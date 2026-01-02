/**
 * File Downloader
 *
 * Downloads media files from various sources including Dropbox and Google Drive.
 */

import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream/promises';
import fetch from 'node-fetch';

/**
 * Convert Dropbox/Google Drive URLs to direct download links
 * @param {string} url - Original URL
 * @returns {string} - Direct download URL
 */
export function convertToDirectDownloadUrl(url) {
  // Handle Dropbox URLs
  if (url.includes('dropbox.com')) {
    // Convert www.dropbox.com to dl.dropboxusercontent.com for direct download
    let directUrl = url.replace('www.dropbox.com', 'dl.dropboxusercontent.com');
    // Remove dl parameter if present (not needed for dl.dropboxusercontent.com)
    directUrl = directUrl.replace(/[?&]dl=[01]/, '');
    return directUrl;
  }

  // Handle Google Drive URLs
  if (url.includes('drive.google.com')) {
    const fileIdMatch = url.match(/\/d\/([^/]+)/);
    if (fileIdMatch) {
      return `https://drive.google.com/uc?export=download&id=${fileIdMatch[1]}`;
    }
  }

  return url;
}

/**
 * Get file extension from content-type header
 */
const MIME_TO_EXT = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'image/svg+xml': '.svg',
  'video/mp4': '.mp4',
  'video/quicktime': '.mov',
  'video/webm': '.webm',
  'video/x-msvideo': '.avi',
  'application/pdf': '.pdf',
};

function getExtensionFromContentType(contentType) {
  if (!contentType) return null;
  const mimeType = contentType.split(';')[0].trim();
  return MIME_TO_EXT[mimeType] || null;
}

function getExtensionFromUrl(url) {
  try {
    const pathname = new URL(url).pathname;
    const ext = path.extname(pathname.split('?')[0]);
    return ext || null;
  } catch {
    return null;
  }
}

/**
 * Download a file from URL to local directory
 * @param {string} url - URL to download from
 * @param {string} outputDir - Directory to save file
 * @param {string} filename - Optional filename (extension auto-detected from response)
 * @returns {Promise<{filePath: string, fileName: string}>}
 */
export async function downloadFile(url, outputDir, filename = null) {
  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Convert to direct download URL if needed
  const directUrl = convertToDirectDownloadUrl(url);

  // Download file
  const response = await fetch(directUrl);
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.statusText}`);
  }

  // Determine extension from response or URL
  const contentType = response.headers.get('content-type');
  const ext = getExtensionFromContentType(contentType) || getExtensionFromUrl(url) || '';

  // Build final filename
  if (!filename) {
    filename = `download-${Date.now()}${ext}`;
  } else if (!path.extname(filename)) {
    // Add extension if filename provided without one
    filename = `${filename}${ext}`;
  }

  const filePath = path.join(outputDir, filename);

  // Write to file
  await pipeline(response.body, fs.createWriteStream(filePath));

  return {
    filePath,
    fileName: filename
  };
}
