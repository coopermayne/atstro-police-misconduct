# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Police Misconduct Law is an Astro-based static site documenting police misconduct cases in California. The site features Cloudflare media hosting and an interactive content creation workflow using Claude Code.

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
npm run build                  # Production build (auto-syncs registry, runs pagefind)
npm run preview                # Preview production build

# Interactive CLI
npm start                     # Opens menu: dev server, media browser, rebuild registry

# Maintenance
npm run rebuild-registry     # Rebuild metadata registry from published content
npm run validate:config      # Validate environment variables
npm run media:browse         # Browse media library (http://localhost:3001)

# Media Upload Utilities (for Claude Code)
npm run upload:video <url> [--caption "..."]
npm run upload:image <url> --alt "..." [--caption "..."]
npm run upload:document <url> --title "..." --description "..."
npm run media:find "<search>"
npm run link:external <url> [--title/--description/--icon]
```

## Content Creation Workflow

Content is created interactively through Claude Code conversations. This replaces the old draft-based publishing system.

### Creating Content

**When creating or editing case articles or blog posts**, read these instruction files first:

| File | Read When |
|------|-----------|
| `instructions/common.md` | Always - covers utilities, components, registry |
| `instructions/cases.md` | Creating/editing case articles |
| `instructions/posts.md` | Creating/editing blog posts |

These files contain:
- Writing tone and structure guidelines
- Complete frontmatter schema with examples
- What you can/cannot infer from notes
- Media upload utility usage
- Full example articles

### Workflow Steps

1. **User provides notes/research** - dump of information about a case or topic
2. **Read instruction files** - `instructions/common.md` + type-specific instructions
3. **Read metadata registry** - `data/metadata-registry.json` for canonical values
4. **Research if needed** - use web search to verify facts or find additional context
5. **Ask clarifying questions** - if information is ambiguous or missing
6. **Upload media** - use CLI utilities to upload images/videos
7. **Write article** - create MDX file in `src/content/cases/` or `src/content/posts/`
8. **Create notes file** - save research context in `notes/cases/` or `notes/posts/`
9. **Iterate** - accept feedback and make changes as requested

### Notes Files

Each article should have a companion notes file referenced in frontmatter:
```yaml
notes_file: "notes/cases/victim-name.md"
```

Notes files preserve:
- Original research/notes dump
- Source links and references
- Details cut from the article
- Edit history and decisions

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

Use `createSlug()` helper to convert display text to URL-safe slugs (lowercase, spaces to hyphens).

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

## Scripts Architecture

### `scripts/cli/`
- `upload-video.js` - Upload video, output component snippet
- `upload-image.js` - Upload image, output component snippet
- `upload-document.js` - Upload document, output component snippet
- `media-search.js` - Search media library
- `external-link.js` - Generate ExternalLinkCard component

### `scripts/cloudflare/`
- `cloudflare-stream.js` - Video uploads to Stream
- `cloudflare-images.js` - Image uploads to Cloudflare Images
- `cloudflare-r2.js` - Document/image uploads to R2 (S3-compatible API)

### `scripts/media/`
- `file-downloader.js` - Downloads from external URLs (Dropbox, Drive)
- `media-library.js` - Tracks uploaded assets in `data/media-library.json`
- `media-browser.js` - Visual interface (http://localhost:3001)

### `scripts/registry/`
- `metadata-registry.js` - Core module managing canonical metadata
- `sync-registry.js` - Auto-syncs registry (runs on `dev`/`build`)
- `rebuild-registry.js` - Manual registry rebuild from all content

## Metadata Registry System

**Purpose**: Ensures consistency across all content by providing canonical names.

**Location**: `data/metadata-registry.json`

**Contains**:
- Agencies: Police departments (canonical names)
- Counties: California counties
- Force Types: Shooting, Taser, Physical Force, Beating, etc.
- Threat Levels: No Threat, Low Threat, Medium Threat, High Threat, Active Threat
- Investigation Statuses: Under Investigation, Charges Filed, Convicted, Settled, etc.
- Case Tags and Post Tags

**Auto-sync**: Registry rebuilds automatically on `npm run dev` and `npm run build`

## Media Library

**Location**: `data/media-library.json`

Tracks all uploaded media to prevent duplicates:
- Videos: Cloudflare Stream IDs, file sizes, source URLs
- Images: Cloudflare Image IDs
- Documents: R2 URLs, filenames

**Visual Browser**: `npm run media:browse` opens http://localhost:3001

## Environment Variables

**Required**:
```bash
CLOUDFLARE_ACCOUNT_ID                # Cloudflare account ID
CLOUDFLARE_API_TOKEN                 # API token (Stream/Images/R2 permissions)
CLOUDFLARE_R2_ACCESS_KEY_ID          # R2 access key
CLOUDFLARE_R2_SECRET_ACCESS_KEY      # R2 secret key
```

See `CLOUDFLARE-SETUP.md` for setup instructions.

## Key Files Reference

- `astro.config.mjs` - Astro config with Tailwind, React, MDX integrations
- `src/content/config.ts` - Content collection schemas (Zod)
- `src/layouts/MainLayout.astro` - Base layout with navbar/footer
- `instructions/` - Content creation guidelines for Claude Code
- `data/metadata-registry.json` - Canonical metadata values
- `data/media-library.json` - Uploaded media tracking

## Documentation

- `CLOUDFLARE-SETUP.md` - Media hosting setup
- `METADATA-REGISTRY.md` - Registry documentation
- `instructions/common.md` - Shared content creation instructions
- `instructions/cases.md` - Case article instructions
- `instructions/posts.md` - Blog post instructions

## Deployment

- **Host**: Netlify (auto-deploy from main branch)
- **Build Command**: `npm run build`
- **Publish Directory**: `dist/`

## Important Patterns

1. **Registry is auto-maintained**: Don't manually edit `metadata-registry.json` during builds
2. **Media library prevents duplicates**: Check `media-library.json` before uploading
3. **MDX content lives in `src/content/`**: Never put content in `public/`
4. **All dynamic routes need `getStaticPaths()`**: Astro generates pages at build time
5. **Cloudflare components need account IDs**: Don't change account hash or customer code
