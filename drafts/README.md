# Drafts Folder

This folder contains draft content before it's processed and published.

## Structure

- `/drafts/` - Active drafts awaiting publication
- `/drafts/published/` - Archive of published drafts (moved here after publication)
- `/drafts/templates/` - Template files for creating new drafts

## Workflow

1. Create a new draft using a template from `/drafts/templates/`
2. Name it: `draft-[case-name].md` or `draft-[topic].md`
3. Fill in case notes, metadata, and external file URLs
4. When ready to publish, run: `npm run publish:draft [filename]`
5. The script will:
   - Download all external media files
   - Upload to Cloudflare (Stream for videos, R2 for images/PDFs)
   - Generate complete article using AI
   - Move draft to `/drafts/published/[YYYY-MM-DD]-[title].md`
   - Commit and push to trigger deployment

## See Also

- Publishing script: `/scripts/publish-draft.js`
- Documentation: `/scripts/PUBLISHING.md`
