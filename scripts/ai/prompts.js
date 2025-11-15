/**
 * AI Prompt Building Functions
 * 
 * Contains all prompt templates and builders for AI-powered content generation.
 */

/**
 * Field-to-Registry mapping with AI generation instructions
 * Defines which schema fields map to registry keys and how AI should handle them
 */
export const FIELD_REGISTRY_MAP = {
  // Case fields
  agencies: {
    registryKey: 'agencies',
    instruction: 'Match abbreviations or informal names to full agency names from registry (e.g., "LAPD" → "Los Angeles Police Department"). Add new agencies if not in registry.',
    canInfer: true,
    inferenceHints: ['Extract from incident descriptions', 'Match to full official names']
  },
  county: {
    registryKey: 'counties',
    instruction: 'Use exact county name from registry. Infer from city if possible.',
    canInfer: true,
    inferenceHints: ['Look up city to determine county']
  },
  force_type: {
    registryKey: 'force_types',
    instruction: 'Select all applicable force types from registry based on incident description. Can infer from action verbs ("shot" → "Shooting", "tased" → "Taser").',
    canInfer: true,
    inferenceHints: ['Multiple types possible', 'Infer from incident verbs and descriptions']
  },
  threat_level: {
    registryKey: 'threat_levels',
    instruction: 'Assess threat level from incident context and subject behavior. Use registry categories.',
    canInfer: true,
    inferenceHints: ['Based on subject actions', 'Consider weapon presence', 'Evaluate behavior described']
  },
  investigation_status: {
    registryKey: 'investigation_statuses',
    instruction: 'Determine current status from legal developments mentioned. Use registry values.',
    canInfer: true,
    inferenceHints: ['Look for mentions of charges, trials, settlements', 'May be explicitly stated']
  },
  
  // Post fields
  tags: {
    registryKey: 'post_tags',
    instruction: 'Select relevant topic tags from registry. Add new tags if article covers topics not yet in registry. Tags should be 1-3 words, title case.',
    canInfer: true,
    inferenceHints: ['Choose 2-5 tags per post', 'Can create new tags for new topics', 'Be specific but reusable']
  }
};

/**
 * Build registry section for a specific field
 * @param {string} fieldName - The field name (e.g., 'agencies')
 * @param {object} config - Field configuration from FIELD_REGISTRY_MAP
 * @param {object} registry - Full metadata registry
 * @returns {string} - Formatted registry section for AI prompt
 */
export function buildRegistrySection(fieldName, config, registry) {
  const values = registry[config.registryKey] || [];
  
  let section = `**${fieldName.toUpperCase()}:**\n`;
  section += `${config.instruction}\n`;
  
  if (values.length > 0) {
    section += `Available values:\n`;
    values.forEach(value => {
      section += `- ${value}\n`;
    });
  } else {
    section += `(Registry currently empty - you may create initial values)\n`;
  }
  
  section += '\n';
  return section;
}

/**
 * Build inference rules section from field configurations
 * @param {string[]} fieldNames - Fields applicable to this content type
 * @returns {string} - Formatted inference rules for AI prompt
 */
export function buildInferenceRules(fieldNames) {
  let rules = '**INFERENCE RULES:**\n\n';
  rules += 'What you CAN infer:\n';
  
  const inferableFields = fieldNames
    .filter(field => FIELD_REGISTRY_MAP[field]?.canInfer)
    .map(field => FIELD_REGISTRY_MAP[field]);
  
  if (inferableFields.length > 0) {
    inferableFields.forEach(config => {
      if (config.inferenceHints) {
        config.inferenceHints.forEach(hint => {
          rules += `- ${hint}\n`;
        });
      }
    });
  }
  
  rules += '\nWhat you CANNOT infer (use null if not stated):\n';
  rules += '- Race/ethnicity (NEVER assume)\n';
  rules += '- Exact dates not mentioned\n';
  rules += '- Names not provided\n';
  rules += '- Specific details not in source\n\n';
  
  return rules;
}

/**
 * Build component reference string for AI
 * @param {object} mediaPackage - Processed media and links
 * @returns {string} - Component reference for AI prompt
 */
export function buildComponentReference(mediaPackage) {
  let reference = '**Available Components:**\n\n';
  reference += '**CRITICAL**: Copy these component tags EXACTLY as shown. Do NOT modify the IDs.\n\n';
  
  if (mediaPackage.media.length > 0) {
    reference += 'MEDIA:\n';
    mediaPackage.media.forEach((item, index) => {
      reference += `${index + 1}. ${item.componentHTML}\n\n`;
    });
  }
  
  if (mediaPackage.links.length > 0) {
    reference += 'EXTERNAL LINKS:\n';
    mediaPackage.links.forEach((item, index) => {
      reference += `${index + 1}. ${item.componentHTML}\n\n`;
    });
  }
  
  return reference;
}

/**
 * Build metadata extraction prompt for cases
 * @param {string} draftContent - Draft markdown content
 * @param {string} schemaContent - Content schema TypeScript file
 * @param {object} registry - Metadata registry
 * @param {object} mediaPackage - Processed media and links
 * @returns {string} - Complete prompt for AI
 */
export function buildCaseMetadataPrompt(draftContent, schemaContent, registry, mediaPackage) {
  // Define which fields from FIELD_REGISTRY_MAP apply to cases
  const caseRegistryFields = ['agencies', 'county', 'force_type', 'threat_level', 'investigation_status'];

  // Build documents array from media - use R2 public URL
  const documents = mediaPackage.media
    .filter(item => item.type === 'document')
    .map(item => ({
      title: item.componentParams.title,
      description: item.componentParams.description,
      url: item.publicUrl
    }));
  
  // Build external_links array
  const external_links = mediaPackage.links.map(item => ({
    title: item.componentParams.title || '',
    description: item.componentParams.description || '',
    url: item.sourceUrl,
    icon: item.componentParams.icon || 'generic'
  }));
  
  // Find featured image
  const imageMedia = mediaPackage.media.filter(item => item.type === 'image');
  
  // Get registry values as JSON arrays
  const agencies = JSON.stringify(registry.agencies || []);
  const counties = JSON.stringify(registry.counties || []);
  const forceTypes = JSON.stringify(registry.force_types || []);
  const threatLevels = JSON.stringify(registry.threat_levels || []);
  const investigationStatuses = JSON.stringify(registry.investigation_statuses || []);
  
  // Build featured image section with clear instructions
  let featuredImageInstructions = '';
  if (imageMedia.length > 0) {
    featuredImageInstructions = `"featured_image": {  // **REQUIRED** - You MUST select one image from the list below
    "imageId": "string",  // MUST be one of these exact IDs: ${imageMedia.map(img => `"${img.imageId}"`).join(', ')}
    "alt": "string",  // Copy the exact alt text from the selected image below
    "caption": "string"  // Copy the exact caption from the selected image below (omit this line if caption is empty)
  },
  // Available images to choose from:
${imageMedia.map((img, i) => `  // ${i + 1}. imageId: "${img.imageId}"
  //    alt: "${img.componentParams.alt}"
  //    caption: ${img.componentParams.caption ? `"${img.componentParams.caption}"` : '(none - omit caption field)'}`).join('\n')}`;
  } else {
    featuredImageInstructions = '"featured_image": null,  // No images available';
  }

  return `You are an expert legal writer generating metadata for a police misconduct case article.

**Draft Content:**
${draftContent}

**Instructions:**

The registry maintains canonical values to prevent duplicates and enable filtering. When you see something that matches a registry value (even if worded differently), use the exact registry value. If something isn't in the registry, create an appropriate new value - it will be added for future cases.

Example: Draft says "Stanislaus Sheriff" → Use "Stanislaus County Sheriff's Department" (from registry)

What you CAN infer:
- Gender from pronouns (he/him → "Male", she/her → "Female")
- Age from phrases ("39-year-old" → 39)
- Force types from actions ("slammed to ground" → "Physical Force")
- Armed status from descriptions ("unarmed", "had no weapons")
- Threat level from behavior described
- Civil lawsuit from mentions of legal filings
- Bodycam if footage is mentioned

What you CANNOT infer (must be explicitly stated or set to null):
- Race/ethnicity (NEVER assume from names or location)
- Exact dates ("October 2022" without day → null)
- Officer names (unless specifically named)
- Legal outcomes (unless explicitly stated)

${imageMedia.length > 0 ? `**AVAILABLE IMAGES:**
You have ${imageMedia.length} image(s) to choose from for the featured_image field:

${imageMedia.map((img, i) => `${i + 1}. imageId: "${img.imageId}"
   alt: "${img.componentParams.alt}"
   caption: ${img.componentParams.caption ? `"${img.componentParams.caption}"` : '(none)'}`).join('\n\n')}

` : ''}**CRITICAL - ERROR HANDLING:**
If you CANNOT determine the victim's name (title) ${imageMedia.length > 0 ? 'or select a featured_image' : ''}, return this error format instead:

\`\`\`json
{
  "error": true,
  "message": "Cannot determine victim's name from draft content. Please provide the victim's full name in the draft."
}
\`\`\`

Only return an error if the REQUIRED fields cannot be determined. Use null for optional fields.

**Return this EXACT JSON structure:**

\`\`\`json
{
  "title": "string",  // Victim's full name
  "description": "string",  // Concise summary, max 100 words
  "incident_date": "YYYY-MM-DD",  // Or null if not stated with day precision
  "published": true,
  
  "city": "string",  // City name
  "county": "string",  // REGISTRY: ${counties} | ${FIELD_REGISTRY_MAP.county.instruction}
  
  "age": 39,  // number or null (can infer from "39-year-old")
  "race": "string or null",  // NEVER assume - must be explicitly stated
  "gender": "Male",  // "Male"|"Female"|"Non-binary" or null (can infer from pronouns)
  
  "agencies": ["Full Agency Name"],  // REGISTRY: ${agencies} | ${FIELD_REGISTRY_MAP.agencies.instruction}
  
  "cause_of_death": "string or null",
  "armed_status": "Armed",  // "Armed"|"Unarmed"|"Unknown" or null
  "threat_level": "No Threat",  // REGISTRY: ${threatLevels} | ${FIELD_REGISTRY_MAP.threat_level.instruction}
  "force_type": ["Physical Force"],  // REGISTRY: ${forceTypes} | ${FIELD_REGISTRY_MAP.force_type.instruction}
  "shooting_officers": ["Officer Name"] or null,
  
  "investigation_status": "string",  // REGISTRY: ${investigationStatuses} | ${FIELD_REGISTRY_MAP.investigation_status.instruction}
  "charges_filed": true,  // true|false|null
  "civil_lawsuit_filed": true,  // true|false|null
  "bodycam_available": true,  // true|false|null
  
  ${featuredImageInstructions}
  "documents": ${JSON.stringify(documents)},  // Use exactly as provided
  "external_links": ${JSON.stringify(external_links)}  // Use exactly as provided
}
\`\`\`

Return ONLY the JSON above with all fields filled in based on the draft content.`;
}

/**
 * Build metadata extraction prompt for blog posts
 * @param {string} draftContent - Draft markdown content
 * @param {string} schemaContent - Content schema TypeScript file
 * @param {object} registry - Metadata registry
 * @param {object} mediaPackage - Processed media and links
 * @returns {string} - Complete prompt for AI
 */
export function buildBlogMetadataPrompt(draftContent, schemaContent, registry, mediaPackage) {
  // Build documents array from media - use R2 public URL
  const documents = mediaPackage.media
    .filter(item => item.type === 'document')
    .map(item => ({
      title: item.componentParams.title,
      description: item.componentParams.description,
      url: item.publicUrl
    }));
  
  // Build external_links array
  const external_links = mediaPackage.links.map(item => ({
    title: item.componentParams.title || '',
    description: item.componentParams.description || '',
    url: item.sourceUrl,
    icon: item.componentParams.icon || 'generic'
  }));
  
  // Find featured image
  const imageMedia = mediaPackage.media.filter(item => item.type === 'image');
  
  // Get registry values as JSON array
  const tags = JSON.stringify(registry.post_tags || []);
  
  // Build featured image section with clear instructions
  let featuredImageInstructions = '';
  if (imageMedia.length > 0) {
    featuredImageInstructions = `"featured_image": {  // **OPTIONAL** but strongly recommended - Select the most relevant image or set to null
    "imageId": "string",  // Choose one of these exact IDs: ${imageMedia.map(img => `"${img.imageId}"`).join(', ')}
    "alt": "string",  // Copy the exact alt text from the selected image below
    "caption": "string"  // Copy the exact caption from the selected image below (omit this line if caption is empty)
  },
  // Available images to choose from (or set featured_image to null if none are suitable):
${imageMedia.map((img, i) => `  // ${i + 1}. imageId: "${img.imageId}"
  //    alt: "${img.componentParams.alt}"
  //    caption: ${img.componentParams.caption ? `"${img.componentParams.caption}"` : '(none - omit caption field)'}`).join('\n')}`;
  } else {
    featuredImageInstructions = '"featured_image": null,  // No images available';
  }

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

  return `You are an expert writer generating metadata for a blog post about police misconduct and legal issues.

**Draft Content:**
${draftContent}

**Instructions:**

The registry maintains canonical tag values for reusable topics across posts. When a topic matches a registry tag, use it exactly. For new topics, create appropriate new tags (1-3 words, Title Case) - they'll be added to the registry.

Example: Topic about SB 2 → Use "California Legislation" (from registry)
Example: New topic about use of force → Create "Use of Force" (will be added)

${imageMedia.length > 0 ? `**AVAILABLE IMAGES:**
You have ${imageMedia.length} image(s) available for the optional featured_image field:

${imageMedia.map((img, i) => `${i + 1}. imageId: "${img.imageId}"
   alt: "${img.componentParams.alt}"
   caption: ${img.componentParams.caption ? `"${img.componentParams.caption}"` : '(none)'}`).join('\n\n')}

` : ''}**CRITICAL - ERROR HANDLING:**
If you CANNOT determine an appropriate title for this blog post, return this error format instead:

\`\`\`json
{
  "error": true,
  "message": "Cannot determine appropriate title from draft content. Please provide a clear topic or title in the draft."
}
\`\`\`

Only return an error if the title cannot be determined. All other fields can use reasonable defaults.

**Return this EXACT JSON structure:**

\`\`\`json
{
  "title": "string",  // Clear, engaging title (5-10 words)
  "description": "string",  // Concise summary for SEO/previews (15-25 words)
  "published_date": "${today}",  // Today's date
  "published": true,
  "tags": ["Tag One", "Tag Two"],  // REGISTRY: ${tags} | ${FIELD_REGISTRY_MAP.tags.instruction}
  ${featuredImageInstructions}
  "documents": ${JSON.stringify(documents)},  // Use exactly as provided
  "external_links": ${JSON.stringify(external_links)}  // Use exactly as provided
}
\`\`\`

Return ONLY the JSON above with all fields filled in based on the draft content.`;
}

/**
 * Build article generation prompt for cases
 * @param {string} draftContent - Draft markdown content
 * @param {object} metadata - Extracted metadata
 * @param {string} componentReference - Available components
 * @returns {string} - Complete prompt for AI
 */
export function buildCaseArticlePrompt(draftContent, metadata, componentReference) {
  return `You are an expert legal writer creating a publication-ready police misconduct case article.

**Draft Content:**
${draftContent}

**Extracted Metadata:**
${JSON.stringify(metadata, null, 2)}

${componentReference}

**WRITING GUIDELINES:**

1. **TONE - Encyclopedic (Wikipedia-style):**
   - Neutral, dispassionate, objective
   - NO emotional language ("tragically", "unfortunately", "shockingly")
   - NO dramatic framing or narrative embellishment
   - State facts directly without editorial commentary
   - Example: "died from injuries" NOT "tragically lost their life"

2. **STRUCTURE:**
   - DO NOT follow draft order - reorganize for best narrative flow
   - Lead with most important information
   - Build context logically
   - 3-5 paragraphs minimum for main summary
   - Use ## for section headings (not #)

3. **MEDIA PLACEMENT:**
   - Integrate components naturally throughout article
   - Place media where they enhance understanding
   - Use components from "Available Components" section above
   - Import ONLY components you actually use at the top

4. **WHAT TO INCLUDE:**
   - Comprehensive case summary
   - Timeline of events (if enough detail available)
   - Key legal/investigative developments
   - Relevant context

5. **WHAT NOT TO INCLUDE:**
   - NO "## Related Documents" section (handled automatically)
   - NO "## External Links" section (handled automatically)
   - NO "## Sources" section (in frontmatter)
   - DO reference documents/links naturally in text (e.g., "According to court filings...")

6. **COMPONENTS:**
   Available: CloudflareVideo, CloudflareImage, DocumentCard, ExternalLinkCard
   - Only import what you use
   - **CRITICAL**: Copy component HTML EXACTLY from "Available Components" - do NOT modify IDs
   - The videoId and imageId values are Cloudflare UUIDs - never change them
   - Place strategically for narrative flow

**OUTPUT FORMAT:**

Return complete MDX file with frontmatter:

\`\`\`mdx
---
title: "${metadata.title}"
description: "${metadata.description}"
incident_date: "${metadata.incident_date}"
city: "${metadata.city}"
county: "${metadata.county}"
agencies: ${JSON.stringify(metadata.agencies)}
published: true
age: ${metadata.age || 'null'}
race: ${metadata.race ? `"${metadata.race}"` : 'null'}
gender: ${metadata.gender ? `"${metadata.gender}"` : 'null'}
cause_of_death: ${metadata.cause_of_death ? `"${metadata.cause_of_death}"` : 'null'}
armed_status: ${metadata.armed_status ? `"${metadata.armed_status}"` : 'null'}
threat_level: ${metadata.threat_level ? `"${metadata.threat_level}"` : 'null'}
force_type: ${metadata.force_type ? JSON.stringify(metadata.force_type) : 'null'}
shooting_officers: ${metadata.shooting_officers ? JSON.stringify(metadata.shooting_officers) : 'null'}
investigation_status: ${metadata.investigation_status ? `"${metadata.investigation_status}"` : 'null'}
charges_filed: ${metadata.charges_filed !== undefined && metadata.charges_filed !== null ? metadata.charges_filed : 'null'}
civil_lawsuit_filed: ${metadata.civil_lawsuit_filed !== undefined && metadata.civil_lawsuit_filed !== null ? metadata.civil_lawsuit_filed : 'null'}
bodycam_available: ${metadata.bodycam_available !== undefined && metadata.bodycam_available !== null ? metadata.bodycam_available : 'null'}
featured_image: ${metadata.featured_image ? `
  imageId: "${metadata.featured_image.imageId}"
  alt: "${metadata.featured_image.alt}"${metadata.featured_image.caption ? `\n  caption: "${metadata.featured_image.caption}"` : ''}` : 'null'}
documents: ${metadata.documents ? JSON.stringify(metadata.documents) : 'null'}
external_links: ${metadata.external_links ? JSON.stringify(metadata.external_links) : 'null'}
---

import CloudflareImage from '../../components/CloudflareImage.astro';
import CloudflareVideo from '../../components/CloudflareVideo.astro';

[Your encyclopedic article content with embedded media, proper headings, timeline, etc.]
\`\`\``;
}

/**
 * Build article generation prompt for blog posts
 * @param {string} draftContent - Draft markdown content
 * @param {object} metadata - Extracted metadata
 * @param {string} componentReference - Available components
 * @returns {string} - Complete prompt for AI
 */
export function buildBlogArticlePrompt(draftContent, metadata, componentReference) {
  return `You are an expert writer creating a publication-ready blog post about police misconduct and legal issues.

**Draft Content:**
${draftContent}

**Extracted Metadata:**
${JSON.stringify(metadata, null, 2)}

${componentReference}

**WRITING GUIDELINES:**

1. **TONE - Engaging and Informative:**
   - Professional but conversational
   - Explain legal concepts clearly for general audience
   - Use active voice
   - Be informative without being dry
   - Example: "Understanding qualified immunity starts with..." NOT "This doctrine is complex and..."

2. **STRUCTURE:**
   - DO NOT follow draft order - reorganize for best flow
   - Lead with engaging introduction that hooks reader
   - Build arguments/explanations logically
   - 4-7 paragraphs minimum for main content
   - Use ## for section headings (not #)

3. **REQUIRED SECTION - Key Takeaways:**
   - Include a "## Key Takeaways" section near the end
   - 3-5 bullet points summarizing main points
   - Clear, actionable insights

4. **MEDIA PLACEMENT:**
   - Integrate components naturally throughout article
   - Place media where they enhance understanding
   - Use components from "Available Components" section above
   - Import ONLY components you actually use at the top

5. **WHAT NOT TO INCLUDE:**
   - NO "## Related Documents" section (handled automatically)
   - NO "## External Links" section (handled automatically)
   - NO "## Sources" section (in frontmatter)
   - DO reference documents/links naturally in text when relevant

6. **COMPONENTS:**
   Available: CloudflareVideo, CloudflareImage, DocumentCard, ExternalLinkCard
   - Only import what you use
   - **CRITICAL**: Copy component HTML EXACTLY from "Available Components" - do NOT modify IDs
   - The videoId and imageId values are Cloudflare UUIDs - never change them
   - Place strategically for narrative flow

**OUTPUT FORMAT:**

Return complete MDX file with frontmatter:

\`\`\`mdx
---
title: "${metadata.title}"
description: "${metadata.description}"
published_date: "${metadata.published_date}"
published: ${metadata.published}
tags: ${JSON.stringify(metadata.tags)}${metadata.featured_image ? `
featured_image:
  imageId: "${metadata.featured_image.imageId}"
  alt: "${metadata.featured_image.alt}"${metadata.featured_image.caption ? `\n  caption: "${metadata.featured_image.caption}"` : ''}` : ''}
documents: ${metadata.documents ? JSON.stringify(metadata.documents) : 'null'}
external_links: ${metadata.external_links ? JSON.stringify(metadata.external_links) : 'null'}
---

import CloudflareImage from '../../components/CloudflareImage.astro';
import CloudflareVideo from '../../components/CloudflareVideo.astro';

[Your engaging article content with embedded media, proper headings, Key Takeaways section, etc.]
\`\`\``;
}
