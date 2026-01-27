# TODO / Future Features

## Automated Content Workflow

**Status:** Planning
**Priority:** Medium
**Complexity:** Medium-High

### Overview

Use cron jobs on Hetzner server running `claude -p` to automatically generate and update content.

### Two Components

#### 1. Daily News Synthesis Posts

- Run daily (e.g., 6am PT)
- Search web for California police misconduct news from last 24 hours
- Cross-reference against existing posts to avoid duplicates
- Generate short news synthesis posts for significant stories
- Commit to staging branch for review (or direct to main if confidence is high)

**Example prompt:**
```
claude -p "Read instructions/posts.md, search web for 'California police misconduct' news from the last 24 hours. If you find significant news not already covered in src/content/posts/, create a short news post. Commit with /cm when done."
```

#### 2. Existing Case Updates

- Run weekly (e.g., Sunday morning)
- For each case in `src/content/cases/`:
  - Extract key identifiers (officer names, victim names, agency, case numbers)
  - Search for recent news/court updates
  - If updates found, append to case article or flag for review
- Track what's been searched to avoid redundant API usage

**Example prompt:**
```
claude -p "Read each case in src/content/cases/, extract officer/victim names and agencies. Search for recent news about each case. If you find updates (settlements, verdicts, new charges, appeals), add them to the relevant case file. Commit changes with /cm."
```

### Technical Requirements

- [ ] Claude Code installed and authenticated on Hetzner server
- [ ] Git credentials configured for push access
- [ ] Decide on branch strategy (direct to main vs staging/PR)
- [ ] Create duplicate detection mechanism (track processed URLs/headlines)
- [ ] Handle auth token refresh/expiration
- [ ] Set up `--allowedTools` flags if needed to restrict dangerous operations

### Considerations

- **Quality control:** Automated posts may need human review before publishing
- **Source verification:** Search results need validation for accuracy
- **Rate limiting:** Don't overload with searches; batch intelligently
- **Error handling:** What happens if Claude hangs or produces bad output?
- **Featured images:** Need default images or automated image sourcing
- **Cost:** Using Claude Max subscription via CLI, not API tokens

### Open Questions

1. Push to main (auto-publish) or staging branch (human review)?
2. How to handle low-confidence updates (flag for review vs skip)?
3. What news sources should be prioritized?
4. How often to check each existing case for updates?

---

## Other Ideas

*Add future feature ideas below*

- [ ] Email/RSS digest of new posts
- [ ] Court calendar integration (PACER/state court APIs)
- [ ] Automated Brady list cross-referencing
- [ ] Social media auto-posting for new articles
