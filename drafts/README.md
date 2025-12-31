# Drafts System

## How It Works

Write your notes in a draft file. The AI will **completely rewrite** your content into a polished, publication-ready article. You don't need to worry about structure, formatting, or MDX syntax—just get the information down.

## Quick Start

### Creating a Case

1. **Create your draft:**
   ```bash
   cp drafts/cases/TEMPLATE.md_template drafts/cases/victim-name.md
   ```

2. **Write the facts:**
   - Victim info (name, age, date, location, agency)
   - What happened (timeline, force used, officers involved)
   - Legal details (case number, status, settlement)
   - Background on the victim (optional)

3. **Add media URLs** with brief descriptions:
   ```
   https://dropbox.com/bodycam.mp4
   Body camera footage of the incident

   https://example.com/complaint.pdf
   Civil rights complaint filed by family
   ```

4. **Publish:**
   ```bash
   npm run publish
   ```

The AI will generate an **encyclopedic article** (Wikipedia-style: neutral, factual, no emotional language) with sections like "Background", "The Incident", "Investigation and Legal Proceedings".

### Creating a Blog Post

1. **Create your draft:**
   ```bash
   cp drafts/posts/TEMPLATE.md_template drafts/posts/topic-name.md
   ```

2. **Write your content:**
   - Topic (one-line description)
   - Key points (paragraphs, bullet points, research notes)
   - Suggested tags

3. **Add media URLs** (same as cases)

4. **Publish:**
   ```bash
   npm run publish
   ```

The AI will generate an **engaging article** with proper section headings and a "Key Takeaways" section with 3-5 bullet points.

## Folder Structure

```
drafts/
├── cases/                    # Case drafts
│   ├── TEMPLATE.md_template  # Copy to start new cases
│   └── *.md                  # Your draft files
├── posts/                    # Blog post drafts
│   ├── TEMPLATE.md_template  # Copy to start new posts
│   └── *.md                  # Your draft files
└── published/                # Archived drafts (auto-moved after publishing)
```

## What the AI Does

When you run `npm run publish`, the AI:

1. **Extracts metadata** from your notes:
   - Case: victim name, age, gender (from pronouns), agencies, force type, threat level, investigation status, etc.
   - Post: title, description, tags

2. **Downloads and uploads media:**
   - Videos → Cloudflare Stream
   - Images → Cloudflare Images
   - PDFs → Cloudflare R2

3. **Rewrites the content:**
   - Reorganizes for best narrative flow
   - Creates appropriate section headings
   - Integrates media throughout the article
   - Cases: encyclopedic tone, no emotional language
   - Posts: engaging tone, includes Key Takeaways

4. **Generates the MDX file** with proper frontmatter and saves to `src/content/`

## Tips

### What to Include

**Cases** - focus on facts:
- Incident timeline and details
- Force used and circumstances
- Legal case information
- Officer names if known
- Victim background (humanizes the case)

**Posts** - focus on substance:
- Main arguments and explanations
- Examples and evidence
- Key points you want covered
- Tone guidance in Notes section

### What NOT to Include

- Section headings (AI creates these)
- Key Takeaways (AI adds this for posts)
- Introduction/conclusion structure
- MDX component syntax
- Formatting or styling

### Media

Just paste URLs with a brief description of what each file is:
```
https://youtube.com/watch?v=abc123
News coverage of the incident

https://dropbox.com/document.pdf
DA report on the shooting (featured: true for images)
```

The AI figures out file types and places media appropriately in the article.

### Reusing Already-Uploaded Media

The media library prevents duplicate uploads. To reuse media from a previous article:

1. Run `npm run media:browse` to open the visual browser
2. Find the media you want to reuse
3. Copy the **original source URL** (shown in the media details)
4. Paste that URL in your new draft

The system recognizes the URL is already in the library and reuses the existing upload instead of downloading again. This works for any URL that was previously processed.

### Content Type Detection

The folder determines the content type:
- `drafts/cases/*.md` → Case article (encyclopedic)
- `drafts/posts/*.md` → Blog post (engaging + Key Takeaways)

## Browse Existing Media

To find already-uploaded media:
```bash
npm run media:browse
```

Opens a visual browser at http://localhost:3001 where you can search and copy component codes.
