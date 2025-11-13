# Quick Start Guide - AI Content Publishing

## ⚡ 5-Minute Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your API keys
```

### 3. Create a Draft
```bash
cp drafts/templates/case-draft-template.md drafts/draft-my-first-case.md
# Edit the draft file
```

### 4. Publish
```bash
npm run publish:draft draft-my-first-case.md
```

## 📋 Minimal Draft Example

Here's the absolute minimum you need in a draft:

```markdown
# Draft: Test Case

**Type:** Case

## Case Summary / Notes

John Doe was subjected to excessive force by LAPD officers on January 15, 2023.
The incident was captured on body camera footage. The case settled for $500,000.

## External Media Files

### Videos
https://example.com/bodycam.mp4
```

That's it! The AI will:
- Generate all metadata
- Create case ID and tags
- Write the full article
- Embed the video properly

## 🎯 Common Commands

```bash
# Publish a case draft
npm run publish:draft draft-case-name.md

# Publish a blog post draft
npm run publish:draft draft-blog-post.md

# Start dev server to preview
npm run dev

# Build for production
npm run build
```

## 🔑 Required Environment Variables

**All 6 required as Codespaces Secrets:**
```
ANTHROPIC_API_KEY=sk-ant-...
CLOUDFLARE_ACCOUNT_ID=...
CLOUDFLARE_API_TOKEN=...
CLOUDFLARE_R2_ACCESS_KEY_ID=...
CLOUDFLARE_R2_SECRET_ACCESS_KEY=...
CLOUDFLARE_R2_BUCKET_NAME=...
```

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
- [ ] Draft has basic information filled in
- [ ] External URLs are publicly accessible
- [ ] You have API credits (OpenAI, Cloudflare)

After publishing:
- [ ] Review generated article for accuracy
- [ ] Check embedded media displays correctly
- [ ] Verify metadata (dates, names, amounts)
- [ ] Preview on local dev server

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
