# AI Content Generation Workflow - Complete Guide

## 📋 Table of Contents

- [Overview](#overview)
- [Setup](#setup)
- [Workflow](#workflow)
- [Usage](#usage)
- [Advanced Features](#advanced-features)
- [Troubleshooting](#troubleshooting)
- [API Reference](#api-reference)

## 🎯 Overview

This automated content generation workflow allows you to:

1. **Draft** cases and blog posts using simple markdown templates
2. **Link** to external media files (Dropbox, Google Drive, etc.)
3. **Automatically** download, upload, and process media
4. **Generate** complete, publication-ready articles using AI
5. **Deploy** with a single command

### What Gets Automated

- ✅ Media file downloading from external URLs
- ✅ Video uploads to Cloudflare Stream
- ✅ Image/PDF uploads to Cloudflare R2
- ✅ AI analysis of video content (timestamps, warnings)
- ✅ AI analysis of PDF documents (key info extraction)
- ✅ Metadata generation (case IDs, tags, dates)
- ✅ Complete article writing with embedded media
- ✅ Git commits and deployment

## 🚀 Setup

### 1. Install Dependencies

```bash
npm install
```

This installs:
- `@anthropic-ai/sdk` - For AI content generation with Claude
- `@aws-sdk/client-s3` - For Cloudflare R2 uploads
- `form-data` & `node-fetch` - For Cloudflare Stream uploads
- `dotenv` - For environment configuration

### 2. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Then fill in your credentials in `.env`:

#### Anthropic Claude API Key
1. Go to https://console.anthropic.com/settings/keys
2. Create a new API key
3. Add to `.env`: `ANTHROPIC_API_KEY=sk-ant-...`

#### Cloudflare Account ID & API Token
1. Go to https://dash.cloudflare.com
2. Copy your Account ID from the sidebar
3. Create an API token with:
   - Stream:Edit permissions
   - Account Resources
4. Add to `.env`:
   ```
   CLOUDFLARE_ACCOUNT_ID=your-account-id
   CLOUDFLARE_API_TOKEN=your-api-token
   ```

#### Cloudflare R2 Credentials
1. Go to https://dash.cloudflare.com → R2
2. Create a new bucket named `police-misconduct` (or your preferred name)
3. Go to "Manage R2 API Tokens"
4. Create a token with "Object Read & Write" permissions
5. Add to `.env`:
   ```
   CLOUDFLARE_R2_ACCESS_KEY_ID=your-access-key
   CLOUDFLARE_R2_SECRET_ACCESS_KEY=your-secret-key
   CLOUDFLARE_R2_BUCKET_NAME=police-misconduct
   ```

#### (Optional) R2 Public URL
If you've configured a custom domain for your R2 bucket:
```
CLOUDFLARE_R2_PUBLIC_URL=https://files.yoursite.com
```

### 3. Verify Setup

Check that all credentials are configured:

```bash
node scripts/publish-draft.js
```

You should see the usage message. If you see warnings about missing credentials, check your `.env` file.

## 📝 Workflow

### Step-by-Step Process

```
┌─────────────────────────────────────────────────────────────┐
│ 1. CREATE DRAFT                                             │
│    - Use template from /drafts/templates/                   │
│    - Add case notes, metadata ideas, media URLs             │
│    - Save as draft-[name].md in /drafts/                    │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. RUN PUBLISH COMMAND                                      │
│    npm run publish:draft draft-[name].md                    │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. AUTOMATED PROCESSING                                     │
│    ├─ Extract URLs from draft                               │
│    ├─ Download all external files                           │
│    ├─ Upload videos → Cloudflare Stream                     │
│    ├─ Upload images/PDFs → Cloudflare R2                    │
│    ├─ AI analyzes videos (timestamps, warnings)             │
│    ├─ AI analyzes PDFs (extract key info)                   │
│    ├─ AI generates metadata (case ID, tags, etc.)           │
│    └─ AI writes complete article                            │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. SAVE & DEPLOY                                            │
│    ├─ Save article to /src/content/cases/ or /posts/        │
│    ├─ Move draft to /drafts/published/[date]-[slug].md      │
│    ├─ Git commit and push                                   │
│    └─ Netlify automatically deploys                         │
└─────────────────────────────────────────────────────────────┘
```

## 💻 Usage

### Creating a New Draft

#### For Cases:

```bash
cp drafts/templates/case-draft-template.md drafts/draft-john-doe-case.md
```

Edit the file and fill in:
- Basic information (victim name, date, location, agencies)
- Case summary/notes
- External media file URLs
- Special AI instructions
- Sources

#### For Blog Posts:

```bash
cp drafts/templates/blog-draft-template.md drafts/draft-qualified-immunity.md
```

Edit the file and fill in:
- Topic and outline
- Key points to cover
- External media URLs
- Special AI instructions

### Adding External Media URLs

Simply paste URLs in the appropriate sections:

```markdown
### Videos
https://www.dropbox.com/s/abc123/bodycam.mp4
https://drive.google.com/file/d/FILE_ID/view

### Images
https://example.com/photo1.jpg
https://example.com/photo2.png

### Documents (PDFs)
https://example.com/complaint.pdf
https://example.com/settlement.pdf
```

**Supported URL types:**
- ✅ Dropbox share links
- ✅ Google Drive share links
- ✅ Direct file URLs (any publicly accessible HTTP/HTTPS URL)

### Publishing a Draft

```bash
npm run publish:draft draft-john-doe-case.md
```

The script will:
1. Show progress for each step
2. Download and process all media
3. Generate the article
4. Save and commit everything
5. Display the final URL

Example output:
```
🚀 Starting draft publishing workflow...

Draft: draft-john-doe-case.md
Content Type: case

📋 Extracting media URLs...
   Found: 2 videos, 3 images, 1 documents

📹 Processing video: https://dropbox.com/...
   ↳ Using direct URL: https://dl.dropboxusercontent.com/...
   ✓ Downloaded: bodycam-footage.mp4 (45.23 MB)
   ↳ Uploading to Cloudflare Stream...
   ↳ Analyzing with AI...
   ✓ Video processed: abc123xyz

[... more processing ...]

🤖 Generating article with AI...
   ✓ Metadata extracted
   ✓ Article generated
   Generated slug: john-doe-lapd-excessive-force

💾 Saving article to: /src/content/cases/john-doe-lapd-excessive-force.mdx
📦 Archiving draft to: /drafts/published/2025-11-13-john-doe-lapd-excessive-force.md

📤 Committing to Git...
   ✓ Pushed to GitHub (Netlify deploy triggered)

✅ Publishing complete!

Published article: /src/content/cases/john-doe-lapd-excessive-force.mdx
Archived draft: /drafts/published/2025-11-13-john-doe-lapd-excessive-force.md

View at: /cases/john-doe-lapd-excessive-force
```

### Quality Control Checklist

After publishing, review the generated article:

- [ ] Metadata is accurate (dates, names, agencies)
- [ ] Videos are embedded correctly with appropriate captions
- [ ] Images have descriptive alt text
- [ ] Content warnings are present if needed
- [ ] Timeline is chronologically accurate
- [ ] Sources are properly cited
- [ ] Links to related cases are relevant
- [ ] No AI hallucinations or factual errors

To edit: Simply open the generated MDX file in `/src/content/cases/` or `/src/content/posts/` and make corrections.

## 🔧 Advanced Features

### Custom AI Instructions

Add specific guidance in your draft:

```markdown
## Special Instructions for AI

- Focus on the legal implications of qualified immunity
- Emphasize the timeline of events
- Include content warning for graphic violence
- Link to related case: george-floyd
- Tone: analytical and educational
```

### Manual Metadata Override

If the AI doesn't generate correct metadata, you can specify it in your draft:

```markdown
## Metadata Suggestions

**Potential case_id:** ca-lapd-2023-042
**Severity:** critical
**Outcome:** Settled for $2.5M
**Featured:** true
```

### Video Analysis Customization

Guide the AI's video analysis:

```markdown
**AI Instructions for Videos:**
- Focus on the first 3 minutes
- Note all verbal exchanges
- Identify when force escalates
- Extract officer badge numbers if visible
```

### Document Analysis Customization

Guide PDF analysis:

```markdown
**AI Instructions for Documents:**
- Extract settlement amount from page 12
- Focus on allegations in section III
- Note the statute of limitations discussion
```

## 🐛 Troubleshooting

### "Download failed with status 403"

**Problem:** The external URL requires authentication or has access restrictions.

**Solutions:**
1. Check if the Dropbox/Drive link is set to "Anyone with the link can view"
2. Try downloading the file manually and uploading to a public hosting service
3. Use a direct file URL instead of a share link

### "Cloudflare Stream upload failed"

**Problem:** Invalid credentials or API permissions.

**Solutions:**
1. Verify `CLOUDFLARE_ACCOUNT_ID` is correct
2. Check that `CLOUDFLARE_API_TOKEN` has Stream:Edit permissions
3. Ensure your Cloudflare account has Stream enabled

### "R2 upload failed"

**Problem:** Invalid R2 credentials or bucket configuration.

**Solutions:**
1. Verify bucket name matches `CLOUDFLARE_R2_BUCKET_NAME`
2. Check R2 API token has Object Read & Write permissions
3. Ensure bucket exists in your Cloudflare account

### "Claude API failed"

**Problem:** API key issues or rate limiting.

**Solutions:**
1. Verify `ANTHROPIC_API_KEY` is valid
2. Check your Anthropic account has available credits
3. If rate limited, wait a few minutes and try again
4. The script automatically retries 3 times with backoff

### "Could not extract JSON from AI response"

**Problem:** AI returned malformed output.

**Solutions:**
1. Check the console output for the raw AI response
2. The AI occasionally returns explanatory text - try running again
3. You may need to manually edit the generated article
4. Consider adjusting the prompt in `scripts/ai-prompts.js`

### Git operations failed

**Problem:** Git push failed (common with authentication issues).

**Solutions:**
1. The article was still saved successfully
2. Manually commit and push:
   ```bash
   git add .
   git commit -m "Publish: [article name]"
   git push
   ```

## 📚 API Reference

### File Downloader (`file-downloader.js`)

```javascript
import { downloadFile, downloadFiles, extractUrlsFromMarkdown } from './scripts/file-downloader.js';

// Download single file
await downloadFile(url, outputDir, optionalFilename);

// Download multiple files
await downloadFiles([url1, url2], outputDir);

// Extract URLs from markdown
const urls = extractUrlsFromMarkdown(markdownContent);
```

### Cloudflare Stream (`cloudflare-stream.js`)

```javascript
import { uploadVideo, uploadVideoFromUrl } from './scripts/cloudflare-stream.js';

// Upload local video file
const result = await uploadVideo(filePath, { name: 'Video title' });
// Returns: { videoId, embedUrl, streamUrl, thumbnailUrl }

// Upload from URL
const result = await uploadVideoFromUrl(url, { name: 'Video title' });
```

### Cloudflare R2 (`cloudflare-r2.js`)

```javascript
import { uploadImage, uploadPDF, uploadToR2 } from './scripts/cloudflare-r2.js';

// Upload image
const result = await uploadImage(filePath, { description: 'Photo description' });
// Returns: { url, key, bucket, contentType }

// Upload PDF
const result = await uploadPDF(filePath, { title: 'Document title' });

// Generic upload
const result = await uploadToR2(filePath, { folder: 'custom-folder' });
```

### AI Prompts (`ai-prompts.js`)

```javascript
import { 
  createVideoAnalysisPrompt,
  createMetadataExtractionPrompt,
  createCaseArticlePrompt 
} from './scripts/ai-prompts.js';

// All functions return { system, user } prompt objects
const prompt = createVideoAnalysisPrompt(metadata);
```

## 📊 Workflow Metrics

Expected processing times (approximate):

- Draft parsing: < 1 second
- Video download (50MB): 30-60 seconds
- Video upload to Stream: 1-2 minutes
- Image download/upload: 5-10 seconds each
- PDF analysis: 30-60 seconds
- Article generation: 1-2 minutes

**Total time for typical case:** 5-10 minutes

## 🎯 Best Practices

### 1. Start Simple
Begin with cases that have:
- 1-2 videos
- A few images
- 1-2 documents
This helps you learn the workflow.

### 2. Organize Your Files
Keep source files organized in Dropbox/Drive by case:
```
/Cases/
  /john-doe-lapd-2023/
    bodycam-1.mp4
    bodycam-2.mp4
    complaint.pdf
    settlement.pdf
```

### 3. Review Before Publishing
The AI is powerful but not perfect. Always:
- Fact-check dates and names
- Verify dollar amounts
- Check embedded media captions
- Read the full article

### 4. Iterate on Prompts
If the AI consistently misses something:
- Update the prompts in `scripts/ai-prompts.js`
- Add more specific instructions in your drafts
- Provide examples in the "Special Instructions" section

### 5. Track Your Work
Use the draft templates' "Notes / To Do" section:
```markdown
## Notes / To Do
- [ ] Verify officer badge numbers
- [ ] Confirm settlement amount
- [ ] Check if case is still under seal
- [ ] Review for legal accuracy
```

## 🔐 Security Notes

### Environment Variables
- Never commit `.env` to Git (it's in `.gitignore`)
- Keep API keys secure
- Rotate keys if compromised

### Sensitive Content
- The workflow handles sensitive police misconduct content
- Ensure your Cloudflare Stream videos have appropriate privacy settings
- Consider adding password protection for graphic content

### API Costs
Monitor your usage:
- **Anthropic Claude:** ~$0.15-0.60 per article (Claude Sonnet 4)
- **Cloudflare Stream:** $1 per 1000 minutes stored
- **Cloudflare R2:** $0.015 per GB stored

## 📞 Support

If you encounter issues not covered here:

1. Check the console output for detailed error messages
2. Review the generated files in `/drafts/published/`
3. Examine the Claude API logs for prompt/response issues
4. Test individual components (download, upload, AI) separately

---

**Next Steps:**
1. Set up your environment (`.env`)
2. Create your first draft using a template
3. Run the publishing script
4. Review and iterate!

Happy publishing! 🚀
