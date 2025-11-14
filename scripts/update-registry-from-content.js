#!/usr/bin/env node
/**
 * Update Registry from Published Content
 * 
 * Scans newly published content and adds any new agencies, counties, or tags
 * to the metadata registry for future consistency.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadRegistry, saveRegistry, matchAgency, matchCounty, matchTags } from './metadata-registry.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Parse frontmatter from MDX file
 */
function parseFrontmatter(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Extract frontmatter
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) {
    return null;
  }
  
  const frontmatterText = frontmatterMatch[1];
  const metadata = {};
  
  // Simple parsing for our needs
  const lines = frontmatterText.split('\n');
  let currentKey = null;
  let currentArray = null;
  
  for (const line of lines) {
    // Array items
    if (line.trim().startsWith('- ')) {
      if (currentArray) {
        const value = line.trim().slice(2).replace(/^["'](.*)["']$/, '$1');
        currentArray.push(value);
      }
      continue;
    }
    
    // Key-value pairs
    const match = line.match(/^(\w+):\s*(.*)$/);
    if (match) {
      const [, key, value] = match;
      currentKey = key;
      
      // Array indicators
      if (value === '[' || value.trim() === '' || (line.includes(':') && !value)) {
        currentArray = [];
        metadata[key] = currentArray;
      }
      // String value
      else if (value.startsWith('"') || value.startsWith("'")) {
        metadata[key] = value.replace(/^["'](.*)["']$/, '$1');
        currentArray = null;
      }
      // Inline array
      else if (value.startsWith('[') && value.endsWith(']')) {
        const items = value.slice(1, -1).split(',').map(v => v.trim().replace(/^["'](.*)["']$/, '$1'));
        metadata[key] = items;
        currentArray = null;
      }
      // Other values
      else {
        metadata[key] = value === 'null' ? null : value;
        currentArray = null;
      }
    }
  }
  
  return metadata;
}

/**
 * Update registry with new values from a file
 */
function updateRegistryFromFile(filePath, contentType = 'case') {
  const metadata = parseFrontmatter(filePath);
  if (!metadata) {
    console.log(`⚠️  Could not parse frontmatter from ${path.basename(filePath)}`);
    return { agencies: [], counties: [], tags: [] };
  }
  
  const registry = loadRegistry();
  const newEntries = {
    agencies: [],
    counties: [],
    tags: []
  };
  
  // Check agencies
  if (metadata.agencies && Array.isArray(metadata.agencies)) {
    for (const agency of metadata.agencies) {
      if (!matchAgency(agency, registry)) {
        // New agency found
        const slug = agency.toLowerCase().replace(/\s+/g, '-');
        
        // Try to extract county and city from metadata
        const county = metadata.county || '';
        const city = metadata.city || '';
        
        registry.agencies.push({
          canonical_name: agency,
          aliases: [],
          slug,
          county,
          city
        });
        
        newEntries.agencies.push(agency);
      }
    }
  }
  
  // Check county
  if (metadata.county && !matchCounty(metadata.county, registry)) {
    const slug = metadata.county.toLowerCase().replace(/\s+/g, '-');
    
    registry.counties.push({
      canonical_name: metadata.county,
      aliases: [],
      slug
    });
    
    // Sort counties alphabetically
    registry.counties.sort((a, b) => a.canonical_name.localeCompare(b.canonical_name));
    
    newEntries.counties.push(metadata.county);
  }
  
  // Check tags
  if (metadata.tags && Array.isArray(metadata.tags)) {
    const tagList = contentType === 'case' ? registry.case_tags : registry.post_tags;
    
    for (const tag of metadata.tags) {
      if (!tagList.includes(tag)) {
        tagList.push(tag);
        newEntries.tags.push(tag);
      }
    }
    
    // Sort tags
    tagList.sort();
    
    if (contentType === 'case') {
      registry.case_tags = tagList;
    } else {
      registry.post_tags = tagList;
    }
  }
  
  // Save if we added anything
  const hasNewEntries = newEntries.agencies.length > 0 || 
                        newEntries.counties.length > 0 || 
                        newEntries.tags.length > 0;
  
  if (hasNewEntries) {
    saveRegistry(registry);
  }
  
  return newEntries;
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('\n❌ Usage: node scripts/update-registry-from-content.js <file-path> [content-type]\n');
    console.log('Example: node scripts/update-registry-from-content.js src/content/cases/anthony-silva.mdx case\n');
    process.exit(1);
  }
  
  const filePath = args[0];
  const contentType = args[1] || 'case';
  
  if (!fs.existsSync(filePath)) {
    console.log(`\n❌ File not found: ${filePath}\n`);
    process.exit(1);
  }
  
  console.log(`\n🔍 Scanning ${path.basename(filePath)} for new metadata values...\n`);
  
  const newEntries = updateRegistryFromFile(filePath, contentType);
  
  // Report results
  if (newEntries.agencies.length > 0) {
    console.log('✅ Added new agencies to registry:');
    newEntries.agencies.forEach(agency => console.log(`   - ${agency}`));
  }
  
  if (newEntries.counties.length > 0) {
    console.log('✅ Added new counties to registry:');
    newEntries.counties.forEach(county => console.log(`   - ${county}`));
  }
  
  if (newEntries.tags.length > 0) {
    console.log(`✅ Added new ${contentType} tags to registry:`);
    newEntries.tags.forEach(tag => console.log(`   - ${tag}`));
  }
  
  const totalNew = newEntries.agencies.length + newEntries.counties.length + newEntries.tags.length;
  
  if (totalNew === 0) {
    console.log('✓ No new entries needed - all metadata values already in registry\n');
  } else {
    console.log(`\n📝 Registry updated with ${totalNew} new ${totalNew === 1 ? 'entry' : 'entries'}\n`);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

// Export for use in other scripts
export { updateRegistryFromFile };
