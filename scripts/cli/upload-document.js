#!/usr/bin/env node
/**
 * Upload Document CLI
 *
 * Downloads a document and uploads to Cloudflare R2, outputs the MDX component.
 * Designed for use by Claude Code - outputs only the component snippet.
 *
 * Usage:
 *   npm run upload:document <url> --title "..." --description "..."
 *   npm run upload:document <url> -- --title "Civil Complaint" --description "Filed in federal court"
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { downloadFile } from '../media/file-downloader.js';
import { uploadPDF } from '../cloudflare/cloudflare-r2.js';
import { addDocumentToLibrary, findAssetBySourceUrl } from '../media/media-library.js';

const TEMP_DIR = '.tmp-upload';

function parseArgs(args) {
  const result = { url: null, title: '', description: '' };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--title' && args[i + 1]) {
      result.title = args[i + 1];
      i++;
    } else if (args[i] === '--description' && args[i + 1]) {
      result.description = args[i + 1];
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

function generateComponent(title, description, url) {
  return `<DocumentCard title="${escapeQuotes(title)}" description="${escapeQuotes(description)}" url="${url}" />`;
}

async function main() {
  const args = process.argv.slice(2);
  const { url, title, description } = parseArgs(args);

  if (!url) {
    console.error('Usage: npm run upload:document <url> --title "..." --description "..."');
    process.exit(1);
  }

  if (!title || !description) {
    console.error('Error: --title and --description are required');
    console.error('Usage: npm run upload:document <url> --title "..." --description "..."');
    process.exit(1);
  }

  // Check if already in library
  const existing = findAssetBySourceUrl(url);
  if (existing && existing.type === 'document') {
    // Already uploaded - output component with provided title/description
    console.log(generateComponent(title, description, existing.publicUrl));
    process.exit(0);
  }

  try {
    // Download file first
    const downloadResult = await downloadFile(url, TEMP_DIR);
    const filePath = downloadResult.filePath;

    // Upload to R2
    const result = await uploadPDF(filePath, {
      title: title,
      description: description
    });

    // Clean up temp file
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      if (fs.existsSync(TEMP_DIR) && fs.readdirSync(TEMP_DIR).length === 0) {
        fs.rmdirSync(TEMP_DIR);
      }
    }

    // Add to media library
    addDocumentToLibrary({
      sourceUrl: url,
      fileName: result.originalFileName,
      r2Key: result.key,
      publicUrl: result.url,
      description: description,
      linkText: title,
      fileType: path.extname(result.originalFileName).slice(1).toUpperCase(),
      metadata: result
    });

    // Output only the component
    console.log(generateComponent(title, description, result.url));

  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

main();
