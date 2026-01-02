# Police Misconduct Law - Project Roadmap

**Last Updated:** January 2026

## Project Vision

Create a comprehensive resource documenting police misconduct cases in California with:
- Detailed case documentation with embedded media
- Educational blog content about police accountability law
- Interactive content creation through Claude Code
- Professional, user-friendly interface

---

## Current Status

### Completed

| Phase | Description | Status |
|-------|-------------|--------|
| 1 | Foundation (Astro, Tailwind, content collections) | Done |
| 2 | Cloudflare Media (Stream, Images, R2) | Done |
| 3 | Content Creation Workflow | Done |
| 4 | Metadata Registry | Done |
| 5 | Media Library Browser | Done |
| 6 | Search (Pagefind) | Done |
| 7 | Contact Form (Netlify Forms) | Done |

### In Progress

- **Newsletter Integration** - Buttondown setup pending
- **Content Sprint** - Building out case database

### Planned

- MPV Dataset Integration
- Advanced Filtering
- Case Statistics Dashboard
- Regional Landing Pages

---

## Upcoming Phases

### Phase 8: MPV Dataset Integration

Integrate MappingPoliceViolence dataset for California 2025 cases.

**Goals:**
- Extend schema with MPV fields (~40 fields)
- Create import script for California cases
- Prioritize cases with video evidence
- Publish 20+ cases from dataset

### Phase 9: Enhanced Features

**Goals:**
- Advanced filtering (agency, county, year, outcome)
- Case statistics dashboard
- Related cases recommendations

### Phase 10: SEO & Analytics

**Goals:**
- Meta descriptions and Open Graph tags
- Structured data (JSON-LD)
- Analytics setup (Plausible)
- Performance optimization

### Phase 11: Geographic Expansion

**Goals:**
- Regional landing pages (LA, Bay Area, San Diego, etc.)
- Region-specific statistics
- Local search optimization

---

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Astro v5 |
| Styling | Tailwind CSS v4 |
| Content | MDX with Content Collections |
| Hosting | Netlify |
| Media CDN | Cloudflare (Stream, Images, R2) |
| Search | Pagefind |
| Forms | Netlify Forms |

---

## Cost Estimate

**Current (~10 cases):** ~$3/month
- Netlify: Free tier
- Cloudflare Stream: ~$2
- Cloudflare Images: ~$0.50
- Cloudflare R2: ~$0.50

**At Scale (50+ cases):** ~$15-25/month

---

## Goals

### 3-Month
- 25+ documented cases
- 12+ educational articles
- Newsletter integration live

### 6-Month
- 50+ documented cases
- Working search and filters
- Regional landing pages
- Referenced by journalists/lawyers

---

## Known Limitations

1. **Search** - Requires production build to update index
2. **Newsletter** - Buttondown integration pending
3. **Comments** - Static site, no user comments yet
4. **Large files** - Videos >1GB may timeout on upload

---

## Documentation

| Document | Purpose |
|----------|---------|
| `CLAUDE.md` | Main Claude Code instructions |
| `QUICKSTART.md` | Quick start guide |
| `CLOUDFLARE-SETUP.md` | Media hosting setup |
| `METADATA-REGISTRY.md` | Registry system |
| `SEARCH.md` | Pagefind implementation |
| `instructions/` | Content creation guidelines |

---

*Maintained by: Cooper Mayne*
