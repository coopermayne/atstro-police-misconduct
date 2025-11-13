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

import { downloadFile, extractUrlsFromMarkdown, categorizeUrls } from './file-downloader.js';
import { uploadVideo } from './cloudflare-stream.js';
import { uploadImage } from './cloudflare-images.js';
import { uploadPDF } from './cloudflare-r2.js';
import {
  createVideoAnalysisPrompt,
  createDocumentAnalysisPrompt,
  createMetadataExtractionPrompt,
  createCaseArticlePrompt,
  createBlogPostPrompt,
  createSlugGenerationPrompt
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
  const codeBlockMatch = text.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
  if (codeBlockMatch) {
    return JSON.parse(codeBlockMatch[1]);
  }
  
  // Try to parse the whole thing
  try {
    return JSON.parse(text);
  } catch {
    // Try to extract first JSON object
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  }
  
  throw new Error('Could not extract JSON from AI response');
}

/**
 * Process videos: download and upload to Cloudflare Stream
 */
async function processVideos(videoUrls) {
  const results = [];
  
  for (const url of videoUrls) {
    try {
      console.log(`\n📹 Processing video: ${url}`);
      
      // Download
      const download = await downloadFile(url, TEMP_DIR);
      
      // Upload to Stream
      console.log('   ↳ Uploading to Cloudflare Stream...');
      const upload = await uploadVideo(download.filePath, {
        name: path.basename(download.filePath, path.extname(download.filePath))
      });
      
      // Analyze with AI (if video is accessible - for now we'll use metadata)
      console.log('   ↳ Analyzing with AI...');
      const analysisPrompt = createVideoAnalysisPrompt({
        filename: download.filename,
        description: 'Police misconduct footage'
      });
      
      const analysisText = await callClaude(analysisPrompt);
      const analysis = extractJSON(analysisText);
      
      results.push({
        type: 'video',
        originalUrl: url,
        videoId: upload.videoId,
        embedUrl: upload.embedUrl,
        analysis,
        metadata: upload
      });
      
      console.log(`   ✓ Video processed: ${upload.videoId}`);
      
      // Clean up temp file
      fs.unlinkSync(download.filePath);
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
async function processImages(imageUrls) {
  const results = [];
  
  for (const url of imageUrls) {
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
 * Process PDFs: download, upload to R2, and analyze with AI
 */
async function processPDFs(pdfUrls) {
  const results = [];
  
  for (const url of pdfUrls) {
    try {
      console.log(`\n📄 Processing PDF: ${url}`);
      
      // Download
      const download = await downloadFile(url, TEMP_DIR);
      
      // Upload to R2
      console.log('   ↳ Uploading to Cloudflare R2...');
      const upload = await uploadPDF(download.filePath, {
        source: url
      });
      
      // Analyze with AI
      console.log('   ↳ Analyzing with AI...');
      const analysisPrompt = createDocumentAnalysisPrompt({
        filename: download.filename,
        type: 'Legal document'
      });
      
      const analysisText = await callClaude(analysisPrompt);
      const analysis = extractJSON(analysisText);
      
      results.push({
        type: 'document',
        originalUrl: url,
        r2Url: upload.url,
        r2Key: upload.key,
        analysis,
        metadata: upload
      });
      
      console.log(`   ✓ PDF processed and analyzed: ${upload.key}`);
      
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
 * Generate article using AI
 */
async function generateArticle(draftContent, mediaAnalysis, contentType) {
  console.log('\n🤖 Generating article with AI...\n');
  
  // Extract metadata
  const metadataPrompt = createMetadataExtractionPrompt(draftContent);
  const metadataText = await callClaude(metadataPrompt);
  const metadata = extractJSON(metadataText);
  
  console.log('   ✓ Metadata extracted');
  
  // Generate article
  const articlePrompt = contentType === 'case' 
    ? createCaseArticlePrompt(draftContent, mediaAnalysis, metadata)
    : createBlogPostPrompt(draftContent, mediaAnalysis, metadata);
  
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
  
  // Create temp directory
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR);
  }
  
  // Extract URLs
  console.log('\n📋 Extracting media URLs...');
  const urls = extractUrlsFromMarkdown(draftContent);
  const categorized = categorizeUrls(urls);
  
  console.log(`   Found: ${categorized.videos.length} videos, ${categorized.images.length} images, ${categorized.documents.length} documents`);
  
  // Process media
  const mediaAnalysis = {
    videos: await processVideos(categorized.videos),
    images: await processImages(categorized.images),
    documents: await processPDFs(categorized.documents)
  };
  
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
  
  // Git operations
  console.log('\n📤 Committing to Git...');
  try {
    execSync(`git add "${outputPath}" "${archivePath}"`, { cwd: ROOT_DIR });
    execSync(`git commit -m "Publish: ${title}"`, { cwd: ROOT_DIR });
    execSync('git push', { cwd: ROOT_DIR });
    console.log('   ✓ Pushed to GitHub (Netlify deploy triggered)');
  } catch (error) {
    console.log('   ⚠️  Git operations failed (you may need to commit manually)');
    console.log(`   ${error.message}`);
  }
  
  console.log('\n✅ Publishing complete!\n');
  console.log(`Published article: ${outputPath}`);
  console.log(`Archived draft: ${archivePath}`);
  console.log(`\nView at: /${draftMeta.type === 'case' ? 'cases' : 'posts'}/${slug}`);
}

// CLI interface
const args = process.argv.slice(2);
if (args.length === 0) {
  console.log(`
Usage: npm run publish:draft <draft-filename>

Example: npm run publish:draft draft-john-doe-case.md

This will:
1. Download all external media files
2. Upload to Cloudflare (Stream/R2)
3. Analyze media with AI
4. Generate complete article
5. Save to content collection
6. Archive draft
7. Commit and push to GitHub
  `);
  process.exit(1);
}

const draftFilename = args[0];

publishDraft(draftFilename).catch(error => {
  console.error('\n❌ Publishing failed:', error.message);
  console.error(error.stack);
  process.exit(1);
});
