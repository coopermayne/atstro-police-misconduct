# Search Implementation

This site uses [Pagefind](https://pagefind.app/) for fast, static site search functionality.

## Overview

Pagefind is a fully static search library that indexes your site at build time and delivers a small, fast search experience to users. It's designed specifically for static sites and requires no backend infrastructure.

## Architecture

### Build-Time Indexing

Search indexing happens **only during production builds**, not in development mode:

```bash
# Development mode - uses cached search index
npm run dev

# Production build - rebuilds search index
npm run build
```

The build command in `package.json` runs two steps:
1. `astro build` - Builds the static site to `dist/`
2. `npx pagefind --site dist` - Indexes the built site and generates search files

### Dev Mode Search

During development, the `copy-pagefind.js` script copies the search index from the last production build into the `public/` directory. This allows you to test search functionality in dev mode without rebuilding the entire index on every change.

To update the search index during development:
```bash
npm run build        # Rebuild and reindex
npm run dev         # Continue development with updated index
```

Or to test the full production experience:
```bash
npm run build && npm run preview
```

## Implementation Details

### Search Modal Component

The search UI is implemented in `src/components/SearchModal.astro` and uses Pagefind's pre-built UI component. Key features:

- **Modal overlay** with backdrop blur
- **Keyboard shortcuts**: `Cmd/Ctrl + K` to open, `ESC` to close
- **Auto-focus**: Search input is automatically focused when modal opens
- **Dark mode support**: Respects site theme with custom styling
- **Styled clear button**: Minimal X icon to clear search

### Search Weighting

Search results are ranked using Pagefind's weighting system. Page titles have 10x weight compared to body content:

```astro
<h1 data-pagefind-weight="10">
  {title}
</h1>
```

This ensures that title matches appear prominently in search results.

### Indexed Content

Content is indexed using the `data-pagefind-body` attribute on article containers:

```astro
<article data-pagefind-body>
  <!-- All content here is indexed -->
</article>
```

Currently indexed:
- ✅ Case detail pages (`/cases/[slug]`)
- ✅ Blog posts (`/posts/[slug]`)
- ❌ Homepage (not indexed)
- ❌ Agency pages (not indexed)
- ❌ County pages (not indexed)

### Search Result Highlighting

Matching terms are highlighted in both titles and excerpts using styled `<mark>` tags:

- **Light mode**: Bold red text on light red background
- **Dark mode**: Bold white text on red background

## Configuration

### Pagefind UI Options

Configured in `src/scripts/searchModal.js`:

```javascript
pagefindInstance = new window.PagefindUI({
  element: '#search-container',
  showSubResults: true,      // Show multiple results per page
  showImages: false,          // Don't show thumbnail images
  excerptLength: 30,          // Number of words in excerpt
  resetStyles: false,         // Use custom styles
});
```

### Custom Styling

Custom CSS variables in `SearchModal.astro` control the appearance:

```css
--pagefind-ui-primary: #dc2626;     /* Red accent color */
--pagefind-ui-scale: 1;             /* UI scaling factor */
--pagefind-ui-border-radius: 8px;   /* Rounded corners */
```

## File Structure

```
src/
├── components/
│   └── SearchModal.astro          # Search UI component
├── scripts/
│   └── searchModal.js             # Search modal behavior
└── pages/
    ├── search.astro               # Standalone search page (optional)
    ├── cases/[slug].astro         # Case pages (indexed)
    └── posts/[slug].astro         # Blog posts (indexed)

scripts/
└── copy-pagefind.js               # Copies index to public/ for dev

public/
└── pagefind/                      # Search index (gitignored)
    ├── pagefind.js
    ├── pagefind-ui.js
    ├── pagefind-ui.css
    └── ...                        # Index fragments
```

## Testing Search

### In Development

1. Build the search index once:
   ```bash
   npm run build
   ```

2. Start dev server (copies index automatically):
   ```bash
   npm run dev
   ```

3. Open search with `Cmd/Ctrl + K` or click the search icon

**Note**: Changes to content won't be reflected in search until you rebuild.

### Before Deployment

Always test the full production build:

```bash
npm run build && npm run preview
```

This ensures search works exactly as it will in production.

## Troubleshooting

### "Search requires a production build" message

This appears when:
- No search index exists in `public/pagefind/`
- You haven't run `npm run build` yet
- The `copy-pagefind.js` script failed

**Solution**: Run `npm run build` to generate the search index.

### Search not finding new content

The search index is static and only updated during builds.

**Solution**: Run `npm run build` to reindex after content changes.

### Search not working in production

Verify that the build command includes Pagefind indexing:

```json
"build": "astro build && npx pagefind --site dist"
```

Check that `dist/pagefind/` exists after building.

### Styling issues in dark mode

Ensure the dark mode class is properly applied to the `<html>` element. The search modal uses `.dark` selectors for dark mode styles.

## Future Enhancements

Potential improvements to consider:

- [ ] Add filters for content type (cases vs. blog posts)
- [ ] Index agency and county pages
- [ ] Add search analytics
- [ ] Implement search suggestions/autocomplete
- [ ] Add "no results" custom messaging
- [ ] Add keyboard navigation for results

## Resources

- [Pagefind Documentation](https://pagefind.app/)
- [Pagefind UI Customization](https://pagefind.app/docs/ui/)
- [Pagefind Weighting](https://pagefind.app/docs/weighting/)
