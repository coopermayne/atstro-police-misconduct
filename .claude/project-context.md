# Project Context: Police Misconduct Law Website

## Overview

California-focused police misconduct documentation website with interactive content creation through Claude Code. Combines case database, legal blog, and victim resources.

**Primary Goal**: Document police misconduct cases with embedded media and provide legal resources.

**Live Site**: Deployed on Netlify (auto-deploy from `main`)

**Development**: GitHub Codespaces exclusively

---

## Tech Stack

### Core
- **Astro v5** - Static site generator
- **Tailwind CSS v4** - Styling
- **MDX** - Content with embedded components
- **TypeScript** - Type safety

### Media CDN (Cloudflare)
- **Cloudflare Stream** - Video hosting
- **Cloudflare Images** - Responsive images
- **Cloudflare R2** - Document storage

### Deployment
- **Netlify** - Hosting with auto-deploy
- **Netlify Forms** - Contact form

---

## Project Structure

```
/
├── src/
│   ├── content/          # MDX content collections
│   │   ├── cases/        # Case documentation
│   │   ├── posts/        # Blog articles
│   │   ├── agencies/     # Police department profiles
│   │   └── counties/     # County pages
│   ├── components/       # Astro components
│   ├── layouts/          # Page layouts
│   └── pages/            # Routes
│
├── instructions/         # Content creation guidelines
│   ├── common.md         # Shared utilities, components
│   ├── cases.md          # Case article guidelines
│   └── posts.md          # Blog post guidelines
│
├── notes/                # Research notes for articles
│   ├── cases/
│   └── posts/
│
├── scripts/              # CLI utilities
│   ├── cli/              # Media upload tools
│   ├── cloudflare/       # Cloudflare API scripts
│   ├── media/            # Media library tools
│   └── registry/         # Metadata registry tools
│
└── data/
    ├── metadata-registry.json
    └── media-library.json
```

---

## Content Creation

Content is created interactively through Claude Code conversations (not automated scripts).

### Workflow
1. User provides notes/research
2. Claude Code reads instruction files and registry
3. Clarifying questions if needed
4. Media uploaded via CLI utilities
5. Article created in `src/content/`
6. Notes preserved in `notes/`

### Guidelines
- Read `instructions/common.md` + type-specific instructions before creating content
- Reference `data/metadata-registry.json` for canonical values
- Use CLI utilities for media uploads

---

## Key Commands

```bash
# Development
npm run dev              # Start dev server (localhost:4321)
npm run build            # Production build
npm start                # Interactive CLI menu

# Media
npm run upload:video <url> [--caption "..."]
npm run upload:image <url> --alt "..." [--caption "..."]
npm run upload:document <url> --title "..." --description "..."
npm run media:find "<search>"
npm run media:browse     # Visual browser (localhost:3001)

# Maintenance
npm run rebuild-registry # Rebuild metadata registry
```

### Custom Skills
- `/cm` - Stage and commit changes with descriptive message
- `/cm file1.js file2.md` - Commit specific files

---

## Content Schema

### Cases (`src/content/cases/`)
Key fields: `title`, `description`, `victim_name`, `incident_date`, `city`, `county`, `agencies[]`, `force_type`, `outcome`, `bodycam_available`, `featured_image`, `videos[]`, `documents[]`

### Posts (`src/content/posts/`)
Key fields: `title`, `description`, `published_date`, `tags[]`, `featured_image`

**Content type**: Path-based (files in `cases/` vs `posts/`)

---

## Metadata Registry

**Auto-maintained** during `npm run dev` and `npm run build`.

**Purpose**: Track canonical values for agencies, counties, force types, tags, etc.

**Files**:
- `data/metadata-registry.json` - Auto-generated, don't edit manually
- Manual rebuild: `npm run rebuild-registry`

---

## Environment Variables

Required (configured in Codespaces secrets):
```bash
CLOUDFLARE_ACCOUNT_ID
CLOUDFLARE_API_TOKEN
CLOUDFLARE_R2_ACCESS_KEY_ID
CLOUDFLARE_R2_SECRET_ACCESS_KEY
```

---

## Implementation Status

### Complete
- Astro v5 static site with dark mode
- Content collections (cases, posts, agencies, counties)
- Cloudflare media integration (Stream, Images, R2)
- Interactive content creation workflow
- Metadata registry auto-sync
- Media library browser
- Pagefind search
- Netlify Forms contact form

### Planned
- Newsletter integration (Buttondown)
- Advanced filtering
- Case statistics dashboard

---

## Common Patterns

### Component Usage in MDX
```mdx
<CloudflareVideo videoId="abc123" caption="..." />
<CloudflareImage imageId="def456" alt="..." caption="..." />
```

### Git Commits
Use `/cm` skill or include signature:
```
🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

---

## Common Issues

1. **Registry out of sync** - Run `npm run rebuild-registry`
2. **Media upload timeouts** - Large videos may need retry
3. **TypeScript warnings** - IDE warnings in .astro files are usually safe to ignore
4. **Form not working locally** - Netlify Forms require deployment

---

## Documentation

See `CLAUDE.md` for documentation index including:
- `instructions/` - Content creation guidelines
- `CLOUDFLARE-SETUP.md` - Media hosting setup
- `METADATA-REGISTRY.md` - Registry system
- `docs/claude-code-structure.md` - How custom MD files work
