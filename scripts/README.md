# Publishing Scripts

This folder contains the automated content generation workflow scripts.

## Scripts Overview

### Main Script
- **`publish-draft.js`** - Main orchestration script that runs the entire publishing workflow

### Test Scripts
- **`test-r2-upload.js`** - Standalone script to test R2 uploads and verify URLs

### Utility Modules
- **`file-downloader.js`** - Downloads files from external URLs (Dropbox, Google Drive, etc.)
- **`cloudflare-stream.js`** - Uploads videos to Cloudflare Stream
- **`cloudflare-r2.js`** - Uploads images and PDFs to Cloudflare R2 storage
- **`cloudflare-images.js`** - Uploads images to Cloudflare Images
- **`ai-prompts.js`** - AI prompt templates for content analysis and generation
- **`validate-config.js`** - Validates environment configuration
- **`media-library.js`** - Tracks uploaded media assets to avoid duplicates
- **`metadata-registry.js`** - Manages canonical metadata values (agencies, counties, tags)
- **`metadata-registry-cli.js`** - CLI tool for managing metadata registry
- **`update-registry-from-content.js`** - Scans published content and adds new metadata to registry
- **`normalize-metadata.js`** - Normalizes existing content metadata against registry

## Usage

### Publish a Draft

```bash
npm run publish:draft draft-filename.md
```

This command:
1. Reads the draft from `/drafts/`
2. Downloads all external media
3. Uploads to Cloudflare services
4. Generates article with AI
5. Saves to content collection
6. **Updates metadata registry** with any new agencies, counties, or tags
7. Commits to Git

### Test R2 Upload (Standalone)

Test uploading PDFs to R2 and verify URL generation without running the full publish workflow:

```bash
npm run test:r2
```

This simple test:
- ✅ Downloads a real court PDF from a test URL
- ✅ Uploads it to Cloudflare R2
- ✅ Displays the public URL
- ✅ Shows frontmatter format for the documents array

This verifies that the R2 upload function properly uploads files and generates working URLs for referencing documents later.

### Update Metadata Registry from Published Content

If you need to manually scan a published file and update the registry:

```bash
node scripts/update-registry-from-content.js src/content/cases/anthony-silva.mdx case
```

This scans the frontmatter and adds any new agencies, counties, or tags to the registry. This happens automatically after publishing, but can be run manually if needed.

### Manage Metadata Registry

View and manage canonical metadata values:

```bash
# List all entries of a type
node scripts/metadata-registry-cli.js list agencies
node scripts/metadata-registry-cli.js list counties
node scripts/metadata-registry-cli.js list case-tags

# Add new entries manually
node scripts/metadata-registry-cli.js add-agency "Berkeley PD" "BPD,Berkeley Police"
node scripts/metadata-registry-cli.js add-tag "Excessive Force" case

# View registry statistics
node scripts/metadata-registry-cli.js stats
```

### Manual Usage of Utilities

You can also use the utilities independently:

#### Download Files
```javascript
import { downloadFile } from './file-downloader.js';

const result = await downloadFile(
  'https://dropbox.com/s/abc/file.mp4',
  './downloads'
);
```

#### Upload to R2 (PDFs/Documents)
```javascript
import { uploadPDF } from './cloudflare-r2.js';

const result = await uploadPDF('./document.pdf', {
  source: 'court-filing',
  case: 'john-doe'
});

console.log(result.url); // Public URL to use in frontmatter
```

#### Upload Video
```javascript
import { uploadVideo } from './cloudflare-stream.js';

const result = await uploadVideo('./video.mp4', {
  name: 'Body Camera Footage'
});

console.log(result.videoId); // Use this in CloudflareVideo component
```

#### Upload Image
```javascript
import { uploadImage } from './cloudflare-r2.js';

const result = await uploadImage('./photo.jpg', {
  description: 'Incident location'
});

console.log(result.url); // Public URL for the image
```

## Configuration

All scripts require environment variables to be set in `.env`:

```bash
# Required
ANTHROPIC_API_KEY=sk-ant-...
CLOUDFLARE_ACCOUNT_ID=...
CLOUDFLARE_API_TOKEN=...
CLOUDFLARE_R2_ACCESS_KEY_ID=...
CLOUDFLARE_R2_SECRET_ACCESS_KEY=...

# Optional
CLOUDFLARE_R2_BUCKET_NAME=police-misconduct
CLOUDFLARE_R2_PUBLIC_URL=https://files.yoursite.com
```

## Architecture

```
publish-draft.js (Main Orchestrator)
  ├── file-downloader.js
  │   └── Downloads from external URLs
  ├── cloudflare-stream.js
  │   └── Uploads videos
  ├── cloudflare-r2.js
  │   └── Uploads images/PDFs
  └── ai-prompts.js
      └── Generates content with AI
```

## Error Handling

All scripts include:
- Retry logic for API calls
- Detailed error messages
- Cleanup of temporary files
- Progress logging

## Extending the Workflow

### Add New Media Source

Edit `file-downloader.js` and add a converter function:

```javascript
function convertCustomServiceUrl(url) {
  // Transform share URL to direct download URL
  return url.replace('share.example.com', 'dl.example.com');
}
```

### Customize AI Prompts

Edit `ai-prompts.js` to modify how the AI analyzes and writes content:

```javascript
export function createCaseArticlePrompt(draftContent, mediaAnalysis, metadata) {
  return {
    system: "Your custom system prompt...",
    user: `Your custom user prompt...`
  };
}
```

### Add New Content Type

1. Create a new template in `/drafts/templates/`
2. Add detection logic in `publish-draft.js`
3. Create a new prompt in `ai-prompts.js`
4. Add content collection in `src/content/config.ts`

## Testing

Test individual components:

```bash
# Test file download
node -e "import('./file-downloader.js').then(m => m.downloadFile('URL', './test'))"

# Test video upload (requires downloaded file)
node -e "import('./cloudflare-stream.js').then(m => m.uploadVideo('./test.mp4'))"
```

## Performance

Typical processing times:
- File download: 30-60s per 50MB file
- Video upload to Stream: 1-2 minutes
- Image upload to R2: 5-10 seconds
- AI analysis: 30-60 seconds per item
- Article generation: 1-2 minutes

Total: **5-10 minutes** for a typical case with 2 videos, 3 images, 1 PDF.

## Troubleshooting

See [PUBLISHING.md](../PUBLISHING.md) for detailed troubleshooting guide.

Common issues:
- **Download fails**: Check URL is publicly accessible
- **Upload fails**: Verify Cloudflare credentials
- **AI fails**: Check Anthropic API key and credits
- **Git fails**: Manually commit the generated files

## Security

- Never commit `.env` file
- Keep API keys secure
- Rotate keys if compromised
- Monitor API usage and costs

## Dependencies

```json
{
  "@anthropic-ai/sdk": "^0.32.1",
  "@aws-sdk/client-s3": "^3.709.0",
  "form-data": "^4.0.1",
  "node-fetch": "^3.3.2",
  "dotenv": "^16.4.7"
}
```

Install with: `npm install`

---

For complete documentation, see [PUBLISHING.md](../PUBLISHING.md) and [QUICKSTART.md](../QUICKSTART.md).
