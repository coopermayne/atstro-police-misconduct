#!/usr/bin/env node
/**
 * Interactive Draft Publisher
 * 
 * Allows user to select a draft file and publish it to the site.
 */

import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import prompts from 'prompts';
import Anthropic from '@anthropic-ai/sdk';
import 'dotenv/config';

import { downloadFile } from './file-downloader.js';
import { uploadVideo, uploadVideoFromUrl } from './cloudflare-stream.js';
import { uploadImage, uploadImageFromUrl } from './cloudflare-images.js';
import { uploadPDF } from './cloudflare-r2.js';
import {
  findAssetBySourceUrl,
  addVideoToLibrary,
  addImageToLibrary,
  addDocumentToLibrary
} from './media-library.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check for debug flag
const DEBUG_MODE = process.argv.includes('--debug');

/**
 * Display prompt to user and ask for confirmation before sending to AI
 * @param {string} prompt - The prompt to display
 * @param {string} promptName - Name/description of the prompt
 * @returns {Promise<boolean>} - True if user confirms, false otherwise
 */
async function displayPromptAndConfirm(prompt, promptName) {
  if (!DEBUG_MODE) {
    // In normal mode, just return true without displaying
    return true;
  }
  
  console.log('\n' + '═'.repeat(80));
  console.log(`📋 ${promptName}`);
  console.log('═'.repeat(80) + '\n');
  
  // Display prompt with word wrapping
  console.log(prompt);
  
  console.log('\n' + '═'.repeat(80));
  console.log(`Total characters: ${prompt.length}`);
  console.log('═'.repeat(80) + '\n');
  
  const response = await prompts({
    type: 'confirm',
    name: 'proceed',
    message: 'Send this prompt to Claude AI?',
    initial: true
  });
  
  if (!response.proceed) {
    console.log('\n❌ Cancelled by user\n');
    process.exit(0);
  }
  
  console.log('\n✓ Sending to Claude...\n');
  return true;
}

/**
 * Display AI response to user and ask for confirmation before continuing
 * @param {string} response - The AI response text to display
 * @param {string} responseName - Name/description of the response
 * @returns {Promise<boolean>} - True if user confirms, false otherwise
 */
async function displayResponseAndConfirm(response, responseName) {
  if (!DEBUG_MODE) {
    // In normal mode, just return true without displaying
    return true;
  }
  
  console.log('\n' + '═'.repeat(80));
  console.log(`🤖 ${responseName}`);
  console.log('═'.repeat(80) + '\n');
  
  // Display response
  console.log(response);
  
  console.log('\n' + '═'.repeat(80));
  console.log(`Total characters: ${response.length}`);
  console.log('═'.repeat(80) + '\n');
  
  const confirmResponse = await prompts({
    type: 'confirm',
    name: 'proceed',
    message: 'Continue with this response?',
    initial: true
  });
  
  if (!confirmResponse.proceed) {
    console.log('\n❌ Cancelled by user\n');
    process.exit(0);
  }
  
  console.log('\n✓ Continuing...\n');
  return true;
}

const DRAFTS_DIR = path.join(__dirname, '..', 'drafts');
const TEMP_DIR = path.join(__dirname, '..', '.temp-uploads');

/**
 * Ensure temp directory exists
 */
function ensureTempDir() {
  if (!fsSync.existsSync(TEMP_DIR)) {
    fsSync.mkdirSync(TEMP_DIR, { recursive: true });
  }
}

/**
 * Clean up temp directory
 */
function cleanupTempDir() {
  if (fsSync.existsSync(TEMP_DIR)) {
    const files = fsSync.readdirSync(TEMP_DIR);
    files.forEach(file => {
      fsSync.unlinkSync(path.join(TEMP_DIR, file));
    });
    fsSync.rmdirSync(TEMP_DIR);
  }
}

/**
 * Upload media item to Cloudflare and add to media library
 * @param {object} mediaItem - Media item with sourceUrl, type, componentParams
 * @returns {Promise<object>} - Media library entry with Cloudflare IDs
 */
async function uploadAndRegisterMedia(mediaItem) {
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


/**
 * Validate media metadata item against schema
 * @param {object} item - Media metadata item to validate
 * @returns {{valid: boolean, errors: string[]}}
 */
function validateMediaMetadataItem(item) {
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
 * Extract minimal context after a URL in the markdown content
 * @param {string} content - Full markdown content
 * @param {string} url - URL to find context for
 * @returns {string} Context snippet (up to ~20 words after the URL)
 */
function extractUrlContext(content, url) {
  const index = content.indexOf(url);
  if (index === -1) return '';
  
  // Start after the URL
  const afterUrl = content.substring(index + url.length);
  
  // Take up to 150 characters (roughly 20-25 words)
  let contextEnd = Math.min(150, afterUrl.length);
  let context = afterUrl.substring(0, contextEnd);
  
  // Stop if we hit another URL (http:// or https://)
  const nextUrlMatch = context.match(/https?:\/\//);
  if (nextUrlMatch) {
    context = context.substring(0, nextUrlMatch.index);
  }
  
  // Trim whitespace
  context = context.trim();
  
  return context || '(no context available)';
}

/**
 * Generate component HTML/MDX string for media
 * @param {string} type - Media type (video, image, document)
 * @param {object} libraryEntry - Media library entry with Cloudflare IDs
 * @param {object} componentParams - AI-generated component parameters
 * @returns {string} - MDX component string
 */
function generateComponentHTML(type, libraryEntry, componentParams) {
  switch (type) {
    case 'video': {
      const props = [];
      props.push(`videoId="${libraryEntry.videoId}"`);
      if (componentParams.caption) {
        props.push(`caption="${escapeQuotes(componentParams.caption)}"`);
      }
      return `<CloudflareVideo ${props.join(' ')} />`;
    }
    
    case 'image': {
      const props = [];
      props.push(`imageId="${libraryEntry.imageId}"`);
      props.push(`alt="${escapeQuotes(componentParams.alt)}"`);
      if (componentParams.caption) {
        props.push(`caption="${escapeQuotes(componentParams.caption)}"`);
      }
      return `<CloudflareImage ${props.join(' ')} />`;
    }
    
    case 'document': {
      const props = [];
      props.push(`title="${escapeQuotes(componentParams.title)}"`);
      props.push(`description="${escapeQuotes(componentParams.description)}"`);
      props.push(`url="${libraryEntry.publicUrl}"`);
      return `<DocumentCard ${props.join(' ')} />`;
    }
    
    default:
      return `<!-- Unknown media type: ${type} -->`;
  }
}

/**
 * Generate component HTML/MDX string for external links
 * @param {string} sourceUrl - The link URL
 * @param {object} componentParams - AI-generated link parameters
 * @returns {string} - MDX component string
 */
function generateLinkComponentHTML(sourceUrl, componentParams) {
  const props = [];
  props.push(`url="${sourceUrl}"`);
  
  if (componentParams.title) {
    props.push(`title="${escapeQuotes(componentParams.title)}"`);
  }
  if (componentParams.description) {
    props.push(`description="${escapeQuotes(componentParams.description)}"`);
  }
  if (componentParams.icon) {
    props.push(`icon="${componentParams.icon}"`);
  }
  
  return `<ExternalLinkCard ${props.join(' ')} />`;
}

/**
 * Escape quotes in component prop values
 * @param {string} str - String to escape
 * @returns {string} - Escaped string
 */
function escapeQuotes(str) {
  if (!str) return '';
  return str.replace(/"/g, '&quot;');
}

/**
 * Use AI to extract metadata for all media items from the article
 * @param {string} filePath - Path to markdown file
 * @param {Array<{sourceUrl: string, type: string}>} mediaItems - Categorized media items
 * @returns {Promise<Array<{sourceUrl: string, type: string, componentParams: object, confidence: number}>>}
 */
async function extractMediaMetadata(filePath, mediaItems) {
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
    if (!DEBUG_MODE) {
      console.log('   → Extracting media metadata with AI...');
    }
    await displayPromptAndConfirm(prompt, 'MEDIA METADATA EXTRACTION PROMPT');
    
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });
    
    const responseText = message.content[0].text.trim();
    await displayResponseAndConfirm(responseText, 'MEDIA METADATA EXTRACTION RESPONSE');
    
    if (!DEBUG_MODE) {
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

// Media type regex patterns
const MEDIA_PATTERNS = {
  image: /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)(\?|$)/i,
  video: /\.(mp4|mov|avi|wmv|flv|mkv|webm|m4v)(\?|$)/i,
  document: /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt)(\?|$)/i
};

/**
 * Extract all URLs from markdown content
 * @param {string} content - Markdown file content
 * @returns {string[]} Array of URLs
 */
function extractUrls(content) {
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
function determineTypeByUrl(url) {
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
function scanMediaAndLinks(filePath) {
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
 * Get all markdown files from drafts/cases and drafts/posts directories
 * @returns {string[]} Array of draft file paths
 */
function getDraftFiles() {
  const files = [];
  const folders = ['cases', 'posts'];
  
  for (const folder of folders) {
    const folderPath = path.join(DRAFTS_DIR, folder);
    
    if (!fsSync.existsSync(folderPath)) {
      continue;
    }
    
    const entries = fsSync.readdirSync(folderPath, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.md')) {
        files.push(path.join(folderPath, entry.name));
      }
    }
  }
  
  return files;
}

/**
 * Main entry point
 */
async function main() {
  console.log('📝 Draft Publisher\n');
  
  if (DEBUG_MODE) {
    console.log('🔍 Debug mode enabled - you will see all AI prompts and responses\n');
  }
  
  const draftFiles = getDraftFiles();
  
  if (draftFiles.length === 0) {
    console.log('No draft files found in the drafts folder.');
    process.exit(0);
  }
  
  // Create readable choices (show relative path from drafts/)
  const choices = draftFiles.map(file => {
    const relativePath = path.relative(DRAFTS_DIR, file);
    return {
      title: relativePath,
      value: file
    };
  });
  
  const response = await prompts({
    type: 'select',
    name: 'selectedDraft',
    message: 'Select a draft to publish:',
    choices: choices,
    initial: 0
  });
  
  if (!response.selectedDraft) {
    console.log('\nCancelled.');
    process.exit(0);
  }
  
  console.log(`\n✓ Selected: ${path.relative(DRAFTS_DIR, response.selectedDraft)}\n`);
  console.log('─'.repeat(80));
  
  // Phase 1: Scan for media and links
  const mediaItems = scanMediaAndLinks(response.selectedDraft);
  
  console.log(`\n📋 Phase 1: Scanning draft`);
  console.log(`   Found ${mediaItems.length} URL(s)\n`);
  
  // Phase 2: Extract metadata for all items using AI
  let result = { media: [], links: [] };
  
  if (mediaItems.length > 0) {
    console.log('🤖 Phase 2: Analyzing media with AI...');
    const enrichedMedia = await extractMediaMetadata(response.selectedDraft, mediaItems);
    
    const videos = enrichedMedia.filter(i => i.type === 'video').length;
    const images = enrichedMedia.filter(i => i.type === 'image').length;
    const docs = enrichedMedia.filter(i => i.type === 'document').length;
    const linkCount = enrichedMedia.filter(i => i.type === 'link').length;
    
    const summary = [];
    if (videos) summary.push(`${videos} video(s)`);
    if (images) summary.push(`${images} image(s)`);
    if (docs) summary.push(`${docs} document(s)`);
    if (linkCount) summary.push(`${linkCount} link(s)`);
    
    console.log(`   ✓ Extracted metadata for ${summary.join(', ')}\n`);
    
    // Phase 3: Upload media to Cloudflare and register in library
    const mediaToUpload = enrichedMedia.filter(item => ['image', 'video', 'document'].includes(item.type));
    const links = enrichedMedia.filter(item => item.type === 'link');
    
    if (mediaToUpload.length > 0) {
      console.log(`📤 Phase 3: Uploading to Cloudflare`);
      console.log(`   Processing ${mediaToUpload.length} media item(s)...\n`);
      
      const uploadedMedia = [];
      let foundInLibrary = 0;
      let newUploads = 0;
      
      for (const item of mediaToUpload) {
        try {
          const libraryEntry = await uploadAndRegisterMedia(item);
          
          // Track if it was found or newly created
          if (findAssetBySourceUrl(item.sourceUrl)) {
            foundInLibrary++;
          } else {
            newUploads++;
          }
          
          uploadedMedia.push({
            ...item,
            libraryEntry
          });
        } catch (error) {
          console.error(`   ❌ Upload failed: ${item.type}`);
          console.error(`   Error: ${error.message}\n`);
          throw error;
        }
      }
      
      console.log(`   ✓ Uploaded: ${newUploads} new, ${foundInLibrary} from library\n`);
      
      // Cleanup temp directory
      cleanupTempDir();
      
      // Return processed media with library references and component HTML
      const processedMedia = uploadedMedia.map(item => ({
        sourceUrl: item.sourceUrl,
        type: item.type,
        componentParams: item.componentParams,
        confidence: item.confidence,
        libraryId: item.libraryEntry.id,
        // Store the Cloudflare IDs for easy access
        imageId: item.type === 'image' ? item.libraryEntry.imageId : undefined,
        videoId: item.type === 'video' ? item.libraryEntry.videoId : undefined,
        publicUrl: item.type === 'document' ? item.libraryEntry.publicUrl : undefined,
        componentHTML: generateComponentHTML(item.type, item.libraryEntry, item.componentParams)
      }));
      
      const processedLinks = links.map(item => ({
        sourceUrl: item.sourceUrl,
        type: item.type,
        componentParams: item.componentParams,
        confidence: item.confidence,
        componentHTML: generateLinkComponentHTML(item.sourceUrl, item.componentParams)
      }));
      
      console.log('─'.repeat(80) + '\n');
      
      result = {
        media: processedMedia,
        links: processedLinks
      };
    } else if (links.length > 0) {
      // Only links, no media to upload
      const processedLinks = links.map(item => ({
        sourceUrl: item.sourceUrl,
        type: item.type,
        componentParams: item.componentParams,
        confidence: item.confidence,
        componentHTML: generateLinkComponentHTML(item.sourceUrl, item.componentParams)
      }));
      
      console.log('─'.repeat(80) + '\n');
      
      result = {
        media: [],
        links: processedLinks
      };
    }
  }
  
  // Phase 4: Generate article content based on type
  console.log('📝 Phase 4: Generating article with AI');
  
  const draftPath = response.selectedDraft;
  const isCase = draftPath.includes('/cases/');
  const isPost = draftPath.includes('/posts/');
  
  const articleType = isCase ? 'Case' : isPost ? 'Blog Post' : null;
  if (!articleType) {
    throw new Error('Unable to determine article type from draft path');
  }
  
  console.log(`   Type: ${articleType}\n`);
  
  let generatedContent;
  if (isCase) {
    generatedContent = await generateCaseArticle(draftPath, result);
  } else if (isPost) {
    generatedContent = await generateBlogPost(draftPath, result);
  }
  
  console.log(`\n   ✓ Content generation complete`);
  console.log(`   Slug: ${generatedContent.slug}\n`);
  
  console.log('─'.repeat(80) + '\n');
  
  // Phase 5: Save to content collection
  console.log('💾 Phase 5: Saving article');
  
  const contentDir = isCase ? './src/content/cases' : './src/content/posts';
  const filePath = path.join(contentDir, `${generatedContent.slug}.mdx`);
  
  console.log(`   → ${contentDir}/${generatedContent.slug}.mdx`);
  
  // Check if file already exists
  if (await fs.access(filePath).then(() => true).catch(() => false)) {
    console.log(`\n   ⚠️  File already exists`);
    const overwrite = await prompts({
      type: 'confirm',
      name: 'value',
      message: '   Overwrite?',
      initial: false
    });
    
    if (!overwrite.value) {
      console.log('\n❌ Cancelled\n');
      process.exit(0);
    }
    console.log();
  }
  
  // Write the MDX file
  await fs.writeFile(filePath, generatedContent.content, 'utf-8');
  
  console.log(`   ✓ File saved\n`);
  
  // Phase 6: Rename draft file to mark as published
  console.log('📌 Phase 6: Marking draft as published');
  
  const originalDraftPath = response.selectedDraft;
  const draftDir = path.dirname(originalDraftPath);
  const draftFileName = path.basename(originalDraftPath);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5); // YYYY-MM-DDTHH-MM-SS
  const newDraftName = `pub_${timestamp}_${draftFileName}`;
  const newDraftPath = path.join(draftDir, newDraftName);
  
  await fs.rename(originalDraftPath, newDraftPath);
  
  console.log(`   → Renamed: ${path.relative(DRAFTS_DIR, newDraftPath)}`);
  console.log(`   ✓ Draft marked as published\n`);
  
  console.log('─'.repeat(80));
  console.log('\n✅ Publishing complete!\n');
  console.log(`📄 Article: src/content/${isCase ? 'cases' : 'posts'}/${generatedContent.slug}.mdx`);
  console.log(`📝 Draft: ${path.relative(DRAFTS_DIR, newDraftPath)}`);
  console.log('='.repeat(80) + '\n');
  
  return { result, generatedContent, filePath, renamedDraft: newDraftPath };
}

/**
 * Field-to-Registry mapping with AI generation instructions
 * Defines which schema fields map to registry keys and how AI should handle them
 */
const FIELD_REGISTRY_MAP = {
  // Case fields
  agencies: {
    registryKey: 'agencies',
    instruction: 'Match abbreviations or informal names to full agency names from registry (e.g., "LAPD" → "Los Angeles Police Department"). Add new agencies if not in registry.',
    canInfer: true,
    inferenceHints: ['Extract from incident descriptions', 'Match to full official names']
  },
  county: {
    registryKey: 'counties',
    instruction: 'Use exact county name from registry. Infer from city if possible.',
    canInfer: true,
    inferenceHints: ['Look up city to determine county']
  },
  force_type: {
    registryKey: 'force_types',
    instruction: 'Select all applicable force types from registry based on incident description. Can infer from action verbs ("shot" → "Shooting", "tased" → "Taser").',
    canInfer: true,
    inferenceHints: ['Multiple types possible', 'Infer from incident verbs and descriptions']
  },
  threat_level: {
    registryKey: 'threat_levels',
    instruction: 'Assess threat level from incident context and subject behavior. Use registry categories.',
    canInfer: true,
    inferenceHints: ['Based on subject actions', 'Consider weapon presence', 'Evaluate behavior described']
  },
  investigation_status: {
    registryKey: 'investigation_statuses',
    instruction: 'Determine current status from legal developments mentioned. Use registry values.',
    canInfer: true,
    inferenceHints: ['Look for mentions of charges, trials, settlements', 'May be explicitly stated']
  },
  
  // Post fields
  tags: {
    registryKey: 'post_tags',
    instruction: 'Select relevant topic tags from registry. Add new tags if article covers topics not yet in registry. Tags should be 1-3 words, title case.',
    canInfer: true,
    inferenceHints: ['Choose 2-5 tags per post', 'Can create new tags for new topics', 'Be specific but reusable']
  }
};

/**
 * Build registry section for a specific field
 * @param {string} fieldName - The field name (e.g., 'agencies')
 * @param {object} config - Field configuration from FIELD_REGISTRY_MAP
 * @param {object} registry - Full metadata registry
 * @returns {string} - Formatted registry section for AI prompt
 */
function buildRegistrySection(fieldName, config, registry) {
  const values = registry[config.registryKey] || [];
  
  let section = `**${fieldName.toUpperCase()}:**\n`;
  section += `${config.instruction}\n`;
  
  if (values.length > 0) {
    section += `Available values:\n`;
    values.forEach(value => {
      section += `- ${value}\n`;
    });
  } else {
    section += `(Registry currently empty - you may create initial values)\n`;
  }
  
  section += '\n';
  return section;
}

/**
 * Build inference rules section from field configurations
 * @param {string[]} fieldNames - Fields applicable to this content type
 * @returns {string} - Formatted inference rules for AI prompt
 */
function buildInferenceRules(fieldNames) {
  let rules = '**INFERENCE RULES:**\n\n';
  rules += 'What you CAN infer:\n';
  
  const inferableFields = fieldNames
    .filter(field => FIELD_REGISTRY_MAP[field]?.canInfer)
    .map(field => FIELD_REGISTRY_MAP[field]);
  
  if (inferableFields.length > 0) {
    inferableFields.forEach(config => {
      if (config.inferenceHints) {
        config.inferenceHints.forEach(hint => {
          rules += `- ${hint}\n`;
        });
      }
    });
  }
  
  rules += '\nWhat you CANNOT infer (use null if not stated):\n';
  rules += '- Race/ethnicity (NEVER assume)\n';
  rules += '- Exact dates not mentioned\n';
  rules += '- Names not provided\n';
  rules += '- Specific details not in source\n\n';
  
  return rules;
}

/**
 * Build component reference string for AI
 * @param {object} mediaPackage - Processed media and links
 * @returns {string} - Component reference for AI prompt
 */
function buildComponentReference(mediaPackage) {
  let reference = '**Available Components:**\n\n';
  reference += '**CRITICAL**: Copy these component tags EXACTLY as shown. Do NOT modify the IDs.\n\n';
  
  if (mediaPackage.media.length > 0) {
    reference += 'MEDIA:\n';
    mediaPackage.media.forEach((item, index) => {
      reference += `${index + 1}. ${item.componentHTML}\n\n`;
    });
  }
  
  if (mediaPackage.links.length > 0) {
    reference += 'EXTERNAL LINKS:\n';
    mediaPackage.links.forEach((item, index) => {
      reference += `${index + 1}. ${item.componentHTML}\n\n`;
    });
  }
  
  return reference;
}

/**
 * Build metadata extraction prompt for cases
 */
function buildCaseMetadataPrompt(draftContent, schemaContent, registry, mediaPackage) {
  // Define which fields from FIELD_REGISTRY_MAP apply to cases
  const caseRegistryFields = ['agencies', 'county', 'force_type', 'threat_level', 'investigation_status'];

  // Build documents array from media - use R2 public URL
  const documents = mediaPackage.media
    .filter(item => item.type === 'document')
    .map(item => ({
      title: item.componentParams.title,
      description: item.componentParams.description,
      url: item.publicUrl
    }));
  
  // Build external_links array
  const external_links = mediaPackage.links.map(item => ({
    title: item.componentParams.title || '',
    description: item.componentParams.description || '',
    url: item.sourceUrl,
    icon: item.componentParams.icon || 'generic'
  }));
  
  // Find featured image
  const imageMedia = mediaPackage.media.filter(item => item.type === 'image');
  
  // Get registry values as JSON arrays
  const agencies = JSON.stringify(registry.agencies || []);
  const counties = JSON.stringify(registry.counties || []);
  const forceTypes = JSON.stringify(registry.force_types || []);
  const threatLevels = JSON.stringify(registry.threat_levels || []);
  const investigationStatuses = JSON.stringify(registry.investigation_statuses || []);
  
  // Build featured image section with clear instructions
  let featuredImageInstructions = '';
  if (imageMedia.length > 0) {
    featuredImageInstructions = `"featured_image": {  // **REQUIRED** - You MUST select one image from the list below
    "imageId": "string",  // MUST be one of these exact IDs: ${imageMedia.map(img => `"${img.imageId}"`).join(', ')}
    "alt": "string",  // Copy the exact alt text from the selected image below
    "caption": "string"  // Copy the exact caption from the selected image below (omit this line if caption is empty)
  },
  // Available images to choose from:
${imageMedia.map((img, i) => `  // ${i + 1}. imageId: "${img.imageId}"
  //    alt: "${img.componentParams.alt}"
  //    caption: ${img.componentParams.caption ? `"${img.componentParams.caption}"` : '(none - omit caption field)'}`).join('\n')}`;
  } else {
    featuredImageInstructions = '"featured_image": null,  // No images available';
  }

  return `You are an expert legal writer generating metadata for a police misconduct case article.

**Draft Content:**
${draftContent}

**Instructions:**

The registry maintains canonical values to prevent duplicates and enable filtering. When you see something that matches a registry value (even if worded differently), use the exact registry value. If something isn't in the registry, create an appropriate new value - it will be added for future cases.

Example: Draft says "Stanislaus Sheriff" → Use "Stanislaus County Sheriff's Department" (from registry)

What you CAN infer:
- Gender from pronouns (he/him → "Male", she/her → "Female")
- Age from phrases ("39-year-old" → 39)
- Force types from actions ("slammed to ground" → "Physical Force")
- Armed status from descriptions ("unarmed", "had no weapons")
- Threat level from behavior described
- Civil lawsuit from mentions of legal filings
- Bodycam if footage is mentioned

What you CANNOT infer (must be explicitly stated or set to null):
- Race/ethnicity (NEVER assume from names or location)
- Exact dates ("October 2022" without day → null)
- Officer names (unless specifically named)
- Legal outcomes (unless explicitly stated)

${imageMedia.length > 0 ? `**AVAILABLE IMAGES:**
You have ${imageMedia.length} image(s) to choose from for the featured_image field:

${imageMedia.map((img, i) => `${i + 1}. imageId: "${img.imageId}"
   alt: "${img.componentParams.alt}"
   caption: ${img.componentParams.caption ? `"${img.componentParams.caption}"` : '(none)'}`).join('\n\n')}

` : ''}**CRITICAL - ERROR HANDLING:**
If you CANNOT determine the victim's name (title) ${imageMedia.length > 0 ? 'or select a featured_image' : ''}, return this error format instead:

\`\`\`json
{
  "error": true,
  "message": "Cannot determine victim's name from draft content. Please provide the victim's full name in the draft."
}
\`\`\`

Only return an error if the REQUIRED fields cannot be determined. Use null for optional fields.

**Return this EXACT JSON structure:**

\`\`\`json
{
  "title": "string",  // Victim's full name
  "description": "string",  // Concise summary, max 100 words
  "incident_date": "YYYY-MM-DD",  // Or null if not stated with day precision
  "published": true,
  
  "city": "string",  // City name
  "county": "string",  // REGISTRY: ${counties} | ${FIELD_REGISTRY_MAP.county.instruction}
  
  "age": 39,  // number or null (can infer from "39-year-old")
  "race": "string or null",  // NEVER assume - must be explicitly stated
  "gender": "Male",  // "Male"|"Female"|"Non-binary" or null (can infer from pronouns)
  
  "agencies": ["Full Agency Name"],  // REGISTRY: ${agencies} | ${FIELD_REGISTRY_MAP.agencies.instruction}
  
  "cause_of_death": "string or null",
  "armed_status": "Armed",  // "Armed"|"Unarmed"|"Unknown" or null
  "threat_level": "No Threat",  // REGISTRY: ${threatLevels} | ${FIELD_REGISTRY_MAP.threat_level.instruction}
  "force_type": ["Physical Force"],  // REGISTRY: ${forceTypes} | ${FIELD_REGISTRY_MAP.force_type.instruction}
  "shooting_officers": ["Officer Name"] or null,
  
  "investigation_status": "string",  // REGISTRY: ${investigationStatuses} | ${FIELD_REGISTRY_MAP.investigation_status.instruction}
  "charges_filed": true,  // true|false|null
  "civil_lawsuit_filed": true,  // true|false|null
  "bodycam_available": true,  // true|false|null
  
  ${featuredImageInstructions}
  "documents": ${JSON.stringify(documents)},  // Use exactly as provided
  "external_links": ${JSON.stringify(external_links)}  // Use exactly as provided
}
\`\`\`

Return ONLY the JSON above with all fields filled in based on the draft content.`;
}

/**
 * Build metadata extraction prompt for blog posts
 */
function buildBlogMetadataPrompt(draftContent, schemaContent, registry, mediaPackage) {
  // Build documents array from media - use R2 public URL
  const documents = mediaPackage.media
    .filter(item => item.type === 'document')
    .map(item => ({
      title: item.componentParams.title,
      description: item.componentParams.description,
      url: item.publicUrl
    }));
  
  // Build external_links array
  const external_links = mediaPackage.links.map(item => ({
    title: item.componentParams.title || '',
    description: item.componentParams.description || '',
    url: item.sourceUrl,
    icon: item.componentParams.icon || 'generic'
  }));
  
  // Find featured image
  const imageMedia = mediaPackage.media.filter(item => item.type === 'image');
  
  // Get registry values as JSON array
  const tags = JSON.stringify(registry.post_tags || []);
  
  // Build featured image section with clear instructions
  let featuredImageInstructions = '';
  if (imageMedia.length > 0) {
    featuredImageInstructions = `"featured_image": {  // **OPTIONAL** but strongly recommended - Select the most relevant image or set to null
    "imageId": "string",  // Choose one of these exact IDs: ${imageMedia.map(img => `"${img.imageId}"`).join(', ')}
    "alt": "string",  // Copy the exact alt text from the selected image below
    "caption": "string"  // Copy the exact caption from the selected image below (omit this line if caption is empty)
  },
  // Available images to choose from (or set featured_image to null if none are suitable):
${imageMedia.map((img, i) => `  // ${i + 1}. imageId: "${img.imageId}"
  //    alt: "${img.componentParams.alt}"
  //    caption: ${img.componentParams.caption ? `"${img.componentParams.caption}"` : '(none - omit caption field)'}`).join('\n')}`;
  } else {
    featuredImageInstructions = '"featured_image": null,  // No images available';
  }

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

  return `You are an expert writer generating metadata for a blog post about police misconduct and legal issues.

**Draft Content:**
${draftContent}

**Instructions:**

The registry maintains canonical tag values for reusable topics across posts. When a topic matches a registry tag, use it exactly. For new topics, create appropriate new tags (1-3 words, Title Case) - they'll be added to the registry.

Example: Topic about SB 2 → Use "California Legislation" (from registry)
Example: New topic about use of force → Create "Use of Force" (will be added)

${imageMedia.length > 0 ? `**AVAILABLE IMAGES:**
You have ${imageMedia.length} image(s) available for the optional featured_image field:

${imageMedia.map((img, i) => `${i + 1}. imageId: "${img.imageId}"
   alt: "${img.componentParams.alt}"
   caption: ${img.componentParams.caption ? `"${img.componentParams.caption}"` : '(none)'}`).join('\n\n')}

` : ''}**CRITICAL - ERROR HANDLING:**
If you CANNOT determine an appropriate title for this blog post, return this error format instead:

\`\`\`json
{
  "error": true,
  "message": "Cannot determine appropriate title from draft content. Please provide a clear topic or title in the draft."
}
\`\`\`

Only return an error if the title cannot be determined. All other fields can use reasonable defaults.

**Return this EXACT JSON structure:**

\`\`\`json
{
  "title": "string",  // Clear, engaging title (5-10 words)
  "description": "string",  // Concise summary for SEO/previews (15-25 words)
  "published_date": "${today}",  // Today's date
  "published": true,
  "tags": ["Tag One", "Tag Two"],  // REGISTRY: ${tags} | ${FIELD_REGISTRY_MAP.tags.instruction}
  ${featuredImageInstructions}
  "documents": ${JSON.stringify(documents)},  // Use exactly as provided
  "external_links": ${JSON.stringify(external_links)}  // Use exactly as provided
}
\`\`\`

Return ONLY the JSON above with all fields filled in based on the draft content.`;
}

/**
 * Build article generation prompt for cases
 */
function buildCaseArticlePrompt(draftContent, metadata, componentReference) {
  return `You are an expert legal writer creating a publication-ready police misconduct case article.

**Draft Content:**
${draftContent}

**Extracted Metadata:**
${JSON.stringify(metadata, null, 2)}

${componentReference}

**WRITING GUIDELINES:**

1. **TONE - Encyclopedic (Wikipedia-style):**
   - Neutral, dispassionate, objective
   - NO emotional language ("tragically", "unfortunately", "shockingly")
   - NO dramatic framing or narrative embellishment
   - State facts directly without editorial commentary
   - Example: "died from injuries" NOT "tragically lost their life"

2. **STRUCTURE:**
   - DO NOT follow draft order - reorganize for best narrative flow
   - Lead with most important information
   - Build context logically
   - 3-5 paragraphs minimum for main summary
   - Use ## for section headings (not #)

3. **MEDIA PLACEMENT:**
   - Integrate components naturally throughout article
   - Place media where they enhance understanding
   - Use components from "Available Components" section above
   - Import ONLY components you actually use at the top

4. **WHAT TO INCLUDE:**
   - Comprehensive case summary
   - Timeline of events (if enough detail available)
   - Key legal/investigative developments
   - Relevant context

5. **WHAT NOT TO INCLUDE:**
   - NO "## Related Documents" section (handled automatically)
   - NO "## External Links" section (handled automatically)
   - NO "## Sources" section (in frontmatter)
   - DO reference documents/links naturally in text (e.g., "According to court filings...")

6. **COMPONENTS:**
   Available: CloudflareVideo, CloudflareImage, DocumentCard, ExternalLinkCard
   - Only import what you use
   - **CRITICAL**: Copy component HTML EXACTLY from "Available Components" - do NOT modify IDs
   - The videoId and imageId values are Cloudflare UUIDs - never change them
   - Place strategically for narrative flow

**OUTPUT FORMAT:**

Return complete MDX file with frontmatter:

\`\`\`mdx
---
title: "${metadata.title}"
description: "${metadata.description}"
incident_date: "${metadata.incident_date}"
city: "${metadata.city}"
county: "${metadata.county}"
agencies: ${JSON.stringify(metadata.agencies)}
published: true
age: ${metadata.age || 'null'}
race: ${metadata.race ? `"${metadata.race}"` : 'null'}
gender: ${metadata.gender ? `"${metadata.gender}"` : 'null'}
cause_of_death: ${metadata.cause_of_death ? `"${metadata.cause_of_death}"` : 'null'}
armed_status: ${metadata.armed_status ? `"${metadata.armed_status}"` : 'null'}
threat_level: ${metadata.threat_level ? `"${metadata.threat_level}"` : 'null'}
force_type: ${metadata.force_type ? JSON.stringify(metadata.force_type) : 'null'}
shooting_officers: ${metadata.shooting_officers ? JSON.stringify(metadata.shooting_officers) : 'null'}
investigation_status: ${metadata.investigation_status ? `"${metadata.investigation_status}"` : 'null'}
charges_filed: ${metadata.charges_filed !== undefined && metadata.charges_filed !== null ? metadata.charges_filed : 'null'}
civil_lawsuit_filed: ${metadata.civil_lawsuit_filed !== undefined && metadata.civil_lawsuit_filed !== null ? metadata.civil_lawsuit_filed : 'null'}
bodycam_available: ${metadata.bodycam_available !== undefined && metadata.bodycam_available !== null ? metadata.bodycam_available : 'null'}
featured_image: ${metadata.featured_image ? `
  imageId: "${metadata.featured_image.imageId}"
  alt: "${metadata.featured_image.alt}"${metadata.featured_image.caption ? `\n  caption: "${metadata.featured_image.caption}"` : ''}` : 'null'}
documents: ${metadata.documents ? JSON.stringify(metadata.documents) : 'null'}
external_links: ${metadata.external_links ? JSON.stringify(metadata.external_links) : 'null'}
---

import CloudflareImage from '../../components/CloudflareImage.astro';
import CloudflareVideo from '../../components/CloudflareVideo.astro';

[Your encyclopedic article content with embedded media, proper headings, timeline, etc.]
\`\`\``;
}

/**
 * Generate a case article from draft and media
 * @param {string} draftPath - Path to draft file
 * @param {object} mediaPackage - Processed media and links from Phase 3
 * @returns {Promise<object>} - Generated article with frontmatter and content
 */
async function generateCaseArticle(draftPath, mediaPackage) {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
  });
  
  const draftContent = await fs.readFile(draftPath, 'utf-8');
  const registry = JSON.parse(await fs.readFile('./metadata-registry.json', 'utf-8'));
  const schemaContent = await fs.readFile('./src/content/config.ts', 'utf-8');
  const componentReference = buildComponentReference(mediaPackage);
  
  // Step 1: Extract metadata from draft
  const metadataPrompt = buildCaseMetadataPrompt(
    draftContent,
    schemaContent,
    registry,
    mediaPackage
  );
  
  if (!DEBUG_MODE) {
    console.log('   → Extracting case metadata...');
  }
  await displayPromptAndConfirm(metadataPrompt, 'CASE METADATA EXTRACTION PROMPT');
  
  const metadataResponse = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4000,
    messages: [{
      role: 'user',
      content: metadataPrompt
    }]
  });
  
  const metadataText = metadataResponse.content[0].text;
  await displayResponseAndConfirm(metadataText, 'CASE METADATA EXTRACTION RESPONSE');
  
  if (!DEBUG_MODE) {
    console.log('   ✓ Case metadata extracted');
  }
  
  const metadataMatch = metadataText.match(/```json\n([\s\S]+?)\n```/);
  
  if (!metadataMatch) {
    throw new Error('Failed to extract JSON metadata from AI response');
  }
  
  const metadata = JSON.parse(metadataMatch[1]);
  
  // Check for error response from AI
  if (metadata.error) {
    console.error('\n' + '═'.repeat(80));
    console.error('❌ METADATA EXTRACTION ERROR');
    console.error('═'.repeat(80));
    console.error(`\n${metadata.message}\n`);
    console.error('The AI could not extract required metadata from the draft.');
    console.error('Please update your draft file and try again.\n');
    process.exit(1);
  }
  
  // Step 2: Generate article content
  const articlePrompt = buildCaseArticlePrompt(
    draftContent,
    metadata,
    componentReference
  );
  
  if (!DEBUG_MODE) {
    console.log('   → Generating article content...');
  }
  await displayPromptAndConfirm(articlePrompt, 'CASE ARTICLE GENERATION PROMPT');
  
  const articleResponse = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8000,
    messages: [{
      role: 'user',
      content: articlePrompt
    }]
  });
  
  const fullArticle = articleResponse.content[0].text;
  await displayResponseAndConfirm(fullArticle, 'CASE ARTICLE GENERATION RESPONSE');
  
  if (!DEBUG_MODE) {
    console.log('   ✓ Article content generated');
  }
  
  const mdxMatch = fullArticle.match(/```mdx\n([\s\S]+?)\n```/);
  
  if (!mdxMatch) {
    throw new Error('Failed to extract MDX content from AI response');
  }
  
  const mdxContent = mdxMatch[1];
  
  // Generate slug from title
  const slug = metadata.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  
  return {
    metadata,
    content: mdxContent,
    slug
  };
}

/**
 * Build article generation prompt for blog posts
 */
function buildBlogArticlePrompt(draftContent, metadata, componentReference) {
  return `You are an expert writer creating a publication-ready blog post about police misconduct and legal issues.

**Draft Content:**
${draftContent}

**Extracted Metadata:**
${JSON.stringify(metadata, null, 2)}

${componentReference}

**WRITING GUIDELINES:**

1. **TONE - Engaging and Informative:**
   - Professional but conversational
   - Explain legal concepts clearly for general audience
   - Use active voice
   - Be informative without being dry
   - Example: "Understanding qualified immunity starts with..." NOT "This doctrine is complex and..."

2. **STRUCTURE:**
   - DO NOT follow draft order - reorganize for best flow
   - Lead with engaging introduction that hooks reader
   - Build arguments/explanations logically
   - 4-7 paragraphs minimum for main content
   - Use ## for section headings (not #)

3. **REQUIRED SECTION - Key Takeaways:**
   - Include a "## Key Takeaways" section near the end
   - 3-5 bullet points summarizing main points
   - Clear, actionable insights

4. **MEDIA PLACEMENT:**
   - Integrate components naturally throughout article
   - Place media where they enhance understanding
   - Use components from "Available Components" section above
   - Import ONLY components you actually use at the top

5. **WHAT NOT TO INCLUDE:**
   - NO "## Related Documents" section (handled automatically)
   - NO "## External Links" section (handled automatically)
   - NO "## Sources" section (in frontmatter)
   - DO reference documents/links naturally in text when relevant

6. **COMPONENTS:**
   Available: CloudflareVideo, CloudflareImage, DocumentCard, ExternalLinkCard
   - Only import what you use
   - **CRITICAL**: Copy component HTML EXACTLY from "Available Components" - do NOT modify IDs
   - The videoId and imageId values are Cloudflare UUIDs - never change them
   - Place strategically for narrative flow

**OUTPUT FORMAT:**

Return complete MDX file with frontmatter:

\`\`\`mdx
---
title: "${metadata.title}"
description: "${metadata.description}"
published_date: "${metadata.published_date}"
published: ${metadata.published}
tags: ${JSON.stringify(metadata.tags)}${metadata.featured_image ? `
featured_image:
  imageId: "${metadata.featured_image.imageId}"
  alt: "${metadata.featured_image.alt}"${metadata.featured_image.caption ? `\n  caption: "${metadata.featured_image.caption}"` : ''}` : ''}
documents: ${metadata.documents ? JSON.stringify(metadata.documents) : 'null'}
external_links: ${metadata.external_links ? JSON.stringify(metadata.external_links) : 'null'}
---

import CloudflareImage from '../../components/CloudflareImage.astro';
import CloudflareVideo from '../../components/CloudflareVideo.astro';

[Your engaging article content with embedded media, proper headings, Key Takeaways section, etc.]
\`\`\``;
}

/**
 * Generate a blog post from draft and media
 * @param {string} draftPath - Path to draft file
 * @param {object} mediaPackage - Processed media and links from Phase 3
 * @returns {Promise<object>} - Generated article with frontmatter and content
 */
async function generateBlogPost(draftPath, mediaPackage) {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
  });
  
  const draftContent = await fs.readFile(draftPath, 'utf-8');
  const registry = JSON.parse(await fs.readFile('./metadata-registry.json', 'utf-8'));
  const schemaContent = await fs.readFile('./src/content/config.ts', 'utf-8');
  const componentReference = buildComponentReference(mediaPackage);
  
  // Step 1: Extract metadata from draft
  const metadataPrompt = buildBlogMetadataPrompt(
    draftContent,
    schemaContent,
    registry,
    mediaPackage
  );
  
  if (!DEBUG_MODE) {
    console.log('   → Extracting blog metadata...');
  }
  await displayPromptAndConfirm(metadataPrompt, 'BLOG METADATA EXTRACTION PROMPT');
  
  const metadataResponse = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4000,
    messages: [{
      role: 'user',
      content: metadataPrompt
    }]
  });
  
  const metadataText = metadataResponse.content[0].text;
  await displayResponseAndConfirm(metadataText, 'BLOG METADATA EXTRACTION RESPONSE');
  
  if (!DEBUG_MODE) {
    console.log('   ✓ Blog metadata extracted');
  }
  
  const metadataMatch = metadataText.match(/```json\n([\s\S]+?)\n```/);
  
  if (!metadataMatch) {
    throw new Error('Failed to extract JSON metadata from AI response');
  }
  
  const metadata = JSON.parse(metadataMatch[1]);
  
  // Check for error response from AI
  if (metadata.error) {
    console.error('\n' + '═'.repeat(80));
    console.error('❌ METADATA EXTRACTION ERROR');
    console.error('═'.repeat(80));
    console.error(`\n${metadata.message}\n`);
    console.error('The AI could not extract required metadata from the draft.');
    console.error('Please update your draft file and try again.\n');
    process.exit(1);
  }
  
  // Step 2: Generate article content
  const articlePrompt = buildBlogArticlePrompt(
    draftContent,
    metadata,
    componentReference
  );
  
  if (!DEBUG_MODE) {
    console.log('   → Generating article content...');
  }
  await displayPromptAndConfirm(articlePrompt, 'BLOG ARTICLE GENERATION PROMPT');
  
  const articleResponse = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8000,
    messages: [{
      role: 'user',
      content: articlePrompt
    }]
  });
  
  const fullArticle = articleResponse.content[0].text;
  await displayResponseAndConfirm(fullArticle, 'BLOG ARTICLE GENERATION RESPONSE');
  
  if (!DEBUG_MODE) {
    console.log('   ✓ Article content generated');
  }
  
  const mdxMatch = fullArticle.match(/```mdx\n([\s\S]+?)\n```/);
  
  if (!mdxMatch) {
    throw new Error('Failed to extract MDX content from AI response');
  }
  
  const mdxContent = mdxMatch[1];
  
  // Generate slug from title
  const slug = metadata.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  
  return {
    metadata,
    content: mdxContent,
    slug
  };
}


main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
