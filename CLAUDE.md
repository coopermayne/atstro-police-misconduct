# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Quick Reference

| Task | Action |
|------|--------|
| Start dev server | `npm run dev` |
| Create case article | Read `instructions/common.md` + `instructions/cases.md` |
| Create blog post | Read `instructions/common.md` + `instructions/posts.md` |
| Upload media | Use CLI utilities below |
| Commit changes | `/cm` or `/cm file1.js file2.md` |

## Documentation Index

| Document | Purpose |
|----------|---------|
| [docs/claude-code-structure.md](docs/claude-code-structure.md) | How custom Claude MD files work |
| [instructions/common.md](instructions/common.md) | Media utilities, components, registry |
| [instructions/cases.md](instructions/cases.md) | Case article guidelines |
| [instructions/posts.md](instructions/posts.md) | Blog post guidelines |
| [CLOUDFLARE-SETUP.md](CLOUDFLARE-SETUP.md) | Media hosting configuration |
| [METADATA-REGISTRY.md](METADATA-REGISTRY.md) | Canonical metadata values |
| [SEARCH.md](SEARCH.md) | Pagefind search implementation |

## Project Overview

Police Misconduct Law is an Astro-based static site documenting police misconduct cases in California. Features Cloudflare media hosting and interactive content creation through Claude Code.

**Development Environment**: GitHub Codespaces exclusively
- Working directory: `/workspaces/atstro-police-misconduct`
- Dev server: port 4321
- Media browser: port 3001

## Commands

```bash
# Development
npm run dev                    # Start dev server
npm run build                  # Production build
npm run preview                # Preview production build
npm start                      # Interactive CLI menu

# Media Upload (for Claude Code)
npm run upload:video <url> [--caption "..."]
npm run upload:image <url> --alt "..." [--caption "..."]
npm run upload:document <url> --title "..." --description "..."
npm run media:find "<search>"
npm run link:external <url> [--title/--description/--icon]

# Maintenance
npm run rebuild-registry       # Rebuild metadata registry
npm run validate:config        # Validate environment variables
npm run media:browse           # Browse media library (localhost:3001)
```

## Content Creation Workflow

Content is created interactively through Claude Code conversations.

### Before Creating Content

**Read these instruction files first:**
- `instructions/common.md` - Always (utilities, components, registry)
- `instructions/cases.md` - For case articles
- `instructions/posts.md` - For blog posts

### Workflow Steps

1. User provides notes/research
2. Read instruction files + `data/metadata-registry.json`
3. Research if needed (web search for facts/context)
4. Ask clarifying questions
5. Upload media using CLI utilities
6. Write article in `src/content/cases/` or `src/content/posts/`
7. Create notes file in `notes/cases/` or `notes/posts/`
8. Iterate based on feedback
9. Commit with `/cm` when complete

## Architecture

### Content Collections (`src/content/config.ts`)

| Collection | Purpose |
|------------|---------|
| **cases** | Police misconduct incidents |
| **posts** | Blog articles |
| **agencies** | Police department profiles |
| **counties** | California county pages |

All content is MDX with structured frontmatter. Slugs from filenames.

### Dynamic Routes (`src/pages/`)

- `/cases/[slug].astro` - Case pages
- `/posts/[slug].astro` - Blog posts
- `/posts/tags/[tag].astro` - Tag archives
- `/agencies/[slug].astro` - Agency profiles
- `/counties/[slug].astro` - County pages

### Cloudflare Media

| Component | Service | Usage |
|-----------|---------|-------|
| `CloudflareImage` | Cloudflare Images | `<CloudflareImage imageId="..." alt="..." />` |
| `CloudflareVideo` | Cloudflare Stream | `<CloudflareVideo videoId="..." />` |

Account hash: `3oZsG34qPq3SIXQhl47vqA` | Customer code: `b2jil4qncbeg5z7d`

### Styling

- Tailwind CSS v4 via Vite plugin
- Dark mode: `.dark` class on `<html>`
- Brand color: `red-600`

## Key Files

| File | Purpose |
|------|---------|
| `astro.config.mjs` | Astro configuration |
| `src/content/config.ts` | Content collection schemas (Zod) |
| `src/layouts/MainLayout.astro` | Base layout |
| `data/metadata-registry.json` | Canonical metadata values |
| `data/media-library.json` | Uploaded media tracking |

## Environment Variables

```bash
CLOUDFLARE_ACCOUNT_ID
CLOUDFLARE_API_TOKEN
CLOUDFLARE_R2_ACCESS_KEY_ID
CLOUDFLARE_R2_SECRET_ACCESS_KEY
```

Configured in Codespaces secrets. See `CLOUDFLARE-SETUP.md` for details.

## Deployment

- **Host**: Netlify (auto-deploy from main)
- **Build**: `npm run build`
- **Output**: `dist/`

## Important Patterns

1. **Registry is auto-maintained** - Don't manually edit during builds
2. **Media library prevents duplicates** - Check before uploading
3. **MDX content in `src/content/`** - Never in `public/`
4. **Dynamic routes need `getStaticPaths()`** - Astro generates at build time
5. **Cloudflare components need account IDs** - Don't change hash/code
