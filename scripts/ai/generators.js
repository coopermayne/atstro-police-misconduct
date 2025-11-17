/**
 * AI Content Generators
 * 
 * Functions for generating complete articles (cases and blog posts) using AI.
 */

import fs from 'fs/promises';
import Anthropic from '@anthropic-ai/sdk';
import {
  buildCaseMetadataPrompt,
  buildCaseArticlePrompt,
  buildBlogMetadataPrompt,
  buildBlogArticlePrompt,
  buildComponentReference
} from './prompts.js';

/**
 * Display prompt to user and ask for confirmation before sending to AI
 * @param {string} prompt - The prompt to display
 * @param {string} promptName - Name/description of the prompt
 * @param {boolean} debugMode - Whether debug mode is enabled
 * @returns {Promise<boolean>} - True if user confirms, false otherwise
 */
async function displayPromptAndConfirm(prompt, promptName, debugMode) {
  // Import dynamically to avoid circular dependencies
  const { displayPromptAndConfirm: debugDisplay } = await import('../utils/debug.js');
  return debugDisplay(prompt, promptName, debugMode);
}

/**
 * Display AI response to user and ask for confirmation before continuing
 * @param {string} response - The AI response text to display
 * @param {string} responseName - Name/description of the response
 * @param {boolean} debugMode - Whether debug mode is enabled
 * @returns {Promise<boolean>} - True if user confirms, false otherwise
 */
async function displayResponseAndConfirm(response, responseName, debugMode) {
  // Import dynamically to avoid circular dependencies
  const { displayResponseAndConfirm: debugDisplay } = await import('../utils/debug.js');
  return debugDisplay(response, responseName, debugMode);
}

/**
 * Generate a case article from draft and media
 * @param {string} draftPath - Path to draft file
 * @param {object} mediaPackage - Processed media and links from Phase 3
 * @param {boolean} debugMode - Whether debug mode is enabled
 * @returns {Promise<object>} - Generated article with frontmatter and content
 */
export async function generateCaseArticle(draftPath, mediaPackage, debugMode = false) {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
  });
  
  const draftContent = await fs.readFile(draftPath, 'utf-8');
  const registry = JSON.parse(await fs.readFile('./data/metadata-registry.json', 'utf-8'));
  const schemaContent = await fs.readFile('./src/content/config.ts', 'utf-8');
  const componentReference = buildComponentReference(mediaPackage);
  
  // Step 1: Extract metadata from draft
  const metadataPrompt = buildCaseMetadataPrompt(
    draftContent,
    schemaContent,
    registry,
    mediaPackage
  );
  
  if (!debugMode) {
    console.log('   → Extracting case metadata...');
  }
  await displayPromptAndConfirm(metadataPrompt, 'CASE METADATA EXTRACTION PROMPT', debugMode);
  
  const metadataResponse = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4000,
    messages: [{
      role: 'user',
      content: metadataPrompt
    }]
  });
  
  const metadataText = metadataResponse.content[0].text;
  await displayResponseAndConfirm(metadataText, 'CASE METADATA EXTRACTION RESPONSE', debugMode);
  
  if (!debugMode) {
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
  
  if (!debugMode) {
    console.log('   → Generating article content...');
  }
  await displayPromptAndConfirm(articlePrompt, 'CASE ARTICLE GENERATION PROMPT', debugMode);
  
  const articleResponse = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8000,
    messages: [{
      role: 'user',
      content: articlePrompt
    }]
  });
  
  const fullArticle = articleResponse.content[0].text;
  await displayResponseAndConfirm(fullArticle, 'CASE ARTICLE GENERATION RESPONSE', debugMode);
  
  if (!debugMode) {
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
 * Generate a blog post from draft and media
 * @param {string} draftPath - Path to draft file
 * @param {object} mediaPackage - Processed media and links from Phase 3
 * @param {boolean} debugMode - Whether debug mode is enabled
 * @returns {Promise<object>} - Generated article with frontmatter and content
 */
export async function generateBlogPost(draftPath, mediaPackage, debugMode = false) {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
  });
  
  const draftContent = await fs.readFile(draftPath, 'utf-8');
  const registry = JSON.parse(await fs.readFile('./data/metadata-registry.json', 'utf-8'));
  const schemaContent = await fs.readFile('./src/content/config.ts', 'utf-8');
  const componentReference = buildComponentReference(mediaPackage);
  
  // Step 1: Extract metadata from draft
  const metadataPrompt = buildBlogMetadataPrompt(
    draftContent,
    schemaContent,
    registry,
    mediaPackage
  );
  
  if (!debugMode) {
    console.log('   → Extracting blog metadata...');
  }
  await displayPromptAndConfirm(metadataPrompt, 'BLOG METADATA EXTRACTION PROMPT', debugMode);
  
  const metadataResponse = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4000,
    messages: [{
      role: 'user',
      content: metadataPrompt
    }]
  });
  
  const metadataText = metadataResponse.content[0].text;
  await displayResponseAndConfirm(metadataText, 'BLOG METADATA EXTRACTION RESPONSE', debugMode);
  
  if (!debugMode) {
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
  
  if (!debugMode) {
    console.log('   → Generating article content...');
  }
  await displayPromptAndConfirm(articlePrompt, 'BLOG ARTICLE GENERATION PROMPT', debugMode);
  
  const articleResponse = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8000,
    messages: [{
      role: 'user',
      content: articlePrompt
    }]
  });
  
  const fullArticle = articleResponse.content[0].text;
  await displayResponseAndConfirm(fullArticle, 'BLOG ARTICLE GENERATION RESPONSE', debugMode);
  
  if (!debugMode) {
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
