/**
 * Metadata Registry Manager
 * 
 * Provides functions to:
 * - Load canonical metadata registry
 * - Match user input to canonical names
 * - Add new entries when needed
 * - Format metadata for AI prompts
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REGISTRY_PATH = path.join(__dirname, '..', 'metadata-registry.json');

/**
 * Load the metadata registry
 */
export function loadRegistry() {
  const content = fs.readFileSync(REGISTRY_PATH, 'utf-8');
  return JSON.parse(content);
}

/**
 * Save the metadata registry
 */
export function saveRegistry(registry) {
  registry.last_updated = new Date().toISOString().split('T')[0];
  fs.writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2));
}

/**
 * Match an agency name to its canonical form
 */
export function matchAgency(input, registry = null) {
  if (!registry) registry = loadRegistry();
  
  const normalized = input.toLowerCase().trim();
  
  for (const agency of registry.agencies) {
    // Check canonical name
    if (agency.canonical_name.toLowerCase() === normalized) {
      return agency.canonical_name;
    }
    
    // Check aliases
    if (agency.aliases.some(alias => alias.toLowerCase() === normalized)) {
      return agency.canonical_name;
    }
  }
  
  return null; // No match found
}

/**
 * Match a county name to its canonical form
 */
export function matchCounty(input, registry = null) {
  if (!registry) registry = loadRegistry();
  
  const normalized = input.toLowerCase().trim();
  
  for (const county of registry.counties) {
    if (county.canonical_name.toLowerCase() === normalized) {
      return county.canonical_name;
    }
    
    if (county.aliases.some(alias => alias.toLowerCase() === normalized)) {
      return county.canonical_name;
    }
  }
  
  return null;
}

/**
 * Match force types to canonical names
 */
export function matchForceTypes(inputs, registry = null) {
  if (!registry) registry = loadRegistry();
  if (!Array.isArray(inputs)) inputs = [inputs];
  
  const matches = new Set();
  
  for (const input of inputs) {
    const normalized = input.toLowerCase().trim();
    
    for (const forceType of registry.force_types) {
      if (forceType.canonical_name.toLowerCase() === normalized) {
        matches.add(forceType.canonical_name);
        continue;
      }
      
      if (forceType.aliases.some(alias => normalized.includes(alias.toLowerCase()))) {
        matches.add(forceType.canonical_name);
      }
    }
  }
  
  return Array.from(matches);
}

/**
 * Match threat level to canonical name
 */
export function matchThreatLevel(input, registry = null) {
  if (!registry) registry = loadRegistry();
  
  const normalized = input.toLowerCase().trim();
  
  for (const threat of registry.threat_levels) {
    if (threat.canonical_name.toLowerCase() === normalized) {
      return threat.canonical_name;
    }
    
    if (threat.aliases.some(alias => normalized.includes(alias.toLowerCase()))) {
      return threat.canonical_name;
    }
  }
  
  return null;
}

/**
 * Match investigation status to canonical name
 */
export function matchInvestigationStatus(input, registry = null) {
  if (!registry) registry = loadRegistry();
  
  const normalized = input.toLowerCase().trim();
  
  for (const status of registry.investigation_statuses) {
    if (status.canonical_name.toLowerCase() === normalized) {
      return status.canonical_name;
    }
    
    if (status.aliases.some(alias => normalized.includes(alias.toLowerCase()))) {
      return status.canonical_name;
    }
  }
  
  return null;
}

/**
 * Match tags to canonical names (case or post)
 */
export function matchTags(inputs, contentType = 'case', registry = null) {
  if (!registry) registry = loadRegistry();
  if (!Array.isArray(inputs)) inputs = [inputs];
  
  const tagList = contentType === 'case' ? registry.case_tags : registry.post_tags;
  const matches = new Set();
  
  for (const input of inputs) {
    const normalized = input.toLowerCase().trim();
    
    // Look for exact or close matches
    for (const tag of tagList) {
      if (tag.toLowerCase() === normalized) {
        matches.add(tag);
      }
    }
  }
  
  return Array.from(matches);
}

/**
 * Add a new agency to the registry
 */
export function addAgency(canonicalName, aliases = [], county = '', city = '') {
  const registry = loadRegistry();
  
  // Check if already exists
  if (matchAgency(canonicalName, registry)) {
    console.log(`Agency "${canonicalName}" already exists in registry`);
    return false;
  }
  
  const slug = canonicalName.toLowerCase().replace(/\s+/g, '-');
  
  registry.agencies.push({
    canonical_name: canonicalName,
    aliases: Array.isArray(aliases) ? aliases : [aliases],
    slug,
    county,
    city
  });
  
  saveRegistry(registry);
  console.log(`✓ Added agency: ${canonicalName}`);
  return true;
}

/**
 * Add a new tag to the registry
 */
export function addTag(tag, contentType = 'case') {
  const registry = loadRegistry();
  const tagList = contentType === 'case' ? registry.case_tags : registry.post_tags;
  
  if (tagList.includes(tag)) {
    console.log(`Tag "${tag}" already exists`);
    return false;
  }
  
  tagList.push(tag);
  tagList.sort();
  
  if (contentType === 'case') {
    registry.case_tags = tagList;
  } else {
    registry.post_tags = tagList;
  }
  
  saveRegistry(registry);
  console.log(`✓ Added ${contentType} tag: ${tag}`);
  return true;
}

/**
 * Format registry for AI prompt
 */
export function formatRegistryForAI(contentType = 'case') {
  const registry = loadRegistry();
  
  let formatted = '**CANONICAL METADATA REGISTRY**\n\n';
  formatted += 'Use these canonical names when generating metadata. If you find a close match, use it. Only create new entries if absolutely necessary.\n\n';
  
  // Agencies
  formatted += '**Police Agencies:**\n';
  registry.agencies.forEach(agency => {
    formatted += `- ${agency.canonical_name}`;
    if (agency.aliases.length > 0) {
      formatted += ` (also: ${agency.aliases.join(', ')})`;
    }
    formatted += `\n`;
  });
  
  // Counties
  formatted += '\n**California Counties:**\n';
  registry.counties.forEach(county => {
    formatted += `- ${county.canonical_name}`;
    if (county.aliases.length > 0) {
      formatted += ` (also: ${county.aliases.join(', ')})`;
    }
    formatted += `\n`;
  });
  
  if (contentType === 'case') {
    // Force types
    formatted += '\n**Force Types (use these exact names):**\n';
    registry.force_types.forEach(force => {
      formatted += `- ${force.canonical_name}`;
      if (force.aliases.length > 0) {
        formatted += ` (matches: ${force.aliases.join(', ')})`;
      }
      formatted += `\n`;
    });
    
    // Threat levels
    formatted += '\n**Threat Levels (choose one):**\n';
    registry.threat_levels.forEach(threat => {
      formatted += `- ${threat.canonical_name}: ${threat.description}\n`;
    });
    
    // Investigation statuses
    formatted += '\n**Investigation Statuses:**\n';
    registry.investigation_statuses.forEach(status => {
      formatted += `- ${status.canonical_name}`;
      if (status.aliases.length > 0) {
        formatted += ` (also: ${status.aliases.join(', ')})`;
      }
      formatted += `\n`;
    });
    
    // Case tags
    formatted += '\n**Case Tags (select relevant ones):**\n';
    registry.case_tags.forEach(tag => {
      formatted += `- ${tag}\n`;
    });
  } else {
    // Post tags
    formatted += '\n**Blog Post Tags (select 3-5 relevant ones):**\n';
    registry.post_tags.forEach(tag => {
      formatted += `- ${tag}\n`;
    });
  }
  
  formatted += '\n**IMPORTANT:** Always use exact canonical names from this registry. Do not create variations.\n';
  
  return formatted;
}

/**
 * Validate and normalize metadata against registry
 */
export function normalizeMetadata(metadata, contentType = 'case') {
  const registry = loadRegistry();
  const normalized = { ...metadata };
  
  // Normalize agency
  if (metadata.agencies && Array.isArray(metadata.agencies)) {
    normalized.agencies = metadata.agencies.map(agency => {
      const match = matchAgency(agency, registry);
      return match || agency;
    });
  }
  
  // Normalize county
  if (metadata.county) {
    const match = matchCounty(metadata.county, registry);
    if (match) normalized.county = match;
  }
  
  // Normalize force types (cases only)
  if (contentType === 'case' && metadata.force_type && Array.isArray(metadata.force_type)) {
    normalized.force_type = matchForceTypes(metadata.force_type, registry);
  }
  
  // Normalize threat level (cases only)
  if (contentType === 'case' && metadata.threat_level) {
    const match = matchThreatLevel(metadata.threat_level, registry);
    if (match) normalized.threat_level = match;
  }
  
  // Normalize investigation status (cases only)
  if (contentType === 'case' && metadata.investigation_status) {
    const match = matchInvestigationStatus(metadata.investigation_status, registry);
    if (match) normalized.investigation_status = match;
  }
  
  // Normalize tags
  if (metadata.tags && Array.isArray(metadata.tags)) {
    const matchedTags = matchTags(metadata.tags, contentType, registry);
    // Keep original tags that didn't match (might be new valid tags)
    normalized.tags = [...new Set([...matchedTags, ...metadata.tags])];
  }
  
  return normalized;
}
