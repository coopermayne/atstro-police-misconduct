/**
 * Shared utility functions for registry scripts
 * 
 * These utilities are used by multiple registry management scripts
 * to avoid code duplication.
 */

import fs from 'fs';
import path from 'path';

/**
 * Parse frontmatter from MDX file
 * 
 * Extracts YAML frontmatter and converts it to a JavaScript object.
 * Handles arrays, strings, and null values.
 * 
 * @param {string} filePath - Path to MDX file
 * @returns {object|null} - Parsed metadata object or null if no frontmatter found
 */
export function parseFrontmatter(filePath) {
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
 * 
 * @param {string} dir - Directory path to search
 * @returns {string[]} - Array of full file paths to MDX files
 */
export function getMDXFiles(dir) {
  if (!fs.existsSync(dir)) {
    return [];
  }
  
  return fs.readdirSync(dir)
    .filter(file => file.endsWith('.mdx'))
    .map(file => path.join(dir, file));
}
