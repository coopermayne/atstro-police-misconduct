#!/usr/bin/env node
/**
 * Interactive CLI Tool
 *
 * Quick access to common development tasks:
 * - Run dev server
 * - Browse media library
 * - Rebuild registry
 */

import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

/**
 * Main menu options
 */
const MAIN_MENU = [
  { title: '1. Run dev server', value: 'dev-server' },
  { title: '2. Browse media library', value: 'media-browser' },
  { title: '3. Rebuild registry', value: 'rebuild-registry' },
  { title: '4. Exit', value: 'exit' }
];

/**
 * Run dev server
 */
async function runDevServer() {
  console.log('\nStarting dev server...\n');

  const child = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    cwd: ROOT_DIR,
    shell: true
  });

  await new Promise((resolve) => {
    child.on('close', resolve);
    child.on('error', resolve);
  });

  console.log('\nDev server stopped\n');
}

/**
 * Run media browser
 */
async function runMediaBrowser() {
  console.log('\nStarting media library browser...\n');
  console.log('   Opening http://localhost:3001 in your browser...');
  console.log('   Press Ctrl+C to stop the server\n');

  const mediaBrowserScript = path.join(__dirname, 'media', 'media-browser.js');

  const child = spawn('node', [mediaBrowserScript], {
    stdio: 'inherit',
    cwd: ROOT_DIR
  });

  await new Promise((resolve) => {
    child.on('close', resolve);
    child.on('error', resolve);
  });

  console.log('\nMedia browser stopped\n');
}

/**
 * Rebuild registry
 */
async function rebuildRegistry() {
  console.log('\nRebuilding registry...\n');

  const rebuildScript = path.join(__dirname, 'registry', 'rebuild-registry.js');

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

    console.log('\nRegistry rebuilt successfully\n');
  } catch (error) {
    console.error(`\nRebuild failed: ${error.message}\n`);
  }
}

/**
 * Main menu loop
 */
async function mainMenu() {
  console.log('\n========================================');
  console.log('   Police Misconduct Law - Dev Tools');
  console.log('========================================\n');

  while (true) {
    console.log('What would you like to do?\n');
    MAIN_MENU.forEach(item => {
      console.log(`  ${item.title}`);
    });
    console.log('\nPress a number key (1-4) to select an option...\n');

    const action = await waitForKeyPress();

    if (!action || action === 'exit') {
      console.log('\nGoodbye!\n');
      process.exit(0);
    }

    switch (action) {
      case 'dev-server':
        await runDevServer();
        break;
      case 'media-browser':
        await runMediaBrowser();
        break;
      case 'rebuild-registry':
        await rebuildRegistry();
        break;
    }

    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

/**
 * Wait for a single key press and return the corresponding action
 */
function waitForKeyPress() {
  return new Promise((resolve) => {
    const keyMap = {
      '1': 'dev-server',
      '2': 'media-browser',
      '3': 'rebuild-registry',
      '4': 'exit'
    };

    readline.emitKeypressEvents(process.stdin);
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
    }

    const onKeypress = (str, key) => {
      if (key && key.ctrl && key.name === 'c') {
        console.log('\n\nGoodbye!\n');
        process.exit(0);
      }

      if (keyMap[str]) {
        cleanup();
        resolve(keyMap[str]);
      }
    };

    const cleanup = () => {
      process.stdin.removeListener('keypress', onKeypress);
      if (process.stdin.isTTY) {
        process.stdin.setRawMode(false);
      }
      process.stdin.pause();
    };

    process.stdin.on('keypress', onKeypress);
    process.stdin.resume();
  });
}

process.on('SIGINT', () => {
  console.log('\n\nGoodbye!\n');
  process.exit(0);
});

mainMenu().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
