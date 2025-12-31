# Interactive CLI Tool

A menu-driven command-line interface for managing the Police Misconduct Documentation System.

## Quick Start

```bash
npm start
```

This launches an interactive menu with the following options:

## Features

### 📝 Create Draft Blog Post
- Prompts for a post name
- Generates a URL-friendly slug
- Copies the blog post template to `drafts/posts/[slug].md`
- Validates that the file doesn't already exist

### ⚖️ Create Draft Case Article
- Prompts for a case name
- Generates a URL-friendly slug
- Copies the case template to `drafts/cases/[slug].md`
- Validates that the file doesn't already exist

### 🚀 Publish Draft
- Lists all available drafts (cases and blog posts)
- Allows selection from an interactive menu
- Runs the full publish pipeline:
  - Validates draft content
  - Downloads and uploads media
  - Generates article with AI
  - Saves to content collection
  - Archives draft
  - Updates registry

### 💻 Run Dev Server
- Starts the Astro development server
- Syncs registry and Pagefind before starting
- Available at `http://localhost:4321` (or next available port)
- Press Ctrl+C to stop

### 🔄 Rebuild Registry
- Scans all published content
- Rebuilds `data/metadata-registry.json` from scratch
- Ensures canonical metadata values are up-to-date

### 📊 Media Library Statistics
Shows comprehensive statistics about uploaded media:
- **Counts**: Videos, images, documents, total assets
- **Storage estimates**: Size breakdown by media type
- **Recent additions**: Last 5 uploaded assets with dates
- **File details**: Names and upload timestamps

### 🖼️ Browse Media Library
Opens a visual web browser for all uploaded media:

```bash
npm run media:browse
# Opens at http://localhost:3001
```

Features:
- **Visual grid** of all videos, images, and documents
- **Click-to-copy** MDX component codes
- **Original source URLs** shown for each asset
- **Search and filter** by type or keyword

**Reusing media in new drafts:**
1. Find the asset in the browser
2. Copy the **original source URL**
3. Paste in your new draft

The system recognizes URLs already in the library and reuses them instead of re-downloading.

## Navigation

- Use **arrow keys** to navigate menu options
- Press **Enter** to select
- Press **Ctrl+C** to exit at any time
- Menu automatically redisplays after completing each action

## Alternative Commands

You can still run individual scripts directly:

```bash
# Publish a specific draft
npm run publish

# Start dev server directly
npm run dev

# Rebuild registry
npm run rebuild-registry
```

## Tips

1. **Create drafts first**: Use the CLI to create properly named draft files from templates
2. **Check media stats**: Review what's already uploaded before adding more media to drafts
3. **Use from any directory**: The CLI handles all paths relative to the project root
4. **Safe operations**: All prompts validate input before making changes
