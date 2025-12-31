# Quick Start Guide

## 5-Minute Overview

1. **Write a draft** with your notes and media URLs
2. **Run publish** - AI rewrites it into a polished article
3. **Done** - Article deployed automatically

## Creating Content

### Cases (Police Misconduct Incidents)

```bash
# Create a new case draft
cp drafts/cases/TEMPLATE.md_template drafts/cases/victim-name.md
```

Write the facts: victim info, what happened, legal details. The AI will rewrite it into an encyclopedic article (Wikipedia-style: neutral, factual).

### Blog Posts (Educational/Legal Topics)

```bash
# Create a new blog post draft
cp drafts/posts/TEMPLATE.md_template drafts/posts/topic-name.md
```

Write your key points and research notes. The AI will rewrite it into an engaging article with a "Key Takeaways" section.

## Adding Media

Just paste URLs with descriptions in your draft:

```
https://dropbox.com/bodycam.mp4
Body camera footage of the incident

https://example.com/photo.jpg
Photo of victim (featured image)

https://courtdocs.gov/complaint.pdf
Civil rights complaint
```

The AI downloads, uploads to Cloudflare, and places media throughout the article.

### Reusing Existing Media

Already uploaded something? Run the media browser:

```bash
npm run media:browse
```

Find the asset, copy its **original source URL**, and paste it in your new draft. The system recognizes it's already uploaded and reuses it.

## Publishing

```bash
npm run publish
```

Select your draft, review the AI's work, and confirm. The article is saved, committed, and deployed automatically.

## Key Commands

```bash
npm start              # Interactive menu for all tasks
npm run publish        # Publish a draft
npm run dev            # Start dev server (localhost:4321)
npm run media:browse   # Browse uploaded media (localhost:3001)
```

## File Locations

```
drafts/cases/           # Your case drafts
drafts/posts/           # Your blog post drafts
src/content/cases/      # Published cases (MDX)
src/content/posts/      # Published posts (MDX)
```

## What the AI Does

When you publish, the AI:

1. **Extracts metadata** - victim info, agencies, tags, dates
2. **Uploads media** - videos to Stream, images to Images, PDFs to R2
3. **Rewrites content** - creates section headings, proper structure
4. **Generates MDX** - complete article with frontmatter

You don't need to worry about formatting, MDX syntax, or component imports.

## Tips

- **Just dump information** - the AI handles structure and tone
- **Cases are neutral** - encyclopedic, no emotional language
- **Posts get Key Takeaways** - AI adds a summary section
- **Review after publishing** - AI is good but not perfect

## Full Documentation

- [PUBLISHING.md](./PUBLISHING.md) - Complete publishing guide
- [EDITING-ARTICLES.md](./EDITING-ARTICLES.md) - Editing published content
- [CLI.md](./CLI.md) - Interactive CLI reference
- [drafts/README.md](./drafts/README.md) - Draft templates and tips
