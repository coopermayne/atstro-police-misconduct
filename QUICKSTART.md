# Quick Start Guide

## Development

```bash
npm run dev            # Start dev server (localhost:4321)
npm start              # Interactive CLI menu
npm run media:browse   # Browse media library (localhost:3001)
```

## Creating Content with Claude Code

Content is created through conversations with Claude Code.

### Starting a New Article

Tell Claude Code what you want:

- **Case article**: "Create a case article about [victim name]" + provide notes/research
- **Blog post**: "Write a blog post about [topic]" + provide research

### What to Provide

Dump whatever information you have:
- News article links
- Victim information (name, age, date)
- Timeline and facts
- Legal outcomes (charges, settlements)
- Media URLs (videos, photos, documents)

Claude Code will:
1. Read instruction files and metadata registry
2. Research additional context if needed
3. Ask clarifying questions
4. Upload media to Cloudflare
5. Create the article with proper structure
6. Save notes for future reference

## Adding Media

Provide URLs from any source (Dropbox, Google Drive, direct links):

```bash
npm run upload:video <url> [--caption "..."]
npm run upload:image <url> --alt "..." [--caption "..."]
npm run upload:document <url> --title "..." --description "..."
```

### Finding Existing Media

```bash
npm run media:browse        # Visual browser at localhost:3001
npm run media:find "term"   # Search from command line
```

## File Locations

```
src/content/cases/      # Case articles (MDX)
src/content/posts/      # Blog posts (MDX)
notes/cases/            # Research notes for cases
notes/posts/            # Research notes for posts
```

## Tips

- **Just provide information** - Claude Code handles structure and formatting
- **Cases are encyclopedic** - neutral, factual, Wikipedia-style
- **Posts are engaging** - include Key Takeaways section
- **Iterate freely** - ask for changes, add media, refine wording
- **Notes are preserved** - research context saved for future edits

## Documentation

| Document | Purpose |
|----------|---------|
| `CLAUDE.md` | Main Claude Code instructions |
| `instructions/common.md` | Media utilities and components |
| `instructions/cases.md` | Case article guidelines |
| `instructions/posts.md` | Blog post guidelines |
| `docs/claude-code-structure.md` | How custom MD files work |
