# Drafts System

## Quick Start

### Creating a Case

1. **Create your draft:**
   ```bash
   cp drafts/cases/TEMPLATE.md drafts/cases/my-case-name.md
   ```

2. **Add your notes** - write in ANY format:
   - Bullet points
   - Paragraphs
   - Lists of links
   - Copy-pasted text
   - Whatever is easiest!

3. **Paste media URLs:**
   - Body camera videos (YouTube, Dropbox, direct links)
   - Photos (any public image URL)
   - PDFs (court documents, police reports)
   
   Just note what each file is so the AI knows how to use it.

4. **Publish:**
   ```bash
   npm run publish:draft my-case-name.md
   ```

The AI will:
- ✅ Read the actual schema from `src/content/config.ts`
- ✅ Extract metadata from your unstructured notes
- ✅ Download and upload all media files
- ✅ Generate a complete, properly formatted article
- ✅ Save to the correct content collection
- ✅ Commit and push to GitHub

### Creating a Blog Post

Same process, but use `drafts/posts/` folder:

```bash
cp drafts/posts/TEMPLATE.md drafts/posts/my-post.md
# Edit the file
npm run publish:draft my-post.md
```

## Folder Structure

```
drafts/
├── cases/           # Case drafts
│   ├── TEMPLATE.md  # Copy this to start new cases
│   └── *.md         # Your draft files
├── posts/           # Blog post drafts
│   ├── TEMPLATE.md  # Copy this to start new posts
│   └── *.md         # Your draft files
└── published/       # Archived drafts (auto-created)
```

## Tips

### Maximum Flexibility

The AI is smart! You can:
- Mix structured and unstructured content
- Use any writing style
- Include messy notes
- Paste links without perfect formatting
- Let the AI figure out what's what

### Media Files

For best results, add a brief description:
```markdown
## Media
- Body camera video showing the traffic stop: https://dropbox.com/...
- Photo of victim John Smith: https://example.com/photo.jpg
- Settlement agreement PDF: https://courtdocs.com/file.pdf
```

### Content Type Auto-Detection

The system automatically detects whether you're writing a case or blog post based on the folder:
- `drafts/cases/*.md` → Creates a case
- `drafts/posts/*.md` → Creates a blog post

You can override by adding `**Type:** case` or `**Type:** post` anywhere in your draft.

## Schema-Aware Generation

The AI reads `src/content/config.ts` directly, so:
- ✅ Always uses current schema
- ✅ Includes all required fields
- ✅ Adds optional fields when data is available
- ✅ Uses correct data types

No need to memorize field names - the AI knows!
