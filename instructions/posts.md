# Blog Post Instructions

**First read `instructions/common.md`** for utilities, components, and registry information.

This file covers how to create and edit blog posts about police misconduct, legal topics, and civil rights issues.

---

## Overview

Blog posts are educational and informative articles that explain legal concepts, analyze legislation, discuss policy issues, and provide context on police accountability topics. Unlike case articles, posts are more engaging and can include the author's analysis.

---

## Writing Tone

**Engaging and Informative:**

- Professional but conversational
- Explain legal concepts clearly for a general audience
- Use active voice
- Be informative without being dry
- Analysis and context are welcome (unlike case articles)

| Don't Write | Write Instead |
|-------------|---------------|
| "This doctrine is complex and..." | "Understanding qualified immunity starts with..." |
| "It should be noted that..." | (just state it directly) |
| "In conclusion..." | (use Key Takeaways section instead) |
| Dense legal jargon | Plain language explanations |

---

## Article Structure

### Required Sections

1. **Opening** (no heading)
   - Hook the reader with why this matters
   - 1-2 paragraphs introducing the topic
   - What will the article cover?

2. **Body Sections** (use descriptive `##` headings)
   - Break down the topic logically
   - Each section should have a clear purpose
   - Use subheadings `###` if sections are long

3. **Key Takeaways** (required)
   - `## Key Takeaways`
   - 3-5 bullet points summarizing main points
   - Clear, actionable insights
   - What should the reader remember?

### Optional Sections
- `## Background` - Historical context
- `## How This Affects You` - Practical implications
- `## What Comes Next` - Future developments
- `## Common Misconceptions` - Clarifying confusion

### Sections NOT to Include
- `## Sources` - reference naturally in text
- `## Related Documents` - rendered automatically
- `## External Links` - rendered automatically
- `## Conclusion` - use Key Takeaways instead

---

## Frontmatter Schema

Blog posts have a simpler frontmatter structure:

```yaml
---
title: "Clear, Engaging Title"              # REQUIRED - 5-10 words
description: "SEO summary of the post..."   # REQUIRED - 15-25 words
published_date: "2024-03-15"                # REQUIRED - YYYY-MM-DD
published: true
notes_file: "notes/posts/article-slug.md"   # Path to notes file
tags: ["Police Accountability", "California Legislation"]  # REQUIRED - from registry

# Media (all optional)
featured_image:
  imageId: "cloudflare-uuid"
  alt: "Description"
  caption: "Optional caption"
documents: []
external_links: []
---
```

---

## Tags

Tags help readers find related content. Read `data/metadata-registry.json` for existing tags.

### Existing Tags (from registry)
- Use exact tag names from the registry
- Select 2-5 relevant tags per post
- Tags are Title Case

### Creating New Tags
- If a topic isn't covered by existing tags, create a new one
- Keep tags to 1-3 words
- Make them reusable (not too specific to one post)

**Examples:**
- Good: "Qualified Immunity", "Use of Force", "Body Cameras"
- Too specific: "SB 447 January 2026 Expiration"

**When unsure, ASK:** "Should I use the existing 'Police Accountability' tag or create a new 'Accountability Reform' tag?"

---

## Media Placement

- Featured image at the top (after opening paragraph) if available
- Additional images/videos where they enhance understanding
- Reference documents naturally in the text
- External links (news articles, YouTube videos) can be embedded or linked inline

---

## Example Article

```mdx
---
title: "Understanding Qualified Immunity in Police Misconduct Cases"
description: "A clear explanation of qualified immunity, how it protects police officers, and recent efforts to reform this legal doctrine."
published_date: "2024-03-15"
published: true
notes_file: "notes/posts/understanding-qualified-immunity.md"
tags: ["Qualified Immunity", "Police Accountability", "Civil Rights"]
featured_image:
  imageId: "abc123-uuid"
  alt: "Courthouse steps"
  caption: "Federal courts play a key role in qualified immunity decisions"
documents: []
external_links:
  - title: "Recent Supreme Court Decision"
    description: "Coverage of the 2023 ruling"
    url: "https://..."
    icon: "news"
---

import CloudflareImage from '../../components/CloudflareImage.astro';

When someone's civil rights are violated by police, they might assume they can sue and recover damages. But a legal doctrine called qualified immunity often stands in the way. Understanding how this works is essential for anyone following police accountability issues.

<CloudflareImage imageId="abc123-uuid" alt="Courthouse steps" caption="Federal courts play a key role in qualified immunity decisions" />

## What Is Qualified Immunity?

Qualified immunity is a judicial doctrine that protects government officials—including police officers—from civil lawsuits unless they violated "clearly established" law. In practice, this means officers can only be held liable if a previous court case with nearly identical facts already ruled the conduct unconstitutional.

This creates a catch-22: without prior cases, there's no "clearly established" law, so officers get immunity. But without being able to sue, plaintiffs can't create new precedent.

## How Courts Apply the Standard

When evaluating qualified immunity claims, courts ask two questions:

1. Did the officer violate a constitutional right?
2. Was that right "clearly established" at the time?

Even if the answer to the first question is yes, officers can still receive immunity if no prior case established the specific right in a sufficiently similar context.

## Recent Reform Efforts

Several states have taken action to limit or eliminate qualified immunity at the state level. Colorado became the first state to eliminate it entirely for civil rights claims in state court. New Mexico and New York City have followed with similar measures.

At the federal level, the George Floyd Justice in Policing Act included qualified immunity reform, but the bill has not passed the Senate.

## Key Takeaways

- **Qualified immunity** protects officers unless they violated "clearly established" law
- **The standard is strict** - plaintiffs must find prior cases with nearly identical facts
- **State-level reform** is happening, with Colorado, New Mexico, and others limiting the doctrine
- **Federal reform** remains stalled despite bipartisan interest
- **Understanding this doctrine** helps explain why many police misconduct lawsuits fail
```

---

## Workflow Checklist

1. [ ] Read `instructions/common.md`
2. [ ] Read `data/metadata-registry.json` for existing tags
3. [ ] **Create notes file FIRST** at `notes/posts/article-slug.md` (see Notes File section below)
4. [ ] Read the user's topic/research notes, add to notes file
5. [ ] Research: search web, update notes file with each source visited
6. [ ] Ask clarifying questions if needed
7. [ ] Upload any media using CLI utilities, update notes with media IDs
8. [ ] Generate frontmatter with appropriate tags
9. [ ] Write article body with Key Takeaways section
10. [ ] Finalize notes file with edit history
11. [ ] Ask user to review, iterate as needed

---

## Notes File

**Create the notes file FIRST before any research.** Update it continuously as you work.

### Notes File Location
- Posts: `notes/posts/article-slug.md`

### Required Sections

```markdown
# [Article Title] - Post Notes

## Post Summary
- **Topic**: [Brief description]
- **Purpose**: [What the article aims to explain/cover]
- **Target audience**: [Who this is for]

## Research Log
<!-- Update this section as you research. Log EVERY source visited. -->

### [Timestamp or sequence number]
- **Source**: [URL or description]
- **Found**: [What information was gathered]
- **Status**: [Useful / Not useful / Needs follow-up]

### [Next source...]

## Key Points to Cover
<!-- Main points the article should address -->

## Sources
<!-- Final list of sources used in article -->

## Media
- **Featured Image**: [Description and Cloudflare ID]
- **Additional Media**: [Any other images/videos]

## Tags Used
<!-- List of tags from registry -->

## Open Questions
<!-- Anything unresolved or needing clarification -->

## Edit History
- [Date]: Initial article created
- [Date]: [Any updates]
```

### Research Log Best Practices

Log each research step as you go:

```markdown
## Research Log

### 1. Initial web search
- **Query**: "qualified immunity reform 2024"
- **Source**: Google search results
- **Found**: Recent articles from Reuters, NPR, legal blogs
- **Status**: Will fetch each article

### 2. Reuters article
- **Source**: https://reuters.com/...
- **Found**: Latest Supreme Court ruling details, state reform updates
- **Status**: Useful - good overview

### 3. State legislature check
- **Source**: https://leginfo.legislature.ca.gov/...
- **Found**: California AB 1234 text and status
- **Status**: Useful - primary source for legislation

### 4. Legal blog analysis
- **Source**: https://lawblog.com/...
- **Found**: Expert analysis on implications
- **Status**: Useful - adds context
```

This creates an audit trail of how the article was researched and what sources informed each fact.

---

## Common Post Topics

For reference, here are typical blog post topics:

- **Legislation explainers** - What a new law does and means
- **Legal concept breakdowns** - Qualified immunity, Section 1983, etc.
- **Policy analysis** - Body camera requirements, use of force policies
- **Reform efforts** - Decertification, civilian oversight, etc.
- **Case analysis** - Lessons from significant cases (different from case articles)
- **Rights education** - "Know your rights" content
- **Data/trends** - Analysis of police misconduct data
