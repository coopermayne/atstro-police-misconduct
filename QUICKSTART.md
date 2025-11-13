# Quick Start Guide - AI Content Publishing

## ⚡ 5-Minute Setup

### 1. Open GitHub Codespace
```
Go to repository → Code → Codespaces → Create/Open
Wait ~30-60 seconds for environment to load
Environment variables automatically configured!
```

### 2. Create a Draft
```bash
cp drafts/templates/case-draft-template.md drafts/cases/my-first-case.md
# Edit the draft file with your notes and media URLs
```

### 3. Publish (Interactive)
```bash
npm run publish:draft
# Select draft from numbered list
# Review validation report
# Type 'yes' to proceed
```

### 4. Done!
```
Article automatically published and deployed
View at the URL shown in terminal output
```

## 📋 Minimal Draft Example

Here's the absolute minimum you need in a draft:

```markdown
# Draft: Test Case

**Type:** Case

## Case Summary / Notes

John Doe was subjected to excessive force by LAPD officers on January 15, 2023.
He was 28 years old. The incident occurred in Los Angeles.
The incident was captured on body camera footage. The case settled for $500,000.

## External Media Files

### Images
https://example.com/featured-photo.jpg

### Videos
https://example.com/bodycam.mp4
```

That's it! The validation will check completeness, then the AI will:
- Generate all metadata (case ID, tags, etc.)
- Download and upload media to Cloudflare
- Write the full article with proper formatting
- Embed media with correct components
- Save, archive, commit, and deploy

## 🎯 Common Commands

```bash
# Publish a draft (interactive - recommended)
npm run publish:draft

# Publish specific draft (direct)
npm run publish:draft cases/my-case.md

# Start dev server to preview locally
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🔑 Required Environment Variables

**All 6 required as Codespaces Secrets** (automatically loaded in Codespace):
```
ANTHROPIC_API_KEY=sk-ant-...          # Claude API for content generation
CLOUDFLARE_ACCOUNT_ID=...             # Your Cloudflare account
CLOUDFLARE_API_TOKEN=...              # Stream + Images access
CLOUDFLARE_R2_ACCESS_KEY_ID=...       # R2 storage access
CLOUDFLARE_R2_SECRET_ACCESS_KEY=...   # R2 storage secret
CLOUDFLARE_R2_BUCKET_NAME=...         # R2 bucket name
```

**Setup Once:** Add these to GitHub Codespaces Secrets at https://github.com/settings/codespaces

**See [CLOUDFLARE-SETUP.md](./CLOUDFLARE-SETUP.md) for detailed setup instructions.**

## 🚨 Troubleshooting (Quick Fixes)

**Problem:** "Missing credentials"
- **Fix:** Check `.env` file has all required variables

**Problem:** "Download failed"
- **Fix:** Ensure URLs are publicly accessible (not behind login)

**Problem:** "Claude API failed"
- **Fix:** Check your API key and account credits

**Problem:** Git push failed
- **Fix:** Article was saved - manually commit and push

## 📁 Where Things Go

```
/drafts/                          ← Your drafts here
  /templates/                     ← Copy templates from here
  /published/                     ← Archived drafts (auto)

/src/content/cases/               ← Published cases (auto)
/src/content/posts/               ← Published blog posts (auto)

/scripts/                         ← Publishing tools (don't edit)
```

## ✅ Publishing Checklist

Before running `publish:draft`:
- [ ] Draft has victim name, date, city, agency
- [ ] At least one image URL (for featured image)
- [ ] External URLs are publicly accessible
- [ ] You have API credits (Anthropic, Cloudflare)

During publishing:
- [ ] Review validation report carefully
- [ ] Decide if you want to add more info or proceed
- [ ] Type 'yes' to confirm and start processing

After publishing:
- [ ] Review generated article for accuracy
- [ ] Check embedded media displays correctly
- [ ] Verify metadata (dates, names, amounts)
- [ ] Edit published MDX file if needed

## 💡 Tips

1. **Start with simple cases** (1-2 videos, minimal media)
2. **Be specific in notes** - better notes = better AI output
3. **Review before going live** - AI is good but not perfect
4. **Save API costs** - test with minimal drafts first

## 🔗 Full Documentation

For complete documentation, see [PUBLISHING.md](./PUBLISHING.md)

## 📞 Need Help?

Check the full docs for:
- Advanced features
- Detailed troubleshooting
- API reference
- Best practices
