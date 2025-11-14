#!/usr/bin/env node
/**
 * Rebuild Metadata Registry from Published Content
 * 
 * Scans all published cases and posts and generates a fresh metadata registry
 * without aliases. This creates a clean registry based only on what's actually
 * published.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const CASES_DIR = path.join(ROOT_DIR, 'src', 'content', 'cases');
const POSTS_DIR = path.join(ROOT_DIR, 'src', 'content', 'posts');
const REGISTRY_PATH = path.join(ROOT_DIR, 'metadata-registry.json');

/**
 * Parse frontmatter from MDX file
 */
function parseFrontmatter(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) {
    return null;
  }
  
  const frontmatterText = frontmatterMatch[1];
  const metadata = {};
  
  const lines = frontmatterText.split('\n');
  let currentKey = null;
  let currentArray = null;
  
  for (const line of lines) {
    if (line.trim().startsWith('- ')) {
      if (currentArray) {
        const value = line.trim().slice(2).replace(/^["'](.*)["']$/, '$1');
        currentArray.push(value);
      }
      continue;
    }
    
    const match = line.match(/^(\w+):\s*(.*)$/);
    if (match) {
      const [, key, value] = match;
      currentKey = key;
      
      if (value === '[' || value.trim() === '' || (line.includes(':') && !value)) {
        currentArray = [];
        metadata[key] = currentArray;
      } else if (value.startsWith('"') || value.startsWith("'")) {
        metadata[key] = value.replace(/^["'](.*)["']$/, '$1');
        currentArray = null;
      } else if (value.startsWith('[') && value.endsWith(']')) {
        const items = value.slice(1, -1).split(',').map(v => v.trim().replace(/^["'](.*)["']$/, '$1'));
        metadata[key] = items;
        currentArray = null;
      } else {
        metadata[key] = value === 'null' ? null : value;
        currentArray = null;
      }
    }
  }
  
  return metadata;
}

/**
 * Get all MDX files from a directory
 */
function getMDXFiles(dir) {
  if (!fs.existsSync(dir)) {
    return [];
  }
  
  return fs.readdirSync(dir)
    .filter(file => file.endsWith('.mdx'))
    .map(file => path.join(dir, file));
}

/**
 * Build registry from published content
 */
function buildRegistry() {
  const silent = process.argv.includes('--silent');
  
  if (!silent) {
    console.log('\n🔨 Building fresh metadata registry from published content...\n');
  }
  
  const agencies = new Set();
  const counties = new Set();
  const caseTags = new Set();
  const postTags = new Set();
  
  // Process cases
  const caseFiles = getMDXFiles(CASES_DIR);
  if (!silent) {
    console.log(`📄 Scanning ${caseFiles.length} case ${caseFiles.length === 1 ? 'file' : 'files'}...`);
  }
  
  for (const filePath of caseFiles) {
    try {
      const metadata = parseFrontmatter(filePath);
      if (!metadata) continue;
      
      // Collect agencies
      if (metadata.agencies && Array.isArray(metadata.agencies)) {
        metadata.agencies.forEach(agency => agencies.add(agency));
      }
      
      // Collect county
      if (metadata.county) {
        counties.add(metadata.county);
      }
      
      // Collect tags
      if (metadata.tags && Array.isArray(metadata.tags)) {
        metadata.tags.forEach(tag => caseTags.add(tag));
      }
    } catch (error) {
      if (!silent) {
        console.log(`⚠️  Error processing ${path.basename(filePath)}: ${error.message}`);
      }
    }
  }
  
  // Process posts
  const postFiles = getMDXFiles(POSTS_DIR);
  if (!silent) {
    console.log(`📝 Scanning ${postFiles.length} post ${postFiles.length === 1 ? 'file' : 'files'}...`);
  }
  
  for (const filePath of postFiles) {
    try {
      const metadata = parseFrontmatter(filePath);
      if (!metadata) continue;
      
      // Collect tags
      if (metadata.tags && Array.isArray(metadata.tags)) {
        metadata.tags.forEach(tag => postTags.add(tag));
      }
    } catch (error) {
      if (!silent) {
        console.log(`⚠️  Error processing ${path.basename(filePath)}: ${error.message}`);
      }
    }
  }
  
  // Build registry object - everything is just arrays of strings
  const registry = {
    metadata_version: "2.0",
    last_updated: new Date().toISOString().split('T')[0],
    agencies: Array.from(agencies).sort(),
    counties: Array.from(counties).sort(),
    force_types: [
      "Shooting",
      "Taser",
      "Physical Force",
      "Beating",
      "Chokehold",
      "Restraint",
      "Vehicle Pursuit",
      "K-9 Attack",
      "Chemical Agent",
      "Baton"
    ],
    threat_levels: [
      "No Threat",
      "Low Threat",
      "Medium Threat",
      "High Threat",
      "Active Threat"
    ],
    investigation_statuses: [
      "Under Investigation",
      "No Investigation",
      "Charges Filed",
      "No Charges Filed",
      "Convicted",
      "Acquitted",
      "Settled",
      "Disciplined",
      "No Discipline"
    ],
    case_tags: Array.from(caseTags).filter(t => t).sort(),
    post_tags: Array.from(postTags).filter(t => t).sort()
  };
  
  // Save registry
  fs.writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2));
  
  if (!silent) {
    console.log('\n✅ Registry built successfully!\n');
    console.log(`   Agencies: ${registry.agencies.length}`);
    console.log(`   Counties: ${registry.counties.length}`);
    console.log(`   Force Types: ${registry.force_types.length}`);
    console.log(`   Threat Levels: ${registry.threat_levels.length}`);
    console.log(`   Investigation Statuses: ${registry.investigation_statuses.length}`);
    console.log(`   Case Tags: ${registry.case_tags.length}`);
    console.log(`   Post Tags: ${registry.post_tags.length}`);
    console.log(`\n📝 Registry saved to: ${REGISTRY_PATH}\n`);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  buildRegistry();
}

export { buildRegistry };
