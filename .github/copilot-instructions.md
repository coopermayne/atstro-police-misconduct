# Police Misconduct Law - Copilot Instructions

## Project Overview

Astro-based static site documenting police misconduct cases in California. Uses MDX for content, Tailwind CSS v4 for styling, and deploys to Netlify.

## Architecture

### Content Collections (`src/content/`)

Defined in `src/content/config.ts` with Zod schemas:

| Collection | Purpose | Key Fields |
|------------|---------|------------|
| **cases** | Police misconduct incidents | victim_name, incident_date, agencies, force_type, bodycam_available |
| **posts** | Blog articles | title, description, published_date, tags, featured_image |
| **agencies** | Police department profiles | Optional custom pages |
| **counties** | California county pages | Optional custom pages |

### Dynamic Routes

All use `getStaticPaths()`:
- `/cases/[slug].astro` - Case detail pages
- `/posts/[slug].astro` - Blog post pages
- `/posts/tags/[tag].astro` - Tag archive pages
- `/agencies/[slug].astro` - Agency profiles
- `/counties/[slug].astro` - County pages

Slugs auto-generated from filename. Use `createSlug()` helper for tag/agency links.

### Cloudflare Media Components

| Component | Service | Props |
|-----------|---------|-------|
| `CloudflareImage.astro` | Cloudflare Images | `imageId`, `alt`, `caption` |
| `CloudflareVideo.astro` | Cloudflare Stream | `videoId`, `caption` |

Account hash: `3oZsG34qPq3SIXQhl47vqA`
Customer code: `b2jil4qncbeg5z7d`

### Styling

- Tailwind CSS v4 via Vite plugin in `astro.config.mjs`
- Dark mode: `.dark` class on `<html>` (localStorage persistence)
- Prose styling via `@tailwindcss/typography`
- Brand color: `red-600`

## Development

```bash
npm run dev      # Start dev server (localhost:4321)
npm run build    # Production build
npm run preview  # Preview production build
npm start        # Interactive CLI menu
```

## Adding Content

### Cases
1. Create MDX in `src/content/cases/` with required frontmatter
2. Set `published: true`
3. Import Cloudflare components as needed
4. Use `##` headings (title from frontmatter)

### Blog Posts
1. Create MDX in `src/content/posts/`
2. Required: title, description, published_date, tags
3. Set `published: true`
4. Optional: featured_image

### MDX Component Imports
```mdx
import CloudflareImage from '../../components/CloudflareImage.astro';
import CloudflareVideo from '../../components/CloudflareVideo.astro';
```

## Key Patterns

### Content Querying
```astro
const cases = await getCollection('cases', ({ data }) => data.published);
```

### Navigation
Main nav: Cases, Blog (/posts), Contact
All pages use `MainLayout.astro`

### Blog Layout
- Featured post prominently displayed
- Recent posts in sidebar
- Full grid of articles
- "Browse by Topic" tag section

## Deployment

- **Host**: Netlify
- **Build**: `npm run build`
- **Output**: `dist/`
- **Auto-deploy**: On push to main

## Key Files

| File | Purpose |
|------|---------|
| `astro.config.mjs` | Astro configuration |
| `src/content/config.ts` | Content collection schemas |
| `src/layouts/MainLayout.astro` | Base layout |
| `data/metadata-registry.json` | Canonical metadata values |
| `data/media-library.json` | Uploaded media tracking |
