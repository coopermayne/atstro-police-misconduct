# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Police Misconduct Law is an Astro-based static site documenting police misconduct cases in California. The site features AI-powered content generation, Cloudflare media hosting, and automated publishing workflows.

## Development Environment

**This project is developed exclusively in GitHub Codespaces.**

When debugging or troubleshooting:
- Working directory is `/workspaces/atstro-police-misconduct`
- Dev server runs on port 4321 (auto-forwarded by Codespaces)
- Media browser runs on port 3001 (auto-forwarded by Codespaces)
- Environment variables are configured in Codespaces secrets (not local .env)
- All file paths should use the `/workspaces/` prefix
- Port forwarding is automatic but may need visibility set to "Public" for external access
- Git operations work normally (credentials handled by Codespaces)

## Development Commands

```bash
# Development
npm run dev                    # Start dev server (auto-syncs registry, copies pagefind)
npm run dev:search            # Dev server with verbose search/registry output
npm run build                 # Production build (auto-syncs registry, runs pagefind)
npm run preview               # Preview production build

# Interactive CLI (Recommended)
npm start                     # Opens interactive menu for all tasks:
                             # - Create drafts, publish content, browse media
                             # - Run dev server, rebuild registry

# Publishing Workflow
npm run publish              # Interactive draft publishing with AI
npm run publish:debug        # Publish with AI prompt/response debugging

# Maintenance
npm run rebuild-registry     # Rebuild metadata registry from published content
npm run validate:config      # Validate environment variables
npm run media:browse         # Browse media library (http://localhost:3001)
```

## Architecture

### Content Collections (`src/content/config.ts`)

Four strictly-typed Zod collections:

- **cases**: Police misconduct incidents with victim_name, incident_date, agencies, demographics, legal status, media
- **posts**: Blog articles with title, description, published_date, tags, featured_image
- **agencies**: Police department profile pages (optional custom pages)
- **counties**: California county pages (optional custom pages)

All content is MDX with structured frontmatter. Slugs are auto-generated from filenames.

### Dynamic Routes (`src/pages/`)

All use `getStaticPaths()`:
- `/cases/[slug].astro` - Case detail pages
- `/posts/[slug].astro` - Blog post pages
- `/posts/tags/[tag].astro` - Tag archive pages
- `/agencies/[slug].astro` - Agency profile pages
- `/counties/[slug].astro` - County pages
- `/status/[slug].astro` - Investigation status pages

Use `createSlug()` helper to convert display text to URL-safe slugs (lowercase, spaces → hyphens).

### Cloudflare Media Components

**CloudflareImage.astro**: Responsive images with srcset support
- Account hash: `3oZsG34qPq3SIXQhl47vqA`
- Imported in MDX: `<CloudflareImage imageId="abc123" alt="Description" />`

**CloudflareVideo.astro**: Embeds Cloudflare Stream videos (16:9 ratio)
- Customer code: `b2jil4qncbeg5z7d`
- Imported in MDX: `<CloudflareVideo videoId="xyz789" />`

### Styling

- **Framework**: Tailwind CSS v4 (via Vite plugin in `astro.config.mjs`)
- **Dark mode**: `.dark` class on `<html>` (localStorage persistence)
- **Brand color**: Red (`red-600` throughout)
- **Typography**: `@tailwindcss/typography` for MDX prose styling
- **Custom variant**: `@custom-variant dark (&:where(.dark, .dark *))` in `global.css`

### Theme Toggle Pattern

Two-step approach to prevent flash:
1. Inline `<script is:inline>` in `MainLayout.astro` applies theme immediately
2. Client-side `themeToggle.js` handles user interaction

## AI Publishing Workflow

**Core Script**: `scripts/publish-draft.js` (orchestrates entire workflow)

### Workflow Steps

1. **Create draft** in `/drafts/cases/` or `/drafts/posts/` (use `npm start` menu)
2. **Add media URLs** (Dropbox, Google Drive, direct links) in frontmatter
3. **Run** `npm run publish` (or `npm start` → "Publish draft")
4. **System automatically**:
   - Validates draft completeness
   - Downloads media from external URLs
   - Uploads videos to Cloudflare Stream
   - Uploads images/PDFs to Cloudflare R2
   - Extracts metadata with Claude AI
   - Generates complete article content with Claude AI
   - Embeds media with proper MDX components
   - Saves to `src/content/cases/` or `src/content/posts/`
   - Rebuilds metadata registry
   - Commits to git

**See**: `PUBLISHING.md` for 550+ line complete workflow documentation

### AI Modules (`scripts/ai/`)

- `prompts.js` - Builds AI prompts for metadata extraction and article generation
- `generators.js` - Calls Claude API with structured outputs

**Model**: Claude Sonnet 4 with structured outputs for metadata extraction

## Scripts Architecture

Organized into modules:

### `scripts/cloudflare/`
- `cloudflare-stream.js` - Video uploads to Stream
- `cloudflare-images.js` - Image uploads to Cloudflare Images
- `cloudflare-r2.js` - Document/image uploads to R2 (S3-compatible API)

### `scripts/media/`
- `file-downloader.js` - Downloads from external URLs (Dropbox, Drive)
- `media-library.js` - Tracks uploaded assets in `data/media-library.json`
- `media-browser.js` - Visual interface (http://localhost:3001)
- `processor.js` - Orchestrates media scanning, download, upload

### `scripts/registry/`
- `metadata-registry.js` - Core module managing canonical metadata
- `sync-registry.js` - Auto-syncs registry (runs on `dev`/`build`)
- `rebuild-registry.js` - Manual registry rebuild from all content
- `metadata-registry-cli.js` - CLI for managing registry
- `utils.js` - Frontmatter parsing, MDX file operations

### `scripts/utils/`
- `components.js` - Generates MDX component HTML
- `files.js` - File system operations, temp directory management
- `debug.js` - Debug mode prompts

## Metadata Registry System

**Purpose**: Ensures consistency across all content by providing canonical names.

**Location**: `data/metadata-registry.json`

**Contains**:
- Agencies: Police departments with aliases (e.g., "LAPD" → "Los Angeles Police Department")
- Counties: California counties with variations
- Force Types: Shooting, Taser, Physical Force, Beating, etc.
- Threat Levels: No Threat, Low Threat, Medium Threat, High Threat, Active Threat
- Investigation Statuses: Under Investigation, Charges Filed, Convicted, Settled, etc.
- Case Tags: Topical categorization
- Post Tags: Educational/legal topics

**Auto-sync**: Registry rebuilds automatically on `npm run dev` and `npm run build`

**Manual management**:
```bash
node scripts/registry/metadata-registry-cli.js stats
node scripts/registry/metadata-registry-cli.js list agencies
node scripts/registry/metadata-registry-cli.js add-agency "Berkeley PD"
```

**Display Names**: `data/display-names.json` maps metadata keys to human-readable names for UI display.

**See**: `METADATA-REGISTRY.md` for complete documentation

## Media Library

**Location**: `data/media-library.json`

Tracks all uploaded media to prevent duplicates:
- Videos: Cloudflare Stream IDs, file sizes, source URLs
- Images: Cloudflare Image IDs, R2 URLs
- Documents: R2 URLs, filenames

**Visual Browser**: `npm run media:browse` opens http://localhost:3001
- Grid view of all media
- Click-to-copy MDX component codes
- Filter by type, search by filename

## Environment Variables

**Required for publishing workflow**:
```bash
ANTHROPIC_API_KEY                    # Claude API key
CLOUDFLARE_ACCOUNT_ID                # Cloudflare account ID
CLOUDFLARE_API_TOKEN                 # API token (Stream/Images/R2 permissions)
CLOUDFLARE_R2_ACCESS_KEY_ID          # R2 access key
CLOUDFLARE_R2_SECRET_ACCESS_KEY      # R2 secret key
```

**Optional**:
```bash
CLOUDFLARE_R2_BUCKET_NAME            # R2 bucket name (has default)
CLOUDFLARE_R2_PUBLIC_URL             # R2 public URL for documents
```

Copy `.env.example` to `.env` and fill in values. See `CLOUDFLARE-SETUP.md` for setup instructions.

## Search Implementation

Uses Pagefind for static site search:
- Runs automatically during `npm run build`
- `scripts/build/copy-pagefind.js` copies assets to proper location
- UI exists in `SearchModal.astro` but needs connection to Pagefind

**See**: `SEARCH.md` for implementation details

## Content Creation Patterns

### MDX Component Imports
Components must be imported at the top of MDX files:
```mdx
---
title: "Example Case"
---

import CloudflareImage from '../../components/CloudflareImage.astro';
import CloudflareVideo from '../../components/CloudflareVideo.astro';

Content here...

<CloudflareVideo videoId="abc123" />
```

### Querying Content
```astro
import { getCollection } from 'astro:content';

// Get published cases
const cases = await getCollection('cases', ({ data }) => data.published);

// Sort by date
const sorted = cases.sort((a, b) =>
  new Date(b.data.incident_date).getTime() - new Date(a.data.incident_date).getTime()
);
```

### Link Generation
Use `createSlug()` helper for consistent URL generation:
```astro
function createSlug(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, '-');
}

<a href={`/agencies/${createSlug(agency)}`}>{agency}</a>
```

## Key Files Reference

- `astro.config.mjs` - Astro config with Tailwind, React, MDX integrations
- `src/content/config.ts` - Content collection schemas (Zod)
- `src/layouts/MainLayout.astro` - Base layout with navbar/footer
- `src/pages/index.astro` - Homepage with hero, recent content
- `scripts/cli.js` - Interactive CLI menu
- `scripts/publish-draft.js` - Main publishing orchestrator
- `data/metadata-registry.json` - Canonical metadata values
- `data/media-library.json` - Uploaded media tracking
- `data/display-names.json` - UI display name mappings

## Documentation Hub

**Getting Started**: `QUICKSTART.md`, `PROJECT-ROADMAP.md`
**Publishing**: `PUBLISHING.md`, `EDITING-ARTICLES.md`, `drafts/README.md`
**Media**: `CLOUDFLARE-SETUP.md`, `scripts/cloudflare/README.md`, `scripts/media/README.md`
**Metadata**: `METADATA-REGISTRY.md`, `METADATA-COMPONENT.md`
**Technical**: `CLI.md`, `scripts/README.md`, `SEARCH.md`, `WORKFLOW-DIAGRAM.md`

## Deployment

- **Host**: Netlify (auto-deploy from main branch)
- **Build Image**: Ubuntu Noble 24.04
- **Build Command**: `npm run build`
- **Publish Directory**: `dist/`
- **Node Version**: 18

## Important Patterns

1. **Registry is auto-maintained**: Don't manually edit `metadata-registry.json` during builds
2. **Media library prevents duplicates**: Check `media-library.json` before uploading
3. **Use `npm start` for common tasks**: Interactive menu is the easiest interface
4. **MDX content lives in `src/content/`**: Never put content in `public/`
5. **Drafts go in `/drafts/`**: Use templates in `drafts/README.md`
6. **Theme toggle requires two scripts**: Inline for immediate load + client-side for interaction
7. **All dynamic routes need `getStaticPaths()`**: Astro generates pages at build time
8. **Cloudflare components need account IDs**: Don't change account hash or customer code

## Incomplete Features

- Search functionality (UI exists, needs Pagefind integration)
- Contact form (Netlify Forms planned)
- Newsletter signup (Buttondown planned)
- RSS feed (planned)
