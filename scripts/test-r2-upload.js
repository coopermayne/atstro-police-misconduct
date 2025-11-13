#!/usr/bin/env node
/**
 * Test R2 Upload Script
 * 
 * Tests uploading PDFs to Cloudflare R2 and verifies URL generation.
 * Run with: npm run test:r2
 * 
 * This is a simple test to ensure:
 * 1. PDFs download correctly from external URLs
 * 2. Upload to R2 works
 * 3. Public URL is generated correctly
 * 4. URL can be used to reference the document later
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { uploadPDF } from './cloudflare-r2.js';
import { downloadFile } from './file-downloader.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const TEMP_DIR = path.join(ROOT_DIR, '.temp-r2-test');

// Hardcoded test URL
const TEST_PDF_URL = "https://www.caed.uscourts.gov/caednew/assets/File/DJC's%20Standing%20Order%20in%20Civil%20Cases%20(rev_%205_28_25).pdf";

// ANSI colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Validate environment variables
 */
function validateEnvironment() {
  const required = [
    'CLOUDFLARE_ACCOUNT_ID',
    'CLOUDFLARE_R2_ACCESS_KEY_ID',
    'CLOUDFLARE_R2_SECRET_ACCESS_KEY',
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    log('❌ Missing required environment variables:', 'red');
    missing.forEach(key => log(`   - ${key}`, 'red'));
    log('\nAdd these to your .env file:', 'yellow');
    log('CLOUDFLARE_ACCOUNT_ID=your_account_id', 'yellow');
    log('CLOUDFLARE_R2_ACCESS_KEY_ID=your_access_key', 'yellow');
    log('CLOUDFLARE_R2_SECRET_ACCESS_KEY=your_secret_key', 'yellow');
    log('CLOUDFLARE_R2_BUCKET_NAME=police-misconduct (optional)', 'yellow');
    log('CLOUDFLARE_R2_PUBLIC_URL=https://files.yoursite.com (optional)', 'yellow');
    process.exit(1);
  }
  
  log('✓ Environment variables validated', 'green');
}

/**
 * Main test function
 */
async function main() {
  log('🧪 R2 Upload Test', 'bright');
  log('=' .repeat(60), 'cyan');
  
  try {
    // Validate environment
    validateEnvironment();
    
    log('\n📋 Configuration:', 'cyan');
    log(`   Account ID: ${process.env.CLOUDFLARE_ACCOUNT_ID}`, 'blue');
    log(`   Bucket: ${process.env.CLOUDFLARE_R2_BUCKET_NAME || 'police-misconduct'}`, 'blue');
    log(`   Public URL: ${process.env.CLOUDFLARE_R2_PUBLIC_URL || '(using default R2 URL)'}`, 'blue');
    
    log('\n📥 Test Document:', 'cyan');
    log(`   ${TEST_PDF_URL}`, 'blue');
    
    // Create temp directory if it doesn't exist
    if (!fs.existsSync(TEMP_DIR)) {
      fs.mkdirSync(TEMP_DIR, { recursive: true });
    }
    
    // Download file
    log('\n⬇️  Downloading PDF...', 'yellow');
    const download = await downloadFile(TEST_PDF_URL, TEMP_DIR);
    const fileSizeMB = (fs.statSync(download.filePath).size / 1024 / 1024).toFixed(2);
    log(`   ✓ Downloaded: ${download.filename} (${fileSizeMB} MB)`, 'green');
    
    // Upload to R2
    log('\n⬆️  Uploading to R2...', 'yellow');
    const result = await uploadPDF(download.filePath, {
      test: 'true',
      uploadedAt: new Date().toISOString()
    });
    
    // Cleanup temp file
    if (fs.existsSync(download.filePath)) {
      fs.unlinkSync(download.filePath);
    }
    if (fs.existsSync(TEMP_DIR) && fs.readdirSync(TEMP_DIR).length === 0) {
      fs.rmdirSync(TEMP_DIR);
    }
    
    // Display results
    log('\n✅ Upload Successful!', 'green');
    log('\n📊 Upload Details:', 'cyan');
    log(`   Original: ${result.originalFileName}`, 'blue');
    log(`   R2 Key: ${result.key}`, 'blue');
    log(`   Bucket: ${result.bucket}`, 'blue');
    
    log('\n🔗 Public URL:', 'magenta');
    log(`   ${result.url}`, 'bright');
    
    log('\n💾 Use in frontmatter:', 'cyan');
    log(`documents:`, 'yellow');
    log(`  - title: "Court Document"`, 'yellow');
    log(`    description: "Standing Order in Civil Cases"`, 'yellow');
    log(`    url: "${result.url}"`, 'yellow');
    
    log('\n' + '='.repeat(60), 'cyan');
    log('✅ Test completed - R2 upload and URL generation working!', 'green');
    
  } catch (error) {
    log('\n❌ Test failed:', 'red');
    log(`   ${error.message}`, 'red');
    if (error.stack) {
      log('\nStack trace:', 'red');
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run the test
main();
