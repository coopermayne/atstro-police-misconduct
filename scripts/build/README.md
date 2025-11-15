# Build Utilities

This folder contains utility scripts used during the build process.

## Files

- **`validate-config.js`** - Validates that all required environment variables are set
- **`copy-pagefind.js`** - Copies Pagefind search assets to public directory for dev server

## Usage

### Validate Configuration

Check that your `.env` file has all required variables for the publishing workflow:

```bash
npm run validate:config
# or
node scripts/build/validate-config.js
```

This will verify:
- Anthropic API key (for AI content generation)
- Cloudflare credentials (for media uploads)
- R2 storage configuration

### Copy Pagefind

Copies Pagefind search index files to the public directory so search works in dev mode:

```bash
node scripts/build/copy-pagefind.js
```

This script is automatically called during:
- `npm run dev`
- `npm run dev:search`

The full search index is built during production builds with:
```bash
npm run build  # Runs: astro build && npx pagefind --site dist
```

## Integration

These utilities are integrated into the npm scripts in `package.json` and run automatically as part of the development and build workflows.
