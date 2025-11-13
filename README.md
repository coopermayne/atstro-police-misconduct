# Police Misconduct Law Website

This is a work-in-progress website built with [Astro](https://astro.build) and styled using [Tailwind CSS](https://tailwindcss.com). The site aims to provide information about police misconduct law, including blog posts, case profiles, and other resources.

## ✨ Features

### Implemented
- **Content Collections**: MDX-based cases and blog posts with structured frontmatter
- **Dynamic Routing**: Auto-generated pages for cases, posts, agencies, and tags
- **Cloudflare Integration**: 
  - Cloudflare Stream for video hosting
  - Cloudflare Images for responsive images
- **Dark Mode**: Theme toggle with localStorage persistence
- **Responsive Design**: Mobile-first with Tailwind CSS v4
- **AI Content Generation Workflow**: Automated publishing from drafts (NEW! 🚀)

### In Progress
- Search functionality (UI exists but non-functional)
- Newsletter subscription
- Contact form

## 🚀 AI Content Generation

This project includes a powerful automated workflow for creating content using GitHub Codespaces and AI.

### Quick Start

1. **Open GitHub Codespace** (sets up everything automatically)

2. **Create a draft**:
   ```bash
   cp drafts/templates/case-draft-template.md drafts/cases/my-case.md
   # Edit the draft with your case notes and media URLs
   ```

3. **Publish** (interactive):
   ```bash
   npm run publish:draft
   # Select from numbered list
   # Review validation report
   # Confirm to proceed
   ```

The workflow will automatically:
- Validate draft completeness before processing
- Download media from external URLs (Dropbox, Google Drive, etc.)
- Upload videos to Cloudflare Stream
- Upload images to Cloudflare Images
- Upload PDFs to Cloudflare R2
- Generate metadata and complete article with AI
- Embed media with proper components
- Save to your content collection
- Archive draft to published folder
- Commit and push to GitHub (triggers Netlify deploy)

### Documentation

- **[PROJECT-ROADMAP.md](./PROJECT-ROADMAP.md)** - Project status and future plans
- **[QUICKSTART.md](./QUICKSTART.md)** - Get started in 5 minutes
- **[PUBLISHING.md](./PUBLISHING.md)** - Complete workflow documentation (550+ lines)
- **[CLOUDFLARE-SETUP.md](./CLOUDFLARE-SETUP.md)** - Media hosting setup guide
- **[scripts/README.md](./scripts/README.md)** - Technical API reference

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
│   ├── templates/        # Draft templates
│   └── published/        # Archived published drafts
├── scripts/              # Publishing automation
└── public/               # Static assets
```

## 🎨 Tech Stack

- **Framework**: [Astro](https://astro.build) v5
- **Styling**: [Tailwind CSS](https://tailwindcss.com) v4
- **Content**: MDX with Content Collections
- **Hosting**: [Netlify](https://netlify.com)
- **Media**: 
  - [Cloudflare Stream](https://cloudflare.com/products/cloudflare-stream/) for videos
  - [Cloudflare R2](https://cloudflare.com/products/r2/) for images/documents
  - [Cloudflare Images](https://cloudflare.com/products/cloudflare-images/) for responsive images
- **AI**: [Anthropic Claude](https://anthropic.com) for content generation

## 📜 Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run publish:draft <file>  # Publish a draft (AI workflow)
```

## 🔑 Environment Variables

For the AI publishing workflow, you'll need:

- `ANTHROPIC_API_KEY` - Anthropic Claude API key
- `CLOUDFLARE_ACCOUNT_ID` - Cloudflare account ID
- `CLOUDFLARE_API_TOKEN` - Cloudflare API token (Stream permissions)
- `CLOUDFLARE_R2_ACCESS_KEY_ID` - R2 access key
- `CLOUDFLARE_R2_SECRET_ACCESS_KEY` - R2 secret key
- `CLOUDFLARE_R2_BUCKET_NAME` - R2 bucket name (optional)

See `.env.example` for details.

## 📝 Content Creation

### Manual (Traditional)
Create MDX files directly in `src/content/cases/` or `src/content/posts/` with proper frontmatter.

### Automated (AI Workflow)
1. Create draft in `/drafts/` using templates
2. Add external media URLs
3. Run `npm run publish:draft <filename>`
4. Review generated content

See [PUBLISHING.md](./PUBLISHING.md) for full workflow documentation.

## 🤝 Contributing

This project is still under development. Contributions and feedback are welcome!

## 📄 License

This project is licensed under the MIT License.
