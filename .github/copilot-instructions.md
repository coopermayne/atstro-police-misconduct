# Police Misconduct Law - Copilot Instructions

## Project Overview
This is an Astro-based static site documenting police misconduct cases in California. The site uses MDX for content, Tailwind CSS v4 for styling, and deploys to Netlify.

## Architecture

### Content Collections (`src/content/`)
The site is built around Astro's content collections defined in `src/content/config.ts`:
- **cases**: MDX files with structured frontmatter (victim_name, incident_date, agencies, etc.)
- **posts**: Blog articles with title, description, published_date, tags, and optional featured_image
- **agencies**: Optional metadata pages for police departments
- **counties**: Optional metadata pages for California counties

Each content file contains both structured metadata and long-form MDX content. The frontmatter schema is strictly typed using Zod.

### Dynamic Routes
All dynamic pages use Astro's `getStaticPaths()`:
- `/cases/[slug].astro` - Individual case detail pages
- `/posts/[slug].astro` - Individual blog post pages
- `/posts/tags/[tag].astro` - Tag archive pages for filtering posts by topic
- `/agencies/[slug].astro` - Agency profile pages
- `/counties/[slug].astro` - County pages
- `/status/[slug].astro` - Investigation status pages

Slugs are auto-generated from the filename (e.g., `sample-case-001.mdx` → `/cases/sample-case-001`). Tags are converted to slugs using `createSlug()` helper.

### Custom Components
- **CloudflareImage.astro**: Renders responsive images from Cloudflare Images with srcset support. Uses account hash `3oZsG34qPq3SIXQhl47vqA`.
- **CloudflareVideo.astro**: Embeds Cloudflare Stream videos with 16:9 aspect ratio. Uses customer code `b2jil4qncbeg5z7d`.

These components are imported directly into MDX content files.

### Styling Conventions
- Uses Tailwind CSS v4 (imported via Vite plugin in `astro.config.mjs`)
- Dark mode via `.dark` class on `<html>` element (toggled via localStorage)
- Prose styling for MDX content via `@tailwindcss/typography` plugin
- Red accent color (`red-600`) is the primary brand color throughout
- Custom dark mode variant defined in `global.css`: `@custom-variant dark (&:where(.dark, .dark *))`

### Theme Toggle Pattern
The theme toggle uses a two-step approach:
1. Inline `<script is:inline>` in `MainLayout.astro` applies theme immediately on page load (prevents flash)
2. Separate client-side script (`themeToggle.js`) handles user interaction

## Development Workflow

### Commands
- `npm run dev` - Start dev server on http://localhost:4321
- `npm run build` - Build for production (outputs to `dist/`)
- `npm run preview` - Preview production build locally

### Adding New Content

#### Cases
1. Create MDX file in `src/content/cases/` with required frontmatter fields
2. Set `published: true` to include in listings
3. Import `CloudflareImage` or `CloudflareVideo` components as needed
4. Use heading levels starting with `##` (title comes from frontmatter)

#### Blog Posts
1. Create MDX file in `src/content/posts/` with required fields (title, description, published_date, tags)
2. Set `published: true` to include in listings
3. Optionally add `featured_image` (Cloudflare Image ID) for visual appeal
4. Tags should be descriptive and reusable across posts
5. Import `CloudflareImage` or `CloudflareVideo` for rich media content

### Link Generation
Dynamic links to agencies, counties, and statuses use the `createSlug()` helper function (defined in case detail pages). This converts display text to URL-safe slugs by lowercasing and replacing spaces with hyphens.

## Key Patterns

### MDX Component Imports
Components must be imported at the top of MDX files:
```mdx
import CloudflareImage from '../../components/CloudflareImage.astro';
```

### Content Querying
Use `getCollection()` to query cases:
```astro
const cases = await getCollection('cases', ({ data }) => data.published);
```

### Navigation Structure
Main nav links: Cases, Blog (/posts), Contact
All pages use `MainLayout.astro` which includes `Navbar.astro` and `Footer.astro`

### Blog Layout Pattern
The blog index (`/posts`) uses a featured layout:
- Most recent post displayed prominently with large image
- 3 recent posts in sidebar with condensed format
- Full grid of all articles below
- "Browse by Topic" section showing all tags
- Featured images use Cloudflare Images with medium variant

## Deployment
Deploys to Netlify with Ubuntu Noble 24.04 build image. Build command: `npm run build`, publish directory: `dist/`. Node version: 18.

## Incomplete Features
- Search functionality (UI exists in navbar but non-functional)
- Contact page (route exists but minimal content)
- Newsletter subscription (form exists on homepage but non-functional)
- Sanity CMS integration (mentioned in README but not implemented)
