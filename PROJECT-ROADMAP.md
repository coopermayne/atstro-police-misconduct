# Police Misconduct Law - Project Roadmap

**Last Updated:** November 13, 2025

## 🎯 Project Vision

Create a comprehensive, accessible resource documenting police misconduct cases in California with:
- Detailed case documentation with embedded media
- Educational blog content about police accountability law
- AI-assisted content generation for rapid publishing
- Professional, user-friendly interface

---

## 📊 Current Status: Phase 5 - Validation & Polish

### ✅ Completed Phases

#### Phase 1: Foundation ✅
**Goal:** Set up Astro static site with content collections

**Completed:**
- ✅ Astro v5 project initialized
- ✅ Tailwind CSS v4 configured
- ✅ Content collections defined (cases, posts, agencies, counties)
- ✅ Dark mode with localStorage persistence
- ✅ Responsive navigation and footer
- ✅ Dynamic routing for all content types

**Files:**
- `src/content/config.ts` - Content schema definitions
- `src/layouts/MainLayout.astro` - Base layout with theme toggle
- `src/pages/` - All route handlers

---

#### Phase 2: Cloudflare Media Integration ✅
**Goal:** Professional media hosting with CDN delivery

**Completed:**
- ✅ Cloudflare Stream for videos (adaptive streaming)
- ✅ Cloudflare Images for responsive images (automatic resizing)
- ✅ Cloudflare R2 for document storage (S3-compatible)
- ✅ Custom components for embedding media
- ✅ Account setup and configuration

**Components:**
- `CloudflareVideo.astro` - Video embeds with Stream
- `CloudflareImage.astro` - Responsive images with srcset

**Documentation:**
- `CLOUDFLARE-SETUP.md` - Complete setup guide

---

#### Phase 3: AI Content Generation ✅
**Goal:** Automate case documentation creation

**Completed:**
- ✅ Draft-based workflow with templates
- ✅ External media file downloader (Dropbox, Drive, direct URLs)
- ✅ Cloudflare uploader scripts (Stream, Images, R2)
- ✅ AI-powered content generation (Claude Sonnet 4)
- ✅ Metadata extraction from unstructured notes
- ✅ Automatic Git commit and deployment
- ✅ Comprehensive documentation

**Scripts:**
- `scripts/publish-draft.js` - Main orchestrator
- `scripts/media/file-downloader.js` - External media downloads
- `scripts/cloudflare/cloudflare-stream.js` - Video uploads
- `scripts/cloudflare/cloudflare-images.js` - Image uploads
- `scripts/cloudflare/cloudflare-r2.js` - Document uploads
- `scripts/ai-prompts.js` - Structured AI prompts

**Documentation:**
- `PUBLISHING.md` - Complete workflow guide (550+ lines)
- `QUICKSTART.md` - 5-minute quick start
- `scripts/README.md` - Technical API reference

---

#### Phase 4: Flexible Draft System ✅
**Goal:** Make drafting as easy as possible

**Completed:**
- ✅ Separate folders for cases vs posts
- ✅ Schema-aware AI (reads config.ts directly)
- ✅ Unstructured input support (bullet points, paragraphs, notes)
- ✅ Media URL descriptions for context
- ✅ Automatic content type detection

**Templates:**
- `drafts/cases/TEMPLATE.md` - Flexible case template
- `drafts/posts/TEMPLATE.md` - Flexible blog post template

**Documentation:**
- `drafts/README.md` - User guide
- `FLEXIBLE-DRAFTS-COMPLETE.md` - Implementation summary

---

#### Phase 5: Validation & Polish ✅
**Goal:** Ensure quality before publishing

**Completed:**
- ✅ AI draft validation before processing
- ✅ Interactive numbered draft selection
- ✅ Validation report with detailed feedback
- ✅ User confirmation checkpoint
- ✅ Updated documentation with new workflow
- ✅ Simplified metadata registry to use simple strings instead of objects
- ✅ Added override option for validation failures in publish script
- ✅ Fixed content type detection for blog posts vs cases (path-based detection)
- ✅ Pruned blog post tags to be minimal and on-point
- ✅ Added encyclopedic tone to AI article generation
- ✅ Removed Sources section requirement from AI-generated articles
- ✅ Restricted AI component usage to CloudflareImage and CloudflareVideo only
- ✅ Integrated registry auto-sync into build/dev processes
- ✅ Added npm run rebuild-registry command

**Features:**
- Pre-processing validation (checks completeness)
- Interactive prompts (select draft by number, confirm publishing)
- Detailed validation reports (critical vs helpful info)
- Safety net to prevent wasted processing time
- Validation override capability for edge cases
- Automatic metadata registry maintenance
- Wikipedia-style encyclopedic tone in generated articles

**Documentation:**
- `PUBLISHING.md` - Updated with validation workflow
- `PROJECT-ROADMAP.md` - This file (comprehensive status tracking)

---

## 🚀 Upcoming Phases

### Phase 6: Content Creation Sprint (Next)
**Goal:** Build out 10-20 high-quality cases

**Tasks:**
- [ ] Research and compile 10-20 notable California cases
- [ ] Gather media files (bodycam, documents, photos)
- [ ] Create drafts using templates
- [ ] Process through publishing workflow
- [ ] Review and edit for accuracy
- [ ] Publish and deploy

**Timeline:** 2-4 weeks  
**Success Metric:** 10+ published cases with media

---

### Phase 7: Blog Content
**Goal:** Educational content about police accountability law

**Planned Posts:**
- [ ] Understanding Qualified Immunity
- [ ] California's SB 2 (Police Decertification)
- [ ] The California Tort Claims Act (CTCA)
- [ ] How to File a Civil Rights Lawsuit
- [ ] Bodycam Evidence in Court
- [ ] Settlement vs Trial: What Cases Settle?
- [ ] Pattern and Practice Investigations
- [ ] Federal vs State Civil Rights Claims

**Timeline:** Ongoing (1-2 per week)  
**Success Metric:** 8+ educational blog posts

---

### Phase 8: Enhanced Features
**Goal:** Improve user experience and functionality

**Planned:**
- [ ] Working search functionality
  - Client-side search with Fuse.js or Pagefind
  - Search cases by name, agency, location, outcome
- [ ] Advanced filtering
  - Filter by agency, county, year, outcome
  - Filter by force type, investigation status
- [ ] Case statistics dashboard
  - Total cases by agency
  - Outcomes breakdown
  - Timeline visualization
- [ ] Related cases recommendations
  - Similar agencies
  - Similar circumstances
  - Legal precedents

**Timeline:** 2-3 weeks  
**Success Metric:** Working search + filters deployed

---

### Phase 9: Community Features (Optional)
**Goal:** Enable user engagement and contributions

**Possible Features:**
- [ ] Case submission form (for tips/new cases)
- [ ] Newsletter signup (Mailchimp/ConvertKit)
- [ ] Comment system (Giscus/Disqus)
- [ ] Social sharing optimization
- [ ] RSS feed for updates

**Timeline:** 1-2 weeks  
**Success Metric:** 100+ newsletter subscribers

---

### Phase 10: SEO & Analytics
**Goal:** Maximize reach and track impact

**Planned:**
- [ ] SEO optimization
  - Meta descriptions for all pages
  - Open Graph tags
  - Structured data (JSON-LD)
  - Sitemap.xml generation
- [ ] Analytics setup
  - Plausible or Google Analytics
  - Track most-viewed cases
  - Monitor search queries
- [ ] Performance optimization
  - Image optimization
  - Lazy loading
  - Bundle size reduction

**Timeline:** 1 week  
**Success Metric:** Lighthouse score 90+ on all pages

---

## 📈 Metrics & Goals

### Current Stats
- **Total Cases:** 6 (3 sample + 3 test)
- **Total Posts:** 4 educational articles
- **Pages:** 44 (last build)
- **Deployment:** Netlify (auto-deploy on push)

### 3-Month Goals
- **Cases:** 25+ documented cases
- **Posts:** 12+ educational articles
- **Traffic:** 1,000+ monthly visitors
- **Engagement:** 100+ newsletter subscribers

### 6-Month Goals
- **Cases:** 50+ documented cases
- **Posts:** 20+ educational articles
- **Traffic:** 5,000+ monthly visitors
- **Features:** Full search, filters, statistics dashboard
- **Impact:** Referenced by journalists, lawyers, or activists

---

## 🛠️ Tech Stack

### Current
- **Framework:** Astro v5 (static site generator)
- **Styling:** Tailwind CSS v4
- **Content:** MDX with Content Collections
- **Hosting:** Netlify (with auto-deploy)
- **Media CDN:** 
  - Cloudflare Stream (videos)
  - Cloudflare Images (images)
  - Cloudflare R2 (documents)
- **AI:** Anthropic Claude Sonnet 4
- **Development:** GitHub Codespaces

### Planned Additions
- **Search:** Pagefind or Fuse.js
- **Analytics:** Plausible Analytics
- **Newsletter:** ConvertKit or Mailchimp
- **Comments:** Giscus (GitHub-based)

---

## 💰 Cost Breakdown

### Monthly Costs (Estimated)

**Current (for ~10 cases):**
- Netlify: $0 (free tier)
- Cloudflare Stream: ~$2
- Cloudflare Images: ~$0.50
- Cloudflare R2: ~$0.50
- **Total: ~$3/month**

**Content Generation (variable):**
- Claude API: ~$0.15-0.60 per article
- **Per 10 articles:** ~$1.50-6.00

**At Scale (50+ cases):**
- Netlify: $0 (still free tier)
- Cloudflare: ~$10-15/month
- Analytics: $0-9/month (Plausible)
- Newsletter: $0-20/month (ConvertKit)
- **Total: $10-44/month**

Very affordable for a professional site with this much functionality!

---

## 📝 Documentation Status

### Complete ✅
- ✅ `README.md` - Project overview
- ✅ `QUICKSTART.md` - 5-minute setup
- ✅ `PUBLISHING.md` - Complete workflow (550+ lines)
- ✅ `CLOUDFLARE-SETUP.md` - Media hosting setup
- ✅ `PROJECT-ROADMAP.md` - This file
- ✅ `scripts/README.md` - Technical reference
- ✅ `drafts/README.md` - Drafting guide
- ✅ `.github/copilot-instructions.md` - AI context

### Migration Docs ✅
- ✅ `MIGRATION-TO-CLAUDE.md` - OpenAI → Claude
- ✅ `FLEXIBLE-DRAFTS-COMPLETE.md` - Draft system improvements
- ✅ `PHASE4-COMPLETE.md` - AI workflow completion
- ✅ `WORKFLOW-DIAGRAM.md` - Visual workflow

---

## 🎓 Learning Resources

### For Content Creation
1. Read `QUICKSTART.md` (5 min)
2. Read `PUBLISHING.md` workflow section (10 min)
3. Copy template and create first draft (10 min)
4. Run publish command (5 min active + 10 min automated)
5. Review and edit published article (5 min)

**Total time to first published case: ~45 minutes**

### For Development
1. Astro docs: https://docs.astro.build
2. Tailwind v4 docs: https://tailwindcss.com/docs
3. MDX guide: https://mdxjs.com/docs/
4. Cloudflare docs: https://developers.cloudflare.com

---

## 🐛 Known Issues & Limitations

### Current Limitations
1. **Search not functional** - UI exists but needs implementation
2. **Newsletter not connected** - Form exists but no backend
3. **No user comments** - Static site limitation
4. **AI may hallucinate** - Always review generated content
5. **Large files may timeout** - Videos >1GB may fail upload
6. **No draft auto-save** - Manual save required

### Planned Fixes
- Search: Phase 8 (Pagefind integration)
- Newsletter: Phase 9 (ConvertKit)
- Comments: Phase 9 (Giscus)
- AI accuracy: Ongoing prompt refinement
- File size: Cloudflare Stream supports up to 30GB (should be fine)

---

## 🤝 Contribution Guidelines

### Content Contributions
- Research must be verifiable
- Sources must be cited
- Media must be legally obtained
- Review for factual accuracy

### Code Contributions
- Follow Astro best practices
- Maintain Tailwind conventions
- Add JSDoc comments to functions
- Update relevant documentation

---

## 📞 Support & Resources

### Getting Help
1. Check documentation (PUBLISHING.md, QUICKSTART.md)
2. Review troubleshooting sections
3. Check GitHub issues
4. Review error messages carefully

### Useful Links
- Live Site: [Your Netlify URL]
- GitHub Repo: coopermayne/atstro-police-misconduct
- Cloudflare Dashboard: https://dash.cloudflare.com
- Anthropic Console: https://console.anthropic.com

---

## 🎯 Success Criteria

### Phase 6 Success (Content Sprint)
- ✅ 10+ published cases with media
- ✅ All cases fact-checked and verified
- ✅ Consistent formatting across all cases
- ✅ No 404 errors on deployed site

### Overall Project Success
- 📊 **Reach:** 5,000+ monthly visitors
- 📚 **Content:** 50+ documented cases
- 📝 **Education:** 20+ blog posts
- 🔍 **Usability:** Working search and filters
- 💼 **Impact:** Referenced by media or legal professionals

---

## 📅 Timeline

### Completed (Phases 1-5)
- **Phase 1:** October 2025 - Foundation
- **Phase 2:** October 2025 - Cloudflare Integration
- **Phase 3:** November 2025 - AI Workflow
- **Phase 4:** November 2025 - Flexible Drafts
- **Phase 5:** November 13, 2025 - Validation & Polish ✅

### Upcoming
- **Phase 6:** November-December 2025 - Content Sprint
- **Phase 7:** Ongoing - Blog Content
- **Phase 8:** January 2026 - Enhanced Features
- **Phase 9:** February 2026 - Community Features (optional)
- **Phase 10:** March 2026 - SEO & Analytics

---

## 🏆 Achievements Unlocked

- ✅ **Automated Publishing:** 95% reduction in content creation time
- ✅ **Professional Media:** CDN-hosted videos and images
- ✅ **AI Integration:** State-of-the-art content generation
- ✅ **Developer Experience:** One-command publishing workflow
- ✅ **Comprehensive Docs:** 1000+ lines of documentation
- ✅ **Quality Controls:** Validation before processing

---

## 🚀 Next Actions

### Immediate (This Week)
1. ✅ Complete validation system
2. ✅ Update all documentation
3. ✅ Create project roadmap
4. ✅ Simplify metadata registry
5. ✅ Add validation overrides
6. [ ] Begin researching 10 cases for content sprint

### Short-term (This Month)
1. [ ] Compile case research notes
2. [ ] Gather media files for 10 cases
3. [ ] Create and publish 10 cases
4. [ ] Write 2-3 blog posts

### Medium-term (Next 3 Months)
1. [ ] Reach 25 published cases
2. [ ] Implement search functionality
3. [ ] Add advanced filtering
4. [ ] Set up analytics

---

**Current Focus:** Phase 6 - Content Creation Sprint  
**Status:** Ready to begin researching and documenting cases  
**Blocker:** None - all systems operational  
**Next Milestone:** 10 published cases with professional media

---

*Last updated: November 14, 2025*  
*Maintained by: Cooper Mayne*

---

## 📋 TODO List

### In Progress
- [ ] 

### Up Next
- [ ] 

### Backlog
- [ ] Gracefully handle duplicate slugs for articles and posts
- [ ] Handle redirects if a page is renamed (e.g., a-silva → anthony-silva when first name is learned)
- [ ] Improve interactive prompts - create unified CLI tool instead of separate commands (npm run dev, publish, etc.)
- [ ] Add fallback for broken image links - decide on policy for articles without featured images
- [ ] Add analytics (Plausible)
- [ ] Add media gallery to browse and easily reuse media with component code copying
- [ ] Remove "published: true/false" field (not needed)
- [ ] Review and finalize metadata schema to avoid future changes
- [ ] Begin researching 10 cases for content sprint
- [ ] Compile case research notes
- [ ] Gather media files for 10 cases
- [ ] Create and publish 10 cases
- [ ] Write 2-3 blog posts

### Recently Completed (November 14, 2025)
- [x] Simplified metadata registry to use simple strings instead of objects
- [x] Added override option for validation failures in publish script
- [x] Fixed content type detection for blog posts vs cases
- [x] Pruned blog post tags to be minimal and on-point
- [x] Added encyclopedic tone to AI article generation
- [x] Removed Sources section from AI prompts
- [x] Restricted AI to CloudflareImage and CloudflareVideo components only
- [x] Integrated registry auto-sync into build/dev processes
- [x] Added `npm run rebuild-registry` command

---

**Usage:** Add new tasks under "Backlog", move to "Up Next" when prioritized, move to "In Progress" when working on them, and move to "Recently Completed" when done.
