#!/usr/bin/env node
/**
 * Upload Image CLI
 *
 * Uploads an image to Cloudflare Images and outputs the MDX component.
 * Downloads file first to avoid URL length/encoding issues with Cloudflare API.
 *
 * Usage:
 *   npm run upload:image <url> --alt "Description" [--caption "..."]
 *   npm run upload:image <url> -- --alt "Scene photo" --caption "Location of incident"
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { uploadImage } from '../cloudflare/cloudflare-images.js';
import { addImageToLibrary, findAssetBySourceUrl } from '../media/media-library.js';
import { downloadFile } from '../media/file-downloader.js';

const TEMP_DIR = '.tmp-upload';

function parseArgs(args) {
  const result = { url: null, alt: '', caption: '' };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--alt' && args[i + 1]) {
      result.alt = args[i + 1];
      i++;
    } else if (args[i] === '--caption' && args[i + 1]) {
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
  const slug = description
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')  // Replace non-alphanumeric with dashes
    .replace(/^-+|-+$/g, '')       // Trim leading/trailing dashes
    .slice(0, 40);                 // Max 40 chars

  const timestamp = Date.now().toString(36); // Short timestamp
  return `${slug || 'image'}-${timestamp}`;
}

function generateComponent(imageId, alt, caption) {
  let component = `<CloudflareImage imageId="${imageId}" alt="${escapeQuotes(alt)}"`;
  if (caption) {
    component += ` caption="${escapeQuotes(caption)}"`;
  }
  component += ' />';
  return component;
}

async function main() {
  const args = process.argv.slice(2);
  const { url, alt, caption } = parseArgs(args);

  if (!url) {
    console.error('Usage: npm run upload:image <url> --alt "Description" [--caption "..."]');
    process.exit(1);
  }

  if (!alt) {
    console.error('Error: --alt is required for accessibility');
    console.error('Usage: npm run upload:image <url> --alt "Description" [--caption "..."]');
    process.exit(1);
  }

  // Check if already in library
  const existing = findAssetBySourceUrl(url);
  if (existing && existing.type === 'image') {
    // Already uploaded - output component with new alt/caption if provided
    console.log(generateComponent(existing.imageId, alt || existing.alt, caption || existing.caption));
    process.exit(0);
  }

  let tempFilePath = null;

  try {
    // Generate short descriptive filename from alt text
    const shortName = generateShortFilename(alt);

    // Download file first (avoids URL length/encoding issues)
    const downloadResult = await downloadFile(url, TEMP_DIR, shortName);
    tempFilePath = downloadResult.filePath;

    // Upload to Cloudflare Images
    const result = await uploadImage(tempFilePath, {
      description: caption || alt
    });

    // Add to media library
    addImageToLibrary({
      sourceUrl: url,
      imageId: result.imageId,
      fileName: downloadResult.fileName,
      alt: alt,
      caption: caption,
      description: caption || alt,
      urls: {
        thumbnail: result.thumbnailUrl,
        medium: result.mediumUrl,
        large: result.largeUrl,
        public: result.publicUrl
      }
    });

    // Output only the component
    console.log(generateComponent(result.imageId, alt, caption));

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
