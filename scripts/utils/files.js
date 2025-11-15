/**
 * File System Utilities
 * 
 * Helper functions for file and directory operations.
 */

import fs from 'fs';
import fsSync from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const DRAFTS_DIR = path.join(__dirname, '..', '..', 'drafts');
export const TEMP_DIR = path.join(__dirname, '..', '..', '.temp-uploads');

/**
 * Ensure temp directory exists
 */
export function ensureTempDir() {
  if (!fsSync.existsSync(TEMP_DIR)) {
    fsSync.mkdirSync(TEMP_DIR, { recursive: true });
  }
}

/**
 * Clean up temp directory
 */
export function cleanupTempDir() {
  if (fsSync.existsSync(TEMP_DIR)) {
    const files = fsSync.readdirSync(TEMP_DIR);
    files.forEach(file => {
      fsSync.unlinkSync(path.join(TEMP_DIR, file));
    });
    fsSync.rmdirSync(TEMP_DIR);
  }
}

/**
 * Get all markdown files from drafts/cases and drafts/posts directories
 * @returns {string[]} Array of draft file paths
 */
export function getDraftFiles() {
  const files = [];
  const folders = ['cases', 'posts'];
  
  for (const folder of folders) {
    const folderPath = path.join(DRAFTS_DIR, folder);
    
    if (!fsSync.existsSync(folderPath)) {
      continue;
    }
    
    const entries = fsSync.readdirSync(folderPath, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.md')) {
        files.push(path.join(folderPath, entry.name));
      }
    }
  }
  
  return files;
}
