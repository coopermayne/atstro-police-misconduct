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
 * Validate draft completeness before processing
 */
async function validateDraft(draftContent, contentType) {
  console.log('\n🔍 Validating draft completeness...\n');
  
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
  console.log('═══════════════════════════════════════════════════════════');
  console.log('                    DRAFT VALIDATION REPORT');
  console.log('═══════════════════════════════════════════════════════════\n');
  
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
      
      // Convert to direct URL
      const directUrl = convertToDirectUrl(url);
      console.log(`   ↳ Direct URL: ${directUrl.substring(0, 80)}...`);
      
      // Try direct URL upload first (avoids download/filename issues)
      console.log('   ↳ Uploading to Cloudflare Stream (direct from URL)...');
      const upload = await uploadVideoFromUrl(directUrl, {
        name: path.basename(url).split('?')[0] // Get filename before query params
      });
      
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
        metadata: upload
      });
      
      console.log(`   ✓ Video uploaded to Stream: ${upload.videoId}`);
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
      
      // Download
      const download = await downloadFile(url, TEMP_DIR);
      
      // Upload to Cloudflare Images
      console.log('   ↳ Uploading to Cloudflare Images...');
      const upload = await uploadImage(download.filePath, {
        description: `Image from ${path.basename(url)}`
      });
      
      results.push({
        type: 'image',
        originalUrl: url,
        imageId: upload.imageId,
        thumbnailUrl: upload.thumbnailUrl,
        mediumUrl: upload.mediumUrl,
        largeUrl: upload.largeUrl,
        publicUrl: upload.publicUrl,
        caption: item.caption || null,
        alt: item.alt || null,
        featured: item.featured || false,
        metadata: upload
      });
      
      console.log(`   ✓ Image uploaded: ${upload.imageId}`);
      
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
      
      // Download
      const download = await downloadFile(url, TEMP_DIR);
      
      // Upload to R2
      console.log('   ↳ Uploading to Cloudflare R2...');
      const upload = await uploadPDF(download.filePath, {
        source: url
      });
      
      // Build structured document object for schema using shortcode metadata
      const document = {
        title: item.title || download.filename.replace(/\.(pdf|docx?|txt)$/i, ''),
        description: item.description || 'Legal document related to the case',
        url: upload.url // R2 public URL
      };
      
      results.push({
        type: 'document',
        originalUrl: url,
        r2Url: upload.url,
        r2Key: upload.key,
        document: document, // Structured for frontmatter
        metadata: upload
      });
      
      console.log(`   ✓ PDF uploaded: ${document.title}`);
      console.log(`   ✓ R2 URL: ${upload.url}`);
      
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
