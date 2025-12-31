#!/usr/bin/env node
/**
 * Media Search CLI
 *
 * Searches the media library and outputs component snippets.
 * Designed for use by Claude Code - outputs clean, usable component snippets.
 *
 * Usage:
 *   npm run media:find "<search term>"
 *   npm run media:find "bodycam"
 *   npm run media:find "martinez"
 */

import fs from 'fs';
import path from 'path';

const LIBRARY_PATH = path.join(process.cwd(), 'data', 'media-library.json');

function loadLibrary() {
  if (!fs.existsSync(LIBRARY_PATH)) {
    return { videos: {}, images: {}, documents: {} };
  }
  return JSON.parse(fs.readFileSync(LIBRARY_PATH, 'utf-8'));
}

function escapeQuotes(str) {
  return str ? str.replace(/"/g, '&quot;') : '';
}

function generateVideoComponent(video) {
  let component = `<CloudflareVideo videoId="${video.videoId}"`;
  if (video.caption) {
    component += ` caption="${escapeQuotes(video.caption)}"`;
  }
  component += ' />';
  return component;
}

function generateImageComponent(image) {
  let component = `<CloudflareImage imageId="${image.imageId}" alt="${escapeQuotes(image.alt)}"`;
  if (image.caption) {
    component += ` caption="${escapeQuotes(image.caption)}"`;
  }
  component += ' />';
  return component;
}

function generateDocumentComponent(doc) {
  return `<DocumentCard title="${escapeQuotes(doc.linkText)}" description="${escapeQuotes(doc.description)}" url="${doc.publicUrl}" />`;
}

function searchLibrary(query) {
  const library = loadLibrary();
  const results = [];
  const lowerQuery = query.toLowerCase();

  // Search videos
  for (const video of Object.values(library.videos)) {
    if (
      video.fileName?.toLowerCase().includes(lowerQuery) ||
      video.description?.toLowerCase().includes(lowerQuery) ||
      video.caption?.toLowerCase().includes(lowerQuery) ||
      video.sourceUrl?.toLowerCase().includes(lowerQuery) ||
      video.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
    ) {
      results.push({ ...video, type: 'video' });
    }
  }

  // Search images
  for (const image of Object.values(library.images)) {
    if (
      image.fileName?.toLowerCase().includes(lowerQuery) ||
      image.description?.toLowerCase().includes(lowerQuery) ||
      image.alt?.toLowerCase().includes(lowerQuery) ||
      image.caption?.toLowerCase().includes(lowerQuery) ||
      image.sourceUrl?.toLowerCase().includes(lowerQuery) ||
      image.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
    ) {
      results.push({ ...image, type: 'image' });
    }
  }

  // Search documents
  for (const doc of Object.values(library.documents)) {
    if (
      doc.fileName?.toLowerCase().includes(lowerQuery) ||
      doc.description?.toLowerCase().includes(lowerQuery) ||
      doc.linkText?.toLowerCase().includes(lowerQuery) ||
      doc.sourceUrl?.toLowerCase().includes(lowerQuery) ||
      doc.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
    ) {
      results.push({ ...doc, type: 'document' });
    }
  }

  return results;
}

function main() {
  const query = process.argv[2];

  if (!query) {
    console.error('Usage: npm run media:find "<search term>"');
    process.exit(1);
  }

  const results = searchLibrary(query);

  if (results.length === 0) {
    console.log(`No results found for "${query}"`);
    process.exit(0);
  }

  console.log(`Found ${results.length} result(s) for "${query}":\n`);

  for (const result of results) {
    const typeLabel = result.type.toUpperCase();
    const name = result.fileName || result.linkText || 'Unknown';

    let component;
    switch (result.type) {
      case 'video':
        component = generateVideoComponent(result);
        break;
      case 'image':
        component = generateImageComponent(result);
        break;
      case 'document':
        component = generateDocumentComponent(result);
        break;
    }

    console.log(`${typeLabel}: ${name}`);
    if (result.description) {
      console.log(`  Description: ${result.description}`);
    }
    console.log(`  Component: ${component}`);
    console.log();
  }
}

main();
