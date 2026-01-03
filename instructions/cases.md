# Case Article Instructions

**First read `instructions/common.md`** for utilities, components, and registry information.

This file covers how to create and edit police misconduct case articles.

---

## Overview

Case articles document specific incidents of police misconduct in California. They are factual, encyclopedic accounts that serve as a permanent record of what happened.

---

## Writing Tone

**Encyclopedic / Wikipedia-style:**

- Neutral, dispassionate, objective
- State facts directly without editorial commentary
- NO emotional language or dramatic framing
- Let the facts speak for themselves

| Don't Write | Write Instead |
|-------------|---------------|
| "tragically lost their life" | "died from injuries" |
| "officers brutally beat" | "officers used physical force on" |
| "shocking video shows" | "video shows" |
| "innocent victim" | "[Name]" or "the individual" |
| "unfortunately" | (omit) |

---

## Article Structure

### Required Sections

1. **Opening Summary** (no heading)
   - Who, what, when, where
   - 2-3 paragraphs of essential facts
   - Most important information first

2. **Incident Details** or **Timeline**
   - Chronological account of events
   - Use `## Timeline` if you have specific times/sequence
   - Otherwise use `## The Incident` or similar

3. **Investigation / Legal Developments**
   - What happened after the incident
   - Criminal investigation status
   - Civil lawsuit if applicable
   - Any disciplinary actions

### Optional Sections (if information available)
- `## Background` - Context about the victim or situation
- `## Officers Involved` - Named officers and their roles
- `## Community Response` - Protests, statements, etc.
- `## Related Cases` - Links to similar incidents

### Sections NOT to Include
- `## Sources` - handled in frontmatter
- `## Related Documents` - rendered automatically from frontmatter
- `## External Links` - rendered automatically from frontmatter

---

## Frontmatter Schema

All case articles require this frontmatter structure:

```yaml
---
title: "Victim Full Name"                    # REQUIRED - victim's name
description: "Brief summary of incident..."  # REQUIRED - max 100 words
incident_date: "2024-03-15"                  # YYYY-MM-DD or null
published: true
notes_file: "notes/cases/victim-name.md"     # Path to notes file

# Location
city: "Los Angeles"                          # REQUIRED
county: "Los Angeles"                        # REQUIRED - from registry

# Demographics
age: 39                                      # number or null
race: "Black"                                # string or null - NEVER assume
gender: "Male"                               # "Male"|"Female"|"Non-binary" or null

# Agency
agencies: ["Los Angeles Police Department"] # REQUIRED - array, from registry

# Incident Details
cause_of_death: "Gunshot wounds"            # string or null
armed_status: "Unarmed"                     # "Armed"|"Unarmed"|"Unknown" or null
threat_level: "No Threat"                   # from registry or null
force_type: ["Shooting"]                    # array from registry or null
shooting_officers: ["Officer Name"]         # array or null

# Legal Status
investigation_status: "Under Investigation" # from registry or null
charges_filed: false                        # true|false|null
civil_lawsuit_filed: true                   # true|false|null
bodycam_available: true                     # true|false|null

# Media
featured_image:                             # object or null
  imageId: "cloudflare-uuid"
  alt: "Description"
  caption: "Optional caption"
documents: []                               # array of {title, description, url}
external_links: []                          # array of {title, description, url, icon}
---
```

---

## What You CAN Infer

- **Gender** from pronouns: he/him → "Male", she/her → "Female"
- **Age** from phrases: "39-year-old" → 39
- **Force types** from actions: "shot" → "Shooting", "tased" → "Taser"
- **Armed status** from descriptions: "unarmed", "had no weapons" → "Unarmed"
- **Threat level** from behavior described
- **Civil lawsuit** from mentions of legal filings
- **Bodycam** if footage is mentioned or referenced

## What You CANNOT Infer

- **Race/ethnicity** - NEVER assume from name or location. Must be explicitly stated.
- **Exact dates** - "October 2022" without day → use null
- **Officer names** - unless specifically named
- **Legal outcomes** - unless explicitly stated

**When unsure, ASK:** "The notes don't specify race - should I leave it null or do you have that information?"

---

## Media Placement

- Place the featured image or primary video near the top (after opening paragraph)
- Place bodycam/surveillance footage in the incident details section
- Place documents where they're referenced in the text
- Reference documents naturally: "According to the civil complaint filed in federal court..."

---

## Example Article

```mdx
---
title: "John Doe"
description: "John Doe died after a physical altercation with Los Angeles Police Department officers during a traffic stop on March 15, 2024."
incident_date: "2024-03-15"
published: true
notes_file: "notes/cases/john-doe.md"
city: "Los Angeles"
county: "Los Angeles"
age: 34
race: null
gender: "Male"
agencies: ["Los Angeles Police Department"]
cause_of_death: "Asphyxiation"
armed_status: "Unarmed"
threat_level: "Low"
force_type: ["Physical Force", "Restraint"]
shooting_officers: null
investigation_status: "Under Investigation"
charges_filed: null
civil_lawsuit_filed: true
bodycam_available: true
featured_image:
  imageId: "abc123-uuid"
  alt: "Intersection of Main St and 5th Ave"
  caption: "Location where the incident occurred"
documents:
  - title: "Civil Complaint"
    description: "Federal lawsuit filed by the family"
    url: "https://..."
external_links: []
---

import CloudflareImage from '../../components/CloudflareImage.astro';
import CloudflareVideo from '../../components/CloudflareVideo.astro';

John Doe, 34, died on March 15, 2024, following a physical altercation with Los Angeles Police Department officers during a traffic stop. Officers applied a restraint hold that resulted in Doe losing consciousness. He was pronounced dead at the scene.

<CloudflareImage imageId="abc123-uuid" alt="Intersection of Main St and 5th Ave" caption="Location where the incident occurred" />

## The Incident

At approximately 2:30 PM, officers initiated a traffic stop on Doe's vehicle near the intersection of Main Street and 5th Avenue. According to witness statements, Doe initially complied with officer instructions.

The situation escalated when officers attempted to remove Doe from his vehicle. Bodycam footage shows officers applying physical force to gain compliance.

<CloudflareVideo videoId="def456-uuid" caption="Bodycam footage of the incident" />

## Investigation

The Los Angeles County District Attorney's Office opened an investigation following the incident. As of this writing, no charges have been filed against the officers involved.

Doe's family filed a federal civil rights lawsuit in April 2024, alleging excessive force and wrongful death. The lawsuit, filed in the Central District of California, seeks unspecified damages.
```

---

## Workflow Checklist

1. [ ] Read `instructions/common.md`
2. [ ] Read `data/metadata-registry.json` for canonical values
3. [ ] **Create notes file FIRST** at `notes/cases/victim-name.md` (see Notes File section below)
4. [ ] Read the user's notes/research, add to notes file
5. [ ] Research: search web, update notes file with each source visited
6. [ ] Ask clarifying questions if needed
7. [ ] Upload any media using CLI utilities, update notes with media IDs
8. [ ] Generate frontmatter with all available fields
9. [ ] Write article body following structure guidelines
10. [ ] Finalize notes file with edit history
11. [ ] Ask user to review, iterate as needed

---

## Notes File

**Create the notes file FIRST before any research.** Update it continuously as you work.

### Notes File Location
- Cases: `notes/cases/victim-name.md`
- Posts: `notes/posts/article-slug.md`

### Required Sections

```markdown
# [Victim Name] Case Notes

## Case Summary
- **Victim**: [Name, age, demographics]
- **Date**: [Incident date]
- **Location**: [City, county]
- **Agency**: [Department name]
- **Outcome**: [Current status]

## Research Log
<!-- Update this section as you research. Log EVERY source visited. -->

### [Timestamp or sequence number]
- **Source**: [URL or description]
- **Found**: [What information was gathered]
- **Status**: [Useful / Not useful / Needs follow-up]

### [Next source...]

## Key Facts
<!-- Bullet points of confirmed facts -->

## Sources
<!-- Final list of sources used in article -->

## Media
- **Featured Image**: [Description and Cloudflare ID]
- **Video**: [Description and Cloudflare Stream ID]

## Data Source
<!-- If from dataset, include the raw data -->

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
- **Query**: "John Doe LAPD shooting 2024"
- **Source**: Google search results
- **Found**: 3 relevant articles from LA Times, ABC7, NBC LA
- **Status**: Will fetch each article

### 2. LA Times article
- **Source**: https://latimes.com/...
- **Found**: Incident date (March 15), location (downtown LA), victim age (34)
- **Status**: Useful - primary source

### 3. ABC7 article
- **Source**: https://abc7.com/...
- **Found**: Body camera footage exists, family statement
- **Status**: Useful - adds context

### 4. DA website check
- **Source**: https://da.lacounty.gov/reports/ois/2024
- **Found**: No report published yet
- **Status**: Note in article as pending

### 5. LASD transparency page
- **Source**: https://lasd.org/transparency/...
- **Found**: Official summary PDF available
- **Status**: Added to documents list
```

This creates an audit trail of how the article was researched and what sources informed each fact.
