/**
 * Media Processing Module
 * 
 * Functions for scanning, validating, and uploading media from drafts.
 */

import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import Anthropic from '@anthropic-ai/sdk';
import { downloadFile } from './file-downloader.js';
import { uploadVideoFromUrl } from '../cloudflare/cloudflare-stream.js';
import { uploadImageFromUrl } from '../cloudflare/cloudflare-images.js';
import { uploadPDF } from '../cloudflare/cloudflare-r2.js';
import {
  findAssetBySourceUrl,
  addVideoToLibrary,
  addImageToLibrary,
  addDocumentToLibrary
} from './media-library.js';
import { extractUrlContext } from '../utils/components.js';
import { ensureTempDir, TEMP_DIR } from '../utils/files.js';
import { displayPromptAndConfirm, displayResponseAndConfirm } from '../utils/debug.js';

// Media type regex patterns
export const MEDIA_PATTERNS = {
  image: /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)(\?|$)/i,
  video: /\.(mp4|mov|avi|wmv|flv|mkv|webm|m4v)(\?|$)/i,
  document: /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt)(\?|$)/i
};

/**
 * Extract all URLs from markdown content
 * @param {string} content - Markdown file content
 * @returns {string[]} Array of URLs
 */
export function extractUrls(content) {
  const urls = new Set();
  
  // Match markdown links [text](url)
  const markdownLinks = content.matchAll(/\[([^\]]*)\]\(([^)]+)\)/g);
  for (const match of markdownLinks) {
    urls.add(match[2]);
  }
  
  // Match plain URLs (http:// or https://)
  const plainUrls = content.matchAll(/https?:\/\/[^\s<>"{}|\\^`\[\]]+/g);
  for (const match of plainUrls) {
    urls.add(match[0]);
  }
  
  return Array.from(urls);
}

/**
 * Determine media type from URL using regex patterns
 * @param {string} url - The URL to categorize
 * @returns {string} Type ('image', 'video', 'document', or 'link')
 */
export function determineTypeByUrl(url) {
  for (const [type, pattern] of Object.entries(MEDIA_PATTERNS)) {
    if (pattern.test(url)) {
      return type;
    }
  }
  return 'link'; // Default to link if no pattern matches
}

/**
 * Scan markdown file and categorize all media and links
 * @param {string} filePath - Path to markdown file
 * @returns {Array<{sourceUrl: string, type: string}>} Array of {sourceUrl, type} objects
 */
export function scanMediaAndLinks(filePath) {
  const content = fsSync.readFileSync(filePath, 'utf-8');
  const urls = extractUrls(content);
  
  const categorized = [];
  
  for (const url of urls) {
    const type = determineTypeByUrl(url);
    categorized.push({ sourceUrl: url, type });
  }
  
  return categorized;
}

/**
 * Validate media metadata item against schema
 * @param {object} item - Media metadata item to validate
 * @returns {{valid: boolean, errors: string[]}}
 */
export function validateMediaMetadataItem(item) {
  const errors = [];
  
  // Check required fields
  if (!item.sourceUrl || typeof item.sourceUrl !== 'string') {
    errors.push('Missing or invalid sourceUrl');
  }
  
  if (!['image', 'video', 'document', 'link'].includes(item.type)) {
    errors.push(`Invalid type: ${item.type}. Must be image, video, document, or link`);
  }
  
  if (typeof item.confidence !== 'number' || item.confidence < 0 || item.confidence > 1) {
    errors.push('confidence must be a number between 0 and 1');
  }
  
  if (!item.componentParams || typeof item.componentParams !== 'object') {
    errors.push('Missing or invalid componentParams');
    return { valid: false, errors };
  }
  
  // Type-specific validation
  switch (item.type) {
    case 'image':
      if (!item.componentParams.alt || typeof item.componentParams.alt !== 'string') {
        errors.push('Image requires alt text (string)');
      } else {
        const altWords = item.componentParams.alt.split(/\s+/).length;
        if (altWords > 15) {
          errors.push(`Image alt text too long: ${altWords} words (max 15)`);
        }
      }
      if (item.componentParams.caption) {
        const captionWords = item.componentParams.caption.split(/\s+/).length;
        if (captionWords > 25) {
          errors.push(`Image caption too long: ${captionWords} words (max 25)`);
        }
      }
      break;
      
    case 'video':
      if (item.componentParams.caption) {
        const captionWords = item.componentParams.caption.split(/\s+/).length;
        if (captionWords > 25) {
          errors.push(`Video caption too long: ${captionWords} words (max 25)`);
        }
      }
      break;
      
    case 'document':
      if (!item.componentParams.title || typeof item.componentParams.title !== 'string') {
        errors.push('Document requires title (string)');
      } else {
        const titleWords = item.componentParams.title.split(/\s+/).length;
        if (titleWords > 8) {
          errors.push(`Document title too long: ${titleWords} words (max 8)`);
        }
      }
      if (!item.componentParams.description || typeof item.componentParams.description !== 'string') {
        errors.push('Document requires description (string)');
      } else {
        const descWords = item.componentParams.description.split(/\s+/).length;
        if (descWords > 30) {
          errors.push(`Document description too long: ${descWords} words (max 30)`);
        }
      }
      break;
      
    case 'link':
      // Title is optional for links (falls back to hostname)
      if (item.componentParams.title) {
        const titleWords = item.componentParams.title.split(/\s+/).length;
        if (titleWords > 8) {
          errors.push(`Link title too long: ${titleWords} words (max 8)`);
        }
      }
      if (item.componentParams.description) {
        const descWords = item.componentParams.description.split(/\s+/).length;
        if (descWords > 30) {
          errors.push(`Link description too long: ${descWords} words (max 30)`);
        }
      }
      if (item.componentParams.icon && !['video', 'news', 'generic'].includes(item.componentParams.icon)) {
        errors.push(`Link icon must be one of: video, news, generic`);
      }
      break;
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Use AI to extract metadata for all media items from the article
 * @param {string} filePath - Path to markdown file
 * @param {Array<{sourceUrl: string, type: string}>} mediaItems - Categorized media items
 * @param {boolean} debugMode - Whether debug mode is enabled
 * @returns {Promise<Array<{sourceUrl: string, type: string, componentParams: object, confidence: number}>>}
 */
export async function extractMediaMetadata(filePath, mediaItems, debugMode = false) {
  const content = fsSync.readFileSync(filePath, 'utf-8');
  
  if (mediaItems.length === 0) {
    return [];
  }
  
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
  });
  
  // Build media list with context
  const mediaWithContext = mediaItems.map((item, i) => {
    const context = extractUrlContext(content, item.sourceUrl);
    return `${i + 1}. ${item.type.toUpperCase()}: ${item.sourceUrl}
CONTEXT: ${context}
`;
  });
  
  const prompt = `You are analyzing a legal article about police misconduct. Extract metadata for each media item to populate component parameters.

MEDIA ITEMS TO ANALYZE (with surrounding context):
${mediaWithContext.join('\n---\n')}

Return a JSON array matching this schema:

[
  {
    "sourceUrl": "exact URL from list above", /required
    "type": "video|image|document|link", /required
    "componentParams": {
      // FOR VIDEO:
      "caption": "string - Brief description of video content. WORD LIMIT: 15-25 words. Only include if context provides info."
      
      // FOR IMAGE:
      "alt": "string (required) - Accessible description. WORD LIMIT: 10-15 words. Focus on what's visible.",
      "caption": "string - Additional context beyond alt. WORD LIMIT: 15-25 words. Only if context provides info."
      
      // FOR DOCUMENT:
      "title": "string (required) - Short title. WORD LIMIT: 3-8 words. Extract from context or make generic.",
      "description": "string (required) - What document contains. WORD LIMIT: 15-30 words. Summarize key content."
      
      // FOR LINK:
      "title": "string Short title. WORD LIMIT: 3-8 words. Falls back to hostname if omitted.",
      "description": "string (optional) - Additional context. WORD LIMIT: 15-30 words.",
      "icon": "string - 'video' (YouTube/Vimeo), 'news' (news outlets), or 'generic' (default)"
    },
    "confidence": 0.85  // number 0-1, lower if guessing
  }
]

CRITICAL: Adhere strictly to word limits. Be concise and precise. Base descriptions on context provided. If minimal context, use generic descriptions and lower confidence.`;

  try {
    if (!debugMode) {
      console.log('   → Extracting media metadata with AI...');
    }
    await displayPromptAndConfirm(prompt, 'MEDIA METADATA EXTRACTION PROMPT', debugMode);
    
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });
    
    const responseText = message.content[0].text.trim();
    await displayResponseAndConfirm(responseText, 'MEDIA METADATA EXTRACTION RESPONSE', debugMode);
    
    if (!debugMode) {
      console.log('   ✓ Media metadata extracted');
    }
    
    // Extract JSON from response (might be wrapped in markdown)
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('No JSON array found in response');
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    console.log('  ✓ Successfully parsed JSON response\n');
    
    // Validate each item against schema
    console.log('  → Validating against schema...\n');
    const validatedItems = [];
    const validationErrors = [];
    
    for (let i = 0; i < parsed.length; i++) {
      const item = parsed[i];
      const validation = validateMediaMetadataItem(item);
      
      if (validation.valid) {
        validatedItems.push(item);
        console.log(`  ✓ Item ${i + 1} (${item.type}): Valid`);
      } else {
        validationErrors.push({ index: i, item, errors: validation.errors });
        console.log(`  ✗ Item ${i + 1} (${item.type}): Invalid`);
        validation.errors.forEach(err => console.log(`    - ${err}`));
      }
    }
    
    console.log();
    
    if (validationErrors.length > 0) {
      console.error(`\n❌ VALIDATION FAILED: ${validationErrors.length} item(s) do not match schema\n`);
      
      validationErrors.forEach(({ index, item, errors }) => {
        console.error(`Item ${index + 1} (${item.type}): ${item.sourceUrl}`);
        errors.forEach(err => console.error(`  • ${err}`));
        console.error();
      });
      
      console.error('The AI response must match the schema exactly. Please review the errors above.');
      console.error('This usually means the AI did not follow word limits or omitted required fields.\n');
      
      throw new Error('Schema validation failed - cannot proceed with invalid metadata');
    } else {
      console.log(`  ✓ All ${validatedItems.length} items validated successfully\n`);
    }
    
    return validatedItems;
  } catch (error) {
    console.error('❌ AI metadata extraction failed:', error.message);
    // Return media items with empty params and low confidence
    return mediaItems.map(item => ({
      sourceUrl: item.sourceUrl,
      type: item.type,
      componentParams: {},
      confidence: 0
    }));
  }
}

/**
 * Upload media item to Cloudflare and add to media library
 * @param {object} mediaItem - Media item with sourceUrl, type, componentParams
 * @returns {Promise<object>} - Media library entry with Cloudflare IDs
 */
export async function uploadAndRegisterMedia(mediaItem) {
  const { sourceUrl, type, componentParams } = mediaItem;
  
  console.log(`\n📤 Processing ${type}: ${sourceUrl}`);
  
  // Check if already in media library
  const existing = findAssetBySourceUrl(sourceUrl);
  if (existing) {
    console.log(`  ✓ Found in media library (${existing.id})`);
    console.log(`  → Reusing existing ${type}`);
    return existing;
  }
  
  console.log(`  → Not in library, uploading to Cloudflare...`);
  
  ensureTempDir();
  
  try {
    switch (type) {
      case 'video': {
        // Upload directly from URL to Cloudflare Stream
        console.log('  → Uploading to Cloudflare Stream...');
        const uploadResult = await uploadVideoFromUrl(sourceUrl, {
          name: componentParams.caption || 'Video',
          description: componentParams.caption || ''
        });
        
        // Add to media library
        console.log('  → Adding to media library...');
        const libraryEntry = addVideoToLibrary({
          sourceUrl,
          videoId: uploadResult.videoId,
          fileName: uploadResult.originalFileName || 'video',
          caption: componentParams.caption || '',
          description: componentParams.caption || '',
          metadata: uploadResult.metadata
        });
        
        console.log(`  ✓ Video uploaded successfully (${libraryEntry.id})`);
        return libraryEntry;
      }
      
      case 'image': {
        // Upload directly from URL to Cloudflare Images
        console.log('  → Uploading to Cloudflare Images...');
        const uploadResult = await uploadImageFromUrl(sourceUrl, {
          description: componentParams.caption || componentParams.alt || ''
        });
        
        // Add to media library
        console.log('  → Adding to media library...');
        const libraryEntry = addImageToLibrary({
          sourceUrl,
          imageId: uploadResult.imageId,
          fileName: uploadResult.originalUrl || 'image',
          alt: componentParams.alt,
          caption: componentParams.caption || '',
          description: componentParams.caption || componentParams.alt || '',
          urls: {
            thumbnail: uploadResult.thumbnailUrl,
            medium: uploadResult.mediumUrl,
            large: uploadResult.largeUrl,
            public: uploadResult.publicUrl
          }
        });
        
        console.log(`  ✓ Image uploaded successfully (${libraryEntry.id})`);
        return libraryEntry;
      }
      
      case 'document': {
        // R2 requires download first
        console.log('  → Downloading document...');
        const downloadResult = await downloadFile(sourceUrl, TEMP_DIR);
        
        // Upload to R2
        console.log('  → Uploading to Cloudflare R2...');
        const uploadResult = await uploadPDF(downloadResult.filePath, {
          title: componentParams.title,
          description: componentParams.description
        });
        
        // Add to media library
        console.log('  → Adding to media library...');
        const libraryEntry = addDocumentToLibrary({
          sourceUrl,
          fileName: uploadResult.originalFileName,
          r2Key: uploadResult.key,
          publicUrl: uploadResult.url,
          description: componentParams.description,
          linkText: componentParams.title,
          fileType: path.extname(uploadResult.originalFileName).slice(1).toUpperCase(),
          metadata: uploadResult
        });
        
        // Cleanup
        await fs.unlink(downloadResult.filePath);
        
        console.log(`  ✓ Document uploaded successfully (${libraryEntry.id})`);
        return libraryEntry;
      }
      
      default:
        throw new Error(`Unsupported media type: ${type}`);
    }
  } catch (error) {
    console.error(`  ✗ Upload failed: ${error.message}`);
    throw error;
  }
}
