/**
 * AI Prompt Templates
 * 
 * Structured prompts for different stages of content generation.
 */

import { formatRegistryForAI } from './metadata-registry.js';

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
  
  if (contentType === 'post') {
    return {
      system: SYSTEM_PROMPT,
      user: `Review this blog post draft and identify any missing critical information.

**Draft Content:**
${draftContent}

**Content Schema (from src/content/config.ts):**
${contentSchema}

**IMPORTANT GUIDELINES FOR BLOG POSTS:**
- Blog posts are educational/informational articles, NOT case reports
- Required information is much simpler than case articles
- Focus on whether the draft has enough content to write a quality blog post

**What CAN be generated/inferred (DO NOT flag these):**
- title (can be extracted from topic or generated from content)
- description (can be written from the draft content)
- published_date (will be set automatically)
- tags (can be inferred from topic and content)
- published (will be set to true)

**What to CHECK:**
1. **Clear Topic**: Is there a clear topic or subject matter?
2. **Key Points**: Are there enough ideas/points to write a substantial article?
3. **Featured Image**: Is there a featured image marked? (Recommended but not required)

**Focus Areas:**
1. Is there a clear topic/subject for the blog post?
2. Are there enough key points or ideas to write a quality article (at least 2-3 main ideas)?
3. Is there a featured image? (Not critical but highly recommended)

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

Be pragmatic - if there's a clear topic with 2-3 key points or ideas, mark canProceed as true.
`
    };
  }
  
  // Case validation (existing logic)
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
- MAKE REASONABLE INFERENCES from context - don't speculate, but use clear evidence:
  * "tased" → force_type includes "Taser"
  * "lawsuit filed" → civil_lawsuit_filed = true
  * "he/his/him" pronouns → gender = "Male"
  * "she/her" pronouns → gender = "Female"
  * Gendered names (John, Mary) → gender can be inferred
  * "teacher" + context → can infer approximate age range if reasonable

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
- gender (CAN AND SHOULD be inferred from pronouns like "he/his/him" or "she/her" or gendered names)
- age (can be inferred if context provides clues like "35-year-old" or job/role suggests age range)

**What CANNOT be inferred (flag these if missing):**
- Victim's name (if not mentioned at all)
- Date of incident (if no date provided)
- City/county (if location not specified)
- Agency name (if no police department mentioned)
- Race/ethnicity (NEVER assume - must be explicitly stated)
- Featured image URL (unless explicitly marked as featured image in the draft)

**Be conservative but reasonable:**
- Gender: Use pronouns (he/she) or clearly gendered names to infer. Only flag if no evidence.
- Age: Use explicit age mentions ("35-year-old") or reasonable inference from context. Flag if no clues.
- Armed status: Infer from incident description ("unarmed", "holding a knife", etc.)

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
export function createMetadataExtractionPrompt(draftContent, contentSchema, contentType = 'case', mediaAnalysis = null) {
  const schemaSection = contentType === 'case' ? 'casesCollection' : 'postsCollection';
  
  // Extract processed documents for frontmatter
  let documentsSection = '';
  if (mediaAnalysis && mediaAnalysis.documents && mediaAnalysis.documents.length > 0) {
    const processedDocs = mediaAnalysis.documents
      .filter(d => d.document)
      .map(d => d.document);
    
    if (processedDocs.length > 0) {
      documentsSection = `\n**Processed Documents (include these in metadata):**\n${JSON.stringify(processedDocs, null, 2)}\n`;
    }
  }
  
  // Extract featured image if marked
  let featuredImageSection = '';
  if (mediaAnalysis && mediaAnalysis.images && mediaAnalysis.images.length > 0) {
    const featuredImage = mediaAnalysis.images.find(img => img.featured === true);
    if (featuredImage) {
      featuredImageSection = `\n**Featured Image (use this imageId for featured_image field):**\n${featuredImage.imageId}\n`;
    }
  }
  
  // Load canonical metadata registry
  const registrySection = formatRegistryForAI(contentType);
  
  return {
    system: SYSTEM_PROMPT,
    user: `Based on this draft content, generate appropriate metadata values.

**Draft Content:**
${draftContent}

${registrySection}

**Content Schema (from src/content/config.ts):**
${contentSchema}
${documentsSection}${featuredImageSection}
**CRITICAL INSTRUCTION FOR DOCUMENTS FIELD:**
${documentsSection ? '- You MUST use the "Processed Documents" array above EXACTLY as provided for the documents field\n- DO NOT extract document URLs from the draft content\n- DO NOT use original external URLs\n- The documents have already been uploaded to our R2 storage and the URLs are ready to use\n' : '- Set documents field to null if no processed documents are provided\n'}
**CRITICAL INSTRUCTION FOR FEATURED_IMAGE FIELD:**
${featuredImageSection ? '- You MUST use the imageId provided in "Featured Image" section above\n- This is a Cloudflare Images ID, not a URL\n' : '- Set featured_image to null if no featured image is provided\n'}
**Instructions:**
1. Extract the schema for "${schemaSection}" from the provided TypeScript code
2. Generate metadata that includes ALL fields defined in the schema (both required and optional)
3. Make REASONABLE INFERENCES from the draft content - don't speculate wildly, but use clear evidence:
   - Pronouns (he/his/him → "Male", she/her → "Female") for gender
   - Gendered names (John → "Male", Mary → "Female") for gender
   - Explicit age mentions ("35-year-old" → 35) for age
   - Incident descriptions ("tased" → ["Taser"], "beaten" → ["Beating"]) for force_type
   - Legal mentions ("lawsuit filed" → true, "settlement" → true) for civil_lawsuit_filed
   - Evidence mentions ("body camera footage" → true) for bodycam_available
4. **CRITICAL**: For the documents field, use ONLY the "Processed Documents" array provided above (if any). DO NOT extract or use URLs from the draft content.
5. **CRITICAL**: For the featured_image field, use ONLY the imageId provided in "Featured Image" section above (if any).
6. For fields where information is NOT available AND cannot be reasonably inferred, use null
7. Return ONLY the metadata as a JSON object
8. Use proper data types (strings as strings, arrays as arrays, booleans as booleans, numbers as numbers)
9. For dates, use "YYYY-MM-DD" format as a STRING
10. For case_id, use format: ca-[agency-slug]-[year]-[number]
11. For tags, choose 3-5 relevant tags from the draft content
12. Be flexible - extract information from unstructured notes, lists, and links
13. ALWAYS include every field from the schema - use null only if truly unknown after inference attempts

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
7. Cite all sources in a ## Sources section
8. Use proper heading hierarchy (## for main sections)
9. Write in clear, accessible language
10. Be factual and objective
11. **CRITICAL: DO NOT create sections for documents, external links, or related cases:**
    - Documents are automatically displayed in a "Related Documents" section via DocumentsList component
    - External links are automatically displayed in an "External Coverage & Resources" section via ExternalLinkCard components
    - Related cases are automatically shown at the bottom of the page
    - DO NOT manually create these sections or list these items in your article
    - DO NOT include "## Related Documents" or "## External Links" headings
12. Reference documents and external sources naturally in the article text (e.g., "According to court filings...", "News outlets reported...")
13. End your article with a ## Sources section listing primary sources only (not the documents or external links)
    - **Captions/Descriptions**: Clean up and make professional. Fix grammar, add proper punctuation, ensure complete sentences
    - **Example**: "this is a video of the use of force incident" → "Body camera footage documenting the use of force incident"
    - **Alt text**: Create descriptive, accessible text from available metadata (alt > title > caption > description)
    - **Context**: Use info/details fields to inform narrative placement and surrounding text
    - **Titles**: Clean up for professional presentation while preserving meaning
    - Make all text publication-ready: proper capitalization, grammar, complete sentences
    - Keep the core meaning and facts from the user's metadata but improve readability

**Component Usage Examples:**
- For videos: <CloudflareVideo videoId="abc123" caption="Body camera footage shows..." />
  - Use the caption property from the shortcode if provided, or craft based on description or info
- For images: <CloudflareImage imageId="xyz789" alt="Scene photo" caption="Photo taken at scene" />
  - Use alt or title from shortcode for alt text, caption or description for caption prop
  - Pull from available metadata intelligently: alt > title > caption > description
- For documents: <DocumentsList documents={frontmatter.documents} /> (REQUIRED if documents array exists)
  - Document titles and descriptions from shortcodes are already in frontmatter
  - Reference documents in the article text using their titles naturally

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
external_links: ${metadata.external_links ? JSON.stringify(metadata.external_links) : 'null'}
---

import CloudflareImage from '../../components/CloudflareImage.astro';
import CloudflareVideo from '../../components/CloudflareVideo.astro';

${metadata.content_warning ? '**Content Warning:** This article contains descriptions of [violence/death/etc].\\n\\n' : ''}
[Your article content here with proper headings, embedded media, citations, etc.]

## Timeline

[Chronological timeline of events]

## Legal Status

[Current legal status and outcomes]

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
9. **CRITICAL: DO NOT create sections for documents or external links:**
    - Documents are automatically displayed in a "Related Documents" section
    - External links are automatically displayed in an "External Resources" section
    - Related posts are automatically shown at the bottom
    - DO NOT manually create these sections or list these items
10. Reference documents and external resources naturally in the article text when relevant

**Component Usage Examples:**
- For videos: <CloudflareVideo videoId="abc123" caption="Example of..." />
- For images: <CloudflareImage imageId="xyz789" alt="Diagram" caption="Visual explanation" />

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
external_links: ${metadata.external_links || 'null'}
---

import CloudflareImage from '../../components/CloudflareImage.astro';
import CloudflareVideo from '../../components/CloudflareVideo.astro';

[Your article content with proper headings, embedded media, examples, etc.]

## Key Takeaways

[Summary bullets]
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
