#!/usr/bin/env node
/**
 * Upload Video CLI
 *
 * Uploads a video to Cloudflare Stream and outputs the MDX component.
 * Designed for use by Claude Code - outputs only the component snippet.
 *
 * Usage:
 *   npm run upload:video <url> [--caption "..."]
 *   npm run upload:video <url> -- --caption "Bodycam footage from incident"
 */

import 'dotenv/config';
import { uploadVideoFromUrl } from '../cloudflare/cloudflare-stream.js';
import { addVideoToLibrary, findAssetBySourceUrl } from '../media/media-library.js';

function parseArgs(args) {
  const result = { url: null, caption: '' };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--caption' && args[i + 1]) {
      result.caption = args[i + 1];
      i++;
    } else if (!args[i].startsWith('--') && !result.url) {
      result.url = args[i];
    }
  }

  return result;
}

function escapeQuotes(str) {
  return str ? str.replace(/"/g, '&quot;') : '';
}

function generateComponent(videoId, caption) {
  let component = `<CloudflareVideo videoId="${videoId}"`;
  if (caption) {
    component += ` caption="${escapeQuotes(caption)}"`;
  }
  component += ' />';
  return component;
}

async function main() {
  const args = process.argv.slice(2);
  const { url, caption } = parseArgs(args);

  if (!url) {
    console.error('Usage: npm run upload:video <url> [--caption "..."]');
    process.exit(1);
  }

  // Check if already in library
  const existing = findAssetBySourceUrl(url);
  if (existing && existing.type === 'video') {
    // Already uploaded - just output the component
    console.log(generateComponent(existing.videoId, caption || existing.caption));
    process.exit(0);
  }

  try {
    // Upload to Cloudflare Stream
    const result = await uploadVideoFromUrl(url, {
      name: caption || 'Video',
      description: caption || ''
    });

    // Add to media library
    addVideoToLibrary({
      sourceUrl: url,
      videoId: result.videoId,
      fileName: result.originalUrl || 'video',
      caption: caption,
      description: caption,
      metadata: result.metadata
    });

    // Output only the component
    console.log(generateComponent(result.videoId, caption));

  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

main();
