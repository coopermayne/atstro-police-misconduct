# Cloudflare Upload Services

This folder contains modules for uploading media assets to Cloudflare services.

## Files

- **`cloudflare-images.js`** - Uploads images to Cloudflare Images with automatic optimization
- **`cloudflare-r2.js`** - Uploads images and PDFs to Cloudflare R2 object storage
- **`cloudflare-stream.js`** - Uploads videos to Cloudflare Stream for adaptive streaming

## Usage

These modules are typically called by `publish-draft.js` during the publishing workflow, but can also be used independently:

```javascript
import { uploadImage } from './cloudflare-images.js';
import { uploadPDF } from './cloudflare-r2.js';
import { uploadVideo } from './cloudflare-stream.js';
```

## Configuration

All modules require environment variables:

```bash
CLOUDFLARE_ACCOUNT_ID=...
CLOUDFLARE_API_TOKEN=...
CLOUDFLARE_R2_ACCESS_KEY_ID=...
CLOUDFLARE_R2_SECRET_ACCESS_KEY=...
CLOUDFLARE_R2_BUCKET_NAME=...
CLOUDFLARE_R2_PUBLIC_URL=...
```

See [CLOUDFLARE-SETUP.md](../../CLOUDFLARE-SETUP.md) for detailed setup instructions.
