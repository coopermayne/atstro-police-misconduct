#!/usr/bin/env node
/**
 * Sync Registry with All Published Content
 * 
 * Rebuilds the metadata registry from scratch based on all published cases
 * and posts. This ensures the registry is always accurate and contains only
 * values that are actually in use.
 * 
 * Run this during build process to keep registry up-to-date.
 */

import { buildRegistry } from './rebuild-registry.js';

const silent = process.argv.includes('--silent');

if (!silent) {
  console.log('🔄 Syncing metadata registry with published content...\n');
}

// Rebuild the registry from published content
buildRegistry();

if (silent) {
  // Just show a simple success message in silent mode
  console.log('✓ Registry synced');
}
