#!/usr/bin/env node
/**
 * Draft Publisher
 * 
 * Main orchestration script that:
 * 1. Reads draft markdown file
 * 2. Downloads external media files
 * 3. Uploads to Cloudflare (Stream for videos, R2 for images/PDFs)
 * 4. Analyzes media with AI
 * 5. Generates complete article with AI
 * 6. Saves to appropriate content collection
 * 7. Archives draft
 * 8. Commits and pushes to GitHub
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import Anthropic from '@anthropic-ai/sdk';

import { downloadFile, extractUrlsFromMarkdown, categorizeUrls, parseDocumentAnnotations, parseMediaShortcodes } from './file-downloader.js';
import { uploadVideo, uploadVideoFromUrl } from './cloudflare-stream.js';
import { uploadImage } from './cloudflare-images.js';
import { uploadPDF } from './cloudflare-r2.js';
import { convertToDirectUrl } from './file-downloader.js';
import { 
  findAssetBySourceUrl, 
  addVideoToLibrary, 
  addImageToLibrary, 
  addDocumentToLibrary 
} from './media-library.js';
import {
  createVideoAnalysisPrompt,
  createDocumentAnalysisPrompt,
  createMetadataExtractionPrompt,
  createCaseArticlePrompt,
  createBlogPostPrompt,
  createSlugGenerationPrompt,
  createDraftValidationPrompt
} from './ai-prompts.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const DRAFTS_DIR = path.join(ROOT_DIR, 'drafts');
const PUBLISHED_DIR = path.join(DRAFTS_DIR, 'published');
const TEMP_DIR = path.join(ROOT_DIR, '.temp-uploads');

// Initialize Anthropic Claude
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

/**
 * Parse frontmatter from draft markdown
 */
function parseDraftMetadata(content) {
  const lines = content.split('\n');
  let inFrontmatter = false;
  let metadata = {};
  
  // Look for basic metadata patterns
  const typeMatch = content.match(/\*\*Type:\*\*\s*(.+)/i);
  const statusMatch = content.match(/\*\*Status:\*\*\s*(.+)/i);
  const createdMatch = content.match(/\*\*Created:\*\*\s*(.+)/i);
  
  return {
    type: typeMatch ? typeMatch[1].trim().toLowerCase() : 'case',
    status: statusMatch ? statusMatch[1].trim() : 'draft',
    created: createdMatch ? createdMatch[1].trim() : new Date().toISOString().split('T')[0]
  };
}

/**
 * Call Claude API with retry logic
 */
async function callClaude(prompt, options = {}) {
  const maxRetries = 3;
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      const response = await anthropic.messages.create({
        model: options.model || 'claude-sonnet-4-20250514',
        max_tokens: options.max_tokens || 4000,
        temperature: options.temperature || 0.7,
        system: prompt.system,
        messages: [
          { role: 'user', content: prompt.user }
        ]
      });
      
      return response.content[0].text;
    } catch (error) {
      attempt++;
      if (attempt >= maxRetries) {
        throw new Error(`Claude API failed after ${maxRetries} attempts: ${error.message}`);
      }
      console.log(`   ⚠️  Retry ${attempt}/${maxRetries}...`);
      await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
    }
  }
}

/**
 * Extract JSON from AI response
 */
function extractJSON(text) {
  // Try to find JSON in code blocks
  const codeBlockMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1]);
    } catch (e) {
      // Continue to other methods
    }
  }
  
  // Try to parse the whole thing
  try {
    return JSON.parse(text);
  } catch {
    // Try to extract first JSON object (non-greedy)
    const jsonMatch = text.match(/\{[\s\S]*?\n\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (e) {
        // Try greedy match
        const greedyMatch = text.match(/\{[\s\S]*\}/);
        if (greedyMatch) {
          return JSON.parse(greedyMatch[0]);
        }
      }
    }
  }
  
  // If all fails, log the response and throw
  console.error('   Raw AI response:', text.substring(0, 500));
  throw new Error('Could not extract JSON from AI response');
}

/**
 * Validate media shortcode syntax
 * Detects malformed shortcodes and provides specific error messages
 */
function validateMediaShortcodeSyntax(draftContent) {
  const errors = [];
  const warnings = [];
  const lines = draftContent.split('\n');
  
  // Pattern to detect potential shortcodes (even malformed ones)
  // Looks for {{ with type-like word followed by colon
  const potentialShortcodePattern = /\{\{[\s]*(\w+)[\s]*:([^}]*)/g;
  
  let match;
  let lineNumber = 0;
  const contentByLine = lines.map((line, idx) => ({ line, number: idx + 1 }));
  
  // Check each line for potential shortcodes
  for (const { line, number } of contentByLine) {
    // Look for potential shortcodes on this line
    const potentialMatches = [...line.matchAll(/\{\{/g)];
    
    if (potentialMatches.length > 0) {
      // Check if properly closed
      const openCount = (line.match(/\{\{/g) || []).length;
      const closeCount = (line.match(/\}\}/g) || []).length;
      
      if (openCount !== closeCount) {
        errors.push({
          line: number,
          text: line.trim(),
          issue: `Mismatched braces - found ${openCount} opening {{ but ${closeCount} closing }}`,
          fix: 'Ensure each {{type: url | params}} ends with }}'
        });
        continue;
      }
      
      // Extract potential shortcodes from this line
      const shortcodeMatches = [...line.matchAll(/\{\{([^}]+)\}\}/g)];
      
      for (const scMatch of shortcodeMatches) {
        const fullShortcode = scMatch[0];
        const content = scMatch[1];
        
        // Check basic structure: type: url
        const structureMatch = content.match(/^\s*(\w+)\s*:\s*([^\s|]+)(.*)/);
        
        if (!structureMatch) {
          errors.push({
            line: number,
            text: line.trim(),
            issue: 'Invalid shortcode structure - missing type or URL',
            fix: 'Use format: {{type: url | param: value}}'
          });
          continue;
        }
        
        const [, type, url, params] = structureMatch;
        const normalizedType = type.toLowerCase();
        
        // Validate type
        if (!['video', 'image', 'document', 'pdf'].includes(normalizedType)) {
          errors.push({
            line: number,
            text: line.trim(),
            issue: `Unknown media type "${type}"`,
            fix: 'Valid types are: video, image, document, pdf'
          });
          continue;
        }
        
        // Validate URL
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          errors.push({
            line: number,
            text: line.trim(),
            issue: `Invalid URL "${url.substring(0, 50)}..." - must start with http:// or https://`,
            fix: 'Provide a complete URL starting with http:// or https://'
          });
          continue;
        }
        
        // Validate parameters if present
        if (params.trim()) {
          // Check for common mistakes
          if (params.includes('featured_img')) {
            warnings.push({
              line: number,
              text: line.trim(),
              issue: 'Found "featured_img" - should be "featured"',
              fix: 'Change | featured_img: true to | featured: true'
            });
          }
          
          // Check for parameters without pipe separator
          if (params.trim() && !params.trim().startsWith('|')) {
            errors.push({
              line: number,
              text: line.trim(),
              issue: 'Parameters must start with | separator',
              fix: 'Add | before parameters: {{type: url | param: value}}'
            });
          }
          
          // Check parameter format
          const paramParts = params.split('|').filter(p => p.trim());
          for (const param of paramParts) {
            if (param.trim() && !param.includes(':')) {
              warnings.push({
                line: number,
                text: line.trim(),
                issue: `Parameter "${param.trim()}" missing colon`,
                fix: 'Parameters should be in format: | paramName: value'
              });
            }
          }
        }
      }
      
      // Check for common closing mistakes
      if (line.includes('{{') && line.match(/\)\s*\}\}|\}\s*\)/)) {
        errors.push({
          line: number,
          text: line.trim(),
          issue: 'Mixed closing characters - found ) instead of or mixed with }}',
          fix: 'Use only }} to close shortcodes, not )'
        });
      }
    }
  }
  
  return { errors, warnings };
}

/**
 * Validate draft completeness before processing
 */
async function validateDraft(draftContent, contentType) {
  console.log('\n🔍 Validating draft...\n');
  
  // First, validate shortcode syntax
  console.log('══════════════════════════════════════════════════════════');
  console.log('              MEDIA SHORTCODE SYNTAX CHECK');
  console.log('══════════════════════════════════════════════════════════\n');
  
  const syntaxValidation = validateMediaShortcodeSyntax(draftContent);
  
  if (syntaxValidation.errors.length > 0) {
    console.log('❌ SYNTAX ERRORS FOUND:\n');
    syntaxValidation.errors.forEach((error, idx) => {
      console.log(`${idx + 1}. Line ${error.line}:`);
      console.log(`   ${error.text}`);
      console.log(`   ❌ ${error.issue}`);
      console.log(`   💡 ${error.fix}\n`);
    });
  } else {
    console.log('✅ All shortcodes are properly formatted\n');
  }
  
  if (syntaxValidation.warnings.length > 0) {
    console.log('⚠️  WARNINGS:\n');
    syntaxValidation.warnings.forEach((warning, idx) => {
      console.log(`${idx + 1}. Line ${warning.line}:`);
      console.log(`   ${warning.text}`);
      console.log(`   ⚠️  ${warning.issue}`);
      console.log(`   💡 ${warning.fix}\n`);
    });
  }
  
  if (syntaxValidation.errors.length > 0) {
    console.log('══════════════════════════════════════════════════════════');
    console.log('\n❌ VALIDATION FAILED: Fix syntax errors before publishing.\n');
    process.exit(1);
  }
  
  console.log('══════════════════════════════════════════════════════════\n');
  
  // Continue with content validation
  console.log('══════════════════════════════════════════════════════════');
  console.log('                CONTENT VALIDATION REPORT');
  console.log('══════════════════════════════════════════════════════════\n');
  
  // Read content schema
  const schemaPath = path.join(ROOT_DIR, 'src', 'content', 'config.ts');
  const contentSchema = fs.readFileSync(schemaPath, 'utf-8');
  
  // Call AI to validate
  const validationPrompt = createDraftValidationPrompt(draftContent, contentSchema, contentType);
  const validationText = await callClaude(validationPrompt, {
    max_tokens: 2000,
    temperature: 0.3
  });
  
  const validation = extractJSON(validationText);
  
  // Display validation results
  console.log('══════════════════════════════════════════════════════════\n');
  
  // Featured image status
  if (validation.hasFeaturedImage) {
    console.log('✅ Featured image: Found');
  } else {
    console.log('⚠️  Featured image: Missing (highly recommended for visibility)');
  }
  
  // Critical information
  if (validation.missingCritical && validation.missingCritical.length > 0) {
    console.log('\n❌ MISSING CRITICAL INFORMATION:');
    validation.missingCritical.forEach(item => console.log(`   • ${item}`));
  } else {
    console.log('\n✅ All critical information present');
  }
  
  // Helpful information
  if (validation.missingHelpful && validation.missingHelpful.length > 0) {
    console.log('\nℹ️  MISSING HELPFUL INFORMATION:');
    validation.missingHelpful.forEach(item => console.log(`   • ${item}`));
  }
  
  // Suggestions
  if (validation.suggestions && validation.suggestions.length > 0) {
    console.log('\n💡 SUGGESTIONS FOR IMPROVEMENT:');
    validation.suggestions.forEach(item => console.log(`   • ${item}`));
  }
  
  // Issues
  if (validation.issues && validation.issues.length > 0) {
    console.log('\n⚠️  ISSUES DETECTED:');
    validation.issues.forEach(item => console.log(`   • ${item}`));
  }
  
  console.log('\n═══════════════════════════════════════════════════════════');
  
  // Always require user confirmation
  if (!validation.canProceed) {
    console.log('\n❌ VALIDATION FAILED: Cannot proceed due to missing critical information.');
    console.log('   Please update your draft and try again.\n');
    process.exit(1);
  }
  
  // Prompt user to continue
  console.log('\nReview the validation report above.');
  console.log('This is your last chance to cancel and make changes.\n');
  
  // Use readline to get user input
  const readline = await import('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve, reject) => {
    rl.question('Do you want to proceed with publishing? (yes/no): ', (answer) => {
      rl.close();
      
      const normalized = answer.trim().toLowerCase();
      if (normalized === 'yes' || normalized === 'y') {
        console.log('\n✅ Proceeding with publishing...\n');
        resolve(validation);
      } else {
        console.log('\n❌ Publishing cancelled by user.\n');
        process.exit(0);
      }
    });
  });
}

/**
 * Process videos: download and upload to Cloudflare Stream
 */
async function processVideos(videoItems) {
  const results = [];
  
  for (const item of videoItems) {
    const url = item.url;
    try {
      console.log(`\n📹 Processing video: ${url}`);
      
      // Check media library first
      const existingAsset = findAssetBySourceUrl(url);
      if (existingAsset) {
        console.log('   ✓ Found in media library - reusing existing upload');
        console.log(`   Asset ID: ${existingAsset.id}`);
        console.log(`   Video ID: ${existingAsset.videoId}`);
        
        results.push({
          type: 'video',
          originalUrl: url,
          videoId: existingAsset.videoId,
          embedUrl: `https://customer-b2jil4qncbeg5z7d.cloudflarestream.com/${existingAsset.videoId}/iframe`,
          caption: item.caption || null,
          featured: item.featured || false,
          analysis: null,
          metadata: existingAsset.cloudflareData || {},
          fromLibrary: true,
          assetId: existingAsset.id
        });
        continue;
      }
      
      // Not in library - upload and add to library
      console.log('   ↳ Not in library - uploading to Cloudflare Stream...');
      
      // Convert to direct URL
      const directUrl = convertToDirectUrl(url);
      console.log(`   ↳ Direct URL: ${directUrl.substring(0, 80)}...`);
      
      // Try direct URL upload first (avoids download/filename issues)
      const upload = await uploadVideoFromUrl(directUrl, {
        name: path.basename(url).split('?')[0] // Get filename before query params
      });
      
      console.log(`   ✓ Video uploaded to Stream: ${upload.videoId}`);
      
      // Add to media library for future reuse
      console.log('   ↳ Adding to media library...');
      const libraryAsset = addVideoToLibrary({
        videoId: upload.videoId,
        fileName: upload.originalFileName || path.basename(url).split('?')[0],
        sourceUrl: url,
        description: item.info || item.caption || '',
        caption: item.caption || '',
        tags: item.tags || [],
        metadata: upload
      });
      console.log(`   ✓ Added to library: ${libraryAsset.id}`);
      
      // Note: AI cannot actually analyze video content, so we skip that
      // Video analysis should be done manually and included in the draft
      
      results.push({
        type: 'video',
        originalUrl: url,
        videoId: upload.videoId,
        embedUrl: upload.embedUrl,
        caption: item.caption || null,
        featured: item.featured || false,
        analysis: null, // No automated analysis available
        metadata: upload,
        fromLibrary: false,
        assetId: libraryAsset.id
      });
    } catch (error) {
      console.error(`   ❌ Failed to process video: ${error.message}`);
      results.push({
        type: 'video',
        originalUrl: url,
        error: error.message
      });
    }
  }
  
  return results;
}

/**
 * Process images: download and upload to Cloudflare Images
 */
async function processImages(imageItems) {
  const results = [];
  
  for (const item of imageItems) {
    const url = item.url;
    try {
      console.log(`\n🖼️  Processing image: ${url}`);
      
      // Check media library first
      const existingAsset = findAssetBySourceUrl(url);
      if (existingAsset) {
        console.log('   ✓ Found in media library - reusing existing upload');
        console.log(`   Asset ID: ${existingAsset.id}`);
        console.log(`   Image ID: ${existingAsset.imageId}`);
        
        results.push({
          type: 'image',
          originalUrl: url,
          imageId: existingAsset.imageId,
          thumbnailUrl: existingAsset.urls?.thumbnail,
          mediumUrl: existingAsset.urls?.medium,
          largeUrl: existingAsset.urls?.large,
          publicUrl: existingAsset.urls?.public,
          caption: item.caption || item.description || existingAsset.caption || null,
          alt: item.alt || item.title || existingAsset.alt || null,
          title: item.title || null,
          info: item.info || null,
          featured: item.featured || false,
          metadata: existingAsset,
          fromLibrary: true,
          assetId: existingAsset.id
        });
        continue;
      }
      
      // Not in library - download and upload
      console.log('   ↳ Not in library - downloading and uploading...');
      
      // Download
      const download = await downloadFile(url, TEMP_DIR);
      
      // Upload to Cloudflare Images
      console.log('   ↳ Uploading to Cloudflare Images...');
      const upload = await uploadImage(download.filePath, {
        description: item.caption || item.description || item.title || item.alt || `Image from ${path.basename(url)}`
      });
      
      console.log(`   ✓ Image uploaded: ${upload.imageId}`);
      
      // Add to media library for future reuse
      console.log('   ↳ Adding to media library...');
      const libraryAsset = addImageToLibrary({
        imageId: upload.imageId,
        fileName: upload.originalFileName || download.filename,
        sourceUrl: url,
        description: item.caption || item.description || '',
        alt: item.alt || item.title || item.caption || '',
        caption: item.caption || item.description || '',
        tags: item.tags || [],
        urls: {
          thumbnail: upload.thumbnailUrl,
          medium: upload.mediumUrl,
          large: upload.largeUrl,
          public: upload.publicUrl
        }
      });
      console.log(`   ✓ Added to library: ${libraryAsset.id}`);
      
      results.push({
        type: 'image',
        originalUrl: url,
        imageId: upload.imageId,
        thumbnailUrl: upload.thumbnailUrl,
        mediumUrl: upload.mediumUrl,
        largeUrl: upload.largeUrl,
        publicUrl: upload.publicUrl,
        caption: item.caption || item.description || null,
        alt: item.alt || item.title || item.caption || null,
        title: item.title || null,
        info: item.info || null,
        featured: item.featured || false,
        metadata: upload,
        fromLibrary: false,
        assetId: libraryAsset.id
      });
      
      // Clean up temp file
      fs.unlinkSync(download.filePath);
    } catch (error) {
      console.error(`   ❌ Failed to process image: ${error.message}`);
      results.push({
        type: 'image',
        originalUrl: url,
        error: error.message
      });
    }
  }
  
  return results;
}

/**
 * Process PDFs: download, upload to R2, and return structured document data
 */
async function processPDFs(documentItems) {
  const results = [];
  
  for (const item of documentItems) {
    const url = item.url;
    try {
      console.log(`\n📄 Processing document: ${url}`);
      
      // Check media library first
      const existingAsset = findAssetBySourceUrl(url);
      if (existingAsset) {
        console.log('   ✓ Found in media library - reusing existing upload');
        console.log(`   Asset ID: ${existingAsset.id}`);
        console.log(`   R2 URL: ${existingAsset.publicUrl}`);
        
        // Build structured document object for schema
        const document = {
          title: item.title || item.name || existingAsset.linkText || existingAsset.fileName,
          description: item.description || item.info || item.details || existingAsset.description || 'Legal document related to the case',
          url: existingAsset.publicUrl
        };
        
        results.push({
          type: 'document',
          originalUrl: url,
          r2Url: existingAsset.publicUrl,
          r2Key: existingAsset.r2Key,
          document: document,
          metadata: existingAsset,
          fromLibrary: true,
          assetId: existingAsset.id
        });
        continue;
      }
      
      // Not in library - download and upload
      console.log('   ↳ Not in library - downloading and uploading...');
      
      // Determine intelligent filename from metadata
      let customName = item.title || item.name || item.description || null;
      
      // If we have custom name, clean it up and add extension hint
      let downloadFilename = null;
      if (customName) {
        const sanitized = customName
          .toLowerCase()
          .replace(/[^a-z0-9-\s]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-+|-+$/g, '')
          .substring(0, 50);
        
        // Add .pdf extension for download
        downloadFilename = `${sanitized}.pdf`;
      }
      
      // Download with intelligent name
      const download = await downloadFile(url, TEMP_DIR, downloadFilename);
      
      // Upload to R2 (will use the intelligent name from download)
      console.log('   ↳ Uploading to Cloudflare R2...');
      const upload = await uploadPDF(download.filePath, {
        source: url,
        customName: customName  // This will be used to generate timestamped filename
      });
      
      console.log(`   ✓ PDF uploaded to R2`);
      console.log(`   ✓ R2 URL: ${upload.url}`);
      
      // Add to media library for future reuse
      console.log('   ↳ Adding to media library...');
      const libraryAsset = addDocumentToLibrary({
        fileName: upload.originalFileName || download.filename,
        r2Key: upload.key,
        publicUrl: upload.url,
        sourceUrl: url,
        description: item.description || item.info || item.details || '',
        linkText: item.title || item.name || download.filename.replace(/\.(pdf|docx?|txt)$/i, ''),
        fileType: path.extname(upload.originalFileName || download.filename).slice(1).toUpperCase(),
        tags: item.tags || [],
        metadata: upload
      });
      console.log(`   ✓ Added to library: ${libraryAsset.id}`);
      
      // Build structured document object for schema using shortcode metadata
      const document = {
        title: item.title || item.name || download.filename.replace(/\.(pdf|docx?|txt)$/i, ''),
        description: item.description || item.info || item.details || 'Legal document related to the case',
        url: upload.url // R2 public URL
      };
      
      results.push({
        type: 'document',
        originalUrl: url,
        r2Url: upload.url,
        r2Key: upload.key,
        document: document, // Structured for frontmatter
        metadata: upload,
        fromLibrary: false,
        assetId: libraryAsset.id
      });
      
      // Clean up temp file
      fs.unlinkSync(download.filePath);
    } catch (error) {
      console.error(`   ❌ Failed to process PDF: ${error.message}`);
      results.push({
        type: 'document',
        originalUrl: url,
        error: error.message
      });
    }
  }
  
  return results;
}

/**
 * Load available component code for AI context
 */
function loadComponentCode() {
  const componentsDir = path.join(ROOT_DIR, 'src', 'components');
  const componentFiles = fs.readdirSync(componentsDir)
    .filter(f => f.endsWith('.astro') && !['Navbar.astro', 'Footer.astro'].includes(f));
  
  const components = {};
  for (const file of componentFiles) {
    const componentName = file.replace('.astro', '');
    const componentPath = path.join(componentsDir, file);
    const componentCode = fs.readFileSync(componentPath, 'utf-8');
    components[componentName] = componentCode;
  }
  
  return components;
}

/**
 * Generate article using AI
 */
async function generateArticle(draftContent, mediaAnalysis, contentType) {
  console.log('\n🤖 Generating article with AI...\n');
  
  // Load schema
  const schemaPath = path.join(ROOT_DIR, 'src', 'content', 'config.ts');
  const contentSchema = fs.readFileSync(schemaPath, 'utf-8');
  console.log('   ↳ Loaded content schema');
  
  // Load available components
  const components = loadComponentCode();
  console.log(`   ↳ Loaded ${Object.keys(components).length} component(s) for AI context`);
  
  // Extract metadata
  const metadataPrompt = createMetadataExtractionPrompt(draftContent, contentSchema, contentType, mediaAnalysis);
  const metadataText = await callClaude(metadataPrompt);
  const metadata = extractJSON(metadataText);
  
  console.log('   ✓ Metadata extracted');
  
  // Generate article
  const articlePrompt = contentType === 'case' 
    ? createCaseArticlePrompt(draftContent, mediaAnalysis, metadata, components, contentSchema)
    : createBlogPostPrompt(draftContent, mediaAnalysis, metadata, components, contentSchema);
  
  const articleContent = await callClaude(articlePrompt, {
    max_tokens: 6000,
    temperature: 0.8
  });
  
  // Extract MDX from code block if needed
  const mdxMatch = articleContent.match(/```mdx\s*([\s\S]*?)\s*```/);
  const finalContent = mdxMatch ? mdxMatch[1] : articleContent;
  
  console.log('   ✓ Article generated');
  
  return {
    content: finalContent,
    metadata
  };
}

/**
 * Generate slug from title
 */
async function generateSlug(title, type) {
  const slugPrompt = createSlugGenerationPrompt(title, type);
  const slug = await callClaude(slugPrompt, {
    max_tokens: 100,
    temperature: 0.3
  });
  return slug.trim().toLowerCase();
}

/**
 * Main publishing workflow
 */
async function publishDraft(draftFilename) {
  console.log('\n🚀 Starting draft publishing workflow...\n');
  console.log(`Draft: ${draftFilename}\n`);
  
  const draftPath = path.join(DRAFTS_DIR, draftFilename);
  
  if (!fs.existsSync(draftPath)) {
    throw new Error(`Draft file not found: ${draftPath}`);
  }
  
  // Read draft
  const draftContent = fs.readFileSync(draftPath, 'utf-8');
  const draftMeta = parseDraftMetadata(draftContent);
  
  console.log(`Content Type: ${draftMeta.type}`);
  
  // Validate draft completeness
  const validation = await validateDraft(draftContent, draftMeta.type);
  
  // Create temp directory
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR);
  }
  
  // Extract media using shortcode parser
  console.log('\n📋 Extracting media from shortcodes...');
  const media = parseMediaShortcodes(draftContent);
  
  console.log(`   Found: ${media.videos.length} videos, ${media.images.length} images, ${media.documents.length} documents`);
  
  if (media.documents.length > 0) {
    console.log(`   Document shortcodes found:`);
    media.documents.forEach(doc => console.log(`     - ${doc.url} (${doc.title || 'untitled'})`));
  }
  
  // Process media
  const mediaAnalysis = {
    videos: await processVideos(media.videos),
    images: await processImages(media.images),
    documents: await processPDFs(media.documents)
  };
  
  console.log(`\n📊 Media processing results:`);
  console.log(`   Videos processed: ${mediaAnalysis.videos.length}`);
  console.log(`   Images processed: ${mediaAnalysis.images.length}`);
  console.log(`   Documents processed: ${mediaAnalysis.documents.length}`);
  if (mediaAnalysis.documents.length > 0) {
    console.log(`   Document details:`);
    mediaAnalysis.documents.forEach(doc => {
      if (doc.document) {
        console.log(`     ✓ ${doc.document.title}: ${doc.document.url}`);
      } else if (doc.error) {
        console.log(`     ✗ Error: ${doc.error}`);
      }
    });
  }
  
  // Generate article
  const article = await generateArticle(draftContent, mediaAnalysis, draftMeta.type);
  
  // Generate slug
  const titleMatch = article.content.match(/victim_name:\s*"([^"]+)"|title:\s*"([^"]+)"/);
  const title = titleMatch ? (titleMatch[1] || titleMatch[2]) : path.basename(draftFilename, '.md');
  const slug = await generateSlug(title, draftMeta.type);
  
  console.log(`   Generated slug: ${slug}`);
  
  // Save to content collection
  const contentDir = draftMeta.type === 'case' 
    ? path.join(ROOT_DIR, 'src', 'content', 'cases')
    : path.join(ROOT_DIR, 'src', 'content', 'posts');
  
  const outputPath = path.join(contentDir, `${slug}.mdx`);
  
  console.log(`\n💾 Saving article to: ${outputPath}`);
  fs.writeFileSync(outputPath, article.content);
  
  // Archive draft
  const timestamp = new Date().toISOString().split('T')[0];
  const archiveName = `${timestamp}-${slug}.md`;
  const archivePath = path.join(PUBLISHED_DIR, archiveName);
  
  console.log(`📦 Archiving draft to: ${archivePath}`);
  fs.renameSync(draftPath, archivePath);
  
  // Clean up temp directory
  if (fs.existsSync(TEMP_DIR)) {
    fs.rmSync(TEMP_DIR, { recursive: true });
  }
    
  console.log('\n✅ Publishing complete!\n');
  console.log(`Published article: ${outputPath}`);
  console.log(`Archived draft: ${archivePath}`);
  console.log(`\nView at: /${draftMeta.type === 'case' ? 'cases' : 'posts'}/${slug}`);
  console.log('\n💡 Next steps:');
  console.log('   1. Run "npm run dev" to preview the published article');
  console.log('   2. Review the article in your browser');
  console.log('   3. Stage and push to Git to automatically deploy to Netlify\n');
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  let draftFilename;
  
  // If filename provided, use it
  if (args.length > 0) {
    draftFilename = args[0];
  } else {
    // Interactive mode - show available drafts
    console.log('\n📝 Available drafts:\n');
    
    // Get all .md files from drafts directory and subdirectories
    const drafts = [];
    
    // Check cases folder
    const casesDir = path.join(DRAFTS_DIR, 'cases');
    if (fs.existsSync(casesDir)) {
      const caseFiles = fs.readdirSync(casesDir)
        .filter(f => f.endsWith('.md'))
        .map(f => ({ name: f, path: `cases/${f}`, type: 'case' }));
      drafts.push(...caseFiles);
    }
    
    // Check posts folder
    const postsDir = path.join(DRAFTS_DIR, 'posts');
    if (fs.existsSync(postsDir)) {
      const postFiles = fs.readdirSync(postsDir)
        .filter(f => f.endsWith('.md'))
        .map(f => ({ name: f, path: `posts/${f}`, type: 'post' }));
      drafts.push(...postFiles);
    }
    
    // Check root drafts folder
    const rootFiles = fs.readdirSync(DRAFTS_DIR)
      .filter(f => f.endsWith('.md') && fs.statSync(path.join(DRAFTS_DIR, f)).isFile())
      .map(f => ({ name: f, path: f, type: 'unknown' }));
    drafts.push(...rootFiles);
    
    if (drafts.length === 0) {
      console.log('No draft files found in drafts/ directory.\n');
      console.log('Create a draft:');
      console.log('  cp drafts/templates/case-draft-template.md drafts/cases/my-case.md\n');
      process.exit(1);
    }
    
    // Display numbered list
    drafts.forEach((draft, index) => {
      const typeLabel = draft.type === 'case' ? '📋' : draft.type === 'post' ? '📰' : '📄';
      console.log(`  ${index + 1}. ${typeLabel} ${draft.path}`);
    });
    
    // Prompt user to select
    const readline = await import('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const selectedIndex = await new Promise((resolve) => {
      rl.question('\nSelect a draft to publish (enter number): ', (answer) => {
        rl.close();
        const num = parseInt(answer.trim(), 10);
        if (isNaN(num) || num < 1 || num > drafts.length) {
          console.log('\n❌ Invalid selection\n');
          process.exit(1);
        }
        resolve(num - 1);
      });
    });
    
    draftFilename = drafts[selectedIndex].path;
    console.log(`\n✅ Selected: ${draftFilename}\n`);
  }
  
  await publishDraft(draftFilename);
}

main().catch(error => {
  console.error('\n❌ Publishing failed:', error.message);
  console.error(error.stack);
  process.exit(1);
});