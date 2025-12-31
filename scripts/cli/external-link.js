#!/usr/bin/env node
/**
 * External Link CLI
 *
 * Generates an ExternalLinkCard component snippet.
 * No upload needed - just formats the component.
 * Designed for use by Claude Code - outputs only the component snippet.
 *
 * Usage:
 *   npm run link:external <url> [--title "..."] [--description "..."] [--icon video|news|generic]
 *   npm run link:external "https://youtube.com/watch?v=123" -- --title "Incident Video" --icon video
 *   npm run link:external "https://news.com/story" -- --title "News Coverage" --description "Local reporting" --icon news
 */

function parseArgs(args) {
  const result = { url: null, title: '', description: '', icon: 'generic' };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--title' && args[i + 1]) {
      result.title = args[i + 1];
      i++;
    } else if (args[i] === '--description' && args[i + 1]) {
      result.description = args[i + 1];
      i++;
    } else if (args[i] === '--icon' && args[i + 1]) {
      const icon = args[i + 1].toLowerCase();
      if (['video', 'news', 'generic'].includes(icon)) {
        result.icon = icon;
      }
      i++;
    } else if (!args[i].startsWith('--') && !result.url) {
      result.url = args[i];
    }
  }

  return result;
}

function escapeQuotes(str) {
  return str ? str.replace(/"/g, '&quot;') : '';
}

function generateComponent(url, title, description, icon) {
  let component = `<ExternalLinkCard url="${url}"`;

  if (title) {
    component += ` title="${escapeQuotes(title)}"`;
  }
  if (description) {
    component += ` description="${escapeQuotes(description)}"`;
  }
  if (icon && icon !== 'generic') {
    component += ` icon="${icon}"`;
  }

  component += ' />';
  return component;
}

function main() {
  const args = process.argv.slice(2);
  const { url, title, description, icon } = parseArgs(args);

  if (!url) {
    console.error('Usage: npm run link:external <url> [--title "..."] [--description "..."] [--icon video|news|generic]');
    console.error('');
    console.error('Icons:');
    console.error('  video   - For YouTube, Vimeo, etc.');
    console.error('  news    - For news articles');
    console.error('  generic - Default external link icon');
    process.exit(1);
  }

  // Output the component
  console.log(generateComponent(url, title, description, icon));
}

main();
