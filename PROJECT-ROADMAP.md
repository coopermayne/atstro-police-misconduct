# Police Misconduct Law - Project Roadmap

**Last Updated:** November 17, 2025

## 🎯 Project Vision

Create a comprehensive, accessible resource documenting police misconduct cases in California with:
- Detailed case documentation with embedded media
- Educational blog content about police accountability law
- AI-assisted content generation for rapid publishing
- Professional, user-friendly interface

---

## 📊 Current Status: Phase 6 - Content Creation & Feature Enhancement

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

#### Phase 6: Media Library & Developer Tools ✅
**Goal:** Create professional media management and CLI tools

**Completed:**
- ✅ Media library browser with visual interface (localhost:3001)
- ✅ File size display for videos (always in GB format)
- ✅ Interactive CLI tool for all common tasks
- ✅ Media statistics and recent additions tracking
- ✅ Fixed CLI media browser path
- ✅ Cloudflare Images, Stream, and R2 integration

**Features:**
- Visual media library browser with filtering and search
- Click-to-copy MDX component codes
- Video file size tracking and display
- Unified CLI menu for drafts, publishing, media, and dev server
- Media library statistics with storage estimates

**Documentation:**
- `scripts/media/README.md` - Media management guide
- `CLI.md` - Command-line interface documentation

---

## 🚀 Current Phase

### Phase 7: Forms & Newsletter Integration (In Progress)
**Goal:** Enable user engagement through contact forms and newsletter

**Status:** Planning complete, ready for implementation

**Planned:**
- [ ] **Contact form with Netlify Forms** (Attorney referral form on /contact)
  - Using Netlify's built-in form handling (free, 100 submissions/month)
  - Honeypot spam protection to prevent bot submissions
  - Form fields: name, email, phone, location, incident date, description
  - Email notifications on new submissions
  
- [ ] **Newsletter signup with Buttondown** (Newsletter form on homepage + /contact)
  - Using Buttondown (free for up to 100 subscribers)
  - Can write newsletters in Markdown or custom HTML
  - Simple API integration
  - Privacy-focused, no tracking pixels
  - Upgrade path: $9/month when reaching 100 subscribers

**Implementation Steps:**
1. Sign up for Buttondown account and get API key
2. Update `NewsletterCTA.astro` component with Buttondown integration
3. Add Netlify form attributes to contact form
4. Add honeypot fields for spam protection on both forms
5. Test form submissions in development
6. Add success/error message handling
7. Deploy and verify on production
8. Test email notifications

**Timeline:** 1 week  
**Success Metric:** Working contact form + newsletter signup on production

---

## 🚀 Upcoming Phases

### Phase 8: MPV Dataset Integration & Video Case Documentation
**Goal:** Integrate MappingPoliceViolence dataset schema and publish California 2025 cases with video evidence

**Context:**
The MappingPoliceViolence (MPV) dataset provides comprehensive structured data on police killings nationwide, including demographic info, geographic data, officer information, external database cross-references, and Washington Post tracking fields. By adopting their schema, we gain compatibility with a well-established dataset and can import high-quality case metadata automatically.

**Sub-phases:**

#### Phase 8.1: Schema Migration to MPV Format
**Tasks:**
- [ ] Extend `src/content/config.ts` casesCollection with ~40 MPV fields
  - Victim info: `victim_image`, `name` (separate from title)
  - Location enhanced: `street_address`, `state`, `zip`, `latitude`, `longitude`
  - Geographic/demographic: `geography`, `tract`, `urban_rural_uspsai`, `urban_rural_nchs`, `hhincome_median_census_tract`
  - Agency: `agency_responsible`, `ori` (FBI ORI code)
  - Incident details: `circumstances`, `encounter_type`, `initial_reason`, `call_for_service`, `off_duty_killing`, `signs_of_mental_illness`, `allegedly_armed`
  - Officer info: `officer_names`, `officer_races`, `officer_known_past_shootings`, `officer_charged`
  - Legal/investigation: `disposition_official`, `news_urls`
  - WAPO fields: `wapo_armed`, `wapo_threat_level`, `wapo_flee`, `wapo_body_camera`, `wapo_id`
  - External IDs: `mpv_id`, `fe_id` (Fatal Encounters database)
- [ ] Mark all new fields as `.nullable().optional()` for backward compatibility
- [ ] Update `src/pages/cases/[slug].astro` to display new MPV fields conditionally
- [ ] Update `src/components/MetadataItem.astro` with new metadata types (mentalIllness, officerCharged, geography, coordinates)
- [ ] Update `scripts/ai/prompts.js` field mapping and extraction prompts for MPV fields
- [ ] Update `scripts/registry/registry-builder.js` to extract new enum fields
- [ ] Test that existing 2 cases still build without changes
- [ ] Create `MPV-SCHEMA-MIGRATION.md` documenting field mappings and differences
- [ ] Update `METADATA-REGISTRY.md` and `PROJECT-ROADMAP.md` with schema changes

**Timeline:** 1 week  
**Success Metric:** Extended schema validated, existing cases still build, documentation complete

---

#### Phase 8.2: MPV Dataset Import Tooling
**Tasks:**
- [ ] Obtain latest MPV dataset (CSV format)
- [ ] Create import script `scripts/import-mpv-dataset.js`
  - Parse MPV CSV data
  - Filter for California cases only
  - Filter for 2025 incidents only
  - Filter for cases with `wapo_body_camera = true` OR high video likelihood from `news_urls`
  - Map MPV fields to extended case schema
  - Generate draft MDX files with populated frontmatter
  - Create `description` field from `circumstances` + context
  - Leave MDX body minimal (AI will expand in next phase)
- [ ] Generate prioritized video research checklist
  - Rank cases by video availability likelihood
  - Note which cases have bodycam confirmed
  - Identify which need news video sourcing
- [ ] Validate generated drafts against schema
- [ ] Review sample of generated drafts for quality

**Timeline:** 1 week  
**Success Metric:** Import script working, 20-50 California 2025 case drafts with video potential generated

---

#### Phase 8.3: Video Sourcing & Publishing Workflow
**Tasks:**
- [ ] Process generated MPV drafts through AI publishing workflow
  - AI expands minimal drafts into full articles
  - AI maintains encyclopedic tone
  - AI uses populated frontmatter as authoritative source
- [ ] Manual video research and sourcing (prioritized by likelihood)
  - Search for bodycam footage releases
  - Source news clips with embedded video
  - Download courtroom/hearing videos if available
  - Verify video authenticity and relevance
- [ ] Upload sourced videos to Cloudflare Stream
- [ ] Insert video components into article MDX
- [ ] Review AI-generated articles for accuracy against MPV data
- [ ] Fact-check against original news sources
- [ ] Publish completed cases with video through standard workflow
- [ ] Track progress: goal is 10+ published cases with video

**Timeline:** 2 weeks  
**Success Metric:** 10+ California 2025 MPV cases published with video content, 20+ total MPV cases published

**Overall Phase 8 Timeline:** 3-4 weeks  
**Overall Success Metric:** MPV schema integrated, 20+ California 2025 cases published from dataset, 10+ include video evidence

---

### Phase 9: Blog Content
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

### Phase 10: Enhanced Features
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

### Phase 9: Community Features (In Progress)
**Goal:** Enable user engagement and contributions

**Planned Features:**
- [ ] **Contact form with Netlify Forms** (Attorney referral form on /contact)
  - Using Netlify's built-in form handling (free, 100 submissions/month)
  - Honeypot spam protection
  - Form fields: name, email, phone, location, incident date, description
- [ ] **Newsletter signup with Buttondown** (Newsletter form on homepage + /contact)
  - Using Buttondown (free for up to 100 subscribers)
  - Can write newsletters in Markdown or custom HTML
  - Simple API integration
  - Privacy-focused, no tracking
  - Plan: Start free, upgrade to $9/month when reaching 100 subscribers
- [ ] Comment system (Giscus/Disqus)
- [ ] Social sharing optimization
- [ ] RSS feed for updates

**Timeline:** 2-3 weeks  
**Success Metric:** Working search + filters deployed

---

### Phase 11: Additional Community Features (Optional)
**Goal:** Enable additional user engagement

**Possible Features:**
- [ ] Case submission form (for tips/new cases)
- [ ] Comment system (Giscus/Disqus)
- [ ] Social sharing optimization
- [ ] RSS feed for updates

**Timeline:** 1-2 weeks  
**Success Metric:** Active community engagement

---

### Phase 12: SEO & Analytics
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
- **Media Library:** Visual browser available at localhost:3001
- **CLI Tool:** Unified menu for all development tasks

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
- **Newsletter:** Buttondown (free tier)
- **Forms:** Netlify Forms (built-in)
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
- Netlify: $0 (still free tier, forms included)
- Cloudflare: ~$10-15/month
- Analytics: $0-9/month (Plausible)
- Newsletter: $0-9/month (Buttondown free tier or paid)
- **Total: $10-33/month**

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
2. **Newsletter not connected** - Form exists, Buttondown integration pending
3. **Contact form not connected** - Form exists, Netlify setup pending
4. **No user comments** - Static site limitation
5. **AI may hallucinate** - Always review generated content
6. **Large files may timeout** - Videos >1GB may fail upload
7. **No draft auto-save** - Manual save required

### Planned Fixes
- Search: Phase 10 (Pagefind integration)
- Newsletter: Phase 7 (Buttondown integration) - IN PROGRESS
- Contact form: Phase 7 (Netlify Forms) - IN PROGRESS
- Comments: Phase 11 (Giscus)
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

### Completed (Phases 1-6)
- **Phase 1:** October 2025 - Foundation
- **Phase 2:** October 2025 - Cloudflare Integration
- **Phase 3:** November 2025 - AI Workflow
- **Phase 4:** November 2025 - Flexible Drafts
- **Phase 5:** November 13, 2025 - Validation & Polish ✅
- **Phase 6:** November 17, 2025 - Media Library & Developer Tools ✅

### In Progress
- **Phase 7:** November 2025 - Forms & Newsletter Integration (CURRENT)

### Upcoming
- **Phase 8:** November-December 2025 - Content Sprint
- **Phase 9:** Ongoing - Blog Content
- **Phase 10:** January 2026 - Enhanced Features
- **Phase 11:** February 2026 - Additional Community Features (optional)
- **Phase 12:** March 2026 - SEO & Analytics

---

## 🏆 Achievements Unlocked

- ✅ **Automated Publishing:** 95% reduction in content creation time
- ✅ **Professional Media:** CDN-hosted videos and images
- ✅ **AI Integration:** State-of-the-art content generation
- ✅ **Developer Experience:** One-command publishing workflow
- ✅ **Comprehensive Docs:** 1000+ lines of documentation
- ✅ **Quality Controls:** Validation before processing
- ✅ **Media Library:** Visual browser with click-to-copy codes
- ✅ **Unified CLI:** All development tasks in one interactive menu

---

## 🚀 Next Actions

### Immediate (This Week)
1. [ ] Set up Buttondown account for newsletter
2. [ ] Integrate Buttondown API with NewsletterCTA component
3. [ ] Add Netlify Forms attributes to contact form
4. [ ] Add honeypot spam protection to both forms
5. [ ] Test form submissions locally and on production

### Short-term (This Month)
1. [ ] Complete forms and newsletter integration
2. [ ] Begin researching 10 cases for content sprint
3. [ ] Compile case research notes
4. [ ] Gather media files for 10 cases
5. [ ] Write 2-3 blog posts

### Medium-term (Next 3 Months)
1. [ ] Create and publish 10 cases
2. [ ] Reach 25 published cases
3. [ ] Implement search functionality
4. [ ] Add advanced filtering
5. [ ] Set up analytics

---

**Current Focus:** Phase 7 - Forms & Newsletter Integration  
**Status:** Planning complete, implementation ready to begin  
**Blocker:** Need to sign up for Buttondown account  
**Next Milestone:** Working contact form + newsletter signup on production

---

*Last updated: November 17, 2025*  
*Maintained by: Cooper Mayne*

---

## 📋 TODO List

### In Progress
- [ ] Set up Buttondown account and get API key
- [ ] Integrate newsletter form with Buttondown API
- [ ] Configure Netlify Forms for contact form
- [ ] Add spam protection (honeypot fields)

### Up Next
- [ ] Test form submissions in development
- [ ] Deploy and verify forms on production
- [ ] Begin researching cases for content sprint

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

### Recently Completed (November 17, 2025)
- [x] Built media library browser with visual interface
- [x] Added video file size display (always in GB)
- [x] Created unified CLI tool for all development tasks
- [x] Fixed CLI media browser path issue
- [x] Added media statistics and tracking
- [x] Researched and selected forms/newsletter services
- [x] Planned forms and newsletter integration approach

### Previously Completed (November 14, 2025)
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
