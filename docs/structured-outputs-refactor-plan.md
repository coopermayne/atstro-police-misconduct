# Structured Outputs Refactor Plan

## Overview

Refactor AI-powered content generation to use Claude's Structured Outputs for guaranteed schema compliance and consistency. This will eliminate regex parsing, validation logic, and schema mismatches while expanding to all 37 dataset fields.

---

## Goals

1. **Implement Structured Outputs** for all AI responses (metadata extraction, article generation)
2. **Expand to 37 fields** from the dataset for case articles
3. **Separate enum fields from extendable fields** in the architecture
4. **Update metadata registry** to only track extendable lists (not enums)
5. **Migrate existing MDX files** to include new metadata fields
6. **Use Assistant prefill** to control response format without preamble

---

## Phase 1: Field Analysis & Categorization

### 1.1 Complete Dataset Field List (37 Fields)

Below are all fields from the case article dataset with initial categorization:

| # | Field Name | Type | Category | Notes / Mapping |
|---|------------|------|----------|-----------------|
| 1 | `name` | String | - | Victim's full name → maps to `title` |
| 2 | `age` | Number \| null | - | Victim's age |
| 3 | `gender` | String \| null | **ENUM** | ["Male", "Female", "Non-binary"] |
| 4 | `race` | String \| null | - | Never infer/assume, must be stated |
| 5 | `victim_image` | Object \| null | - | Featured image → maps to `featured_image` |
| 6 | `date` | String \| null | - | Incident date (YYYY-MM-DD) → maps to `incident_date` |
| 7 | `street_address` | String \| null | - | Street address of incident |
| 8 | `city` | String | - | City name (required) |
| 9 | `state` | String | **ENUM** | US state code ["CA", "TX", ...] or full names |
| 10 | `zip` | String \| null | - | ZIP/postal code |
| 11 | `county` | String | **EXTENDABLE** | County name (from registry) |
| 12 | `agency_responsible` | Array\<String\> | **EXTENDABLE** | Law enforcement agencies → maps to `agencies` |
| 13 | `cause_of_death` | String \| null | - | Medical cause of death |
| 14 | `circumstances` | String | - | Narrative description (may be article content, not metadata) |
| 15 | `disposition_official` | String \| null | **EXTENDABLE** | Official disposition → maps to `investigation_status` |
| 16 | `officer_charged` | Boolean \| null | - | Whether officer(s) were charged → maps to `charges_filed` |
| 17 | `news_urls` | Array\<String\> | - | News article URLs → maps to `external_links` |
| 18 | `signs_of_mental_illness` | Boolean \| null | - | Whether victim showed signs of mental illness |
| 19 | `allegedly_armed` | String \| null | **ENUM** | Armed status → maps to `armed_status` ["Armed", "Unarmed", "Unknown"] |
| 20 | `wapo_armed` | String \| null | **ENUM** | Washington Post armed classification ["gun", "knife", "vehicle", "unarmed", etc.] |
| 21 | `wapo_threat_level` | String \| null | **ENUM** | WaPo threat level ["attack", "other", "undetermined"] |
| 22 | `wapo_flee` | String \| null | **ENUM** | Fleeing status ["Not fleeing", "Car", "Foot", "Other"] |
| 23 | `wapo_body_camera` | Boolean \| null | - | Body camera footage available → maps to `bodycam_available` |
| 24 | `wapo_id` | String \| null | - | Washington Post database ID |
| 25 | `off_duty_killing` | Boolean \| null | - | Whether officer was off-duty |
| 26 | `geography` | String \| null | **ENUM** | Location type ["Urban", "Suburban", "Rural"] |
| 27 | `mpv_id` | String \| null | - | Mapping Police Violence database ID |
| 28 | `fe_id` | String \| null | - | Fatal Encounters database ID |
| 29 | `encounter_type` | String \| null | **EXTENDABLE** | Type of encounter (traffic stop, mental health call, etc.) |
| 30 | `initial_reason` | String \| null | - | Reason for initial police contact |
| 31 | `officer_names` | Array\<String\> \| null | - | Names of involved officers → maps to `shooting_officers` |
| 32 | `officer_races` | Array\<String\> \| null | **EXTENDABLE** | Races of involved officers |
| 33 | `officer_known_past_shootings` | Number \| null | - | Count of officer's prior shooting incidents |
| 34 | `call_for_service` | String \| null | - | Type of call that initiated encounter |
| 35 | `tract` | String \| null | - | Census tract identifier |
| 36 | `latitude` | Number \| null | - | Incident location latitude |
| 37 | `longitude` | Number \| null | - | Incident location longitude |

**Field Mappings to Current Schema:**

These dataset fields map to existing schema fields:
- `name` → `title`
- `date` → `incident_date`
- `victim_image` → `featured_image`
- `agency_responsible` → `agencies`
- `disposition_official` → `investigation_status`
- `officer_charged` → `charges_filed`
- `news_urls` → `external_links`
- `allegedly_armed` → `armed_status`
- `wapo_body_camera` → `bodycam_available`
- `officer_names` → `shooting_officers`

**New Fields to Add:**

These fields don't currently exist and need to be added:
- `street_address`, `state`, `zip` (location details)
- `signs_of_mental_illness`, `off_duty_killing` (incident flags)
- `wapo_*` fields (Washington Post dataset attributes)
- `mpv_id`, `fe_id` (external database IDs)
- `encounter_type`, `initial_reason`, `call_for_service` (encounter context)
- `officer_races`, `officer_known_past_shootings` (officer details)
- `geography` (location classification)
- `tract`, `latitude`, `longitude` (geographic data)

**Action Items:**
- [ ] Review categorizations (ENUM vs EXTENDABLE vs free-form)
- [ ] Decide on final field names (dataset names vs. schema-friendly names)
- [ ] Determine which fields should be in frontmatter vs. content
- [ ] Document any fields that need special handling

### 1.2 Categorize Fields

**ENUM Fields (Fixed Values - Controlled by Schema):**

These fields have a predefined set of allowed values and should be controlled by JSON Schema enums:

1. **`gender`**: `["Male", "Female", "Non-binary"]` (nullable)
2. **`state`**: US state codes or full names (nullable)
   - Use two-letter codes: `["AL", "AK", "AZ", ... "WY"]`
   - Or consider full names for clarity
3. **`armed_status`**: `["Armed", "Unarmed", "Unknown"]` (nullable)
   - Maps from `allegedly_armed` field
4. **`wapo_armed`**: Washington Post armed classification (nullable)
   - `["gun", "knife", "vehicle", "toy weapon", "unarmed", "undetermined"]`
   - Based on WaPo dataset schema
5. **`wapo_threat_level`**: Washington Post threat assessment (nullable)
   - `["attack", "other", "undetermined"]`
6. **`wapo_flee`**: Fleeing status (nullable)
   - `["Not fleeing", "Car", "Foot", "Other"]`
7. **`geography`**: Location type (nullable)
   - `["Urban", "Suburban", "Rural"]`
8. **`link.icon`**: External link icon type
   - `["video", "news", "generic"]` (existing)

**Why ENUM?**
- Fixed, well-defined categories from established datasets (WaPo)
- Consistent filtering and aggregation needed
- No expectation of new values emerging
- Standardized across sources

**EXTENDABLE Fields (Dynamic Values - Registry-Tracked):**

These fields can use existing registry values OR create new ones as cases emerge:

1. **`agencies`** (Array\<String\>): Law enforcement agencies
   - Maps from `agency_responsible`
   - Example: "Los Angeles Police Department", "Stanislaus County Sheriff's Department"
   - AI should match abbreviations to full names from registry

2. **`county`** (String): County name
   - Example: "Los Angeles County", "Stanislaus County"
   - Can be inferred from city if needed

3. **`force_type`** (Array\<String\>): Types of force used (existing)
   - Example: "Shooting", "Taser", "Physical Force", "Restraint"
   - Can infer from incident description

4. **`investigation_status`** (String): Current investigation/legal status (existing)
   - Maps from `disposition_official`
   - Example: "Under Investigation", "Charges Filed", "No Charges", "Settlement Reached"

5. **`encounter_type`** (String): Type of police encounter
   - Example: "Traffic Stop", "Mental Health Call", "Domestic Disturbance", "Warrant Service"
   - Contextualizes how encounter began

6. **`officer_races`** (Array\<String\>): Races of involved officers
   - Example: "White", "Black", "Hispanic", "Asian"
   - Only include if explicitly stated

7. **`post_tags`** (Array\<String\>): Topic tags for blog posts (existing)
   - Example: "California Legislation", "Use of Force", "Qualified Immunity"

**Why EXTENDABLE?**
- Proper nouns (agencies, locations) naturally vary
- New encounter types and force types can emerge
- Maintains consistency while allowing flexibility
- Registry provides autocomplete-like suggestions for AI

**Decision Matrix:**

| Question | Answer | Category |
|----------|--------|----------|
| Are there a fixed, predefined set of values? | Yes | ENUM |
| Could new values emerge over time? | Yes | EXTENDABLE |
| Is this a proper noun (name, place, organization)? | Yes | EXTENDABLE |
| Is this a controlled vocabulary/ontology? | Yes | ENUM |
| Should users be able to filter by exact values? | Yes (critical) | ENUM |
| Should users be able to filter by exact values? | Yes (nice to have) | EXTENDABLE |

**FREE-FORM Fields (No Constraints):**

These fields accept any value and don't need enum or registry tracking:

**String Fields:**
- `title` (maps from `name`) - Victim's full name
- `description` - Article summary/meta description
- `city` - City name
- `street_address` - Street address
- `zip` - ZIP/postal code
- `cause_of_death` - Medical cause of death
- `initial_reason` - Reason for police contact
- `call_for_service` - Type of service call
- `tract` - Census tract identifier
- `wapo_id`, `mpv_id`, `fe_id` - External database IDs

**Number Fields:**
- `age` - Victim's age
- `officer_known_past_shootings` - Count of prior shootings by officer
- `latitude`, `longitude` - Geographic coordinates

**Boolean Fields:**
- `published` - Publication status (typically set to true)
- `charges_filed` (maps from `officer_charged`) - Whether charges were filed
- `civil_lawsuit_filed` - Whether civil suit was filed
- `bodycam_available` (maps from `wapo_body_camera`) - Body camera footage exists
- `signs_of_mental_illness` - Victim showed signs of mental illness
- `off_duty_killing` - Officer was off-duty

**Array Fields:**
- `shooting_officers` (maps from `officer_names`) - Names of involved officers
- `external_links` (maps from `news_urls`) - News articles and sources
- `documents` - Legal documents and reports

**Object Fields:**
- `featured_image` (maps from `victim_image`) - Featured image with alt/caption

**Special Consideration - `circumstances` Field:**

The `circumstances` field in the dataset contains narrative descriptions of the incident. This is likely better suited as **article content** rather than frontmatter metadata. Consider:
- Using it as a draft/summary for the AI to expand into full article content
- Storing as a separate field only if needed for data analysis
- Excluding from frontmatter schema if it duplicates article body

**Summary of Categorization:**

From the 37 dataset fields:
- **8 ENUM fields**: Fixed vocabularies controlled by JSON Schema (gender, state, armed_status, wapo_armed, wapo_threat_level, wapo_flee, geography, link.icon)
- **6 EXTENDABLE fields**: Registry-tracked values that can grow (agencies, county, force_type, investigation_status, encounter_type, officer_races)
- **23 FREE-FORM fields**: No constraints (names, dates, IDs, coordinates, booleans, etc.)
- **1 CONTENT field**: `circumstances` - better suited for article body than frontmatter

This architecture ensures:
- **Consistency** through enums for standardized categories
- **Flexibility** through extendable fields for evolving vocabularies
- **Simplicity** through free-form fields where constraints don't add value

**Action Items:**
- [ ] Review categorizations (ENUM vs EXTENDABLE vs free-form)
- [ ] Decide on final field names (dataset names vs. schema-friendly names)
- [ ] Determine which fields should be in frontmatter vs. content (especially `circumstances`)
- [ ] Document any fields that need special handling
- [ ] Confirm Washington Post enum values match their actual schema
- [ ] Decide if all 37 fields belong in frontmatter or if some should be content-only

---

## Phase 2: Schema Design

### 2.1 Design JSON Schemas for Structured Outputs

Create three JSON schemas:

#### A. Case Metadata Schema (`schemas/case-metadata-schema.json`)

**Structure:**
```javascript
{
  "type": "object",
  "properties": {
    // String fields
    "title": { "type": "string" },
    "description": { "type": "string" },
    "city": { "type": "string" },

    // Date fields with format validation
    "incident_date": {
      "oneOf": [
        { "type": "string", "format": "date" },
        { "type": "null" }
      ]
    },

    // Nullable number fields
    "age": {
      "oneOf": [
        { "type": "number" },
        { "type": "null" }
      ]
    },

    // ENUM fields (fixed values)
    "armed_status": {
      "oneOf": [
        { "type": "string", "enum": ["Armed", "Unarmed", "Unknown"] },
        { "type": "null" }
      ]
    },
    "gender": {
      "oneOf": [
        { "type": "string", "enum": ["Male", "Female", "Non-binary"] },
        { "type": "null" }
      ]
    },

    // EXTENDABLE fields (registry-tracked)
    "agencies": {
      "type": "array",
      "items": { "type": "string" },
      "minItems": 1
    },
    "county": { "type": "string" },  // From registry
    "force_type": {
      "type": "array",
      "items": { "type": "string" }  // From registry or new
    },

    // Boolean fields
    "published": { "type": "boolean", "const": true },
    "charges_filed": {
      "oneOf": [
        { "type": "boolean" },
        { "type": "null" }
      ]
    },

    // Nested objects with $ref
    "featured_image": {
      "oneOf": [
        { "$ref": "#/$defs/FeaturedImage" },
        { "type": "null" }
      ]
    },
    "documents": {
      "type": "array",
      "items": { "$ref": "#/$defs/Document" }
    },
    "external_links": {
      "type": "array",
      "items": { "$ref": "#/$defs/ExternalLink" }
    }
  },

  "required": ["title", "description", "incident_date", "city", "published"],
  "additionalProperties": false,

  "$defs": {
    "FeaturedImage": {
      "type": "object",
      "properties": {
        "imageId": { "type": "string", "format": "uuid" },
        "alt": { "type": "string" },
        "caption": { "type": "string" }
      },
      "required": ["imageId", "alt"],
      "additionalProperties": false
    },
    "Document": {
      "type": "object",
      "properties": {
        "title": { "type": "string" },
        "description": { "type": "string" },
        "url": { "type": "string", "format": "uri" }
      },
      "required": ["title", "description", "url"],
      "additionalProperties": false
    },
    "ExternalLink": {
      "type": "object",
      "properties": {
        "title": { "type": "string" },
        "description": { "type": "string" },
        "url": { "type": "string", "format": "uri" },
        "icon": {
          "type": "string",
          "enum": ["video", "news", "generic"],
          "default": "generic"
        }
      },
      "required": ["url"],
      "additionalProperties": false
    }
  }
}
```

#### B. Blog Metadata Schema (`schemas/blog-metadata-schema.json`)

Simpler schema for blog posts with tags and optional featured image.

#### C. Media Metadata Schema (`schemas/media-metadata-schema.json`)

For Phase 2 media processing with guaranteed valid component parameters.

**Action Items:**
- [ ] Create `schemas/` directory
- [ ] Write case-metadata-schema.json with all 37 fields
- [ ] Write blog-metadata-schema.json
- [ ] Write media-metadata-schema.json
- [ ] Validate schemas with JSON Schema validator

### 2.2 Update Metadata Registry Structure

**Current:** Tracks all registry values (agencies, counties, force_types, etc.)

**New:** Only track EXTENDABLE fields (remove enum fields)

**Example `data/metadata-registry.json`:**
```json
{
  "agencies": [
    "Los Angeles Police Department",
    "Stanislaus County Sheriff's Department",
    ...
  ],
  "counties": [
    "Los Angeles County",
    "Stanislaus County",
    ...
  ],
  "force_types": [
    "Shooting",
    "Taser",
    "Physical Force",
    "Restraint",
    ...
  ],
  "threat_levels": [
    "No Threat",
    "Low Threat",
    ...
  ],
  "investigation_statuses": [
    "Under Investigation",
    "Charges Filed",
    ...
  ],
  "post_tags": [
    "California Legislation",
    "Use of Force",
    ...
  ]
}
```

**Remove:** Any enum-controlled fields (armed_status, gender, link icons, etc.)

**Action Items:**
- [ ] Review current metadata-registry.json
- [ ] Remove enum fields from registry
- [ ] Document which fields remain in registry
- [ ] Add any new extendable fields from 37-field expansion

---

## Phase 3: Update Content Schema

### 3.1 Update Astro Content Collections Schema

**File:** `src/content/config.ts`

Add all 37 fields to the `cases` collection schema:

```typescript
const cases = defineCollection({
  type: 'content',
  schema: z.object({
    // Existing fields...
    title: z.string(),
    description: z.string(),

    // NEW fields from dataset (example - replace with actual 36)
    subject_name: z.string().optional(),
    subject_age: z.number().nullable().optional(),
    officer_names: z.array(z.string()).optional(),
    witness_count: z.number().nullable().optional(),
    settlement_amount: z.number().nullable().optional(),
    // ... (add remaining fields)
  })
});
```

**Action Items:**
- [ ] Map all 37 dataset fields to Zod schema types
- [ ] Add fields to cases collection
- [ ] Ensure nullable fields use `.nullable()` or `.optional()`
- [ ] Update TypeScript types if using `CollectionEntry<'cases'>`

### 3.2 Update Blog Posts Schema

**File:** `src/content/config.ts`

Ensure blog schema is also updated if expanding blog metadata.

**Action Items:**
- [ ] Review blog post fields
- [ ] Add any new fields needed
- [ ] Ensure consistency with JSON schema

---

## Phase 4: Implement Structured Outputs

### 4.1 Update API Calls in `scripts/ai/generators.js`

**Before (Current):**
```javascript
const metadataResponse = await anthropic.messages.create({
  model: 'claude-sonnet-4-20250514',
  max_tokens: 4000,
  messages: [{
    role: 'user',
    content: metadataPrompt
  }]
});

// Manual regex parsing
const metadataMatch = metadataText.match(/```json\n([\s\S]+?)\n```/);
const metadata = JSON.parse(metadataMatch[1]);
```

**After (With Structured Outputs):**
```javascript
import caseMetadataSchema from '../../schemas/case-metadata-schema.json' assert { type: 'json' };

const metadataResponse = await anthropic.messages.create({
  model: 'claude-sonnet-4-20250514',
  max_tokens: 4000,
  messages: [{
    role: 'user',
    content: metadataPrompt
  }],
  response_format: {
    type: 'json_schema',
    json_schema: {
      name: 'case_metadata',
      strict: true,
      schema: caseMetadataSchema
    }
  }
});

// Direct JSON parsing - no regex needed
const metadata = JSON.parse(metadataResponse.content[0].text);
```

**Changes:**
1. Import schema files
2. Add `response_format` parameter
3. Remove regex parsing
4. Direct JSON parse (guaranteed valid)

**Action Items:**
- [ ] Update `generateCaseArticle()` metadata extraction (generators.js:73)
- [ ] Update `generateBlogPost()` metadata extraction (generators.js:187)
- [ ] Update `extractMediaMetadata()` in processor.js (processor.js:253)

### 4.2 Remove Validation Logic

**File:** `scripts/media/processor.js`

**Remove:**
- `validateMediaMetadataItem()` function (lines 88-185)
- Validation loop in `extractMediaMetadata()` (lines 278-314)

**Before:**
```javascript
// Validate each item against schema
const validatedItems = [];
const validationErrors = [];

for (let i = 0; i < parsed.length; i++) {
  const item = parsed[i];
  const validation = validateMediaMetadataItem(item);
  // ... validation logic
}
```

**After:**
```javascript
// Direct use - no validation needed, schema guarantees correctness
return JSON.parse(message.content[0].text);
```

**Action Items:**
- [ ] Remove `validateMediaMetadataItem()` function
- [ ] Remove validation loop from `extractMediaMetadata()`
- [ ] Simplify error handling to only catch actual failures
- [ ] Update console logging to reflect no validation step

### 4.3 Update Prompts with Registry Context

**File:** `scripts/ai/prompts.js`

Since Structured Outputs handles the schema, prompts should focus on **value guidance** for extendable fields.

**Example for Case Metadata Prompt:**
```javascript
export function buildCaseMetadataPrompt(draftContent, registry, mediaPackage) {
  const agencies = JSON.stringify(registry.agencies || []);
  const counties = JSON.stringify(registry.counties || []);
  const forceTypes = JSON.stringify(registry.force_types || []);

  return `You are extracting metadata for a police misconduct case.

**Draft Content:**
${draftContent}

**Registry Values (prefer these, but create new ones if needed):**

AGENCIES: ${agencies}
- Use full official names
- Match abbreviations to registry ("LAPD" → "Los Angeles Police Department")
- Add new agencies if not in registry

COUNTIES: ${counties}
- Use exact county name from registry
- Infer from city if possible

FORCE TYPES: ${forceTypes}
- Select all applicable types
- Can infer from action verbs ("shot" → "Shooting", "tased" → "Taser")
- Add new types if needed

**Instructions:**
- Extract all available information from the draft
- Use null for fields not explicitly stated (NEVER assume race/ethnicity)
- For extendable fields, prefer registry values but create new ones when appropriate
- For enum fields, use only the allowed values
- Dates must be in YYYY-MM-DD format or null

Your response will be validated against a strict JSON schema.`;
}
```

**Action Items:**
- [ ] Update `buildCaseMetadataPrompt()` with registry guidance
- [ ] Update `buildBlogMetadataPrompt()` with tag guidance
- [ ] Remove schema definitions from prompts (now handled by Structured Outputs)
- [ ] Simplify instructions to focus on values, not structure

---

## Phase 5: Article Generation with Assistant Prefill

### 5.1 Implement Assistant Prefill

Use Claude's prefill feature to control response format without preamble.

**File:** `scripts/ai/generators.js`

**Before:**
```javascript
const articleResponse = await anthropic.messages.create({
  model: 'claude-sonnet-4-20250514',
  max_tokens: 8000,
  messages: [{
    role: 'user',
    content: articlePrompt
  }]
});

// Regex to extract MDX
const mdxMatch = fullArticle.match(/```mdx\n([\s\S]+?)\n```/);
```

**After:**
```javascript
const articleResponse = await anthropic.messages.create({
  model: 'claude-sonnet-4-20250514',
  max_tokens: 8000,
  messages: [
    {
      role: 'user',
      content: articlePrompt
    },
    {
      role: 'assistant',
      content: '---\ntitle: "'  // Prefill with frontmatter start
    }
  ]
});

// No regex needed - response starts directly with frontmatter
const mdxContent = '---\ntitle: "' + articleResponse.content[0].text;
```

**Alternative Prefill (More Explicit):**
```javascript
{
  role: 'assistant',
  content: '## '  // Prefill with markdown header to ensure no preamble
}
```

**Benefits:**
- No "Here's the article..." preamble
- No markdown code blocks to parse
- Direct MDX output
- Consistent formatting

**Action Items:**
- [ ] Add assistant prefill to `generateCaseArticle()` (line 120)
- [ ] Add assistant prefill to `generateBlogPost()` (line 234)
- [ ] Remove regex parsing for MDX extraction
- [ ] Test different prefill strategies (frontmatter vs. header)
- [ ] Update prompts to remove instructions about code blocks

### 5.2 Update Article Prompts

**File:** `scripts/ai/prompts.js`

Remove instructions about wrapping in code blocks:

**Remove:**
```javascript
**OUTPUT FORMAT:**

Return complete MDX file with frontmatter:

\`\`\`mdx
---
title: "${metadata.title}"
...
---

[content]
\`\`\`
```

**Replace with:**
```javascript
**OUTPUT FORMAT:**

Return a complete MDX file starting with YAML frontmatter and followed by the article content.
Use ## for section headings (not #).
Import only the components you actually use.
```

**Action Items:**
- [ ] Update `buildCaseArticlePrompt()` output format section
- [ ] Update `buildBlogArticlePrompt()` output format section
- [ ] Remove code block examples from prompts
- [ ] Test that prompts work with prefill

---

## Phase 6: Migrate Existing MDX Files

### 6.1 Create Migration Script

**File:** `scripts/migrations/add-new-metadata-fields.js`

**Purpose:** Update existing case MDX files to include new metadata fields from 37-field expansion

**Logic:**
1. Read all files in `src/content/cases/`
2. Parse frontmatter (use `gray-matter` library)
3. Add new fields with appropriate defaults:
   - Nullable fields → `null`
   - Arrays → `[]`
   - Booleans → `false` or appropriate default
4. Write back to file

**Example:**
```javascript
import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import { glob } from 'glob';

const NEW_FIELDS = {
  // Location details
  street_address: null,
  state: null,
  zip: null,

  // Incident flags
  signs_of_mental_illness: null,
  off_duty_killing: null,

  // Washington Post fields
  wapo_armed: null,
  wapo_threat_level: null,
  wapo_flee: null,
  wapo_id: null,

  // External database IDs
  mpv_id: null,
  fe_id: null,

  // Encounter details
  encounter_type: null,
  initial_reason: null,
  call_for_service: null,

  // Officer details
  officer_races: null,
  officer_known_past_shootings: null,

  // Geographic data
  geography: null,
  tract: null,
  latitude: null,
  longitude: null

  // Add any other fields not currently in existing MDX files
};

async function migrateCaseFiles() {
  const files = await glob('src/content/cases/**/*.mdx');

  for (const file of files) {
    const content = await fs.readFile(file, 'utf-8');
    const parsed = matter(content);

    // Add missing fields
    for (const [key, defaultValue] of Object.entries(NEW_FIELDS)) {
      if (!(key in parsed.data)) {
        parsed.data[key] = defaultValue;
      }
    }

    // Write back
    const updated = matter.stringify(parsed.content, parsed.data);
    await fs.writeFile(file, updated, 'utf-8');

    console.log(`✓ Updated ${path.basename(file)}`);
  }
}

migrateCaseFiles();
```

**Action Items:**
- [ ] Create `scripts/migrations/` directory
- [ ] Write migration script
- [ ] Test on a copy of one MDX file first
- [ ] Run migration on all case files
- [ ] Verify Astro build still works
- [ ] Commit changes

### 6.2 Validate Migration

**Action Items:**
- [ ] Run Astro build: `npm run build`
- [ ] Check for schema validation errors
- [ ] Spot-check random MDX files for correct frontmatter
- [ ] Verify site renders correctly with new fields
- [ ] Test filtering/querying with new fields

---

## Phase 7: Testing & Validation

### 7.1 Unit Tests

**Test Cases:**
1. Schema validation
2. Metadata extraction with Structured Outputs
3. Article generation with prefill
4. Media processing with structured media metadata

**File:** `scripts/tests/structured-outputs.test.js`

```javascript
import { describe, it, expect } from 'vitest';
import { generateCaseArticle } from '../ai/generators.js';
import caseMetadataSchema from '../../schemas/case-metadata-schema.json';

describe('Structured Outputs', () => {
  it('should return valid case metadata matching schema', async () => {
    const result = await generateCaseArticle('path/to/test-draft.md', mockMediaPackage);

    // Validate against schema
    const valid = validateJsonSchema(result.metadata, caseMetadataSchema);
    expect(valid).toBe(true);
  });

  it('should not require regex parsing', async () => {
    const result = await generateCaseArticle('path/to/test-draft.md', mockMediaPackage);

    // Should be direct JSON, no code blocks
    expect(result.metadata).toBeInstanceOf(Object);
  });
});
```

**Action Items:**
- [ ] Set up test framework (if not already)
- [ ] Write unit tests for metadata extraction
- [ ] Write unit tests for article generation
- [ ] Write integration tests for full pipeline
- [ ] Ensure all tests pass

### 7.2 Manual Testing

**Test Scenarios:**
1. **New case article** with all 37 fields
2. **New blog post** with tags
3. **Existing case update** - verify migration worked
4. **Edge cases:**
   - Missing optional fields (should be null)
   - Multiple force types
   - New agency not in registry (should add)
   - Invalid enum value (should fail gracefully)

**Action Items:**
- [ ] Create test draft files
- [ ] Run through full generation pipeline
- [ ] Verify all metadata fields populated correctly
- [ ] Check that extendable fields add to registry
- [ ] Verify enum fields only accept valid values
- [ ] Test error handling

### 7.3 Performance Testing

**Metrics to Track:**
- API response time (should be similar)
- Schema validation overhead (should be negligible)
- File generation time

**Action Items:**
- [ ] Time metadata extraction before/after
- [ ] Compare API costs (tokens used)
- [ ] Verify no performance regression

---

## Phase 8: Documentation & Cleanup

### 8.1 Update Documentation

**Files to Update:**
- `README.md` - Update workflow description
- `docs/ai-workflow.md` (if exists) - Document Structured Outputs usage
- `scripts/ai/README.md` - Update prompt building docs

**New Documentation:**
- Document 37-field schema
- Document enum vs. extendable field decisions
- Document migration process

**Action Items:**
- [ ] Update existing docs
- [ ] Create schema documentation
- [ ] Add examples of enum vs. extendable fields
- [ ] Document how to add new fields in future

### 8.2 Code Cleanup

**Remove:**
- Regex parsing functions
- Validation functions for structured data
- Code block extraction logic
- Old comments referencing manual parsing

**Refactor:**
- Simplify error handling
- Remove unnecessary try-catch blocks for validation
- Clean up console logging

**Action Items:**
- [ ] Search for and remove dead code
- [ ] Update error messages
- [ ] Simplify control flow where possible
- [ ] Run linter and fix issues

### 8.3 Update Dependencies

Check if JSON Schema validation library is needed for development:

```bash
npm install --save-dev ajv  # For validating schemas during development
```

**Action Items:**
- [ ] Install any needed dependencies
- [ ] Remove unused dependencies
- [ ] Update package.json scripts if needed

---

## Rollout Checklist

- [ ] **Phase 1:** Field analysis complete, categorization documented
- [ ] **Phase 2:** All JSON schemas created and validated
- [ ] **Phase 3:** Content schema updated in `config.ts`
- [ ] **Phase 4:** Structured Outputs implemented in all API calls
- [ ] **Phase 5:** Assistant prefill implemented for article generation
- [ ] **Phase 6:** Existing MDX files migrated successfully
- [ ] **Phase 7:** All tests passing
- [ ] **Phase 8:** Documentation updated, code cleaned up

---

## Success Criteria

1. ✅ Zero regex parsing for structured data
2. ✅ Zero schema validation errors from AI responses
3. ✅ All 37 dataset fields supported in case metadata
4. ✅ Enum fields controlled by schema (not registry)
5. ✅ Extendable fields properly tracked in registry
6. ✅ Article generation produces clean MDX without preamble
7. ✅ Existing MDX files migrated with new fields
8. ✅ All tests passing
9. ✅ Documentation up to date

---

## Future Enhancements

- **Registry UI**: Build admin interface for managing extendable registry values
- **Field Statistics**: Track which new values are added most frequently
- **Schema Versioning**: Support schema migrations as fields evolve
- **Multi-step Validation**: Add business logic validation on top of schema validation
- **Batch Processing**: Update multiple cases at once with new fields
