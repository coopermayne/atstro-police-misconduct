# Scripts

This folder contains CLI utilities and automation scripts.

## Scripts Overview

### CLI Utilities (`cli/`)

Media upload tools for use with Claude Code:

- **`upload-video.js`** - Upload video to Cloudflare Stream, output component snippet
- **`upload-image.js`** - Upload image to Cloudflare Images, output component snippet
- **`upload-document.js`** - Upload document to R2, output component snippet
- **`media-search.js`** - Search media library for existing assets
- **`external-link.js`** - Generate ExternalLinkCard component (no upload)

Usage:
```bash
npm run upload:video <url> [--caption "..."]
npm run upload:image <url> --alt "..." [--caption "..."]
npm run upload:document <url> --title "..." --description "..."
npm run media:find "<search>"
npm run link:external <url> [--title/--description/--icon]
```

### Interactive CLI

- **`cli.js`** - Interactive menu for common dev tasks (dev server, media browser, rebuild registry)

Run with `npm start`.

### Cloudflare Uploaders (`cloudflare/`)

- **`cloudflare-stream.js`** - Uploads videos to Cloudflare Stream
- **`cloudflare-images.js`** - Uploads images to Cloudflare Images
- **`cloudflare-r2.js`** - Uploads documents to Cloudflare R2 storage

### Media Management (`media/`)

- **`file-downloader.js`** - Downloads files from external URLs (Dropbox, Google Drive, etc.)
- **`media-library.js`** - Tracks uploaded media assets to avoid duplicates
- **`media-browser.js`** - Visual browser for viewing uploaded media (localhost:3001)
- **`processor.js`** - Media scanning and upload orchestration

### Metadata Registry (`registry/`)

- **`metadata-registry.js`** - Core module for managing canonical metadata values
- **`metadata-registry-cli.js`** - CLI tool for managing metadata registry
- **`rebuild-registry.js`** - Rebuilds registry from published content
- **`sync-registry.js`** - Syncs registry (runs automatically on build/dev)
- **`utils.js`** - Shared utility functions

### Build Utilities (`build/`)

- **`validate-config.js`** - Validates environment configuration
- **`copy-pagefind.js`** - Copies Pagefind search assets

### Utilities (`utils/`)

- **`components.js`** - MDX component HTML generation
- **`files.js`** - File system operations
- **`debug.js`** - Debug mode utilities

## Media Browser

```bash
npm run media:browse
```

Opens visual interface at http://localhost:3001 with:
- Grid view of all uploaded media
- Click-to-copy component codes
- Filter by type, search by filename

## Registry Management

```bash
npm run rebuild-registry  # Full rebuild from all content
```

Registry auto-syncs on `npm run dev` and `npm run build`.
