#!/usr/bin/env node
/**
 * Interactive CLI Tool
 * 
 * Main menu for common tasks:
 * - Create draft blog post
 * - Create draft case article
 * - Publish draft
 * - Run dev server
 * - Rebuild registry
 * - Media library statistics
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import prompts from 'prompts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const DRAFTS_DIR = path.join(ROOT_DIR, 'drafts');
const CASES_TEMPLATE = path.join(DRAFTS_DIR, 'cases', 'TEMPLATE.md_template');
const POSTS_TEMPLATE = path.join(DRAFTS_DIR, 'posts', 'TEMPLATE.md_template');
const CASES_DIR = path.join(DRAFTS_DIR, 'cases');
const POSTS_DIR = path.join(DRAFTS_DIR, 'posts');
const MEDIA_LIBRARY_PATH = path.join(ROOT_DIR, 'media-library.json');

/**
 * Main menu options
 */
const MAIN_MENU = [
  { title: '📝 Create draft blog post', value: 'create-blog' },
  { title: '⚖️  Create draft case article', value: 'create-case' },
  { title: '🚀 Publish draft', value: 'publish' },
  { title: '💻 Run dev server', value: 'dev-server' },
  { title: '📚 Browse media library', value: 'media-browser' },
  { title: '🔄 Rebuild registry', value: 'rebuild-registry' },
  { title: '📊 Media library statistics', value: 'media-stats' },
  { title: '❌ Exit', value: 'exit' }
];

/**
 * Create a slug from a title
 */
function createSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

/**
 * Create a new draft from template
 */
async function createDraft(type) {
  const isCase = type === 'case';
  const templatePath = isCase ? CASES_TEMPLATE : POSTS_TEMPLATE;
  const outputDir = isCase ? CASES_DIR : POSTS_DIR;
  const typeLabel = isCase ? 'case article' : 'blog post';

  // Prompt for name
  const response = await prompts({
    type: 'text',
    name: 'name',
    message: `Enter ${typeLabel} name:`,
    validate: value => {
      if (!value || value.trim().length === 0) {
        return 'Name is required';
      }
      const slug = createSlug(value);
      const filePath = path.join(outputDir, `${slug}.md`);
      if (fs.existsSync(filePath)) {
        return `File already exists: ${slug}.md`;
      }
      return true;
    }
  });

  if (!response.name) {
    console.log('❌ Cancelled');
    return;
  }

  // Create slug and file path
  const slug = createSlug(response.name);
  const filePath = path.join(outputDir, `${slug}.md`);

  // Copy template
  try {
    const template = fs.readFileSync(templatePath, 'utf-8');
    fs.writeFileSync(filePath, template, 'utf-8');
    console.log(`\n✅ Created ${typeLabel}: ${slug}.md`);
    console.log(`   📁 Location: ${filePath}`);
    console.log(`\n💡 Next steps:`);
    console.log(`   1. Edit the file with your notes`);
    console.log(`   2. Add media URLs using shortcode format`);
    console.log(`   3. Run "Publish draft" from the menu\n`);
  } catch (error) {
    console.error(`❌ Failed to create draft: ${error.message}`);
  }
}

/**
 * Publish a draft
 */
async function publishDraft() {
  // List available drafts
  const caseDrafts = fs.readdirSync(CASES_DIR)
    .filter(f => f.endsWith('.md') && !f.endsWith('_template'))
    .map(f => ({ title: `[Case] ${f}`, value: path.join(CASES_DIR, f) }));

  const postDrafts = fs.readdirSync(POSTS_DIR)
    .filter(f => f.endsWith('.md') && !f.endsWith('_template'))
    .map(f => ({ title: `[Blog] ${f}`, value: path.join(POSTS_DIR, f) }));

  const allDrafts = [...caseDrafts, ...postDrafts];

  if (allDrafts.length === 0) {
    console.log('\n⚠️  No drafts found. Create one first!\n');
    return;
  }

  const response = await prompts({
    type: 'select',
    name: 'draft',
    message: 'Select draft to publish:',
    choices: [
      ...allDrafts,
      { title: '← Back to main menu', value: null }
    ]
  });

  if (!response.draft) {
    return;
  }

  // Run publish script
  console.log('\n🚀 Publishing draft...\n');
  const publishScript = path.join(__dirname, 'publish-draft.js');
  
  try {
    const child = spawn('node', [publishScript, response.draft], {
      stdio: 'inherit',
      cwd: ROOT_DIR
    });

    await new Promise((resolve, reject) => {
      child.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Publish script exited with code ${code}`));
        }
      });
      child.on('error', reject);
    });
  } catch (error) {
    console.error(`\n❌ Publish failed: ${error.message}\n`);
  }
}

/**
 * Run dev server
 */
async function runDevServer() {
  console.log('\n💻 Starting dev server...\n');
  
  const child = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    cwd: ROOT_DIR,
    shell: true
  });

  // Wait for exit (user will Ctrl+C to stop)
  await new Promise((resolve) => {
    child.on('close', resolve);
    child.on('error', resolve);
  });

  console.log('\n✅ Dev server stopped\n');
}

/**
 * Run media browser
 */
async function runMediaBrowser() {
  console.log('\n📚 Starting media library browser...\n');
  console.log('   Opening http://localhost:3001 in your browser...');
  console.log('   Press Ctrl+C to stop the server\n');
  
  const mediaBrowserScript = path.join(__dirname, 'media', 'media-browser.js');

  const child = spawn('node', [mediaBrowserScript], {
    stdio: 'inherit',
    cwd: ROOT_DIR
  });

  // Wait for exit (user will Ctrl+C to stop)
  await new Promise((resolve) => {
    child.on('close', resolve);
    child.on('error', resolve);
  });

  console.log('\n✅ Media browser stopped\n');
}

/**
 * Rebuild registry
 */
async function rebuildRegistry() {
  console.log('\n🔄 Rebuilding registry...\n');
  
  const rebuildScript = path.join(__dirname, 'rebuild-registry.js');
  
  try {
    const child = spawn('node', [rebuildScript], {
      stdio: 'inherit',
      cwd: ROOT_DIR
    });

    await new Promise((resolve, reject) => {
      child.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Rebuild script exited with code ${code}`));
        }
      });
      child.on('error', reject);
    });
    
    console.log('\n✅ Registry rebuilt successfully\n');
  } catch (error) {
    console.error(`\n❌ Rebuild failed: ${error.message}\n`);
  }
}

/**
 * Show media library statistics
 */
function showMediaStats() {
  try {
    if (!fs.existsSync(MEDIA_LIBRARY_PATH)) {
      console.log('\n⚠️  Media library not found\n');
      return;
    }

    const library = JSON.parse(fs.readFileSync(MEDIA_LIBRARY_PATH, 'utf-8'));
    
    const videoCount = Object.keys(library.videos || {}).length;
    const imageCount = Object.keys(library.images || {}).length;
    const documentCount = Object.keys(library.documents || {}).length;
    const totalCount = videoCount + imageCount + documentCount;

    console.log('\n📊 Media Library Statistics\n');
    console.log('═'.repeat(50));
    console.log(`📹 Videos:    ${videoCount.toString().padStart(4)}`);
    console.log(`🖼️  Images:    ${imageCount.toString().padStart(4)}`);
    console.log(`📄 Documents: ${documentCount.toString().padStart(4)}`);
    console.log('─'.repeat(50));
    console.log(`📦 Total:     ${totalCount.toString().padStart(4)}`);
    console.log('═'.repeat(50));

    // Calculate storage estimates
    let totalVideoSize = 0;
    let totalImageSize = 0;
    let totalDocumentSize = 0;

    Object.values(library.videos || {}).forEach(video => {
      if (video.cloudflareData?.metadata?.size) {
        totalVideoSize += video.cloudflareData.metadata.size;
      }
    });

    Object.values(library.images || {}).forEach(image => {
      // Estimate 2MB average per image (Cloudflare doesn't provide size)
      totalImageSize += 2 * 1024 * 1024;
    });

    Object.values(library.documents || {}).forEach(doc => {
      if (doc.size) {
        totalDocumentSize += doc.size;
      }
    });

    const totalSize = totalVideoSize + totalImageSize + totalDocumentSize;

    if (totalSize > 0) {
      console.log(`\n💾 Storage Estimates:\n`);
      console.log(`📹 Videos:    ${formatBytes(totalVideoSize)}`);
      console.log(`🖼️  Images:    ${formatBytes(totalImageSize)} (estimated)`);
      console.log(`📄 Documents: ${formatBytes(totalDocumentSize)}`);
      console.log('─'.repeat(50));
      console.log(`📦 Total:     ${formatBytes(totalSize)}`);
    }

    // Show recent additions
    const allAssets = [
      ...Object.values(library.videos || {}).map(v => ({ ...v, type: 'video' })),
      ...Object.values(library.images || {}).map(i => ({ ...i, type: 'image' })),
      ...Object.values(library.documents || {}).map(d => ({ ...d, type: 'document' }))
    ];

    allAssets.sort((a, b) => {
      const dateA = new Date(a.addedAt || a.uploadedAt || 0);
      const dateB = new Date(b.addedAt || b.uploadedAt || 0);
      return dateB - dateA;
    });

    const recent = allAssets.slice(0, 5);
    if (recent.length > 0) {
      console.log(`\n⏱️  Recent Additions:\n`);
      recent.forEach((asset, i) => {
        const icon = asset.type === 'video' ? '📹' : asset.type === 'image' ? '🖼️' : '📄';
        const date = new Date(asset.addedAt || asset.uploadedAt);
        const dateStr = date.toLocaleDateString();
        const name = asset.fileName || asset.title || asset.id;
        console.log(`${i + 1}. ${icon} ${name.substring(0, 40)} (${dateStr})`);
      });
    }

    console.log('\n');
  } catch (error) {
    console.error(`\n❌ Failed to read media library: ${error.message}\n`);
  }
}

/**
 * Format bytes to human readable
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Main menu loop
 */
async function mainMenu() {
  console.log('\n╔════════════════════════════════════════════════╗');
  console.log('║   Police Misconduct Documentation System      ║');
  console.log('╚════════════════════════════════════════════════╝\n');

  while (true) {
    const response = await prompts({
      type: 'select',
      name: 'action',
      message: 'What would you like to do?',
      choices: MAIN_MENU
    });

    if (!response.action || response.action === 'exit') {
      console.log('\n👋 Goodbye!\n');
      process.exit(0);
    }

    switch (response.action) {
      case 'create-blog':
        await createDraft('blog');
        break;
      case 'create-case':
        await createDraft('case');
        break;
      case 'publish':
        await publishDraft();
        break;
      case 'dev-server':
        await runDevServer();
        break;
      case 'media-browser':
        await runMediaBrowser();
        break;
      case 'rebuild-registry':
        await rebuildRegistry();
        break;
      case 'media-stats':
        showMediaStats();
        break;
    }

    // Add a small delay before showing menu again
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n\n👋 Goodbye!\n');
  process.exit(0);
});

// Start the CLI
mainMenu().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
