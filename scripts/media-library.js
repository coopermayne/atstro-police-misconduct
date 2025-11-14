/**
 * Media Library Manager
 * 
 * Central registry for all uploaded media assets (videos, images, documents).
 * Allows reuse across multiple articles/cases and easy MDX code generation.
 * 
 * Usage:
 *   node scripts/media-library.js add-video <url> [--description "..."] [--tags "tag1,tag2"]
 *   node scripts/media-library.js add-image <url> [--description "..."] [--tags "tag1,tag2"]
 *   node scripts/media-library.js add-document <url> [--description "..."] [--tags "tag1,tag2"]
 *   node scripts/media-library.js search <query>
 *   node scripts/media-library.js get-code <asset-id>
 *   node scripts/media-library.js list [--type videos|images|documents]
 */

import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { downloadFile } from './file-downloader.js';
import { uploadVideo, getVideoDetails } from './cloudflare-stream.js';
import { uploadImage, getImageDetails } from './cloudflare-images.js';
import { uploadPDF } from './cloudflare-r2.js';

const LIBRARY_PATH = path.join(process.cwd(), 'media-library.json');

/**
 * Load the media library
 */
function loadLibrary() {
  if (!fs.existsSync(LIBRARY_PATH)) {
    return { videos: {}, images: {}, documents: {} };
  }
  return JSON.parse(fs.readFileSync(LIBRARY_PATH, 'utf-8'));
}

/**
 * Save the media library
 */
function saveLibrary(library) {
  fs.writeFileSync(LIBRARY_PATH, JSON.stringify(library, null, 2));
}

/**
 * Add a video to the library
 */
async function addVideo(urlOrPath, options = {}) {
  const library = loadLibrary();
  
  // Check if this URL is already in the library
  if (urlOrPath.startsWith('http://') || urlOrPath.startsWith('https://')) {
    const existing = Object.values(library.videos).find(v => v.sourceUrl === urlOrPath);
    if (existing) {
      console.log('⚠️  This video URL is already in the library!');
      console.log(`   Asset ID: ${existing.id}`);
      console.log(`   Video ID: ${existing.videoId}`);
      console.log(`   Added: ${new Date(existing.addedAt).toLocaleDateString()}`);
      console.log('\n📝 MDX code:');
      console.log(getMdxCode(existing.id, library));
      return existing;
    }
  }
  
  let filePath = urlOrPath;
  let isDownloaded = false;
  
  // If it's a URL, download it first
  if (urlOrPath.startsWith('http://') || urlOrPath.startsWith('https://')) {
    console.log(`📥 Downloading video from: ${urlOrPath}`);
    const result = await downloadFile(urlOrPath, '.tmp-media');
    filePath = result.filePath;
    isDownloaded = true;
  }
  
  console.log(`📤 Uploading video: ${filePath}`);
  
  const result = await uploadVideo(filePath, {
    description: options.description,
    requireSignedURLs: options.private || false
  });
  
  // Clean up downloaded file
  if (isDownloaded && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    const tmpDir = path.dirname(filePath);
    if (fs.existsSync(tmpDir) && fs.readdirSync(tmpDir).length === 0) {
      fs.rmdirSync(tmpDir);
    }
  }

  const assetId = `video-${uuidv4()}`;
  
  library.videos[assetId] = {
    id: assetId,
    videoId: result.videoId,
    fileName: result.originalFileName,
    sourceUrl: urlOrPath.startsWith('http') ? urlOrPath : null,
    description: options.description || '',
    alt: options.alt || options.description || '',
    caption: options.caption || '',
    tags: options.tags || [],
    addedAt: new Date().toISOString(),
    // Store full component props
    componentProps: {
      videoId: result.videoId,
      title: options.title || '',
      poster: options.poster || ''
    },
    cloudflareData: result.metadata
  };

  saveLibrary(library);
  
  console.log('✅ Video added to library');
  console.log(`   Asset ID: ${assetId}`);
  console.log(`   Video ID: ${result.videoId}`);
  console.log('\n📝 MDX code:');
  console.log(getMdxCode(assetId, library));
  
  return library.videos[assetId];
}

/**
 * Add an image to the library
 */
async function addImage(urlOrPath, options = {}) {
  const library = loadLibrary();
  
  // Check if this URL is already in the library
  if (urlOrPath.startsWith('http://') || urlOrPath.startsWith('https://')) {
    const existing = Object.values(library.images).find(i => i.sourceUrl === urlOrPath);
    if (existing) {
      console.log('⚠️  This image URL is already in the library!');
      console.log(`   Asset ID: ${existing.id}`);
      console.log(`   Image ID: ${existing.imageId}`);
      console.log(`   Added: ${new Date(existing.addedAt).toLocaleDateString()}`);
      console.log('\n📝 MDX code:');
      console.log(getMdxCode(existing.id, library));
      return existing;
    }
  }
  
  let filePath = urlOrPath;
  let isDownloaded = false;
  
  // If it's a URL, download it first
  if (urlOrPath.startsWith('http://') || urlOrPath.startsWith('https://')) {
    console.log(`📥 Downloading image from: ${urlOrPath}`);
    const result = await downloadFile(urlOrPath, '.tmp-media');
    filePath = result.filePath;
    isDownloaded = true;
  }
  
  console.log(`📤 Uploading image: ${filePath}`);
  
  const result = await uploadImage(filePath, {
    description: options.description,
    requireSignedURLs: options.private || false
  });
  
  // Clean up downloaded file
  if (isDownloaded && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    const tmpDir = path.dirname(filePath);
    if (fs.existsSync(tmpDir) && fs.readdirSync(tmpDir).length === 0) {
      fs.rmdirSync(tmpDir);
    }
  }

  const assetId = `image-${uuidv4()}`;
  
  library.images[assetId] = {
    id: assetId,
    imageId: result.imageId,
    fileName: result.originalFileName,
    sourceUrl: urlOrPath.startsWith('http') ? urlOrPath : null,
    description: options.description || '',
    alt: options.alt || options.description || result.originalFileName,
    caption: options.caption || '',
    tags: options.tags || [],
    addedAt: new Date().toISOString(),
    // Store full component props
    componentProps: {
      imageId: result.imageId,
      alt: options.alt || options.description || result.originalFileName,
      variant: options.variant || 'public',
      class: options.class || ''
    },
    urls: {
      thumbnail: result.thumbnailUrl,
      medium: result.mediumUrl,
      large: result.largeUrl,
      public: result.publicUrl
    }
  };

  saveLibrary(library);
  
  console.log('✅ Image added to library');
  console.log(`   Asset ID: ${assetId}`);
  console.log(`   Image ID: ${result.imageId}`);
  console.log('\n📝 MDX code:');
  console.log(getMdxCode(assetId, library));
  
  return library.images[assetId];
}

/**
 * Add a document to the library
 */
async function addDocument(url, options = {}) {
  const library = loadLibrary();
  
  // Check if this URL is already in the library
  const existing = Object.values(library.documents).find(d => d.sourceUrl === url);
  if (existing) {
    console.log('⚠️  This document URL is already in the library!');
    console.log(`   Asset ID: ${existing.id}`);
    console.log(`   File: ${existing.fileName}`);
    console.log(`   Added: ${new Date(existing.addedAt).toLocaleDateString()}`);
    console.log('\n📝 MDX code:');
    console.log(getMdxCode(existing.id, library));
    return existing;
  }
  
  console.log(`📥 Downloading document from: ${url}`);
  
  // Download file first
  const downloadResult = await downloadFile(url, '.tmp-media');
  const filePath = downloadResult.filePath;
  
  console.log(`📤 Uploading document to R2`);
  
  const result = await uploadPDF(filePath, {
    description: options.description,
    ...options.customMetadata
  });
  
  // Clean up downloaded file
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    const tmpDir = path.dirname(filePath);
    if (fs.existsSync(tmpDir) && fs.readdirSync(tmpDir).length === 0) {
      fs.rmdirSync(tmpDir);
    }
  }

  const assetId = `document-${uuidv4()}`;
  
  library.documents[assetId] = {
    id: assetId,
    fileName: result.originalFileName,
    r2Key: result.key,
    publicUrl: result.url,
    sourceUrl: url,
    description: options.description || '',
    linkText: options.linkText || options.description || result.originalFileName,
    fileType: path.extname(result.originalFileName).slice(1).toUpperCase(),
    fileSize: null,
    tags: options.tags || [],
    addedAt: new Date().toISOString(),
    // Store full component/link props
    componentProps: {
      href: result.url,
      text: options.linkText || options.description || result.originalFileName,
      download: options.download || false,
      target: '_blank',
      rel: 'noopener noreferrer'
    },
    metadata: result
  };

  saveLibrary(library);
  
  console.log('✅ Document added to library');
  console.log(`   Asset ID: ${assetId}`);
  console.log(`   Public URL: ${result.publicUrl}`);
  console.log('\n📝 MDX code:');
  console.log(getMdxCode(assetId, library));
  
  return library.documents[assetId];
}

/**
 * Find an asset by source URL (for deduplication)
 * @param {string} url - Source URL to search for
 * @returns {object|null} - Asset object if found, null otherwise
 */
export function findAssetBySourceUrl(url) {
  const library = loadLibrary();
  
  // Search videos
  const video = Object.values(library.videos).find(v => v.sourceUrl === url);
  if (video) return { ...video, type: 'video' };
  
  // Search images
  const image = Object.values(library.images).find(i => i.sourceUrl === url);
  if (image) return { ...image, type: 'image' };
  
  // Search documents
  const document = Object.values(library.documents).find(d => d.sourceUrl === url);
  if (document) return { ...document, type: 'document' };
  
  return null;
}

/**
 * Get an asset by its asset ID
 * @param {string} assetId - Asset ID (e.g., 'video-abc123')
 * @returns {object|null} - Asset object if found, null otherwise
 */
export function getAssetById(assetId) {
  const library = loadLibrary();
  
  if (library.videos[assetId]) {
    return { ...library.videos[assetId], type: 'video' };
  }
  if (library.images[assetId]) {
    return { ...library.images[assetId], type: 'image' };
  }
  if (library.documents[assetId]) {
    return { ...library.documents[assetId], type: 'document' };
  }
  
  return null;
}

/**
 * Add or update a video asset in the library (for use by other scripts)
 * @param {object} videoData - Video data to add
 * @returns {object} - The added/updated asset
 */
export function addVideoToLibrary(videoData) {
  const library = loadLibrary();
  
  // Check if already exists
  const existing = Object.values(library.videos).find(v => v.sourceUrl === videoData.sourceUrl);
  if (existing) {
    return existing;
  }
  
  const assetId = `video-${uuidv4()}`;
  
  library.videos[assetId] = {
    id: assetId,
    videoId: videoData.videoId,
    fileName: videoData.fileName || videoData.originalFileName || 'unknown',
    sourceUrl: videoData.sourceUrl,
    description: videoData.description || '',
    alt: videoData.alt || videoData.description || '',
    caption: videoData.caption || '',
    tags: videoData.tags || [],
    addedAt: new Date().toISOString(),
    componentProps: {
      videoId: videoData.videoId,
      title: videoData.title || '',
      poster: videoData.poster || ''
    },
    cloudflareData: videoData.metadata || {}
  };
  
  saveLibrary(library);
  return library.videos[assetId];
}

/**
 * Add or update an image asset in the library (for use by other scripts)
 * @param {object} imageData - Image data to add
 * @returns {object} - The added/updated asset
 */
export function addImageToLibrary(imageData) {
  const library = loadLibrary();
  
  // Check if already exists
  const existing = Object.values(library.images).find(i => i.sourceUrl === imageData.sourceUrl);
  if (existing) {
    return existing;
  }
  
  const assetId = `image-${uuidv4()}`;
  
  library.images[assetId] = {
    id: assetId,
    imageId: imageData.imageId,
    fileName: imageData.fileName || imageData.originalFileName || 'unknown',
    sourceUrl: imageData.sourceUrl,
    description: imageData.description || '',
    alt: imageData.alt || imageData.description || imageData.fileName || '',
    caption: imageData.caption || '',
    tags: imageData.tags || [],
    addedAt: new Date().toISOString(),
    componentProps: {
      imageId: imageData.imageId,
      alt: imageData.alt || imageData.description || imageData.fileName || '',
      variant: imageData.variant || 'public',
      class: imageData.class || ''
    },
    urls: imageData.urls || {}
  };
  
  saveLibrary(library);
  return library.images[assetId];
}

/**
 * Add or update a document asset in the library (for use by other scripts)
 * @param {object} documentData - Document data to add
 * @returns {object} - The added/updated asset
 */
export function addDocumentToLibrary(documentData) {
  const library = loadLibrary();
  
  // Check if already exists
  const existing = Object.values(library.documents).find(d => d.sourceUrl === documentData.sourceUrl);
  if (existing) {
    return existing;
  }
  
  const assetId = `document-${uuidv4()}`;
  
  library.documents[assetId] = {
    id: assetId,
    fileName: documentData.fileName || documentData.originalFileName || 'unknown',
    r2Key: documentData.r2Key || documentData.key || '',
    publicUrl: documentData.publicUrl || documentData.url || '',
    sourceUrl: documentData.sourceUrl,
    description: documentData.description || '',
    linkText: documentData.linkText || documentData.description || documentData.fileName || '',
    fileType: documentData.fileType || 'PDF',
    fileSize: documentData.fileSize || null,
    tags: documentData.tags || [],
    addedAt: new Date().toISOString(),
    componentProps: {
      href: documentData.publicUrl || documentData.url || '',
      text: documentData.linkText || documentData.description || documentData.fileName || '',
      download: documentData.download || false,
      target: '_blank',
      rel: 'noopener noreferrer'
    },
    metadata: documentData.metadata || {}
  };
  
  saveLibrary(library);
  return library.documents[assetId];
}

/**
 * Generate MDX code for an asset
 */
function getMdxCode(assetId, library = null) {
  if (!library) {
    library = loadLibrary();
  }

  // Find the asset
  let asset = null;
  let type = null;

  if (library.videos[assetId]) {
    asset = library.videos[assetId];
    type = 'video';
  } else if (library.images[assetId]) {
    asset = library.images[assetId];
    type = 'image';
  } else if (library.documents[assetId]) {
    asset = library.documents[assetId];
    type = 'document';
  }

  if (!asset) {
    throw new Error(`Asset not found: ${assetId}`);
  }

  // Generate MDX code based on type
  switch (type) {
    case 'video': {
      const props = asset.componentProps;
      let mdx = `<CloudflareVideo videoId="${props.videoId}"`;
      if (props.title) mdx += ` title="${props.title}"`;
      if (props.poster) mdx += ` poster="${props.poster}"`;
      mdx += ' />';
      return mdx;
    }
    
    case 'image': {
      const props = asset.componentProps;
      let mdx = `<CloudflareImage imageId="${props.imageId}" alt="${props.alt}"`;
      if (props.variant && props.variant !== 'public') mdx += ` variant="${props.variant}"`;
      if (props.class) mdx += ` class="${props.class}"`;
      mdx += ' />';
      if (asset.caption) {
        mdx += `\n\n*${asset.caption}*`;
      }
      return mdx;
    }
    
    case 'document': {
      const props = asset.componentProps;
      return `[${props.text}](${props.href})`;
    }
    
    default:
      throw new Error(`Unknown asset type: ${type}`);
  }
}

/**
 * Search the media library
 */
function searchLibrary(query) {
  const library = loadLibrary();
  const results = [];
  const lowerQuery = query.toLowerCase();

  // Search videos
  for (const [id, video] of Object.entries(library.videos)) {
    if (
      video.fileName?.toLowerCase().includes(lowerQuery) ||
      video.description?.toLowerCase().includes(lowerQuery) ||
      video.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
    ) {
      results.push({ ...video, type: 'video' });
    }
  }

  // Search images
  for (const [id, image] of Object.entries(library.images)) {
    if (
      image.fileName?.toLowerCase().includes(lowerQuery) ||
      image.description?.toLowerCase().includes(lowerQuery) ||
      image.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
    ) {
      results.push({ ...image, type: 'image' });
    }
  }

  // Search documents
  for (const [id, doc] of Object.entries(library.documents)) {
    if (
      doc.fileName?.toLowerCase().includes(lowerQuery) ||
      doc.description?.toLowerCase().includes(lowerQuery) ||
      doc.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
    ) {
      results.push({ ...doc, type: 'document' });
    }
  }

  return results;
}

/**
 * List all assets
 */
function listAssets(typeFilter = null) {
  const library = loadLibrary();
  const results = [];

  if (!typeFilter || typeFilter === 'videos') {
    for (const video of Object.values(library.videos)) {
      results.push({ ...video, type: 'video' });
    }
  }

  if (!typeFilter || typeFilter === 'images') {
    for (const image of Object.values(library.images)) {
      results.push({ ...image, type: 'image' });
    }
  }

  if (!typeFilter || typeFilter === 'documents') {
    for (const doc of Object.values(library.documents)) {
      results.push({ ...doc, type: 'document' });
    }
  }

  return results;
}

/**
 * Display search/list results
 */
function displayResults(results) {
  if (results.length === 0) {
    console.log('No results found.');
    return;
  }

  console.log(`\n📚 Found ${results.length} asset(s):\n`);

  for (const asset of results) {
    console.log(`${getTypeEmoji(asset.type)} ${asset.type.toUpperCase()}: ${asset.id}`);
    console.log(`   File: ${asset.fileName}`);
    if (asset.description) {
      console.log(`   Description: ${asset.description}`);
    }
    if (asset.tags && asset.tags.length > 0) {
      console.log(`   Tags: ${asset.tags.join(', ')}`);
    }
    console.log(`   Added: ${new Date(asset.addedAt).toLocaleDateString()}`);
    console.log(`\n   📝 MDX code: ${getMdxCode(asset.id)}\n`);
  }
}

function getTypeEmoji(type) {
  switch (type) {
    case 'video': return '🎥';
    case 'image': return '🖼️';
    case 'document': return '📄';
    default: return '📦';
  }
}

// CLI
const args = process.argv.slice(2);
const command = args[0];

(async () => {
  try {
    switch (command) {
      case 'add-video': {
        const urlOrPath = args[1];
        if (!urlOrPath) {
          console.error('Usage: node scripts/media-library.js add-video <url-or-file> [--description "..."] [--tags "tag1,tag2"] [--title "..."] [--caption "..."]');
          process.exit(1);
        }
        const descIndex = args.indexOf('--description');
        const tagsIndex = args.indexOf('--tags');
        const titleIndex = args.indexOf('--title');
        const captionIndex = args.indexOf('--caption');
        const posterIndex = args.indexOf('--poster');
        const options = {
          description: descIndex > -1 ? args[descIndex + 1] : '',
          tags: tagsIndex > -1 ? args[tagsIndex + 1].split(',').map(t => t.trim()) : [],
          title: titleIndex > -1 ? args[titleIndex + 1] : '',
          caption: captionIndex > -1 ? args[captionIndex + 1] : '',
          poster: posterIndex > -1 ? args[posterIndex + 1] : ''
        };
        await addVideo(urlOrPath, options);
        break;
      }

      case 'add-image': {
        const urlOrPath = args[1];
        if (!urlOrPath) {
          console.error('Usage: node scripts/media-library.js add-image <url-or-file> [--description "..."] [--tags "tag1,tag2"] [--alt "..."] [--caption "..."] [--variant "..."]');
          process.exit(1);
        }
        const descIndex = args.indexOf('--description');
        const tagsIndex = args.indexOf('--tags');
        const altIndex = args.indexOf('--alt');
        const captionIndex = args.indexOf('--caption');
        const variantIndex = args.indexOf('--variant');
        const classIndex = args.indexOf('--class');
        const options = {
          description: descIndex > -1 ? args[descIndex + 1] : '',
          tags: tagsIndex > -1 ? args[tagsIndex + 1].split(',').map(t => t.trim()) : [],
          alt: altIndex > -1 ? args[altIndex + 1] : '',
          caption: captionIndex > -1 ? args[captionIndex + 1] : '',
          variant: variantIndex > -1 ? args[variantIndex + 1] : 'public',
          class: classIndex > -1 ? args[classIndex + 1] : ''
        };
        await addImage(urlOrPath, options);
        break;
      }

      case 'add-document': {
        const url = args[1];
        if (!url) {
          console.error('Usage: node scripts/media-library.js add-document <url> [--description "..."] [--tags "tag1,tag2"] [--link-text "..."]');
          process.exit(1);
        }
        const descIndex = args.indexOf('--description');
        const tagsIndex = args.indexOf('--tags');
        const linkTextIndex = args.indexOf('--link-text');
        const downloadIndex = args.indexOf('--download');
        const options = {
          description: descIndex > -1 ? args[descIndex + 1] : '',
          tags: tagsIndex > -1 ? args[tagsIndex + 1].split(',').map(t => t.trim()) : [],
          linkText: linkTextIndex > -1 ? args[linkTextIndex + 1] : '',
          download: downloadIndex > -1
        };
        await addDocument(url, options);
        break;
      }

      case 'search': {
        const query = args[1];
        if (!query) {
          console.error('Usage: node scripts/media-library.js search <query>');
          process.exit(1);
        }
        const results = searchLibrary(query);
        displayResults(results);
        break;
      }

      case 'get-code': {
        const assetId = args[1];
        if (!assetId) {
          console.error('Usage: node scripts/media-library.js get-code <asset-id>');
          process.exit(1);
        }
        console.log(getMdxCode(assetId));
        break;
      }

      case 'list': {
        const typeIndex = args.indexOf('--type');
        const typeFilter = typeIndex > -1 ? args[typeIndex + 1] : null;
        const results = listAssets(typeFilter);
        displayResults(results);
        break;
      }

      default:
        console.log('Media Library Manager\n');
        console.log('Commands:');
        console.log('  add-video <url> [--description "..."] [--tags "tag1,tag2"] [--title "..."] [--caption "..."] [--poster "..."]');
        console.log('  add-image <url> [--description "..."] [--tags "tag1,tag2"] [--alt "..."] [--caption "..."] [--variant "..."] [--class "..."]');
        console.log('  add-document <url> [--description "..."] [--tags "tag1,tag2"] [--link-text "..."] [--download]');
        console.log('  search <query>');
        console.log('  get-code <asset-id>');
        console.log('  list [--type videos|images|documents]');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();
