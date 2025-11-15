#!/usr/bin/env node
/**
 * Interactive Draft Publisher
 * 
 * Allows user to select a draft file and publish it to the site.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import prompts from 'prompts';
import Anthropic from '@anthropic-ai/sdk';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DRAFTS_DIR = path.join(__dirname, '..', 'drafts');

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
 * Use AI to extract metadata for all media items from the article
 * @param {string} filePath - Path to markdown file
 * @param {Array<{sourceUrl: string, type: string}>} mediaItems - Categorized media items
 * @returns {Promise<Array<{sourceUrl: string, type: string, componentParams: object, confidence: number}>>}
 */
async function extractMediaMetadata(filePath, mediaItems) {
  const content = fs.readFileSync(filePath, 'utf-8');
  
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
  const content = fs.readFileSync(filePath, 'utf-8');
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
    
    if (!fs.existsSync(folderPath)) {
      continue;
    }
    
    const entries = fs.readdirSync(folderPath, { withFileTypes: true });
    
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
  
  // Phase 1: Scan for media and links
  const mediaItems = scanMediaAndLinks(response.selectedDraft);
  
  console.log(`🔍 Found ${mediaItems.length} URLs in draft\n`);
  
  // Phase 2: Extract metadata for all items using AI
  if (mediaItems.length > 0) {
    console.log('🤖 Analyzing all URLs with AI...\n');
    const enrichedMedia = await extractMediaMetadata(response.selectedDraft, mediaItems);
    
    // Print results
    console.log('📊 URLs with Metadata:\n');
    for (const item of enrichedMedia) {
      console.log(`${item.type.toUpperCase()}: ${item.sourceUrl}`);
      console.log(`  Confidence: ${(item.confidence * 100).toFixed(0)}%`);
      console.log(`  Params:`, JSON.stringify(item.componentParams, null, 2));
      console.log();
    }
  }
  
  // TODO: Next phases
  console.log('Next: Upload media to Cloudflare...');
}

main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
