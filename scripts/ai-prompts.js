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
- Gender (can be inferred from pronouns or gendered name - only flag if truly ambiguous)
- Featured image URL, unless it's obvious that an image provided makes sense as featured image or it's specified as the featured image

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
2. Generate metadata that includes ALL fields defined in the schema (both required and optional)
3. For fields where information is NOT available, use null (not empty string, not omitted)
4. Return ONLY the metadata as a JSON object
5. Use proper data types (strings as strings, arrays as arrays, booleans as booleans, numbers as numbers)
6. For dates, use "YYYY-MM-DD" format as a STRING
7. For case_id, use format: ca-[agency-slug]-[year]-[number]
8. For tags, choose 3-5 relevant tags from the draft content
9. Be flexible - extract information from unstructured notes, lists, and links
10. ALWAYS include every field from the schema - use null if data is missing

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
export function createCaseArticlePrompt(draftContent, mediaAnalysis, metadata, components = {}, contentSchema = '') {
  // Format components for the prompt
  const componentsSection = Object.keys(components).length > 0 
    ? `\n**Available Components:**\n${Object.entries(components).map(([name, code]) => 
        `\n### ${name}\n\`\`\`astro\n${code}\n\`\`\`\n`
      ).join('\n')}`
    : '';

  return {
    system: SYSTEM_PROMPT,
    user: `Generate a complete, publication-ready article for this police misconduct case.

**Draft Content:**
${draftContent}

**Metadata:**
${JSON.stringify(metadata, null, 2)}

**Available Media:**
${JSON.stringify(mediaAnalysis, null, 2)}
${componentsSection}

**CONTENT SCHEMA (MUST FOLLOW EXACTLY):**
${contentSchema}

**CRITICAL: Your frontmatter MUST match the casesCollection schema exactly. Every field must use the correct data type:**
- Strings must be quoted: "value"
- Numbers must be unquoted: 35
- Booleans must be unquoted: true or false
- Arrays must use bracket notation: ["item1", "item2"]
- Nullable/optional fields must be either the correct type or null (unquoted)
- Do NOT use "null" (string), use null (literal)
- Do NOT omit optional fields - include them with null if no data

**Instructions:**
1. Write a comprehensive case summary (3-5 paragraphs minimum)
2. Include a clear timeline of events
3. Embed media using the available MDX components shown above
4. Import only the components you actually use
5. Use components intelligently based on their props and functionality
6. Include content warnings at the top if needed
7. Cite all sources
8. Use proper heading hierarchy (## for main sections)
9. Write in clear, accessible language
10. Be factual and objective

**Component Usage Examples:**
- For videos: <CloudflareVideo videoId="abc123" caption="Body camera footage shows..." />
- For images: <CloudflareImage imageId="xyz789" alt="Scene photo" caption="Photo taken at scene" />
- For documents: <DocumentsList documents={frontmatter.documents} /> (if documents exist in frontmatter)

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
published: ${metadata.published}
tags: ${JSON.stringify(metadata.tags || [])}
featured_image: ${metadata.featured_image || 'null'}
age: ${metadata.age || 'null'}
race: ${metadata.race ? '"' + metadata.race + '"' : 'null'}
gender: ${metadata.gender ? '"' + metadata.gender + '"' : 'null'}
cause_of_death: ${metadata.cause_of_death ? '"' + metadata.cause_of_death + '"' : 'null'}
armed_status: ${metadata.armed_status ? '"' + metadata.armed_status + '"' : 'null'}
threat_level: ${metadata.threat_level ? '"' + metadata.threat_level + '"' : 'null'}
force_type: ${metadata.force_type ? JSON.stringify(metadata.force_type) : 'null'}
shooting_officers: ${metadata.shooting_officers ? JSON.stringify(metadata.shooting_officers) : 'null'}
investigation_status: ${metadata.investigation_status ? '"' + metadata.investigation_status + '"' : 'null'}
charges_filed: ${metadata.charges_filed !== undefined ? metadata.charges_filed : 'null'}
civil_lawsuit_filed: ${metadata.civil_lawsuit_filed !== undefined ? metadata.civil_lawsuit_filed : 'null'}
bodycam_available: ${metadata.bodycam_available !== undefined ? metadata.bodycam_available : 'null'}
documents: ${metadata.documents ? JSON.stringify(metadata.documents) : 'null'}
---

import CloudflareImage from '../../components/CloudflareImage.astro';
import CloudflareVideo from '../../components/CloudflareVideo.astro';
${metadata.documents ? "import DocumentsList from '../../components/DocumentsList.astro';" : ''}

${metadata.content_warning ? '**Content Warning:** This article contains descriptions of [violence/death/etc].\n\n' : ''}
[Your article content here with proper headings, embedded media, citations, etc.]

## Timeline

[Chronological timeline of events]

## Legal Status

[Current legal status and outcomes]

${metadata.documents ? '\n<DocumentsList documents={frontmatter.documents} />\n' : ''}

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
export function createBlogPostPrompt(draftContent, mediaAnalysis, metadata, components = {}, contentSchema = '') {
  // Format components for the prompt
  const componentsSection = Object.keys(components).length > 0 
    ? `\n**Available Components:**\n${Object.entries(components).map(([name, code]) => 
        `\n### ${name}\n\`\`\`astro\n${code}\n\`\`\`\n`
      ).join('\n')}`
    : '';

  return {
    system: SYSTEM_PROMPT,
    user: `Generate a complete, publication-ready blog post.

**Draft Content:**
${draftContent}

**Metadata:**
${JSON.stringify(metadata, null, 2)}

**Available Media:**
${JSON.stringify(mediaAnalysis, null, 2)}
${componentsSection}

**CONTENT SCHEMA (MUST FOLLOW EXACTLY):**
${contentSchema}

**CRITICAL: Your frontmatter MUST match the postsCollection schema exactly. Every field must use the correct data type:**
- Strings must be quoted: "value"
- Booleans must be unquoted: true or false
- Arrays must use bracket notation: ["item1", "item2"]
- Nullable/optional fields must be either the correct type or null (unquoted)
- Do NOT use "null" (string), use null (literal)

**Instructions:**
1. Write an engaging, informative article
2. Target reading time: ${metadata.targetReadingTime || '8-10 minutes'}
3. Use clear section headings
4. Include examples and explanations
5. Link to related cases when relevant
6. Embed media using the available MDX components shown above
7. Import only the components you actually use
8. Include a clear takeaway/conclusion

**Component Usage Examples:**
- For videos: <CloudflareVideo videoId="abc123" caption="Example of..." />
- For images: <CloudflareImage imageId="xyz789" alt="Diagram" caption="Visual explanation" />
- For documents: <DocumentsList documents={frontmatter.documents} /> (if documents exist)

**Output Format:**
Return the complete MDX file content with frontmatter:

\`\`\`mdx
---
title: "${metadata.title}"
description: "${metadata.description}"
published_date: "${metadata.published_date}"
tags: ${JSON.stringify(metadata.tags)}
published: ${metadata.published}
featured_image: ${metadata.featured_image || 'null'}
documents: ${metadata.documents || 'null'}
---

import CloudflareImage from '../../components/CloudflareImage.astro';
import CloudflareVideo from '../../components/CloudflareVideo.astro';
${metadata.documents ? "import DocumentsList from '../../components/DocumentsList.astro';" : ''}

[Your article content with proper headings, embedded media, examples, etc.]

## Key Takeaways

[Summary bullets]

${metadata.documents ? '\n<DocumentsList documents={frontmatter.documents} />\n' : ''}

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
