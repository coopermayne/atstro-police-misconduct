# Editing Published Articles

This guide explains how to edit existing articles and add media files to them.

## Quick Reference

- **Simple text edits**: Edit MDX files directly in `src/content/cases/` or `src/content/posts/`
- **Adding media**: Use the media library CLI to upload and get component code
- **Preview changes**: Run `npm run dev` and view at `http://localhost:4321`

---

## Editing Text Content

Published articles are stored as MDX files:
- Cases: `src/content/cases/[slug].mdx`
- Blog posts: `src/content/posts/[slug].mdx`

Simply open the file and edit the content. Changes will appear immediately in dev mode.

---

## Adding Media to Existing Articles

### Step 1: Upload Media to Library

Use the media library CLI to upload your media file. This ensures the file is properly hosted on Cloudflare and tracked for reuse.

#### Upload an Image

```bash
node scripts/media-library.js add-image "https://example.com/photo.jpg" \
  --description "Photo of incident scene" \
  --alt "Police officers at incident location" \
  --tags "evidence,photos"
```

**Output:**
```
✅ Image added to library
   Asset ID: image-abc123-uuid
   Image ID: xyz789-cloudflare-id

📝 MDX code:
<CloudflareImage imageId="xyz789-cloudflare-id" alt="Police officers at incident location" />
```

#### Upload a Video

```bash
node scripts/media-library.js add-video "https://dropbox.com/.../bodycam.mp4" \
  --description "Body camera footage from incident" \
  --title "Body Camera - Officer Smith" \
  --tags "bodycam,evidence"
```

**Output:**
```
✅ Video added to library
   Asset ID: video-def456-uuid
   Video ID: abc123-cloudflare-id

📝 MDX code:
<CloudflareVideo videoId="abc123-cloudflare-id" title="Body Camera - Officer Smith" />
```

#### Upload a Document (PDF)

```bash
node scripts/media-library.js add-document "https://example.gov/report.pdf" \
  --description "Official police report" \
  --link-text "View Police Report (PDF)" \
  --tags "documents,reports"
```

**Output:**
```
✅ Document added to library
   Asset ID: document-ghi789-uuid
   R2 URL: https://pub-xyz.r2.dev/report-20251114.pdf

📝 MDX code:
[View Police Report (PDF)](https://pub-xyz.r2.dev/report-20251114.pdf)
```

### Step 2: Copy the MDX Code

The CLI automatically outputs the exact MDX code you need. Copy this code snippet.

### Step 3: Edit Your Article

Open the article file you want to edit:

```bash
# For cases
code src/content/cases/john-smith.mdx

# For blog posts
code src/content/posts/qualified-immunity-history-explained.mdx
```

### Step 4: Add Component Imports (If Needed)

At the top of the MDX file, ensure you have the necessary component imports:

```jsx
---
// ... frontmatter ...
---

import CloudflareImage from '../../components/CloudflareImage.astro';
import CloudflareVideo from '../../components/CloudflareVideo.astro';
```

These imports should already exist in published articles. If not, add them right after the frontmatter.

### Step 5: Paste the Component Code

Paste the MDX code wherever you want the media to appear in your article:

```jsx
## Incident Details

The traffic stop occurred on June 15, 2023 in South Los Angeles.

<CloudflareImage imageId="xyz789-cloudflare-id" alt="Police officers at incident location" />

Body camera footage shows the interaction escalating rapidly...

<CloudflareVideo videoId="abc123-cloudflare-id" title="Body Camera - Officer Smith" />
```

### Step 6: Save and Preview

1. Save the file
2. Run `npm run dev` if not already running
3. Open your browser to `http://localhost:4321`
4. Navigate to your article to see the changes

---

## Advanced: Component Options

### CloudflareImage Options

```jsx
<CloudflareImage 
  imageId="xyz789-cloudflare-id" 
  alt="Description for accessibility"
  caption="Optional caption text that appears below image"
/>
```

### CloudflareVideo Options

```jsx
<CloudflareVideo 
  videoId="abc123-cloudflare-id"
  title="Optional video title"
/>
```

### Image Captions

Add a caption by including the `caption` attribute:

```jsx
<CloudflareImage 
  imageId="xyz789" 
  alt="Scene photo"
  caption="Photo taken at 2:45 PM by witness"
/>
```

---

## Reusing Media from Library

If you've already uploaded media and want to use it in another article:

### Search the Library

```bash
# Search by keyword
node scripts/media-library.js search bodycam

# Search by tag
node scripts/media-library.js search evidence

# List all media
node scripts/media-library.js list

# List only videos
node scripts/media-library.js list --type videos
```

### Get the Code for an Asset

Once you find the asset you want, get its MDX code:

```bash
node scripts/media-library.js get-code video-abc123-uuid
```

Then paste the code into your article as described above.

---

## Editing Frontmatter

The frontmatter (YAML section at the top) contains metadata. You can edit these fields directly:

### Case Frontmatter

```yaml
---
case_id: "ca-lapd-2023-001"
title: "John Smith"
description: "Brief description of the case"
incident_date: "2023-06-15"
published: true
featured_image: "cloudflare-image-id"  # Optional
city: "Los Angeles"
county: "Los Angeles County"
age: 35
agencies: ["LAPD"]
bodycam_available: true
civil_lawsuit_filed: true
investigation_status: "Closed"  # Optional
documents: [
  {
    title: "Police Report",
    description: "Official report",
    url: "https://pub-xyz.r2.dev/report.pdf"
  }
]
---
```

### Blog Post Frontmatter

```yaml
---
title: "Understanding Qualified Immunity"
description: "A comprehensive guide to qualified immunity in police misconduct cases"
published_date: "2024-11-14"
published: true
tags: ["legal", "qualified-immunity", "civil-rights"]
featured_image: "cloudflare-image-id"  # Optional
---
```

---

## Adding Documents to Frontmatter

Documents appear in a special section at the bottom of case pages. Add them to the `documents` array in frontmatter:

```yaml
documents: [
  {
    title: "Police Report",
    description: "Official incident report filed by LAPD",
    url: "https://pub-xyz.r2.dev/police-report-20251114.pdf"
  },
  {
    title: "Court Complaint",
    description: "Civil rights lawsuit filed under 42 USC § 1983",
    url: "https://pub-xyz.r2.dev/complaint-20251114.pdf"
  }
]
```

Get document URLs by uploading to the media library or checking existing entries.

---

## Tips & Best Practices

### 1. Use Descriptive Alt Text

Always provide meaningful alt text for images for accessibility:

```jsx
<!-- ❌ Bad -->
<CloudflareImage imageId="xyz" alt="image" />

<!-- ✅ Good -->
<CloudflareImage imageId="xyz" alt="Wide shot of incident scene showing three police vehicles and officers" />
```

### 2. Add Captions for Context

Use captions to provide additional context that isn't appropriate for alt text:

```jsx
<CloudflareImage 
  imageId="xyz" 
  alt="Officer's body camera view of traffic stop"
  caption="Timestamp shows incident occurred at 8:47 PM on June 15, 2023"
/>
```

### 3. Tag Media for Easy Discovery

Use consistent, descriptive tags when uploading:

```bash
--tags "bodycam,evidence,smith-case"
```

This makes it easy to find related media later when editing other articles.

### 4. Keep Media Library Organized

- **Description**: Brief summary of what the media shows
- **Alt text**: Accessibility description of visual content
- **Title**: Descriptive title for videos
- **Tags**: Categories for searching

### 5. Preview Before Publishing

Always preview your changes locally with `npm run dev` before committing:
1. Check that media loads correctly
2. Verify formatting looks good
3. Test on both light and dark modes
4. Check mobile responsiveness

---

## Troubleshooting

### Media Not Displaying

1. **Check component imports**: Ensure CloudflareImage/CloudflareVideo are imported
2. **Verify IDs**: Double-check the imageId or videoId is correct
3. **Check dev server**: Make sure `npm run dev` is running
4. **Clear browser cache**: Hard refresh with Ctrl+Shift+R (Cmd+Shift+R on Mac)

### Media Library Commands Not Working

1. **Check you're in project root**: Run commands from `/workspaces/atstro-police-misconduct/`
2. **Verify credentials**: Ensure Cloudflare credentials are set in `.env` file
3. **Check Node version**: Requires Node.js 18 or higher

### Finding Existing Media

```bash
# Search by filename or description
node scripts/media-library.js search "smith"

# List everything
node scripts/media-library.js list
```

---

## Example: Complete Editing Workflow

Let's walk through adding a new image to an existing case:

```bash
# 1. Upload image to library
node scripts/media-library.js add-image "https://example.com/evidence.jpg" \
  --description "Evidence photo from scene" \
  --alt "Close-up of damaged vehicle door" \
  --tags "evidence,photos,smith-case"

# Output shows:
# <CloudflareImage imageId="abc123xyz" alt="Close-up of damaged vehicle door" />

# 2. Open the article
code src/content/cases/john-smith.mdx

# 3. Add the component where you want it (in the file):
```

```jsx
## Physical Evidence

The incident resulted in significant property damage.

<CloudflareImage 
  imageId="abc123xyz" 
  alt="Close-up of damaged vehicle door"
  caption="Damage to victim's vehicle door from forcible extraction"
/>

This evidence was presented during the civil trial...
```

```bash
# 4. Save and preview
# Dev server auto-reloads at http://localhost:4321/cases/john-smith

# 5. Commit when satisfied
git add src/content/cases/john-smith.mdx
git commit -m "Add evidence photo to John Smith case"
git push
```

Done! Your changes will automatically deploy to Netlify.

---

## Quick Command Reference

```bash
# Upload media
node scripts/media-library.js add-image <url> [options]
node scripts/media-library.js add-video <url> [options]
node scripts/media-library.js add-document <url> [options]

# Search library
node scripts/media-library.js search <keyword>
node scripts/media-library.js list [--type videos|images|documents]

# Get component code
node scripts/media-library.js get-code <asset-id>

# Preview site
npm run dev

# Build for production
npm run build
```

---

## Need Help?

- Check the media library: `node scripts/media-library.js` (shows all commands)
- See available components: Look in `src/components/`
- View schema: `src/content/config.ts` for frontmatter field definitions
