# Police Misconduct Law Website

This is a work-in-progress website built with [Astro](https://astro.build) and styled using [Tailwind CSS](https://tailwindcss.com). The site aims to provide information about police misconduct law, including blog posts, case profiles, and other resources.

## ✨ Features

### Implemented
- **Content Collections**: MDX-based cases and blog posts with structured frontmatter
- **Dynamic Routing**: Auto-generated pages for cases, posts, agencies, and tags
- **Cloudflare Integration**: 
  - Cloudflare Stream for video hosting
  - Cloudflare Images for responsive images
  - Cloudflare R2 for document storage
- **Dark Mode**: Theme toggle with localStorage persistence
- **Responsive Design**: Mobile-first with Tailwind CSS v4
- **AI Content Generation**: Automated publishing from drafts with Claude Sonnet 4
- **Media Library Browser**: Visual interface for browsing media assets (localhost:3001)
- **Unified CLI Tool**: Interactive menu for all development tasks (`npm start`)
- **Metadata Registry**: Automatic tracking and display name management

### In Progress
- Forms & Newsletter (Phase 7):
  - Contact form with Netlify Forms
  - Newsletter signup with Buttondown
- Search functionality (UI exists, needs implementation)

### Planned
- Advanced search and filtering
- Analytics dashboard
- Case statistics and visualizations
- RSS feed

## 🚀 Quick Start

### Option 1: Interactive CLI (Recommended)
```bash
npm start
```
This opens an interactive menu with all common tasks:
- 📝 Create draft blog post
- ⚖️ Create draft case article
- 🚀 Publish draft
- 💻 Run dev server
- 📚 Browse media library
- 🔄 Rebuild registry
- 📊 Media library statistics

### Option 2: Direct Commands
```bash
npm run dev          # Start development server
npm run publish      # Publish a draft interactively
```

**👉 For detailed instructions, see [QUICKSTART.md](./QUICKSTART.md)**

---

## 🚀 AI Content Generation

This project includes a powerful automated workflow for creating content using GitHub Codespaces and AI.

### Publishing Workflow Overview

1. **Create a draft** using templates in `drafts/` folder
2. **Add media URLs** (Dropbox, Drive, direct links)
3. **Run publish command** (`npm run publish` or via `npm start` menu)
4. **Review and confirm** - AI generates complete article

The workflow automatically:
- ✅ Validates draft completeness
- ✅ Downloads media from external URLs
- ✅ Uploads to Cloudflare (Stream/Images/R2)
- ✅ Generates metadata and article content
- ✅ Embeds media with proper components
- ✅ Commits and deploys to Netlify

**📚 For complete workflow details, see [PUBLISHING.md](./PUBLISHING.md)**

---

## 📖 Documentation Hub

**Getting Started:**
- **[QUICKSTART.md](./QUICKSTART.md)** - Get started in 5 minutes
- **[PROJECT-ROADMAP.md](./PROJECT-ROADMAP.md)** - Project status, phases, and future plans

**Publishing & Content:**
- **[PUBLISHING.md](./PUBLISHING.md)** - Complete publishing workflow (550+ lines)
- **[EDITING-ARTICLES.md](./EDITING-ARTICLES.md)** - Guide to editing articles
- **[drafts/README.md](./drafts/README.md)** - How to create content drafts

**Media & Assets:**
- **[CLOUDFLARE-SETUP.md](./CLOUDFLARE-SETUP.md)** - Media hosting setup guide
- **[scripts/cloudflare/README.md](./scripts/cloudflare/README.md)** - Cloudflare API usage
- **[scripts/media/README.md](./scripts/media/README.md)** - Media management tools

**Metadata & Registry:**
- **[METADATA-REGISTRY.md](./METADATA-REGISTRY.md)** - Understanding the metadata registry
- **[METADATA-COMPONENT.md](./METADATA-COMPONENT.md)** - Using metadata components
- **[display-names.json](./display-names.json)** - Display name mappings

**Technical Reference:**
- **[CLI.md](./CLI.md)** - Command-line interface guide
- **[scripts/README.md](./scripts/README.md)** - Scripts API reference
- **[SEARCH.md](./SEARCH.md)** - Search implementation guide
- **[WORKFLOW-DIAGRAM.md](./WORKFLOW-DIAGRAM.md)** - Visual workflow diagrams

## 🛠️ Development Setup

1. Clone the repository:
   ```sh
   git clone <repository-url>
   cd astro-police-misconduct-law
   ```

2. Install dependencies:
   ```sh
   npm install
   ```

3. Set up environment variables (for publishing workflow):
   ```sh
   cp .env.example .env
   # Edit .env with your API keys
   ```

4. Start the development server:
   ```sh
   npm run dev
   ```

5. Open http://localhost:4321

## 📁 Project Structure

```
/
├── src/
│   ├── components/        # Astro components
│   ├── content/          # MDX content collections
│   │   ├── cases/        # Case documentation
│   │   ├── posts/        # Blog articles
│   │   ├── agencies/     # Police department profiles
│   │   └── counties/     # County pages
│   ├── layouts/          # Page layouts
│   ├── pages/            # Routes and dynamic pages
│   └── styles/           # Global CSS
├── drafts/               # Content drafts (for AI workflow)
│   ├── cases/            # Case drafts
│   ├── posts/            # Blog post drafts
│   ├── published/        # Archived published drafts
│   └── README.md         # Drafting guide
├── scripts/              # Publishing automation
│   ├── cloudflare/       # Cloudflare API scripts
│   ├── media/            # Media management tools
│   ├── registry/         # Metadata registry tools
│   └── README.md         # Technical reference
└── public/               # Static assets
```

## 🎨 Tech Stack

- **Framework**: [Astro](https://astro.build) v5
- **Styling**: [Tailwind CSS](https://tailwindcss.com) v4
- **Content**: MDX with Content Collections
- **Hosting**: [Netlify](https://netlify.com) (auto-deploy)
- **Media CDN**: 
  - [Cloudflare Stream](https://cloudflare.com/products/cloudflare-stream/) - Videos
  - [Cloudflare Images](https://cloudflare.com/products/cloudflare-images/) - Responsive images
  - [Cloudflare R2](https://cloudflare.com/products/r2/) - Documents
- **AI**: [Anthropic Claude](https://anthropic.com) Sonnet 4 for content generation
- **Forms**: Netlify Forms (planned)
- **Newsletter**: Buttondown (planned)

## 📜 Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build

# Interactive CLI (Recommended)
npm start            # Interactive menu for all tasks

# Publishing
npm run publish      # Interactive draft publishing

# Maintenance
npm run rebuild-registry  # Rebuild metadata registry
```

**💡 Tip:** Use `npm start` to access the unified CLI menu with all development tasks!

## 🔑 Environment Variables

For the AI publishing workflow, you'll need:

**Required:**
- `ANTHROPIC_API_KEY` - Anthropic Claude API key
- `CLOUDFLARE_ACCOUNT_ID` - Cloudflare account ID
- `CLOUDFLARE_API_TOKEN` - Cloudflare API token (with Stream/Images/R2 permissions)
- `CLOUDFLARE_R2_ACCESS_KEY_ID` - R2 access key
- `CLOUDFLARE_R2_SECRET_ACCESS_KEY` - R2 secret key

**Optional:**
- `CLOUDFLARE_R2_BUCKET_NAME` - R2 bucket name (defaults to configured value)
- `CLOUDFLARE_R2_PUBLIC_URL` - R2 public URL for documents

See `.env.example` for details and [CLOUDFLARE-SETUP.md](./CLOUDFLARE-SETUP.md) for setup instructions.

## 📝 Content Creation

### Quick Method: Use CLI
```bash
npm start
# Select "Create draft blog post" or "Create draft case article"
```

### Manual Method
Create MDX files directly in `src/content/cases/` or `src/content/posts/` with proper frontmatter.

### Automated (AI Workflow)
1. Create draft in `/drafts/cases/` or `/drafts/posts/`
2. Add case notes and external media URLs
3. Run `npm run publish` (or use `npm start` menu)
4. Review validation report and confirm
5. AI generates complete article with embedded media

**📚 See [PUBLISHING.md](./PUBLISHING.md) for full workflow documentation.**

---

## 🛠️ Tools & Utilities

### Media Library Browser
View and manage all media assets:
```bash
npm start
# Select "Browse media library"
# Opens visual interface at http://localhost:3001
```

Features:
- Visual grid of videos, images, and documents
- Click-to-copy MDX component codes
- File size display for videos
- Filter by type and tags
- Search by filename

### Metadata Registry
Automatically maintains display names and metadata:
```bash
npm run rebuild-registry  # Manually rebuild if needed
```

The registry auto-updates during builds to track agencies, counties, and other metadata.

**📚 See [METADATA-REGISTRY.md](./METADATA-REGISTRY.md) for details.**

---

## 🤝 Contributing

This project is still under development. Contributions and feedback are welcome!

## 📄 License

This project is licensed under the MIT License.
