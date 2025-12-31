# Content Workflow Refactor Plan

**Date:** December 31, 2024
**Branch:** `feature/content-workflow-refactor`

## What We Built

### CLI Upload Utilities
Claude Code can now upload media directly:
```bash
npm run upload:video <url> [--caption "..."]
npm run upload:image <url> --alt "..." [--caption "..."]
npm run upload:document <url> --title "..." --description "..."
npm run media:find "<search>"
npm run link:external <url> [--title/--description/--icon]
```

### Instruction Files
Located in `instructions/`:
- `common.md` - utilities, components, registry
- `cases.md` - case article guidance
- `posts.md` - blog post guidance

Claude Code reads these when working on content.

### Notes System
- `notes/cases/` and `notes/posts/` directories
- `notes_file` field added to frontmatter schema
- Preserves context/research for each article

## New Workflow (Interactive)

**Old:** Dump notes → run script → get finished article (one-shot)

**New:** Conversational with Claude Code:
1. "Let's write a case article about X"
2. Claude reads instructions, registry, asks clarifying questions
3. Claude uploads media as needed, generates article
4. "Move the video to section Y" / "Make the legal section shorter"
5. Iterate until done
6. Notes file preserves context for future edits

## Still TODO

- [ ] Test the new workflow end-to-end
- [ ] Consider: validation utility to check frontmatter against registry
- [ ] Consider: update CLAUDE.md to point to instruction files
- [ ] Merge branch to main when ready

## Key Files

| File | Purpose |
|------|---------|
| `instructions/*.md` | Content creation guidance |
| `scripts/cli/*.js` | Upload utilities |
| `data/metadata-registry.json` | Canonical values |
| `src/content/config.ts` | Frontmatter schema |
