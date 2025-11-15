#!/usr/bin/env node
/**
 * Normalize Existing Metadata
 * 
 * Scans all published cases and blog posts, normalizes their metadata
 * against the canonical registry, and updates the files.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { normalizeMetadata, loadRegistry } from './metadata-registry.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const CASES_DIR = path.join(ROOT_DIR, 'src', 'content', 'cases');
const POSTS_DIR = path.join(ROOT_DIR, 'src', 'content', 'posts');

/**
 * Parse frontmatter and content from MDX file
 */
function parseMDX(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Extract frontmatter
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!frontmatterMatch) {
    return null;
  }
  
  const [, frontmatterText, body] = frontmatterMatch;
  
  // Parse frontmatter (simple YAML parsing for our needs)
  const metadata = {};
  const lines = frontmatterText.split('\n');
  let currentKey = null;
  let currentArray = null;
  
  for (const line of lines) {
    // Array items
    if (line.trim().startsWith('- ')) {
      if (currentArray) {
        const value = line.trim().slice(2).replace(/^"(.*)"$/, '$1');
        currentArray.push(value);
      }
      continue;
    }
    
    // Key-value pairs
    const match = line.match(/^(\w+):\s*(.*)$/);
    if (match) {
      const [, key, value] = match;
      currentKey = key;
      
      // Array start
      if (value === '[' || value.trim() === '') {
        currentArray = [];
        metadata[key] = currentArray;
      }
      // String value
      else if (value.startsWith('"') && value.endsWith('"')) {
        metadata[key] = value.slice(1, -1);
        currentArray = null;
      }
      // Boolean or number
      else if (value === 'true' || value === 'false') {
        metadata[key] = value === 'true';
        currentArray = null;
      }
      else if (value === 'null') {
        metadata[key] = null;
        currentArray = null;
      }
      else if (!isNaN(value)) {
        metadata[key] = Number(value);
        currentArray = null;
      }
      // Raw string
      else {
        metadata[key] = value;
        currentArray = null;
      }
    }
  }
  
  return { metadata, body, frontmatterText };
}

/**
 * Format metadata back to YAML frontmatter
 */
function formatFrontmatter(metadata) {
  let yaml = '---\n';
  
  for (const [key, value] of Object.entries(metadata)) {
    if (value === null) {
      yaml += `${key}: null\n`;
    } else if (typeof value === 'boolean') {
      yaml += `${key}: ${value}\n`;
    } else if (typeof value === 'number') {
      yaml += `${key}: ${value}\n`;
    } else if (Array.isArray(value)) {
      if (value.length === 0) {
        yaml += `${key}: []\n`;
      } else if (typeof value[0] === 'string') {
        yaml += `${key}: [${value.map(v => `"${v}"`).join(', ')}]\n`;
      } else if (typeof value[0] === 'object') {
        // Handle array of objects (like documents)
        yaml += `${key}:\n`;
        for (const item of value) {
          yaml += `  - `;
          const entries = Object.entries(item);
          for (let i = 0; i < entries.length; i++) {
            const [k, v] = entries[i];
            if (i === 0) {
              yaml += `${k}: "${v}"\n`;
            } else {
              yaml += `    ${k}: "${v}"\n`;
            }
          }
        }
      } else {
        yaml += `${key}: [${value.join(', ')}]\n`;
      }
    } else if (typeof value === 'string') {
      yaml += `${key}: "${value}"\n`;
    } else if (typeof value === 'object') {
      // Handle single objects - shouldn't normally happen but fallback
      yaml += `${key}: ${JSON.stringify(value)}\n`;
    }
  }
  
  yaml += '---';
  return yaml;
}

/**
 * Process a single file
 */
function processFile(filePath, contentType) {
  const parsed = parseMDX(filePath);
  if (!parsed) {
    console.log(`  ⚠️  Could not parse: ${path.basename(filePath)}`);
    return { processed: false, changed: false };
  }
  
  const { metadata, body } = parsed;
  const normalized = normalizeMetadata(metadata, contentType);
  
  // Check if anything changed
  const changed = JSON.stringify(metadata) !== JSON.stringify(normalized);
  
  if (changed) {
    // Write back to file
    const newContent = formatFrontmatter(normalized) + '\n' + body;
    fs.writeFileSync(filePath, newContent);
    
    // Show what changed
    const changes = [];
    for (const key of Object.keys(metadata)) {
      if (JSON.stringify(metadata[key]) !== JSON.stringify(normalized[key])) {
        changes.push(`    ${key}: ${JSON.stringify(metadata[key])} → ${JSON.stringify(normalized[key])}`);
      }
    }
    
    return { processed: true, changed: true, changes };
  }
  
  return { processed: true, changed: false };
}

/**
 * Process all files in a directory
 */
function processDirectory(dir, contentType, label) {
  console.log(`\n📂 Processing ${label}...\n`);
  
  if (!fs.existsSync(dir)) {
    console.log(`  ⚠️  Directory not found: ${dir}\n`);
    return { total: 0, changed: 0 };
  }
  
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.mdx'));
  
  if (files.length === 0) {
    console.log(`  ℹ️  No files found\n`);
    return { total: 0, changed: 0 };
  }
  
  let changedCount = 0;
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const result = processFile(filePath, contentType);
    
    if (result.processed) {
      if (result.changed) {
        console.log(`  ✅ ${file}`);
        if (result.changes) {
          result.changes.forEach(change => console.log(change));
        }
        changedCount++;
      } else {
        console.log(`  ✓  ${file} (no changes needed)`);
      }
    }
  }
  
  console.log(`\n  Total: ${files.length} | Updated: ${changedCount}\n`);
  
  return { total: files.length, changed: changedCount };
}

/**
 * Main
 */
async function main() {
  console.log('\n🔄 Normalizing Metadata Across All Content\n');
  console.log('This will update all case and blog post files to use canonical metadata.\n');
  
  // Load registry first to show what we're working with
  const registry = loadRegistry();
  console.log('📋 Registry Statistics:');
  console.log(`   Agencies: ${registry.agencies.length}`);
  console.log(`   Counties: ${registry.counties.length}`);
  console.log(`   Force Types: ${registry.force_types.length}`);
  console.log(`   Case Tags: ${registry.case_tags.length}`);
  console.log(`   Post Tags: ${registry.post_tags.length}`);
  
  // Process cases
  const casesResult = processDirectory(CASES_DIR, 'case', 'Cases');
  
  // Process posts
  const postsResult = processDirectory(POSTS_DIR, 'post', 'Blog Posts');
  
  // Summary
  console.log('═══════════════════════════════════════════════════════════');
  console.log('\n📊 Summary\n');
  console.log(`  Total Files Processed: ${casesResult.total + postsResult.total}`);
  console.log(`  Files Updated: ${casesResult.changed + postsResult.changed}`);
  console.log(`  Files Already Normalized: ${(casesResult.total - casesResult.changed) + (postsResult.total - postsResult.changed)}`);
  
  if (casesResult.changed + postsResult.changed > 0) {
    console.log('\n✅ Metadata normalization complete!');
    console.log('   All files now use canonical names from the registry.\n');
  } else {
    console.log('\n✅ All files already use canonical metadata!\n');
  }
}

main().catch(error => {
  console.error('\n❌ Error:', error.message);
  console.error(error.stack);
  process.exit(1);
});
