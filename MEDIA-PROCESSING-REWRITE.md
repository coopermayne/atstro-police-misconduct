# Media Processing System Rewrite - Feature Plan

**Status:** Planning Phase  
**Created:** November 15, 2025  
**Target:** Phased implementation with backward compatibility

---

## 🎯 Project Goals

Replace the current **shortcode-based** media processing system with an **AI-first, natural markdown** approach that:

1. **Eliminates machine-readable syntax** - Users write natural notes and annotations instead of `{{type: url | params}}`
2. **Centralizes data flow** - Single `processingState` object passed through phases
3. **Enables AI flexibility** - AI can choose where (or whether) to place media in article
4. **Maintains all context** - Nothing is lost; frontmatter arrays are complete registry
5. **Improves component generation** - Programmatic finalization instead of AI code generation
6. **Supports link enrichment** - Automatically fetch titles/descriptions from external URLs

---

## 📋 Current System (Before Rewrite)

### How It Works Now

1. **User writes shortcodes** in draft markdown:
   ```markdown
   {{video: https://example.com/video.mp4 | caption: Body camera footage}}
   {{image: https://example.com/photo.jpg | featured: true | alt: Scene photo}}
   {{document: https://example.com/doc.pdf | title: Complaint | description: Civil rights complaint}}
   ```

2. **`parseMediaShortcodes()`** extracts all shortcodes using regex

3. **`processVideos()`**, **`processImages()`**, **`processPDFs()`** functions:
   - Download from external URLs
   - Upload to Cloudflare services (Stream, Images, R2)
   - Add to `media-library.json` for deduplication
   - Return structured media analysis

4. **AI receives media analysis** and generates complete article with:
   - Frontmatter metadata
   - MDX imports
   - Embedded components in article body

5. **Article saved** to `src/content/cases/` or `src/content/posts/`

### Problems with Current System

❌ **Users write machine-readable syntax** - `{{type: url | param: value}}` is tedious and error-prone  
❌ **Rigid structure** - Shortcodes must be precisely formatted or validation fails  
❌ **Limited AI flexibility** - Shortcode location somewhat dictates placement  
❌ **Component code generation by AI** - AI writes `<CloudflareVideo videoId="..." />` which is slow and error-prone  
❌ **No link enrichment** - External URLs remain bare, no title/description fetched  
❌ **Scattered variables** - Media data flows through multiple disconnected variables

---

## 🏗️ New System Architecture

### Core Concepts

#### 1. Natural Markdown Input
Users write normal markdown with:
- Plain URLs (system detects and categorizes)
- Natural annotations (AI extracts context)
- Simple notes about media purpose

**Example:**
```markdown
## Video Evidence

This body camera footage shows the initial encounter:
https://example.com/bodycam.mp4

The officer approached with weapon drawn.
```

#### 2. `processingState` Object
Central data structure passed through all phases:

```javascript
const processingState = {
  // Media registry with IDs as keys
  media: {
    'media-0': {
      type: 'video',
      intrinsic: {
        videoId: 'abc123',
        sourceUrl: 'https://...',
        fileName: 'bodycam.mp4',
        addedAt: '2025-11-15T...',
        assetId: 'video-uuid-...'
      },
      contextual: {
        caption: 'Body camera footage...',
        alt: 'Officer approaching with weapon',
        title: 'Initial Encounter',
        placement: 'featured',
        featured: true
      },
      component: '<CloudflareVideo videoId="{{VIDEO_ID}}" caption="{{CAPTION}}" />'
    },
    'media-1': { /* ... */ }
  },
  
  // External link registry
  links: {
    'link-0': {
      url: 'https://news.example.com/article',
      title: 'Local News Coverage',  // Fetched from <title>
      description: 'Article about...',  // Fetched from <meta>
      icon: 'news',  // Auto-determined or AI-suggested
      foundAt: 126  // Character position in markdown
    }
  },
  
  // Processed markdown with placeholders
  markdown: '...The officer approached [MEDIA:media-0] with weapon drawn...',
  
  // Article metadata (generated in Phase 4)
  articleMetadata: {
    // ALL processed media goes here (complete registry)
    videos: [
      { videoId: 'abc123', caption: '...', featured: true }
    ],
    images: [
      { imageId: 'xyz789', alt: '...', caption: '...' }
    ],
    documents: [
      { title: '...', description: '...', url: 'https://r2.../doc.pdf' }
    ],
    external_links: [
      { title: '...', url: '...', description: '...' }
    ],
    // Plus all other frontmatter fields (title, victim_name, etc.)
  }
};
```

#### 3. Placeholder System
URLs are replaced with `[MEDIA:media-0]` markers:
- Preserves location context for AI analysis
- Allows flexible placement decisions
- Maintains clean markdown structure

#### 4. Component Pre-Generation
- **Phase 1:** Create base components with `{{PLACEHOLDERS}}`
- **Phase 3:** AI fills contextual placeholders (caption, alt, title)
- **Phase 5:** Programmatic string replacement (fast, reliable)
- **Phase 6:** AI places finalized components in article

#### 5. Complete Frontmatter Registry
- **ALL media goes into frontmatter arrays** (videos, images, documents, external_links)
- AI chooses what to place in article body during Phase 6
- Astro templates extract "used vs. unused" for "Related Media" sections
- Nothing is lost; full registry preserved

---

## 🔄 Six-Phase Processing Pipeline

### Phase 1: Media Detection & Upload

**Purpose:** Detect URLs, categorize as media vs. links, upload media to Cloudflare

**Input:** Raw markdown draft  
**Output:** `processingState` with media registry and placeholder markdown

**Steps:**

1. **Extract all URLs** from markdown using regex
   ```javascript
   const urls = extractUrlsFromMarkdown(draftContent);
   // ['https://example.com/video.mp4', 'https://news.com/article', ...]
   ```

2. **Categorize URLs** using heuristics + AI for ambiguous cases
   ```javascript
   const categorized = await categorizeUrls(urls, draftContent);
   // {
   //   videos: ['https://example.com/video.mp4'],
   //   images: ['https://example.com/photo.jpg'],
   //   documents: ['https://example.com/doc.pdf'],
   //   links: ['https://news.com/article']
   // }
   ```

3. **For each media URL:**
   - Download file to `.temp-uploads/`
   - Upload to appropriate Cloudflare service
   - Add to `media-library.json` (check for duplicates first)
   - Generate media ID (e.g., `media-0`, `media-1`)
   - Create base component with `{{PLACEHOLDERS}}`:
     ```javascript
     component: '<CloudflareVideo videoId="{{VIDEO_ID}}" caption="{{CAPTION}}" title="{{TITLE}}" />'
     ```
   - Store intrinsic properties (videoId, imageId, fileName, sourceUrl, assetId)

4. **Replace URLs with placeholders** in markdown:
   ```markdown
   Body camera footage [MEDIA:media-0] shows the encounter.
   ```

5. **Initialize processingState:**
   ```javascript
   processingState = {
     media: { 'media-0': {...}, 'media-1': {...} },
     links: {},
     markdown: '...with placeholders...',
     articleMetadata: {}
   };
   ```

**Dependencies:**
- `file-downloader.js` - URL extraction, download, conversion
- `cloudflare-stream.js` - Video upload
- `cloudflare-images.js` - Image upload
- `cloudflare-r2.js` - Document upload
- `media-library.js` - Deduplication and registry

---

### Phase 2: Link Enrichment

**Purpose:** Fetch metadata (title, description) from external link URLs

**Input:** `processingState` with links array  
**Output:** `processingState` with enriched links

**Steps:**

1. **For each link URL:**
   - Fetch HTML content
   - Extract `<title>` tag
   - Extract `<meta name="description">` tag
   - Extract `<meta property="og:description">` (fallback)
   - Determine icon/category (news, legal, government, social)

2. **Store enriched link data:**
   ```javascript
   links['link-0'] = {
     url: 'https://news.example.com/article',
     title: 'Local Coverage of Incident',  // From <title>
     description: 'Article describes...',   // From <meta>
     icon: 'news',
     foundAt: 126  // Character position
   };
   ```

3. **Handle errors gracefully:**
   - If fetch fails, use URL as title
   - If no description, leave blank

**Dependencies:**
- `node-fetch` or `axios` for HTTP requests
- HTML parser (e.g., `cheerio`)

---

### Phase 3: Contextual Metadata Extraction

**Purpose:** AI analyzes markdown context around each `[MEDIA:xxx]` placeholder

**Input:** `processingState` with placeholder markdown  
**Output:** `processingState` with contextual properties filled

**Steps:**

1. **Send to AI:**
   - Markdown with placeholders
   - Media registry (intrinsic properties only)
   - Request: extract contextual metadata for each media item

2. **AI returns contextual layer:**
   ```javascript
   {
     'media-0': {
       caption: 'Body camera footage shows officer approaching with weapon drawn',
       alt: 'Police officer approaching subject with gun drawn',
       title: 'Initial Encounter',
       placement: 'featured',  // featured | inline | supporting
       featured: true
     },
     'media-1': { /* ... */ }
   }
   ```

3. **Merge contextual data into processingState:**
   ```javascript
   processingState.media['media-0'].contextual = aiResponse['media-0'];
   ```

**AI Prompt Structure:**
```
You are analyzing a draft article to extract contextual metadata for media.

Draft (with placeholders):
[markdown content]

Media Registry:
{media-0: {type: 'video', videoId: '...'}, ...}

For each [MEDIA:xxx] placeholder, analyze surrounding context and return:
- caption: Descriptive caption based on context
- alt: Accessible alt text (images only)
- title: Brief title/heading
- placement: featured | inline | supporting
- featured: true/false (only ONE should be featured)

Return JSON:
{"media-0": {...}, "media-1": {...}}
```

**Dependencies:**
- `@anthropic-ai/sdk` - Claude API
- `ai-prompts.js` - Prompt templates

---

### Phase 4: Article Metadata Extraction

**Purpose:** AI extracts all frontmatter fields (victim_name, incident_date, etc.)

**Input:** `processingState` with full media and link data  
**Output:** `processingState.articleMetadata` populated

**Steps:**

1. **Transform media registry into frontmatter arrays:**
   ```javascript
   articleMetadata.videos = Object.values(processingState.media)
     .filter(m => m.type === 'video')
     .map(m => ({
       videoId: m.intrinsic.videoId,
       caption: m.contextual.caption,
       featured: m.contextual.featured || false
     }));
   
   articleMetadata.images = /* similar for images */;
   articleMetadata.documents = /* similar for documents */;
   articleMetadata.external_links = Object.values(processingState.links);
   ```

2. **Send to AI for remaining metadata:**
   - Draft content (original, not placeholder version)
   - Request all schema fields (victim_name, incident_date, city, county, etc.)

3. **AI returns complete metadata:**
   ```javascript
   {
     case_id: 'ca-oakland-pd-2023-001',
     title: 'John Doe',
     victim_name: 'John Doe',
     incident_date: '2023-06-15',
     city: 'Oakland',
     county: 'Alameda',
     // ... all other fields
     videos: [...],  // Already populated above
     images: [...],
     documents: [...],
     external_links: [...]
   }
   ```

4. **Store in processingState:**
   ```javascript
   processingState.articleMetadata = aiResponse;
   ```

**Dependencies:**
- `@anthropic-ai/sdk` - Claude API
- `metadata-registry.js` - Normalize against canonical registry
- `src/content/config.ts` - Schema validation

---

### Phase 5: Component Finalization

**Purpose:** Programmatically replace `{{PLACEHOLDERS}}` in components with contextual data

**Input:** `processingState` with base components and contextual data  
**Output:** `processingState` with finalized component strings

**Steps:**

1. **For each media item:**
   ```javascript
   let component = processingState.media['media-0'].component;
   // '<CloudflareVideo videoId="{{VIDEO_ID}}" caption="{{CAPTION}}" />'
   
   const intrinsic = processingState.media['media-0'].intrinsic;
   const contextual = processingState.media['media-0'].contextual;
   
   component = component.replace('{{VIDEO_ID}}', intrinsic.videoId);
   component = component.replace('{{CAPTION}}', contextual.caption || '');
   component = component.replace('{{TITLE}}', contextual.title || '');
   // ... replace all placeholders
   
   processingState.media['media-0'].finalizedComponent = component;
   ```

2. **Add caption as markdown** (if present):
   ```javascript
   if (contextual.caption) {
     component += `\n\n*${contextual.caption}*`;
   }
   ```

3. **No AI needed** - Pure string replacement (fast, reliable)

**Dependencies:** None (pure JavaScript)

---

### Phase 6: Article Assembly

**Purpose:** AI generates final article, choosing which components to place and where

**Input:** `processingState` with finalized components and metadata  
**Output:** Complete MDX article with frontmatter

**Steps:**

1. **Send to AI:**
   - Original draft content
   - Markdown with `[MEDIA:xxx]` placeholders
   - Component map: `{'media-0': '<CloudflareVideo...>', 'media-1': '...'}`
   - Complete metadata (frontmatter)

2. **AI instructions:**
   - Replace `[MEDIA:xxx]` placeholders with components WHERE APPROPRIATE
   - AI can choose NOT to place some media (they'll appear in "Related Media")
   - Restructure article for best narrative flow
   - Write in encyclopedic tone (neutral, factual)
   - Include proper headings, timeline, etc.

3. **AI returns complete MDX:**
   ```mdx
   ---
   case_id: "ca-oakland-pd-2023-001"
   victim_name: "John Doe"
   # ... all metadata fields
   videos: [...]  # ALL videos in registry
   images: [...]  # ALL images in registry
   documents: [...] # ALL documents
   external_links: [...]
   ---

   import CloudflareVideo from '../../components/CloudflareVideo.astro';
   import CloudflareImage from '../../components/CloudflareImage.astro';

   ## Case Summary
   
   [Article content with strategically placed components]

   <CloudflareVideo videoId="abc123" caption="..." />

   [More content...]
   ```

4. **Save to content collection:**
   - Generate slug from title
   - Write to `src/content/cases/[slug].mdx` or `src/content/posts/[slug].mdx`

**Dependencies:**
- `@anthropic-ai/sdk` - Claude API
- `ai-prompts.js` - Article generation prompts

---

## 📁 New Files & Refactoring

### New Files to Create

#### `scripts/media-schema.js`
Canonical schema definitions for intrinsic vs. contextual properties:

```javascript
export const MEDIA_SCHEMAS = {
  video: {
    intrinsic: ['videoId', 'sourceUrl', 'fileName', 'assetId', 'addedAt'],
    contextual: ['caption', 'title', 'placement', 'featured']
  },
  image: {
    intrinsic: ['imageId', 'sourceUrl', 'fileName', 'assetId', 'addedAt', 'urls'],
    contextual: ['caption', 'alt', 'title', 'placement', 'featured']
  },
  document: {
    intrinsic: ['r2Key', 'publicUrl', 'sourceUrl', 'fileName', 'assetId', 'addedAt'],
    contextual: ['title', 'description']
  }
};

export const COMPONENT_TEMPLATES = {
  video: '<CloudflareVideo videoId="{{VIDEO_ID}}" caption="{{CAPTION}}" title="{{TITLE}}" />',
  image: '<CloudflareImage imageId="{{IMAGE_ID}}" alt="{{ALT}}" caption="{{CAPTION}}" title="{{TITLE}}" />',
  // Documents don't need components - they go in DocumentCard list
};
```

#### `scripts/process-draft.js`
New DraftProcessor class with phased methods:

```javascript
export class DraftProcessor {
  constructor(draftContent, draftMeta) {
    this.originalDraft = draftContent;
    this.draftMeta = draftMeta;
    this.processingState = null;
  }

  async phase1_detectAndUploadMedia() { /* ... */ }
  async phase2_enrichLinks() { /* ... */ }
  async phase3_extractContextualMetadata() { /* ... */ }
  async phase4_extractArticleMetadata() { /* ... */ }
  phase5_finalizeComponents() { /* ... */ }
  async phase6_assembleArticle() { /* ... */ }

  async process() {
    await this.phase1_detectAndUploadMedia();
    await this.phase2_enrichLinks();
    await this.phase3_extractContextualMetadata();
    await this.phase4_extractArticleMetadata();
    this.phase5_finalizeComponents();
    return await this.phase6_assembleArticle();
  }
}
```

#### `scripts/url-categorizer.js`
Smart URL categorization with heuristics and AI fallback:

```javascript
export async function categorizeUrls(urls, draftContext) {
  const categorized = { videos: [], images: [], documents: [], links: [] };
  
  for (const url of urls) {
    // Heuristic categorization
    if (isVideoUrl(url)) categorized.videos.push(url);
    else if (isImageUrl(url)) categorized.images.push(url);
    else if (isDocumentUrl(url)) categorized.documents.push(url);
    else {
      // Ambiguous - ask AI
      const category = await askAIToCategorizUrl(url, draftContext);
      categorized[category].push(url);
    }
  }
  
  return categorized;
}
```

### Files to Modify

#### `scripts/publish-draft.js`
**Changes:**
- Remove `parseMediaShortcodes()` (replaced by URL extraction)
- Remove `processVideos()`, `processImages()`, `processPDFs()` (moved to DraftProcessor)
- Replace monolithic flow with:
  ```javascript
  const processor = new DraftProcessor(draftContent, draftMeta);
  const result = await processor.process();
  ```

#### `scripts/file-downloader.js`
**Changes:**
- Keep `extractUrlsFromMarkdown()` but make it more robust
- Remove `parseMediaShortcodes()` (deprecated)
- Keep `convertToDirectUrl()`, `downloadFile()` (still needed)

#### `scripts/ai-prompts.js`
**Changes:**
- Add `createContextualMetadataPrompt()` for Phase 3
- Modify `createCaseArticlePrompt()` and `createBlogPostPrompt()` for Phase 6
  - Accept placeholder markdown
  - Accept component map
  - New instructions about placement flexibility

#### `scripts/media-library.js`
**Changes:**
- No major changes needed
- Already supports deduplication via `findAssetBySourceUrl()`

---

## 🎨 Template Updates

### Astro Layout Changes

#### Helper Function: Extract Used Media
```javascript
// src/layouts/CaseLayout.astro
function extractUsedMediaIds(content, type) {
  const regex = type === 'video' 
    ? /videoId="([^"]+)"/g 
    : /imageId="([^"]+)"/g;
  const ids = [];
  let match;
  while ((match = regex.exec(content)) !== null) {
    ids.push(match[1]);
  }
  return ids;
}

const usedVideoIds = extractUsedMediaIds(content, 'video');
const usedImageIds = extractUsedMediaIds(content, 'image');

const unusedVideos = entry.data.videos?.filter(v => !usedVideoIds.includes(v.videoId)) || [];
const unusedImages = entry.data.images?.filter(i => !usedImageIds.includes(i.imageId)) || [];
const allDocuments = entry.data.documents || [];
const allExternalLinks = entry.data.external_links || [];
```

#### Related Media Section
```astro
{(unusedVideos.length > 0 || unusedImages.length > 0 || allDocuments.length > 0) && (
  <section class="mt-12 border-t pt-8">
    <h2 class="text-2xl font-bold mb-6">Related Media & Documents</h2>
    
    {unusedVideos.length > 0 && (
      <div class="mb-8">
        <h3 class="text-xl font-semibold mb-4">Additional Videos</h3>
        <div class="grid gap-4">
          {unusedVideos.map(video => (
            <CloudflareVideo {...video} />
          ))}
        </div>
      </div>
    )}
    
    {unusedImages.length > 0 && (
      <div class="mb-8">
        <h3 class="text-xl font-semibold mb-4">Additional Images</h3>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
          {unusedImages.map(image => (
            <CloudflareImage {...image} />
          ))}
        </div>
      </div>
    )}
    
    {allDocuments.length > 0 && (
      <div class="mb-8">
        <h3 class="text-xl font-semibold mb-4">Documents</h3>
        <div class="grid gap-3">
          {allDocuments.map(doc => (
            <DocumentCard {...doc} />
          ))}
        </div>
      </div>
    )}
  </section>
)}

{allExternalLinks.length > 0 && (
  <section class="mt-8 border-t pt-8">
    <h2 class="text-2xl font-bold mb-6">External Coverage & Resources</h2>
    <div class="grid gap-3">
      {allExternalLinks.map(link => (
        <ExternalLinkCard {...link} />
      ))}
    </div>
  </section>
)}
```

---

## 🔄 Migration Strategy

### Approach: Soft Launch (Backward Compatibility)

**Phase 1: Implement New System** (Weeks 1-2)
- Create new files (`process-draft.js`, `media-schema.js`, `url-categorizer.js`)
- Implement all 6 phases
- Test with sample drafts

**Phase 2: Dual Mode Support** (Week 3)
- Detect draft format (shortcodes vs. natural markdown)
- Route to old processor for shortcodes
- Route to new processor for natural markdown
  ```javascript
  if (draftContent.includes('{{')) {
    // Old system
    const media = parseMediaShortcodes(draftContent);
    // ... existing flow
  } else {
    // New system
    const processor = new DraftProcessor(draftContent, draftMeta);
    const result = await processor.process();
  }
  ```

**Phase 3: Update Templates** (Week 4)
- Add "Related Media" sections to layouts
- Test with both old and new articles

**Phase 4: Documentation** (Week 4)
- Update `EDITING-ARTICLES.md` with natural markdown examples
- Deprecate shortcode documentation

**Phase 5: Full Cutover** (Week 5+)
- Remove old system code once all existing drafts processed
- Remove shortcode parser
- Simplify `publish-draft.js`

### Backward Compatibility Checklist

✅ Existing published articles remain unchanged  
✅ Can still process old shortcode drafts during transition  
✅ Media library continues to deduplicate across both systems  
✅ Frontmatter schemas remain the same  

---

## ✅ Testing Plan

### Unit Tests

- [ ] URL extraction from markdown (all patterns)
- [ ] URL categorization (heuristics)
- [ ] Placeholder replacement (all patterns)
- [ ] Component string replacement (all templates)
- [ ] Link enrichment (HTML parsing)

### Integration Tests

- [ ] Phase 1: Detect and upload (video, image, document)
- [ ] Phase 2: Link enrichment (title/description fetch)
- [ ] Phase 3: Contextual metadata (AI extraction)
- [ ] Phase 4: Article metadata (AI extraction)
- [ ] Phase 5: Component finalization (string replacement)
- [ ] Phase 6: Article assembly (AI generation)

### End-to-End Tests

- [ ] Process case draft with videos, images, documents, links
- [ ] Process blog post draft with images and external links
- [ ] Verify frontmatter arrays contain ALL media
- [ ] Verify "Related Media" sections display unused items
- [ ] Verify media library deduplication works

### Edge Cases

- [ ] Ambiguous URLs (need AI categorization)
- [ ] Duplicate URLs (deduplication)
- [ ] Failed uploads (retry logic)
- [ ] Missing contextual metadata (fallback to defaults)
- [ ] No featured image selected (AI picks one)
- [ ] All media unused by AI (all appear in "Related Media")

---

## 📊 Success Metrics

### User Experience
- ⏱️ **Time to draft:** <30 minutes (vs. 45+ with shortcodes)
- 🐛 **Syntax errors:** <5% (vs. 20-30% with shortcodes)
- 😊 **User satisfaction:** "Much easier" feedback

### System Performance
- ⚡ **Processing time:** <2 minutes per article (similar to current)
- 🎯 **AI accuracy:** >90% correct metadata extraction
- ♻️ **Deduplication rate:** >80% media reuse across articles

### Code Quality
- 🧩 **Modularity:** Clear separation of concerns (6 phases)
- 🧪 **Test coverage:** >80% for new code
- 📚 **Maintainability:** <500 lines per module

---

## 🚧 Open Questions & Decisions Needed

### 1. URL Ambiguity Handling
**Question:** When should we ask AI to categorize URLs vs. using heuristics?  
**Options:**
- A) Always use heuristics first, AI only for ambiguous (*.html, no extension)
- B) Ask AI for all URLs to avoid false categorization  
- C) Configurable threshold (e.g., confidence < 80% → ask AI)  

**Recommendation:** **Option A** - Heuristics for obvious cases (`.mp4`, `.jpg`, `.pdf`), AI for ambiguous

---

### 2. Link Enrichment Failure Handling
**Question:** What if we can't fetch title/description from a URL?  
**Options:**
- A) Use domain name as title (e.g., "nytimes.com")
- B) Use URL path as title (e.g., "article-about-case")
- C) Ask AI to generate title from context  

**Recommendation:** **Option C** - AI can infer from surrounding context

---

### 3. Featured Media Selection
**Question:** If user doesn't mark featured image, how do we pick one?  
**Options:**
- A) First image in draft
- B) AI picks based on context and quality
- C) Require user to mark explicitly  

**Recommendation:** **Option B** - AI picks best candidate, can be overridden

---

### 4. Component Placement Defaults
**Question:** If AI doesn't place a media item, is that intentional or error?  
**Options:**
- A) Assume intentional, show in "Related Media"
- B) Warn user and ask for confirmation
- C) Log for review but proceed  

**Recommendation:** **Option A** - Trust AI, show in "Related Media" section

---

### 5. Checkpoint/Resume Strategy
**Question:** Should we save progress between phases?  
**Options:**
- A) No checkpoints - restart on error (simple, current decision)
- B) Save after Phase 1 (uploads complete) - expensive operations preserved
- C) Save after every phase - full resume capability  

**Recommendation:** **Option A** for MVP - Keep it simple, restart on error

---

## 📅 Implementation Timeline

### Week 1: Foundation
- [ ] Create `media-schema.js` with schemas and templates
- [ ] Create `url-categorizer.js` with heuristics + AI fallback
- [ ] Implement Phase 1 (detect and upload) in `process-draft.js`
- [ ] Write unit tests for URL extraction and categorization

### Week 2: Core Processing
- [ ] Implement Phase 2 (link enrichment)
- [ ] Implement Phase 3 (contextual metadata)
- [ ] Implement Phase 4 (article metadata)
- [ ] Implement Phase 5 (component finalization)
- [ ] Write unit tests for each phase

### Week 3: AI Integration & Assembly
- [ ] Implement Phase 6 (article assembly)
- [ ] Update `ai-prompts.js` with new prompts
- [ ] Add dual-mode routing in `publish-draft.js`
- [ ] Write integration tests

### Week 4: Templates & Polish
- [ ] Update `CaseLayout.astro` with "Related Media" section
- [ ] Update `PostLayout.astro` with "Related Media" section
- [ ] Create helper functions for media extraction
- [ ] Write end-to-end tests
- [ ] Update documentation (`EDITING-ARTICLES.md`)

### Week 5: Testing & Deployment
- [ ] Process test drafts (cases and posts)
- [ ] Fix bugs and edge cases
- [ ] User acceptance testing
- [ ] Deploy to production
- [ ] Monitor first production runs

### Week 6+: Deprecation
- [ ] Remove old shortcode system (once all drafts processed)
- [ ] Clean up `publish-draft.js`
- [ ] Archive old documentation
- [ ] Celebrate! 🎉

---

## 📚 Related Documentation

- **Current System:** See `scripts/publish-draft.js` (738 lines)
- **Media Library:** See `scripts/media-library.js` and `media-library.json`
- **Content Schema:** See `src/content/config.ts`
- **Metadata Registry:** See `METADATA-REGISTRY.md` and `metadata-registry.json`
- **Editing Guide:** See `EDITING-ARTICLES.md` (will be updated)

---

## 🎯 Next Steps

1. **Review this plan** - Get stakeholder approval
2. **Set up testing environment** - Create test drafts
3. **Begin Week 1 implementation** - Start with `media-schema.js`
4. **Daily standups** - Track progress and blockers

---

**Status:** ✅ Plan complete, ready for implementation  
**Last Updated:** November 15, 2025  
**Next Review:** After Phase 1 implementation (Week 1)
