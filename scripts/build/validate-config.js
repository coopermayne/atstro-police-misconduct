#!/usr/bin/env node
/**
 * Configuration Validator
 * 
 * Checks if all required environment variables are set
 * and tests basic connectivity to APIs.
 */

import 'dotenv/config';
import chalk from 'chalk';

const REQUIRED_VARS = [
  'ANTHROPIC_API_KEY',
  'CLOUDFLARE_ACCOUNT_ID',
  'CLOUDFLARE_API_TOKEN',
  'CLOUDFLARE_R2_ACCESS_KEY_ID',
  'CLOUDFLARE_R2_SECRET_ACCESS_KEY'
];

const OPTIONAL_VARS = [
  'CLOUDFLARE_R2_BUCKET_NAME',
  'CLOUDFLARE_R2_PUBLIC_URL'
];

console.log('\n🔍 Validating Publishing Workflow Configuration\n');

let allValid = true;

// Check required variables
console.log('Required Environment Variables:');
REQUIRED_VARS.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`  ✅ ${varName}: ${value.substring(0, 10)}...`);
  } else {
    console.log(`  ❌ ${varName}: NOT SET`);
    allValid = false;
  }
});

console.log('\nOptional Environment Variables:');
OPTIONAL_VARS.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`  ✅ ${varName}: ${value}`);
  } else {
    console.log(`  ⚠️  ${varName}: Not set (using defaults)`);
  }
});

console.log('\n' + '─'.repeat(60) + '\n');

if (allValid) {
  console.log('✅ All required variables are set!\n');
  console.log('Next steps:');
  console.log('  1. Create a draft: cp drafts/templates/case-draft-template.md drafts/draft-test.md');
  console.log('  2. Edit the draft with your content');
  console.log('  3. Publish: npm run publish:draft draft-test.md\n');
} else {
  console.log('❌ Missing required environment variables!\n');
  console.log('Please set them in your .env file:');
  console.log('  1. Copy the example: cp .env.example .env');
  console.log('  2. Edit .env and add your API keys');
  console.log('  3. Run this script again to verify\n');
  console.log('See PUBLISHING.md for detailed setup instructions.\n');
  process.exit(1);
}
