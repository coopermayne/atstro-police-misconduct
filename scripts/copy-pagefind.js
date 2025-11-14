#!/usr/bin/env node
/**
 * Copy Pagefind files from dist to public for dev mode
 * Run this after building to make search work in dev mode
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const SOURCE = path.join(ROOT_DIR, 'dist', 'pagefind');
const TARGET = path.join(ROOT_DIR, 'public', 'pagefind');

// Check for --silent flag
const silent = process.argv.includes('--silent');

function copyRecursive(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  
  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach(childItemName => {
      copyRecursive(
        path.join(src, childItemName),
        path.join(dest, childItemName)
      );
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

try {
  if (!fs.existsSync(SOURCE)) {
    if (!silent) {
      console.log('ℹ️  Pagefind not found. Run `npm run build` to enable search.');
    }
    process.exit(0); // Exit successfully, just skip the copy
  }

  // Remove old pagefind files
  if (fs.existsSync(TARGET)) {
    fs.rmSync(TARGET, { recursive: true, force: true });
  }

  // Copy new pagefind files
  copyRecursive(SOURCE, TARGET);
  
  if (!silent) {
    console.log('✅ Pagefind files copied to public/ directory');
    console.log('   Search will now work in dev mode!');
  }
} catch (error) {
  console.error('❌ Error copying Pagefind files:', error.message);
  process.exit(1);
}
