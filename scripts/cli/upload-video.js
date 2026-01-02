#!/usr/bin/env node
/**
 * Upload Video CLI
 *
 * Uploads a video to Cloudflare Stream and outputs the MDX component.
 * Downloads file first to avoid URL length/encoding issues with Cloudflare API.
 *
 * Usage:
 *   npm run upload:video <url> [--caption "..."]
 *   npm run upload:video <url> -- --caption "Bodycam footage from incident"
 */

import 'dotenv/config';
import fs from 'fs';
import { uploadVideo } from '../cloudflare/cloudflare-stream.js';
import { addVideoToLibrary, findAssetBySourceUrl } from '../media/media-library.js';
import { downloadFile } from '../media/file-downloader.js';

const TEMP_DIR = '.tmp-upload';

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

function generateShortFilename(description) {
  // Create a short, clean filename from description
  const slug = (description || 'video')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')  // Replace non-alphanumeric with dashes
    .replace(/^-+|-+$/g, '')       // Trim leading/trailing dashes
    .slice(0, 40);                 // Max 40 chars

  const timestamp = Date.now().toString(36); // Short timestamp
  return `${slug}-${timestamp}`;
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

  let tempFilePath = null;

  try {
    // Generate short descriptive filename from caption
    const shortName = generateShortFilename(caption);

    // Download file first (avoids URL length/encoding issues)
    const downloadResult = await downloadFile(url, TEMP_DIR, shortName);
    tempFilePath = downloadResult.filePath;

    // Upload to Cloudflare Stream
    const result = await uploadVideo(tempFilePath, {
      name: caption || 'Video',
      description: caption || ''
    });

    // Add to media library
    addVideoToLibrary({
      sourceUrl: url,
      videoId: result.videoId,
      fileName: downloadResult.fileName,
      caption: caption,
      description: caption,
      metadata: result.metadata
    });

    // Output only the component
    console.log(generateComponent(result.videoId, caption));

  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  } finally {
    // Clean up temp file
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
      if (fs.existsSync(TEMP_DIR) && fs.readdirSync(TEMP_DIR).length === 0) {
        fs.rmdirSync(TEMP_DIR);
      }
    }
  }
}

main();
