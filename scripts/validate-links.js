#!/usr/bin/env node
/**
 * Link Validation Script
 *
 * Checks all external links in content files and stores results in data/link-status.json
 * Usage: npm run validate:links
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const CONTENT_DIRS = [
  path.join(ROOT_DIR, 'src/content/cases'),
  path.join(ROOT_DIR, 'src/content/posts')
];

const STATUS_FILE = path.join(ROOT_DIR, 'data/link-status.json');

// Request timeout in ms
const REQUEST_TIMEOUT = 10000;

// Concurrent request limit
const CONCURRENCY = 5;

/**
 * Parse frontmatter from MDX file
 */
function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;

  // Simple YAML parsing for our use case
  const yaml = match[1];
  const result = {};

  // Extract external_links array
  const linksMatch = yaml.match(/external_links:\s*\n((?:\s+-[\s\S]*?)*)(?=\n[a-z]|\n*$)/);
  if (linksMatch) {
    const linksYaml = linksMatch[1];
    const urls = [...linksYaml.matchAll(/url:\s*["']?([^"'\n]+)["']?/g)];
    result.external_links = urls.map(m => m[1].trim());
  }

  // Extract documents array
  const docsMatch = yaml.match(/documents:\s*\n((?:\s+-[\s\S]*?)*)(?=\n[a-z]|\n*$)/);
  if (docsMatch) {
    const docsYaml = docsMatch[1];
    const urls = [...docsYaml.matchAll(/url:\s*["']?([^"'\n]+)["']?/g)];
    result.documents = urls.map(m => m[1].trim());
  }

  return result;
}

/**
 * Collect all URLs from content files
 */
function collectUrls() {
  const urlMap = new Map(); // url -> [sources]

  for (const dir of CONTENT_DIRS) {
    if (!fs.existsSync(dir)) continue;

    const files = fs.readdirSync(dir).filter(f => f.endsWith('.mdx'));

    for (const file of files) {
      const filePath = path.join(dir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const frontmatter = parseFrontmatter(content);

      if (!frontmatter) continue;

      const source = path.relative(ROOT_DIR, filePath);

      if (frontmatter.external_links) {
        for (const url of frontmatter.external_links) {
          if (!urlMap.has(url)) urlMap.set(url, []);
          urlMap.get(url).push({ source, type: 'external_link' });
        }
      }

      if (frontmatter.documents) {
        for (const url of frontmatter.documents) {
          if (!urlMap.has(url)) urlMap.set(url, []);
          urlMap.get(url).push({ source, type: 'document' });
        }
      }
    }
  }

  return urlMap;
}

/**
 * Check a single URL
 */
async function checkUrl(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    // Try HEAD first (faster)
    let response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LinkValidator/1.0)'
      },
      redirect: 'follow'
    });

    // Some servers don't support HEAD, try GET
    if (response.status === 405 || response.status === 403) {
      response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; LinkValidator/1.0)'
        },
        redirect: 'follow'
      });
    }

    clearTimeout(timeout);

    return {
      status: response.ok ? 'ok' : 'error',
      statusCode: response.status,
      error: response.ok ? null : `HTTP ${response.status}`
    };
  } catch (err) {
    clearTimeout(timeout);

    let error = err.message;
    if (err.name === 'AbortError') {
      error = 'Timeout';
    }

    return {
      status: 'error',
      statusCode: null,
      error
    };
  }
}

/**
 * Check URLs with concurrency limit
 */
async function checkUrlsWithConcurrency(urls, concurrency) {
  const results = new Map();
  const queue = [...urls];

  async function worker() {
    while (queue.length > 0) {
      const url = queue.shift();
      if (!url) break;

      process.stdout.write(`Checking: ${url.substring(0, 60)}...`);
      const result = await checkUrl(url);
      results.set(url, result);

      const symbol = result.status === 'ok' ? '✓' : '✗';
      console.log(` ${symbol}`);
    }
  }

  // Start workers
  const workers = Array(Math.min(concurrency, urls.length))
    .fill(null)
    .map(() => worker());

  await Promise.all(workers);

  return results;
}

/**
 * Load existing status file
 */
function loadExistingStatus() {
  try {
    if (fs.existsSync(STATUS_FILE)) {
      return JSON.parse(fs.readFileSync(STATUS_FILE, 'utf-8'));
    }
  } catch (err) {
    console.warn('Could not load existing status file:', err.message);
  }
  return { links: {}, lastFullCheck: null };
}

/**
 * Main function
 */
async function main() {
  console.log('\n🔗 Link Validator\n');
  console.log('Scanning content files for external links...\n');

  const urlMap = collectUrls();
  const urls = [...urlMap.keys()];

  console.log(`Found ${urls.length} unique URLs to check\n`);

  if (urls.length === 0) {
    console.log('No URLs found. Exiting.');
    return;
  }

  // Check all URLs
  const results = await checkUrlsWithConcurrency(urls, CONCURRENCY);

  // Build status object
  const existingStatus = loadExistingStatus();
  const now = new Date().toISOString();

  const links = {};
  let okCount = 0;
  let errorCount = 0;

  for (const [url, result] of results) {
    const sources = urlMap.get(url);
    links[url] = {
      ...result,
      lastChecked: now,
      sources: sources.map(s => s.source)
    };

    if (result.status === 'ok') {
      okCount++;
    } else {
      errorCount++;
    }
  }

  // Preserve status for URLs no longer in content (in case they come back)
  for (const [url, data] of Object.entries(existingStatus.links || {})) {
    if (!links[url]) {
      links[url] = { ...data, sources: [] }; // Mark as orphaned
    }
  }

  const status = {
    lastFullCheck: now,
    summary: {
      total: urls.length,
      ok: okCount,
      error: errorCount
    },
    links
  };

  // Save status file
  fs.writeFileSync(STATUS_FILE, JSON.stringify(status, null, 2));

  console.log('\n' + '='.repeat(50));
  console.log(`\n✅ OK: ${okCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log(`\nResults saved to: ${path.relative(ROOT_DIR, STATUS_FILE)}`);

  // Show broken links
  if (errorCount > 0) {
    console.log('\n❌ Broken Links:\n');
    for (const [url, data] of Object.entries(links)) {
      if (data.status === 'error') {
        console.log(`  ${url}`);
        console.log(`    Error: ${data.error}`);
        console.log(`    Sources: ${data.sources.join(', ')}`);
        console.log();
      }
    }
  }
}

main().catch(console.error);
