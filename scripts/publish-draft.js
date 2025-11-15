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
        fs.unlinkSync(downloadResult.filePath);
        
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
 * Extract context around a URL in the markdown content
 * @param {string} content - Full markdown content
 * @param {string} url - URL to find context for
 * @param {number} contextChars - Characters before/after to include (default: 500)
 * @returns {string} Context snippet around the URL
 */
function extractUrlContext(content, url, contextChars = 500) {
  const index = content.indexOf(url);
  if (index === -1) return '';
  
  const start = Math.max(0, index - contextChars);
  const end = Math.min(content.length, index + url.length + contextChars);
  
  return content.substring(start, end);
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

For each media item, provide:

FOR VIDEOS:
- caption: Brief description of what the video shows (optional, only if context provides info)
  * WORD LIMIT: 15-25 words maximum
  * Be concise and factual

FOR IMAGES:
- alt: Accessible description of the image content (required - use context clues or generic description)
  * WORD LIMIT: 10-15 words maximum
  * Focus on what's visible in the image
- caption: Brief description for display (optional, only if context provides info)
  * WORD LIMIT: 15-25 words maximum
  * Can provide additional context beyond alt text

FOR DOCUMENTS:
- title: Short descriptive title (required - extract from context or make generic)
  * WORD LIMIT: 3-8 words maximum
  * Clear and specific
- description: What the document contains (required - extract from context or make generic)
  * WORD LIMIT: 15-30 words maximum
  * Summarize key content

FOR LINKS:
- title: Short title for the link (optional - falls back to hostname if omitted)
  * WORD LIMIT: 3-8 words maximum
  * Extract from context or link text
- description: Additional context (optional)
  * WORD LIMIT: 15-30 words maximum
  * What the link provides or covers
- icon: Icon variant (optional - choose based on link type)
  * "video" for YouTube/Vimeo/video platforms
  * "news" for news articles/outlets
  * "generic" for everything else (default)

For all items:
- confidence: 0-1 rating of how confident you are (lower if guessing)

CRITICAL: Adhere strictly to word limits. Be concise and precise.

Respond with ONLY a JSON array in this exact format:
[
  {
    "sourceUrl": "exact URL from list above",
    "type": "video|image|document",
    "componentParams": {
      // type-specific parameters
    },
    "confidence": 0.85
  }
]

Base your descriptions on the context provided. If there's minimal context, provide generic but accurate descriptions and lower the confidence score.`;

  try {
    console.log('  → Sending request to Claude...');
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });
    
    console.log('  → Received response from Claude\n');
    
    const responseText = message.content[0].text.trim();
    console.log('Raw AI Response:');
    console.log('─'.repeat(80));
    console.log(responseText);
    console.log('─'.repeat(80));
    console.log();
    
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
    }
    
    if (links.length > 0) {
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
  
  console.log(`   Type: ${articleType}`);
  console.log(`   Extracting metadata...`);
  
  let generatedContent;
  if (isCase) {
    generatedContent = await generateCaseArticle(draftPath, result);
  } else if (isPost) {
    generatedContent = await generateBlogPost(draftPath, result);
  }
  
  console.log(`   ✓ Metadata extracted`);
  console.log(`   ✓ Article content generated`);
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
  console.log('─'.repeat(80));
  console.log('\n✅ Publishing complete!\n');
  console.log(`📄 File: src/content/${isCase ? 'cases' : 'posts'}/${generatedContent.slug}.mdx`);
  console.log('='.repeat(80) + '\n');
  
  return { result, generatedContent, filePath };
}

/**
 * Build component reference string for AI
 * @param {object} mediaPackage - Processed media and links
 * @returns {string} - Component reference for AI prompt
 */
function buildComponentReference(mediaPackage) {
  let reference = '**Available Components:**\n\n';
  
  if (mediaPackage.media.length > 0) {
    reference += 'MEDIA:\n';
    mediaPackage.media.forEach((item, index) => {
      reference += `${index + 1}. ${item.componentHTML}\n`;
      reference += `   Source: ${item.sourceUrl}\n`;
      reference += `   Library ID: ${item.libraryId}\n\n`;
    });
  }
  
  if (mediaPackage.links.length > 0) {
    reference += '\nEXTERNAL LINKS:\n';
    mediaPackage.links.forEach((item, index) => {
      reference += `${index + 1}. ${item.componentHTML}\n`;
      reference += `   URL: ${item.sourceUrl}\n\n`;
    });
  }
  
  return reference;
}

/**
 * Build metadata extraction prompt for cases
 */
function buildCaseMetadataPrompt(draftContent, schemaContent, registry, mediaPackage) {
  const registrySection = `
**Canonical Metadata Registry:**
Use these exact values when they match the case details:

**Agencies:**
${registry.agencies.map(a => `- ${a}`).join('\n')}

**Counties:**
${registry.counties.map(c => `- ${c}`).join('\n')}

**Force Types:**
${registry.force_types.map(f => `- ${f}`).join('\n')}

**Threat Levels:**
${registry.threat_levels.map(t => `- ${t}`).join('\n')}

**Investigation Statuses:**
${registry.investigation_statuses.map(s => `- ${s}`).join('\n')}
`;

  // Build documents array from media
  const documents = mediaPackage.media
    .filter(item => item.type === 'document')
    .map(item => ({
      title: item.componentParams.title,
      description: item.componentParams.description,
      url: item.sourceUrl // Will be replaced with R2 URL
    }));
  
  // Build external_links array
  const external_links = mediaPackage.links.map(item => ({
    title: item.componentParams.title || '',
    description: item.componentParams.description || '',
    url: item.sourceUrl,
    icon: item.componentParams.icon || 'generic'
  }));
  
  // Find featured image
  let featuredImageId = null;
  const imageMedia = mediaPackage.media.filter(item => item.type === 'image');
  if (imageMedia.length > 0) {
    // Use first image as featured for now (could be enhanced with AI selection)
    const featuredImage = imageMedia[0];
    // Extract imageId from library entry
    featuredImageId = featuredImage.libraryId.replace('image-', '');
  }

  return `You are an expert legal writer generating metadata for a police misconduct case article.

**Draft Content:**
${draftContent}

${registrySection}

**Schema (from src/content/config.ts):**
${schemaContent.match(/const casesCollection[\s\S]+?\}\);/)[0]}

**Processed Media:**
Documents: ${JSON.stringify(documents, null, 2)}
External Links: ${JSON.stringify(external_links, null, 2)}
Featured Image ID: ${featuredImageId || 'null'}

**CRITICAL INSTRUCTIONS:**

1. **INFERENCE RULES - What you CAN infer:**
   - Gender from pronouns (he/his/him → "Male", she/her → "Female") or gendered names
   - Age from explicit mentions ("35-year-old" → 35)
   - Force type from incident description ("tased" → ["Taser"], "shot" → ["Shooting"])
   - Investigation status from legal mentions ("charges filed" → "Charges Filed")
   - Civil lawsuit from mentions of lawsuits/settlements
   - Bodycam availability if footage is mentioned or provided
   - Armed status from descriptions ("unarmed", "holding a knife", etc.)
   - Threat level from incident context

2. **What you CANNOT infer - use null:**
   - Race/ethnicity (NEVER assume - must be explicitly stated)
   - Exact dates not mentioned
   - Names not mentioned
   - Specific details not in the draft

3. **Registry Matching:**
   - For agencies: Match to registry values exactly (e.g., "LAPD" → "Los Angeles Police Department")
   - For counties: Use registry values
   - For force_types, threat_level, investigation_status: Use registry values
   - Add new values ONLY if registry doesn't have a match

4. **Required Fields:**
   - case_id: Format "ca-[agency-slug]-[year]-[sequential-number]" (e.g., "ca-lapd-2023-001")
   - title: Victim's full name
   - description: 1-2 sentence summary of the case
   - incident_date: "YYYY-MM-DD" format as STRING
   - city: City name
   - county: County name (from registry)
   - agencies: Array of agency names (from registry)

5. **Media Fields:**
   - documents: Use the "Processed Media" documents array exactly as provided
   - external_links: Use the "Processed Media" external_links array exactly as provided
   - featured_image: Use the Featured Image ID provided (or null)

6. **Data Types:**
   - Strings: Use quotes
   - Numbers: No quotes (age: 35, not "35")
   - Booleans: true/false (not "true"/"false")
   - Arrays: Use brackets []
   - Null: Use null (not "null")

7. **All Fields:** Include EVERY field from the schema. Use null for missing/unknown values.

Return ONLY valid JSON:
\`\`\`json
{
  "case_id": "ca-agency-year-001",
  "title": "Victim Name",
  ...all other fields...
}
\`\`\``;
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
   - Use exact HTML from "Available Components"
   - Place strategically for narrative flow

**OUTPUT FORMAT:**

Return complete MDX file with frontmatter:

\`\`\`mdx
---
case_id: "${metadata.case_id}"
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
featured_image: ${metadata.featured_image ? `"${metadata.featured_image}"` : 'null'}
documents: ${metadata.documents ? JSON.stringify(metadata.documents) : 'null'}
external_links: ${metadata.external_links ? JSON.stringify(metadata.external_links) : 'null'}
related_cases: ${metadata.related_cases ? JSON.stringify(metadata.related_cases) : 'null'}
attorney: ${metadata.attorney ? `"${metadata.attorney}"` : 'null'}
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
  
  const metadataResponse = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4000,
    messages: [{
      role: 'user',
      content: metadataPrompt
    }]
  });
  
  const metadataText = metadataResponse.content[0].text;
  const metadataMatch = metadataText.match(/```json\n([\s\S]+?)\n```/);
  
  if (!metadataMatch) {
    throw new Error('Failed to extract JSON metadata from AI response');
  }
  
  const metadata = JSON.parse(metadataMatch[1]);
  
  // Step 2: Generate article content
  const articlePrompt = buildCaseArticlePrompt(
    draftContent,
    metadata,
    componentReference
  );
  
  const articleResponse = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8000,
    messages: [{
      role: 'user',
      content: articlePrompt
    }]
  });
  
  const fullArticle = articleResponse.content[0].text;
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
 * Generate a blog post from draft and media
 * @param {string} draftPath - Path to draft file
 * @param {object} mediaPackage - Processed media and links from Phase 3
 * @returns {Promise<object>} - Generated article with frontmatter and content
 */
async function generateBlogPost(draftPath, mediaPackage) {
  console.log('→ Reading draft content...');
  const draftContent = await fs.readFile(draftPath, 'utf-8');
  
  // TODO: Parse existing frontmatter if present
  // TODO: Build AI prompt with draft content, media, and blog-specific requirements
  // TODO: Call Claude API to generate complete blog post
  // TODO: Validate required post frontmatter fields (title, description, published_date, tags, etc.)
  // TODO: Return { frontmatter, content }
  
  console.log('→ TODO: Implement blog post generation');
  return {
    frontmatter: {},
    content: draftContent,
    slug: 'placeholder-slug'
  };
}


main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
