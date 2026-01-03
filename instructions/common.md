# Common Instructions for Content Creation

Read this file before working on any content (cases, posts, etc.). It covers shared utilities, components, and the metadata registry.

## Git Workflow

Work directly on `main` unless told otherwise. Commit when the article is complete using `/cm`.

---

## Interactive Workflow

This is a **conversational content creation process**. You are encouraged to:

### Ask Clarifying Questions
When information is ambiguous or unclear, ask before assuming:
- "Is 'COLA' referring to the County of Los Angeles?"
- "The notes mention the investigation cleared the officers - is that correct?"
- "I see 'moderate force' mentioned - should threat_level be 'Medium' or 'High'?"
- "The incident date says 'late October 2022' - do you have the exact date?"
- "Is [Agency Name] the same as [Similar Agency Name] in our registry?"

### Use Web Search When Helpful
You can search the web to:
- Verify facts about an incident
- Find additional context or developments
- Look up correct agency names or jurisdictions
- Find the exact date of an incident
- Check current investigation/legal status

Example: "Let me search for recent news on this case to see if there have been any legal developments..."

### Iterate on the Article
Content creation is iterative. After generating a draft:
- Ask if the user wants changes
- Accept feedback like "make section X shorter" or "add more detail about Y"
- Add/remove/move media as requested

---

## Media Upload Utilities

Use these CLI commands to upload media and get component snippets.

### Upload Video
```bash
npm run upload:video <url> [--caption "..."]
```
- Uploads to Cloudflare Stream
- Returns: `<CloudflareVideo videoId="..." caption="..." />`
- Handles Dropbox/Google Drive URLs automatically
- Checks for duplicates in media library

**Example:**
```bash
npm run upload:video "https://dropbox.com/bodycam.mp4" -- --caption "Bodycam footage of initial contact"
```

### Upload Image
```bash
npm run upload:image <url> --alt "..." [--caption "..."]
```
- Uploads to Cloudflare Images
- Returns: `<CloudflareImage imageId="..." alt="..." caption="..." />`
- `--alt` is required for accessibility

**Example:**
```bash
npm run upload:image "https://dropbox.com/scene.jpg" -- --alt "Intersection where incident occurred" --caption "Photo taken day after incident"
```

### Upload Document
```bash
npm run upload:document <url> --title "..." --description "..."
```
- Uploads to Cloudflare R2
- Returns: `<DocumentCard title="..." description="..." url="..." />`
- Both `--title` and `--description` are required

**Example:**
```bash
npm run upload:document "https://dropbox.com/complaint.pdf" -- --title "Civil Complaint" --description "Filed in U.S. District Court, Central District of California"
```

### Search Existing Media
```bash
npm run media:find "<search term>"
```
- Searches the media library by filename, description, tags
- Returns component snippets for matching items
- Use this to reuse previously uploaded media

**Example:**
```bash
npm run media:find "martinez bodycam"
```

### Generate External Link
```bash
npm run link:external <url> [--title "..."] [--description "..."] [--icon video|news|generic]
```
- No upload - just generates the component
- Icons: `video` (YouTube/Vimeo), `news` (news articles), `generic` (default)

**Example:**
```bash
npm run link:external "https://youtube.com/watch?v=abc" -- --title "News Coverage" --icon video
```

---

## Document Handling Best Practices

### PDFs Must Be Downloaded, Not Linked

**Always download and upload PDFs** to our R2 storage rather than linking to external sources. External PDF links break frequently when:
- Government agencies reorganize their websites
- News sites remove or archive old content
- Documents are moved or renamed

**Correct approach:**
```bash
npm run upload:document "https://example.gov/report.pdf" -- --title "Investigation Report" --description "..."
```

**Incorrect approach:**
```yaml
# DON'T do this - link will break eventually
external_links:
  - title: "Investigation Report"
    url: "https://example.gov/report.pdf"
```

### When to Use External Links vs Documents

| Content Type | Use | Why |
|--------------|-----|-----|
| PDFs, reports, court filings | `upload:document` → R2 | Permanent storage, won't break |
| News articles | `link:external` | Content too large to archive |
| YouTube/video platforms | `link:external` | Streaming content |
| Interactive web pages | `link:external` | Can't be downloaded |

### Link Validation

Run `npm run validate:links` periodically to check for broken external links. Results are stored in `data/link-status.json` and broken links are automatically hidden from display.

---

## MDX Components

### CloudflareVideo
```jsx
<CloudflareVideo videoId="uuid-here" caption="Optional caption" />
```
- `videoId` (required): Cloudflare Stream UUID
- `caption` (optional): Text displayed below video

### CloudflareImage
```jsx
<CloudflareImage imageId="uuid-here" alt="Description" caption="Optional caption" />
```
- `imageId` (required): Cloudflare Images UUID
- `alt` (required): Accessible description
- `caption` (optional): Text displayed below image

### DocumentCard
```jsx
<DocumentCard title="Document Title" description="What this document contains" url="https://..." />
```
- `title` (required): Short title (3-8 words)
- `description` (required): What the document contains (15-30 words)
- `url` (required): Public URL to the document

### ExternalLinkCard
```jsx
<ExternalLinkCard url="https://..." title="Link Title" description="Optional context" icon="news" />
```
- `url` (required): External URL
- `title` (optional): Falls back to hostname if omitted
- `description` (optional): Additional context
- `icon` (optional): `video`, `news`, or `generic` (default)

### Component Imports
At the top of MDX files, import only the components you use:
```jsx
import CloudflareImage from '../../components/CloudflareImage.astro';
import CloudflareVideo from '../../components/CloudflareVideo.astro';
import DocumentCard from '../../components/DocumentCard.astro';
import ExternalLinkCard from '../../components/ExternalLinkCard.astro';
```

---

## Metadata Registry

Location: `data/metadata-registry.json`

The registry maintains canonical values to ensure consistency across all content. **Always read this file before generating frontmatter.**

### What It Contains
- `agencies`: Police department names (canonical form)
- `counties`: California county names
- `force_types`: Types of force used (Shooting, Taser, Physical Force, etc.)
- `threat_levels`: Threat assessment categories
- `investigation_statuses`: Legal/investigation status values
- `case_tags`: Tags for case articles
- `post_tags`: Tags for blog posts

### How to Use It
1. **Read the registry** before generating frontmatter
2. **Match to canonical values** - if the notes say "LASD", use "Los Angeles County Sheriff's Department"
3. **Ask if unsure** - "Is 'Riverside PD' the same as 'Riverside Police Department' in our registry?"
4. **Add new values** when genuinely new (e.g., a new agency not yet in registry)

### Matching Examples
| Notes Say | Registry Has | Use |
|-----------|--------------|-----|
| "LAPD" | "Los Angeles Police Department" | "Los Angeles Police Department" |
| "Stanislaus Sheriff" | "Stanislaus County Sheriff's Department" | "Stanislaus County Sheriff's Department" |
| "shot by police" | force_types: ["Shooting", ...] | "Shooting" |

---

## Content Schema

Location: `src/content/config.ts`

This file defines the Zod schema for all content collections. Read it to understand:
- Required vs optional fields
- Field types (string, number, boolean, array, enum)
- Nested object structures (featured_image, documents, external_links)

Key points:
- `null` is valid for most optional fields
- Arrays can be empty `[]` or `null`
- Dates should be `YYYY-MM-DD` format or `null`

---

## Notes Files

For each article, maintain a companion notes file and reference it in frontmatter:

```
notes/cases/victim-name.md    # Notes for a case
notes/posts/article-slug.md   # Notes for a post
```

In the article frontmatter, add:
```yaml
notes_file: "notes/cases/victim-name.md"
```

The notes file contains:
- Original research/notes dump
- Source links and references
- Details cut from the article
- Edit history and decisions
- Context that might be useful later

This preserves context even after the article is published, allowing future edits with full background. The `notes_file` field makes it easy to find the notes from the article.

---

## File Locations

| Content | Location |
|---------|----------|
| Case articles | `src/content/cases/` |
| Blog posts | `src/content/posts/` |
| Case notes | `notes/cases/` |
| Post notes | `notes/posts/` |
| Media library | `data/media-library.json` |
| Metadata registry | `data/metadata-registry.json` |
| Content schema | `src/content/config.ts` |
