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

### Quick Start Summary

**Draft content anywhere** → **Open GitHub Codespace** → **Run publish script** → **Live on site**

That's it! The entire workflow is designed for ease of use.

### Step-by-Step Process

```
┌─────────────────────────────────────────────────────────────┐
│ 1. CREATE DRAFT (Anywhere)                                  │
│    - Draft in Notes, Google Docs, or markdown editor        │
│    - Use template structure from /drafts/templates/         │
│    - Add case notes, metadata ideas, media URLs             │
│    - No need for GitHub yet - just write!                   │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. OPEN CODESPACE                                           │
│    - Go to GitHub repo                                      │
│    - Click Code → Codespaces → Create/Open                  │
│    - Wait ~30-60 seconds for environment to load            │
│    - Your dev environment is ready!                         │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. ADD DRAFT TO REPO                                        │
│    - Copy your draft markdown                               │
│    - Create file in /drafts/cases/ or /drafts/posts/        │
│    - Name it descriptively (e.g., john-doe-case.md)         │
│    - Paste content and save                                 │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. RUN PUBLISH COMMAND                                      │
│    npm run publish:draft                                    │
│    - Shows numbered list of available drafts                │
│    - Select number (1, 2, 3, etc.)                          │
│    - Press Enter                                            │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. VALIDATION CHECKPOINT                                    │
│    - AI analyzes draft for completeness                     │
│    - Shows validation report:                               │
│      • Featured image status                                │
│      • Missing critical info (stops if found)               │
│      • Missing helpful info (warnings only)                 │
│      • Suggestions for improvement                          │
│    - You review and decide: proceed or cancel?              │
│    - Type 'yes' to continue, anything else to cancel        │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. AUTOMATED PROCESSING                                     │
│    ├─ Extract URLs from draft                               │
│    ├─ Download all external files                           │
│    ├─ Upload videos → Cloudflare Stream                     │
│    ├─ Upload images → Cloudflare Images                     │
│    ├─ Upload PDFs → Cloudflare R2                           │
│    ├─ AI generates metadata (case ID, tags, etc.)           │
│    └─ AI writes complete article                            │
│    (You watch progress in real-time)                        │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. SAVE & DEPLOY                                            │
│    ├─ Save article to /src/content/cases/ or /posts/        │
│    ├─ Archive draft to /drafts/published/[date]-[slug].md   │
│    ├─ Git commit and push                                   │
│    └─ Netlify automatically deploys (2-3 minutes)           │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 8. DONE!                                                    │
│    - Article live on site                                   │
│    - Draft archived for reference                           │
│    - Close Codespace (or leave open for next time)          │
└─────────────────────────────────────────────────────────────┘
```

### Why This Workflow Works

**✅ Flexible Drafting**: Write anywhere, anytime. Use your favorite tools.

**✅ No Local Setup**: GitHub Codespaces handles all dependencies and environment.

**✅ Interactive**: You review and approve before publishing - not fully automated.

**✅ Fast**: Active time is ~2 minutes. Automation handles the rest.

**✅ Safe**: Validation catches issues before you waste time processing media.

**✅ Reversible**: Draft is archived, you can always edit the published MDX file.

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

#### Interactive Mode (Recommended)

Simply run:
```bash
npm run publish:draft
```

You'll see a numbered list of all available drafts:
```
📝 Available drafts:

  1. 📋 cases/john-doe-case.md
  2. 📋 cases/sarah-johnson-case.md
  3. 📰 posts/qualified-immunity-explained.md

Select a draft to publish (enter number): 
```

Type the number and press Enter. The script handles the rest!

#### Direct Mode (Optional)

If you know the exact filename:
```bash
npm run publish:draft cases/john-doe-case.md
```

#### What Happens Next

The script will:
1. Validate draft completeness (with interactive review)
2. Show progress for each step
3. Download and process all media
4. Generate the article with AI
5. Save and commit everything
6. Display the final URL

Example output:
```
📝 Available drafts:

  1. 📋 cases/john-doe-case.md

Select a draft to publish (enter number): 1

✅ Selected: cases/john-doe-case.md

🚀 Starting draft publishing workflow...

Draft: cases/john-doe-case.md

Content Type: case

🔍 Validating draft completeness...

═══════════════════════════════════════════════════════════
                    DRAFT VALIDATION REPORT
═══════════════════════════════════════════════════════════

✅ Featured image: Found
✅ All critical information present

ℹ️  MISSING HELPFUL INFORMATION:
   • Victim's age
   • Race/ethnicity

💡 SUGGESTIONS FOR IMPROVEMENT:
   • Consider adding demographic details for context
   • Include officer names if available in source documents

═══════════════════════════════════════════════════════════

Review the validation report above.
This is your last chance to cancel and make changes.

Do you want to proceed with publishing? (yes/no): yes

✅ Proceeding with publishing...

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

### 1. Draft Organization

**Create drafts in the right folder:**
- Cases → `/drafts/cases/`
- Blog posts → `/drafts/posts/`
- Use descriptive filenames: `john-doe-lapd-2023.md` (not `draft1.md`)

**Why it matters:** The publish script automatically detects content type from the folder, and organized files make it easier to find drafts later.

### 2. Pre-Publishing Checklist

Before running the publish script, ensure your draft has:
- [ ] Victim/subject name clearly stated
- [ ] Incident date (at least month/year)
- [ ] City and county/state
- [ ] Police agency/department name
- [ ] At least one featured image URL (highly recommended)
- [ ] Basic incident summary or notes

**Why it matters:** The validation step will catch missing critical info, but having this ready saves time.

### 3. Use the Validation Checkpoint Wisely

When you see the validation report:
- **Read it carefully** - AI might spot gaps you missed
- **Cancel if needed** - No penalty for going back to add more info
- **Featured image matters** - Cases/posts with images get more visibility
- **Optional fields are optional** - Don't feel pressured to have everything

**Why it matters:** This is your safety net. Use it to ensure quality before spending time on media processing.

### 4. Media File Management

**Organize source files by case:**
```
Dropbox/Cases/
  /john-doe-lapd-2023/
    bodycam-1.mp4
    bodycam-2.mp4
    photos/
      scene-photo-1.jpg
      evidence-photo.jpg
    documents/
      complaint.pdf
      settlement.pdf
```

**Share settings:**
- Set Dropbox/Drive links to "Anyone with link can view"
- Test links in incognito/private browsing
- Use direct download links when possible

**Why it matters:** Broken links waste time during processing. Good organization makes it easy to find files months later.

### 5. Review After Publishing

The AI generates high-quality content but isn't perfect. After publishing, check:
- [ ] Dates are accurate (incident date, filing dates, etc.)
- [ ] Names are spelled correctly
- [ ] Dollar amounts are correct
- [ ] Embedded videos have appropriate captions
- [ ] Content warnings are present if needed
- [ ] No factual hallucinations

**Where to edit:** Published files are in `/src/content/cases/` or `/src/content/posts/` as `.mdx` files. Just edit and commit like any other file.

**Why it matters:** Published content represents your research. Small errors undermine credibility.

### 6. Iterate on AI Instructions

If the AI consistently misses something or makes the same mistake:
- Add specific instructions in your draft's "Special Instructions" section
- Update the system prompts in `scripts/ai-prompts.js`
- Provide examples of what you want

**Example:**
```markdown
## Special Instructions for AI

- Always include content warning for videos showing use of force
- Link to related cases when the same agency is involved
- Emphasize legal precedents, not just facts
- Use analytical tone, not sensational
```

**Why it matters:** The AI learns from your instructions. Better prompts = better articles.

### 7. Keep Drafts Simple

**Start with:**
- 1-2 videos max
- A few images
- 1-2 PDFs
- Basic incident notes

**Why it matters:** Simpler drafts process faster and help you learn the workflow. You can always edit the published article to add more media later.

### 8. Use GitHub Codespaces Efficiently

**Keep it open:** Codespaces stay alive for a while after you close the browser. Reopen within a few hours and it's instant.

**Process multiple drafts:** If you have several ready, process them all in one session.

**Free tier limits:** 60 hours/month free. Each publishing session uses ~10-30 minutes of compute time.

**Why it matters:** Starting/stopping Codespaces wastes time. Batch your work for efficiency.

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

## 🎓 Learning Path

### First Time Publishing

1. **Read this entire document** (you're almost done!)
2. **Verify setup:** Run `npm run publish:draft` to check environment
3. **Start with a simple case:**
   - Copy template: `cp drafts/templates/case-draft-template.md drafts/cases/test-case.md`
   - Fill in minimal info (name, date, city, agency)
   - Add 1 image URL and 1 video URL
   - Don't worry about perfection
4. **Run publish:** `npm run publish:draft`
5. **Review validation report** carefully
6. **Watch the automation** work its magic
7. **Check the published article** at the URL shown
8. **Edit if needed** - the MDX file is in `/src/content/cases/`

### After Your First Success

1. **Try a blog post** using the blog template
2. **Add more media** to test Cloudflare uploads
3. **Experiment with AI instructions** in drafts
4. **Review archived drafts** in `/drafts/published/` to see what worked

### Become a Pro

1. **Customize AI prompts** in `scripts/ai-prompts.js`
2. **Create your own templates** for specific case types
3. **Build a library** of reusable media (agency logos, maps, etc.)
4. **Document patterns** - what makes a good article?

---

## 📞 Quick Reference Card

```
┌─────────────────────────────────────────────────────────┐
│ CONTENT CREATION QUICK REFERENCE                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ 1. Draft anywhere → Copy to /drafts/cases/ or /posts/  │
│                                                          │
│ 2. Open GitHub Codespace                                │
│                                                          │
│ 3. npm run publish:draft                                │
│                                                          │
│ 4. Select number → Review validation → Type 'yes'       │
│                                                          │
│ 5. Wait 5-10 minutes → Article published!               │
│                                                          │
├─────────────────────────────────────────────────────────┤
│ FILES                                                    │
│  Templates:     /drafts/templates/                      │
│  Your drafts:   /drafts/cases/ or /drafts/posts/        │
│  Published:     /src/content/cases/ or /posts/          │
│  Archived:      /drafts/published/                      │
│                                                          │
├─────────────────────────────────────────────────────────┤
│ REQUIRED IN DRAFT                                        │
│  ✓ Victim/subject name                                  │
│  ✓ Incident date                                        │
│  ✓ City & county                                        │
│  ✓ Agency name                                          │
│  ✓ Basic incident summary                               │
│                                                          │
├─────────────────────────────────────────────────────────┤
│ RECOMMENDED                                              │
│  ✓ Featured image URL                                   │
│  ✓ Demographics (age, race, gender)                     │
│  ✓ Media files (videos, PDFs)                           │
│  ✓ Source citations                                     │
│                                                          │
├─────────────────────────────────────────────────────────┤
│ TROUBLESHOOTING                                          │
│  Media download failed?  → Check share link permissions │
│  Validation failed?      → Add missing critical info    │
│  Bad AI output?          → Edit the published MDX file  │
│  Git push failed?        → Manually commit/push         │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Next Steps:**
1. Verify your environment is set up (`.env` file)
2. Create your first draft using a template
3. Run the publish script and follow the prompts
4. Review the published article and edit if needed
5. Iterate and improve!

Happy publishing! 🚀
