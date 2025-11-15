/**
 * File Downloader
 * 
 * Minimal version for downloading media files.
 */

import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream/promises';
import fetch from 'node-fetch';

/**
 * Download a file from URL to local directory
 * @param {string} url - URL to download from
 * @param {string} outputDir - Directory to save file
 * @param {string} filename - Optional filename (auto-detected if not provided)
 * @returns {Promise<{filePath: string, fileName: string}>}
 */
export async function downloadFile(url, outputDir, filename = null) {
  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Determine filename
  if (!filename) {
    const urlPath = new URL(url).pathname;
    filename = path.basename(urlPath) || `download-${Date.now()}`;
  }

  const filePath = path.join(outputDir, filename);

  // Download file
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.statusText}`);
  }

  // Write to file
  await pipeline(response.body, fs.createWriteStream(filePath));

  return {
    filePath,
    fileName: filename
  };
}
