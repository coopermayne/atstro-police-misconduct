# Project Context: Police Misconduct Law Website

## Project Overview
California-focused police misconduct documentation website with AI-assisted content generation. Combines case database, legal blog, and victim resources.

**Primary Goal**: Document police misconduct cases with embedded media and provide legal resources for victims and families.

**Live Site**: Deployed on Netlify with auto-deploy from `main` branch

**Development Environment**: This project is developed **exclusively in GitHub Codespaces**. All development, testing, and deployment happens in the Codespaces environment. This context may help explain certain errors or behaviors during testing.

---

## Tech Stack

### Core
- **Astro v5** - Static site generator
- **Tailwind CSS v4** - Styling
- **MDX** - Content with embedded components
- **TypeScript** - Type safety

### Media CDN (Cloudflare)
- **Cloudflare Stream** - Video hosting with adaptive streaming
- **Cloudflare Images** - Responsive images with automatic resizing
- **Cloudflare R2** - S3-compatible document storage

### AI & Automation
- **Anthropic Claude Sonnet 4** - Content generation from drafts
- **Structured Outputs** - Metadata extraction and article generation

### Deployment & Forms
- **Netlify** - Hosting with auto-deploy
- **Netlify Forms** - Contact form (attorney referrals)
- **Buttondown** - Newsletter (planned, not yet integrated)

---

## Project Structure

```
/
├── src/
│   ├── content/          # MDX content collections
│   │   ├── cases/        # Case documentation (victim stories)
│   │   ├── posts/        # Blog articles (legal guides)
│   │   ├── agencies/     # Police department profiles
│   │   └── counties/     # County pages
│   ├── components/       # Astro components
│   ├── layouts/          # Page layouts
│   └── pages/            # Routes (Astro file-based routing)
│
├── drafts/               # AI publishing workflow
│   ├── cases/            # Case drafts → AI generates final
│   ├── posts/            # Blog post drafts → AI generates
│   └── published/        # Archived drafts after publishing
│
├── scripts/              # Automation & tooling
│   ├── publish-draft.js  # Main publishing orchestrator
│   ├── cloudflare/       # Media upload scripts
│   ├── media/            # Media downloader & library
│   ├── registry/         # Metadata registry builder
│   └── ai/               # AI prompts & generation
│
├── data/
│   ├── metadata-registry.json    # Auto-generated from content
│   └── display-names.json        # Human-readable names
│
└── public/               # Static assets
```

---

## Content Schema

### Cases Collection (`src/content/cases/`)
Key frontmatter fields:
- `title`, `description`, `victim_name`
- `incident_date`, `city`, `county`
- `agencies[]` - Array of police departments
- `force_type`, `outcome`, `settlement_amount`
- `bodycam_available`, `criminal_charges`
- `featured_image` - Cloudflare Images object
- `videos[]`, `documents[]` - Cloudflare media

### Posts Collection (`src/content/posts/`)
Key frontmatter fields:
- `title`, `description`, `excerpt`
- `published_date`, `updated_date`
- `tags[]` - Minimal, on-point tags
- `featured_image`

**Important**: Content type detection is path-based:
- Files in `drafts/cases/` → case
- Files in `drafts/posts/` → blog post

---

## AI Publishing Workflow

### Command
```bash
npm run publish
# or via CLI: npm start → "Publish draft"
```

### Process
1. **Select draft** - Interactive numbered list
2. **Validate** - AI checks completeness, shows report
3. **User confirmation** - Proceed or abort
4. **Download media** - From Dropbox, Drive, direct URLs
5. **Upload to Cloudflare** - Videos → Stream, Images → Images, Docs → R2
6. **AI generation** - Extract metadata, generate article content
7. **Write MDX file** - Complete frontmatter + body with embedded media
8. **Git commit** - Auto-commit with descriptive message
9. **Deploy** - Netlify auto-deploys on push

### Draft Format
- Unstructured notes (bullet points, paragraphs)
- Media URLs with descriptions
- AI reads schema from `src/content/config.ts` directly
- Validation override: `--force` flag

### AI Tone
- **Encyclopedic** - Wikipedia-style neutrality
- No "Sources" section (baked into content)
- Only use `<CloudflareImage>` and `<CloudflareVideo>` components
- Minimal tags for blog posts

---

## Key Commands

```bash
# Development
npm run dev              # Start dev server (localhost:4321)
npm run build            # Production build
npm start                # Interactive CLI menu (recommended)

# Publishing
npm run publish          # Publish draft (interactive)
npm run publish -- --force  # Override validation

# Maintenance
npm run rebuild-registry # Rebuild metadata registry

# Media Library
# Via npm start → "Browse media library" → localhost:3001
```

### Claude Code Slash Commands

Custom slash commands available:

- **`/commit`** - Stage and commit all changes with descriptive message
- **`/commit file1.js file2.md`** - Commit only specific files with focused message

---

## Metadata Registry

**Auto-maintained** during builds via:
- `astro:build:done` hook in `astro.config.mjs`
- `npm run dev` pre-hook
- Manual: `npm run rebuild-registry`

**Purpose**: Track all unique values for:
- Agencies, counties, cities
- Force types, outcomes, tags
- Display names (human-readable mappings)

**Files**:
- `data/metadata-registry.json` - Auto-generated, don't edit
- `data/display-names.json` - Edit manually for custom names

---

## Environment Variables

Required for AI publishing workflow:

```bash
# AI
ANTHROPIC_API_KEY=

# Cloudflare
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_API_TOKEN=
CLOUDFLARE_R2_ACCESS_KEY_ID=
CLOUDFLARE_R2_SECRET_ACCESS_KEY=
CLOUDFLARE_R2_BUCKET_NAME=       # Optional, has default
CLOUDFLARE_R2_PUBLIC_URL=        # Optional
```

See `.env.example` for details.

---

## Current Implementation Status

### ✅ Complete
- Astro v5 static site with dark mode
- Content collections (cases, posts, agencies, counties)
- Cloudflare media integration (Stream, Images, R2)
- AI publishing workflow with validation
- Metadata registry auto-sync
- Media library browser (visual UI)
- Unified CLI tool
- Netlify Forms contact form with spam protection

### 🚧 In Progress / Planned
- Newsletter integration (Buttondown) - planned
- Search functionality - UI exists, needs implementation
- Advanced filtering - planned
- Case statistics dashboard - planned
- MPV dataset integration - planned
- SEO optimization - planned

---

## Important Patterns

### File Operations
- NEVER create new files unless absolutely necessary
- ALWAYS prefer editing existing files
- No markdown docs unless user requests

### Component Usage in MDX
Restrict to Cloudflare components only:
```mdx
<CloudflareVideo videoId="abc123" caption="..." />
<CloudflareImage imageId="def456" alt="..." caption="..." />
```

### Git Commits
- Always include descriptive messages
- End with Claude Code signature:
```
🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

### Form Submissions
- Netlify Forms only work on deployed sites (not localhost)
- Check Netlify dashboard → Forms for submissions
- Configure email notifications in Netlify settings

---

## Common Issues

1. **TypeScript errors about `class`** - These are IDE warnings in .astro files, safe to ignore
2. **Form not working locally** - Netlify Forms require deployment
3. **Registry out of sync** - Run `npm run rebuild-registry`
4. **Draft validation fails** - Use `npm run publish -- --force` to override
5. **Media upload timeouts** - Videos >1GB may fail (Cloudflare supports up to 30GB)

---

## Documentation

**Primary Docs** (read these for details):
- `PROJECT-ROADMAP.md` - Project status, phases, goals
- `PUBLISHING.md` - Complete AI workflow (550+ lines)
- `QUICKSTART.md` - 5-minute setup guide
- `CLOUDFLARE-SETUP.md` - Media hosting setup
- `METADATA-REGISTRY.md` - Registry system
- `CLI.md` - CLI tool documentation

**Tech Docs**:
- `scripts/README.md` - Script API reference
- `drafts/README.md` - Drafting guide
- `scripts/media/README.md` - Media management

---

## Quick Context Tips

1. **Cases vs Posts**: Cases are victim stories, posts are legal guides
2. **Tone**: Encyclopedic, neutral, factual - like Wikipedia
3. **Tags**: Keep minimal and on-point for blog posts
4. **Media**: All hosted on Cloudflare CDN, never in repo
5. **Deployment**: Auto-deploys to Netlify on push to `main`
6. **Forms**: Contact form for attorney referrals, newsletter coming soon
7. **Registry**: Auto-syncs, don't manually edit `metadata-registry.json`

---

**Last Updated**: 2025-11-21
