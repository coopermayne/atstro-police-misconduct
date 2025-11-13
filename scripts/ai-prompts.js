/**
 * AI Prompt Templates
 * 
 * Structured prompts for different stages of content generation.
 */

export const SYSTEM_PROMPT = `You are an expert legal writer specializing in civil rights law and police misconduct cases. Your role is to analyze case materials and create clear, accurate, factual documentation for a public-facing website.

Your writing should:
- Be factual and objective
- Use clear, accessible language for general audiences
- Maintain legal accuracy
- Include appropriate content warnings
- Cite sources properly
- Follow journalistic standards for sensitive content`;

/**
 * Prompt for analyzing video content
 */
export function createVideoAnalysisPrompt(videoMetadata) {
  return {
    system: SYSTEM_PROMPT,
    user: `Analyze this video file for a police misconduct case documentation website.

Video: ${videoMetadata.filename || 'Uploaded video'}
Description: ${videoMetadata.description || 'Body camera or surveillance footage'}

Please provide:

1. **Content Summary** (2-3 sentences describing what the video shows)

2. **Key Timestamps** (important moments in MM:SS format):
   - List 3-5 critical moments with brief descriptions
   - Example: "02:45 - Officer draws weapon"

3. **Content Warnings** (if applicable):
   - Does this video contain graphic violence?
   - Does it contain disturbing audio (screaming, gunshots)?
   - Should viewers be warned before watching?

4. **Contextual Notes**:
   - Camera angle/perspective
   - Audio quality
   - Any important visual details
   - Gaps or missing footage

5. **Suggested Caption**:
   - A brief 1-2 sentence caption for embedding in the article

Return your analysis in JSON format:
\`\`\`json
{
  "summary": "...",
  "timestamps": [
    {"time": "00:00", "description": "..."}
  ],
  "contentWarnings": ["warning1", "warning2"],
  "contextualNotes": "...",
  "suggestedCaption": "..."
}
\`\`\``
  };
}

/**
 * Prompt for analyzing PDF documents
 */
export function createDocumentAnalysisPrompt(documentMetadata, extractedText = null) {
  return {
    system: SYSTEM_PROMPT,
    user: `Analyze this legal document for a police misconduct case.

Document: ${documentMetadata.filename || 'Uploaded document'}
Type: ${documentMetadata.type || 'Legal document'}
${extractedText ? `\n\nExtracted Text Preview:\n${extractedText.substring(0, 2000)}...\n` : ''}

Please extract:

1. **Document Type**: (e.g., complaint, settlement agreement, police report, court filing)

2. **Key Information**:
   - Case names/numbers
   - Dates (incident date, filing date, etc.)
   - Parties involved
   - Monetary amounts (damages, settlements)
   - Key allegations or findings

3. **Important Quotes**:
   - 2-3 significant excerpts (with page numbers if available)

4. **Summary**:
   - 2-3 paragraph summary of the document's content and significance

5. **Suggested Citation**:
   - How this document should be cited in the article

Return your analysis in JSON format:
\`\`\`json
{
  "documentType": "...",
  "keyInformation": {
    "caseNumbers": ["..."],
    "dates": {"incident": "YYYY-MM-DD", "filed": "YYYY-MM-DD"},
    "parties": ["plaintiff", "defendant"],
    "amounts": {"settlement": "$X"},
    "allegations": ["..."]
  },
  "importantQuotes": [
    {"quote": "...", "page": "X", "context": "..."}
  ],
  "summary": "...",
  "suggestedCitation": "..."
}
\`\`\`

If you cannot extract text from the document, indicate that and provide whatever analysis you can from the metadata.`
  };
}


/**
 * Prompt for validating draft completeness
 */
export function createDraftValidationPrompt(draftContent, contentSchema, contentType = 'case') {
  const schemaSection = contentType === 'case' ? 'casesCollection' : 'postsCollection';
  
  return {
    system: SYSTEM_PROMPT,
    user: `Review this draft and identify ONLY truly missing information that CANNOT be inferred or generated.

**Draft Content:**
${draftContent}

**Content Schema (from src/content/config.ts):**
${contentSchema}

**IMPORTANT GUIDELINES:**
- DO NOT flag fields that can be extracted, inferred, or generated from the draft
- DO NOT flag auto-generated fields (like case_id, slugs, etc.)
- ONLY flag information that is completely absent and cannot be reasonably inferred
- Be smart about inference - if notes mention "tased" you can infer force type, if they mention "lawsuit filed" you know civil_lawsuit_filed

**What CAN be generated/inferred (DO NOT flag these):**
- title (victim's name if mentioned anywhere)
- description (can be written from any case summary/notes)
- case_id (auto-generated from agency + date)
- tags (can be inferred from incident type)
- investigation_status (can be inferred from legal status mentions)
- force_type (can be inferred from incident description)
- threat_level (can be inferred from incident description)
- civil_lawsuit_filed (can be inferred if lawsuit is mentioned)
- bodycam_available (can be inferred if bodycam footage URL is provided or mentioned)

**What CANNOT be inferred (flag these if missing):**
- Victim's name (if not mentioned at all)
- Date of incident (if no date provided)
- City/county (if location not specified)
- Agency name (if no police department mentioned)
- Age (specific number needed)
- Race/ethnicity (cannot be assumed)
- Gender (cannot be assumed without info)
- Featured image URL (cannot be generated - needs actual image link)

**Focus Areas:**
1. Is there enough basic information to write a case (name, date, location, what happened)?
2. Is there a featured image URL? (CRITICAL - this cannot be generated)
3. Are there demographic details that would improve the article but are missing?

Return your analysis as JSON:
\`\`\`json
{
  "isComplete": true/false,
  "canProceed": true/false,
  "hasFeaturedImage": true/false,
  "missingCritical": [],
  "missingHelpful": [],
  "issues": [],
  "suggestions": []
}
\`\`\`

Be pragmatic - if there's enough info to write a quality article, mark canProceed as true even if some optional fields are missing.
`
  };
}
/**
 * Prompt for generating case metadata
 */
/**
 * Prompt for generating case metadata
 */
export function createMetadataExtractionPrompt(draftContent, contentSchema, contentType = 'case') {
  const schemaSection = contentType === 'case' ? 'casesCollection' : 'postsCollection';
  
  return {
    system: SYSTEM_PROMPT,
    user: `Based on this draft content, generate appropriate metadata values.

**Draft Content:**
${draftContent}

**Content Schema (from src/content/config.ts):**
${contentSchema}

**Instructions:**
1. Extract the schema for "${schemaSection}" from the provided TypeScript code
2. Generate metadata that matches ALL required fields in the schema
3. For optional fields, include them if the information is available in the draft
4. Return ONLY the metadata as a JSON object
5. Use proper data types (strings as strings, arrays as arrays, booleans as booleans, numbers as numbers)
6. For dates, use "YYYY-MM-DD" format as a STRING
7. For case_id, use format: ca-[agency-slug]-[year]-[number]
8. For tags, choose 3-5 relevant tags from the draft content
9. Be flexible - extract information from unstructured notes, lists, and links

Return ONLY valid JSON matching the schema:
\`\`\`json
{
  // Your extracted metadata here
}
\`\`\`
`
  };
}
/**
 * Prompt for generating complete case article
 */
export function createCaseArticlePrompt(draftContent, mediaAnalysis, metadata) {
  return {
    system: SYSTEM_PROMPT,
    user: `Generate a complete, publication-ready article for this police misconduct case.

**Draft Content:**
${draftContent}

**Metadata:**
${JSON.stringify(metadata, null, 2)}

**Available Media:**
${JSON.stringify(mediaAnalysis, null, 2)}

**Instructions:**
1. Write a comprehensive case summary (3-5 paragraphs minimum)
2. Include a clear timeline of events
3. Embed media using these MDX components:
   - CloudflareVideo: <CloudflareVideo videoId="..." caption="..." />
   - CloudflareImage: <CloudflareImage imageId="..." alt="..." caption="..." />
4. Include content warnings at the top if needed
5. Cite all sources
6. Use proper heading hierarchy (## for main sections)
7. Write in clear, accessible language
8. Be factual and objective

**Output Format:**
Return the complete MDX file content with frontmatter. Use this exact structure:

\`\`\`mdx
---
case_id: "${metadata.case_id}"
title: "${metadata.title}"
description: "${metadata.description}"
incident_date: "${metadata.incident_date}"
city: "${metadata.city}"
county: "${metadata.county}"
agencies: ${JSON.stringify(metadata.agencies)}
investigation_status: "${metadata.investigation_status}"
published: ${metadata.published}
tags: ${JSON.stringify(metadata.tags || [])}
age: ${metadata.age || 'null'}
race: "${metadata.race || ''}"
gender: "${metadata.gender || ''}"
featured_image: "${metadata.featured_image || ''}"
---

import CloudflareImage from '../../components/CloudflareImage.astro';
import CloudflareVideo from '../../components/CloudflareVideo.astro';

${metadata.content_warning ? '> **Content Warning**: This article contains descriptions and footage of [violence/death/etc]. Reader discretion is advised.\n\n' : ''}
[Your article content here with proper headings, embedded media, citations, etc.]

## Timeline

[Chronological timeline of events]

## Legal Status

[Current legal status and outcomes]

## Media

[Description and context for embedded media]

## Sources

- [Source 1]
- [Source 2]
\`\`\`

Generate the complete article now.`
  };
}

/**
 * Prompt for generating blog post
 */
export function createBlogPostPrompt(draftContent, mediaAnalysis, metadata) {
  return {
    system: SYSTEM_PROMPT,
    user: `Generate a complete, publication-ready blog post.

**Draft Content:**
${draftContent}

**Metadata:**
${JSON.stringify(metadata, null, 2)}

**Available Media:**
${JSON.stringify(mediaAnalysis, null, 2)}

**Instructions:**
1. Write an engaging, informative article
2. Target reading time: ${metadata.targetReadingTime || '8-10 minutes'}
3. Use clear section headings
4. Include examples and explanations
5. Link to related cases when relevant
6. Embed media where appropriate using MDX components
7. Include a clear takeaway/conclusion

**Output Format:**
Return the complete MDX file content with frontmatter:

\`\`\`mdx
---
title: "${metadata.title}"
description: "${metadata.description}"
published_date: ${metadata.published_date}
tags: ${JSON.stringify(metadata.tags)}
featured_image: "${metadata.featured_image || ''}"
published: ${metadata.published}
---

import CloudflareImage from '../../components/CloudflareImage.astro';
import CloudflareVideo from '../../components/CloudflareVideo.astro';

[Your article content with proper headings, embedded media, examples, etc.]

## Key Takeaways

[Summary bullets]

## Related Resources

[Links to related content]
\`\`\`

Generate the complete article now.`
  };
}

/**
 * Prompt for suggesting filename/slug
 */
export function createSlugGenerationPrompt(title, type = 'case') {
  return {
    system: 'You are a helpful assistant that generates URL-friendly slugs.',
    user: `Generate a URL-friendly slug for this ${type}:

Title: "${title}"

Requirements:
- Lowercase only
- Use hyphens for spaces
- Remove special characters
- Max 60 characters
- Be descriptive but concise

Return only the slug, nothing else.

Example: "John Doe v. LAPD Excessive Force" → "john-doe-lapd-excessive-force"`
  };
}
