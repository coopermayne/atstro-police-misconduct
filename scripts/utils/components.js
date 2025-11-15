/**
 * Component Generation Utilities
 * 
 * Functions for generating MDX component HTML strings.
 */

/**
 * Escape quotes in component prop values
 * @param {string} str - String to escape
 * @returns {string} - Escaped string
 */
export function escapeQuotes(str) {
  if (!str) return '';
  return str.replace(/"/g, '&quot;');
}

/**
 * Extract minimal context after a URL in the markdown content
 * @param {string} content - Full markdown content
 * @param {string} url - URL to find context for
 * @returns {string} Context snippet (up to ~20 words after the URL)
 */
export function extractUrlContext(content, url) {
  const index = content.indexOf(url);
  if (index === -1) return '';
  
  // Start after the URL
  const afterUrl = content.substring(index + url.length);
  
  // Take up to 150 characters (roughly 20-25 words)
  let contextEnd = Math.min(150, afterUrl.length);
  let context = afterUrl.substring(0, contextEnd);
  
  // Stop if we hit another URL (http:// or https://)
  const nextUrlMatch = context.match(/https?:\/\//);
  if (nextUrlMatch) {
    context = context.substring(0, nextUrlMatch.index);
  }
  
  // Trim whitespace
  context = context.trim();
  
  return context || '(no context available)';
}

/**
 * Generate component HTML/MDX string for media
 * @param {string} type - Media type (video, image, document)
 * @param {object} libraryEntry - Media library entry with Cloudflare IDs
 * @param {object} componentParams - AI-generated component parameters
 * @returns {string} - MDX component string
 */
export function generateComponentHTML(type, libraryEntry, componentParams) {
  switch (type) {
    case 'video': {
      const props = [];
      props.push(`videoId="${libraryEntry.videoId}"`);
      if (componentParams.caption) {
        props.push(`caption="${escapeQuotes(componentParams.caption)}"`);
      }
      return `<CloudflareVideo ${props.join(' ')} />`;
    }
    
    case 'image': {
      const props = [];
      props.push(`imageId="${libraryEntry.imageId}"`);
      props.push(`alt="${escapeQuotes(componentParams.alt)}"`);
      if (componentParams.caption) {
        props.push(`caption="${escapeQuotes(componentParams.caption)}"`);
      }
      return `<CloudflareImage ${props.join(' ')} />`;
    }
    
    case 'document': {
      const props = [];
      props.push(`title="${escapeQuotes(componentParams.title)}"`);
      props.push(`description="${escapeQuotes(componentParams.description)}"`);
      props.push(`url="${libraryEntry.publicUrl}"`);
      return `<DocumentCard ${props.join(' ')} />`;
    }
    
    default:
      return `<!-- Unknown media type: ${type} -->`;
  }
}

/**
 * Generate component HTML/MDX string for external links
 * @param {string} sourceUrl - The link URL
 * @param {object} componentParams - AI-generated link parameters
 * @returns {string} - MDX component string
 */
export function generateLinkComponentHTML(sourceUrl, componentParams) {
  const props = [];
  props.push(`url="${sourceUrl}"`);
  
  if (componentParams.title) {
    props.push(`title="${escapeQuotes(componentParams.title)}"`);
  }
  if (componentParams.description) {
    props.push(`description="${escapeQuotes(componentParams.description)}"`);
  }
  if (componentParams.icon) {
    props.push(`icon="${componentParams.icon}"`);
  }
  
  return `<ExternalLinkCard ${props.join(' ')} />`;
}
