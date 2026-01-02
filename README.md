# Police Misconduct Law Website

A website built with [Astro](https://astro.build) and [Tailwind CSS](https://tailwindcss.com) documenting police misconduct cases in California.

## Features

- **Content Collections**: MDX-based cases and blog posts with structured frontmatter
- **Dynamic Routing**: Auto-generated pages for cases, posts, agencies, and tags
- **Cloudflare Integration**:
  - Cloudflare Stream for video hosting
  - Cloudflare Images for responsive images
  - Cloudflare R2 for document storage
- **Dark Mode**: Theme toggle with localStorage persistence
- **Responsive Design**: Mobile-first with Tailwind CSS v4
- **Interactive Content Creation**: Conversational workflow using Claude Code
- **Media Library Browser**: Visual interface for browsing media assets
- **Metadata Registry**: Automatic tracking and consistency management

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:4321
```

### Interactive CLI

```bash
npm start
```

Opens a menu with common tasks:
- Run dev server
- Browse media library
- Rebuild registry

## Content Creation

Content is created through conversations with Claude Code. The workflow:

1. Provide notes/research about a case or topic
2. Claude Code reads instruction files and metadata registry
3. Clarifying questions if needed
4. Media uploaded via CLI utilities
5. Article created in `src/content/`
6. Notes preserved in `notes/`

See `instructions/` for detailed guidelines:
- `instructions/common.md` - Shared utilities and components
- `instructions/cases.md` - Case article guidelines
- `instructions/posts.md` - Blog post guidelines

## Project Structure

```
/
├── src/
│   ├── components/        # Astro components
│   ├── content/           # MDX content collections
│   │   ├── cases/         # Case documentation
│   │   ├── posts/         # Blog articles
│   │   ├── agencies/      # Police department profiles
│   │   └── counties/      # County pages
│   ├── layouts/           # Page layouts
│   └── pages/             # Routes and dynamic pages
├── instructions/          # Content creation guidelines
├── notes/                 # Research notes for articles
│   ├── cases/
│   └── posts/
├── scripts/               # CLI utilities and automation
│   ├── cli/               # Media upload utilities
│   ├── cloudflare/        # Cloudflare API scripts
│   ├── media/             # Media library tools
│   └── registry/          # Metadata registry tools
└── data/                  # JSON data files
    ├── metadata-registry.json
    └── media-library.json
```

## Tech Stack

- **Framework**: [Astro](https://astro.build) v5
- **Styling**: [Tailwind CSS](https://tailwindcss.com) v4
- **Content**: MDX with Content Collections
- **Hosting**: [Netlify](https://netlify.com) (auto-deploy)
- **Media CDN**: Cloudflare (Stream, Images, R2)

## Scripts

```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run preview          # Preview production build
npm start                # Interactive CLI menu
npm run rebuild-registry # Rebuild metadata registry
npm run media:browse     # Browse media library (localhost:3001)

# Media upload utilities
npm run upload:video <url> [--caption "..."]
npm run upload:image <url> --alt "..." [--caption "..."]
npm run upload:document <url> --title "..." --description "..."
npm run media:find "<search>"
```

## Environment Variables

Required for media uploads:
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_R2_ACCESS_KEY_ID`
- `CLOUDFLARE_R2_SECRET_ACCESS_KEY`

See `CLOUDFLARE-SETUP.md` for setup instructions.

## Documentation

### For Humans

| Document | Description |
|----------|-------------|
| [QUICKSTART.md](QUICKSTART.md) | Get started quickly |
| [PROJECT-ROADMAP.md](PROJECT-ROADMAP.md) | Project status and future plans |
| [CLOUDFLARE-SETUP.md](CLOUDFLARE-SETUP.md) | Media hosting configuration |
| [METADATA-REGISTRY.md](METADATA-REGISTRY.md) | How canonical metadata works |
| [SEARCH.md](SEARCH.md) | Pagefind search implementation |

### For Claude Code / AI Assistants

| Document | Description |
|----------|-------------|
| [CLAUDE.md](CLAUDE.md) | Main Claude Code instructions |
| [docs/claude-code-structure.md](docs/claude-code-structure.md) | How custom instruction files work |
| [instructions/common.md](instructions/common.md) | Media utilities and components |
| [instructions/cases.md](instructions/cases.md) | Case article guidelines |
| [instructions/posts.md](instructions/posts.md) | Blog post guidelines |

## License

MIT License
