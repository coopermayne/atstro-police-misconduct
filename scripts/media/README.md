# Media Management

This folder contains tools for managing media assets (videos, images, documents).

## Files

- **`file-downloader.js`** - Downloads files from external URLs (Dropbox, Google Drive, direct links)
- **`media-library.js`** - Central registry for tracking all uploaded media assets
- **`media-browser.js`** - Web-based browser for viewing and managing the media library
- **`processor.js`** - Media scanning, validation, and upload orchestration

## Usage

### File Downloader
Used by the publishing workflow to download external media before uploading to Cloudflare:

```javascript
import { downloadFile } from './file-downloader.js';
const localPath = await downloadFile('https://example.com/video.mp4', './downloads');
```

### Media Library
Track and reuse media assets across multiple articles:

```bash
# Add media to library
node scripts/media/media-library.js add-video <url>
node scripts/media/media-library.js add-image <url>
node scripts/media/media-library.js add-document <url>

# Search and retrieve
node scripts/media/media-library.js search "body camera"
node scripts/media/media-library.js get-code <asset-id>
node scripts/media/media-library.js list
```

### Media Browser
Launch a web interface to browse uploaded media:

```bash
npm run media:browse
# Opens at http://localhost:3456
```

### Media Processor
Core module used by the publishing workflow for automated media handling:

```javascript
import {
  scanMediaAndLinks,
  extractMediaMetadata,
  uploadAndRegisterMedia,
  validateMediaMetadataItem
} from './media/processor.js';

// Scan markdown file for URLs
const mediaItems = scanMediaAndLinks('/path/to/draft.md');

// Extract metadata using AI
const enrichedMedia = await extractMediaMetadata(filePath, mediaItems, debugMode);

// Upload to Cloudflare and register in library
const libraryEntry = await uploadAndRegisterMedia(mediaItem);
```

## Data Storage

Media library data is stored in `/data/media-library.json` at the project root.
