#!/usr/bin/env node
/**
 * Interactive Draft Publisher
 * 
 * Main workflow orchestrator for publishing drafts to the site.
 * Coordinates media processing, AI content generation, and file management.
 */

import fs from 'fs/promises';
import path from 'path';
import prompts from 'prompts';
import 'dotenv/config';

// Import organized modules
import { generateCaseArticle, generateBlogPost } from './ai/generators.js';
import { 
  scanMediaAndLinks, 
  extractMediaMetadata, 
  uploadAndRegisterMedia 
} from './media/processor.js';
import { 
  generateComponentHTML, 
  generateLinkComponentHTML 
} from './utils/components.js';
import { 
  getDraftFiles, 
  cleanupTempDir, 
  DRAFTS_DIR 
} from './utils/files.js';
import { findAssetBySourceUrl } from './media/media-library.js';

// Check for debug flag
const DEBUG_MODE = process.argv.includes('--debug');

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
    const enrichedMedia = await extractMediaMetadata(response.selectedDraft, mediaItems, DEBUG_MODE);
    
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
    generatedContent = await generateCaseArticle(draftPath, result, DEBUG_MODE);
  } else if (isPost) {
    generatedContent = await generateBlogPost(draftPath, result, DEBUG_MODE);
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

main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
