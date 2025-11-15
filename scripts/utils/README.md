# Utility Modules

This folder contains reusable utility functions for the publishing workflow.

## Files

- **`components.js`** - MDX component HTML generation utilities
- **`files.js`** - File system operations and directory management
- **`debug.js`** - Debug mode interactive prompt display

## Components Utilities

Functions for generating MDX component strings with proper escaping:

```javascript
import {
  generateComponentHTML,
  generateLinkComponentHTML,
  escapeQuotes,
  extractUrlContext
} from './utils/components.js';

// Generate media component HTML
const html = generateComponentHTML('video', libraryEntry, componentParams);
// Returns: '<CloudflareVideo videoId="..." caption="..." />'

// Generate link component HTML
const linkHtml = generateLinkComponentHTML(url, linkParams);
// Returns: '<ExternalLinkCard url="..." title="..." />'
```

## File Utilities

Helper functions for file and directory operations:

```javascript
import {
  getDraftFiles,
  ensureTempDir,
  cleanupTempDir,
  DRAFTS_DIR,
  TEMP_DIR
} from './utils/files.js';

// Get all draft markdown files
const drafts = getDraftFiles();
// Returns: ['/path/to/drafts/cases/file.md', ...]

// Create temp directory if needed
ensureTempDir();

// Clean up temp files
cleanupTempDir();
```

### Directory Constants

- `DRAFTS_DIR` - Path to `/drafts` folder
- `TEMP_DIR` - Path to `/.temp-uploads` folder for temporary file storage

## Debug Utilities

Interactive prompts for debugging AI interactions:

```javascript
import {
  displayPromptAndConfirm,
  displayResponseAndConfirm
} from './utils/debug.js';

// Display prompt before sending to AI (only in debug mode)
await displayPromptAndConfirm(prompt, 'PROMPT NAME', debugMode);

// Display AI response before continuing (only in debug mode)
await displayResponseAndConfirm(response, 'RESPONSE NAME', debugMode);
```

When `debugMode` is `false`, these functions immediately return `true` without displaying anything.

When `debugMode` is `true`, they:
1. Display the full prompt/response
2. Show character count
3. Ask user to confirm before proceeding
4. Exit process if user cancels

## Usage in Workflow

These utilities are used throughout the publishing workflow to:
- Generate component HTML for embedded media
- Manage temporary files during uploads
- Provide interactive debugging of AI interactions
- Handle file system operations consistently
