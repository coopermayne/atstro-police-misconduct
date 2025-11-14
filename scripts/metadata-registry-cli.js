#!/usr/bin/env node
/**
 * Metadata Registry CLI
 * 
 * Manage canonical metadata for consistent tagging across the site
 */

import { loadRegistry, saveRegistry, addAgency, addTag, formatRegistryForAI } from './metadata-registry.js';

const args = process.argv.slice(2);
const command = args[0];

function showHelp() {
  console.log(`
Metadata Registry Manager

Commands:
  list [type]                    List all entries (agencies, counties, force-types, threat-levels, investigation-statuses, tags)
  add-agency <name> <aliases>   Add new agency (aliases comma-separated)
  add-tag <tag> <type>          Add new tag (type: case or post)
  show-ai-format [type]         Show formatted registry for AI (type: case or post)
  stats                         Show registry statistics

Examples:
  node scripts/metadata-registry-cli.js list agencies
  node scripts/metadata-registry-cli.js add-agency "Berkeley Police Department" "BPD,Berkeley PD"
  node scripts/metadata-registry-cli.js add-tag "Wrongful Arrest" case
  node scripts/metadata-registry-cli.js show-ai-format case
`);
}

function listEntries(type) {
  const registry = loadRegistry();
  
  switch (type) {
    case 'agencies':
      console.log('\n📋 Police Agencies:\n');
      registry.agencies.forEach(agency => {
        console.log(`  ${agency.canonical_name}`);
        if (agency.aliases.length > 0) {
          console.log(`    Aliases: ${agency.aliases.join(', ')}`);
        }
        console.log(`    Location: ${agency.city}, ${agency.county} County`);
        console.log(`    Slug: ${agency.slug}\n`);
      });
      break;
      
    case 'counties':
      console.log('\n🗺️  California Counties:\n');
      registry.counties.forEach(county => {
        console.log(`  ${county.canonical_name}`);
        if (county.aliases.length > 0) {
          console.log(`    Aliases: ${county.aliases.join(', ')}`);
        }
        console.log(`    Slug: ${county.slug}\n`);
      });
      break;
      
    case 'force-types':
      console.log('\n⚡ Force Types:\n');
      registry.force_types.forEach(force => {
        console.log(`  ${force.canonical_name} (${force.severity})`);
        if (force.aliases.length > 0) {
          console.log(`    Matches: ${force.aliases.join(', ')}\n`);
        }
      });
      break;
      
    case 'threat-levels':
      console.log('\n⚠️  Threat Levels:\n');
      registry.threat_levels.forEach(threat => {
        console.log(`  ${threat.canonical_name}`);
        console.log(`    ${threat.description}\n`);
      });
      break;
      
    case 'investigation-statuses':
      console.log('\n🔍 Investigation Statuses:\n');
      registry.investigation_statuses.forEach(status => {
        console.log(`  ${status.canonical_name}`);
        if (status.aliases.length > 0) {
          console.log(`    Aliases: ${status.aliases.join(', ')}`);
        }
        console.log(`    Slug: ${status.slug}\n`);
      });
      break;
      
    case 'case-tags':
      console.log('\n🏷️  Case Tags:\n');
      registry.case_tags.forEach(tag => {
        console.log(`  - ${tag}`);
      });
      console.log();
      break;
      
    case 'post-tags':
      console.log('\n🏷️  Blog Post Tags:\n');
      registry.post_tags.forEach(tag => {
        console.log(`  - ${tag}`);
      });
      console.log();
      break;
      
    default:
      console.log('\n❌ Invalid type. Use: agencies, counties, force-types, threat-levels, investigation-statuses, case-tags, post-tags\n');
  }
}

function showStats() {
  const registry = loadRegistry();
  
  console.log('\n📊 Metadata Registry Statistics\n');
  console.log(`  Agencies: ${registry.agencies.length}`);
  console.log(`  Counties: ${registry.counties.length}`);
  console.log(`  Force Types: ${registry.force_types.length}`);
  console.log(`  Threat Levels: ${registry.threat_levels.length}`);
  console.log(`  Investigation Statuses: ${registry.investigation_statuses.length}`);
  console.log(`  Case Tags: ${registry.case_tags.length}`);
  console.log(`  Post Tags: ${registry.post_tags.length}`);
  console.log(`\n  Last Updated: ${registry.last_updated}`);
  console.log(`  Version: ${registry.metadata_version}\n`);
}

// Main command handler
switch (command) {
  case 'list':
    if (!args[1]) {
      console.log('\n❌ Please specify type: agencies, counties, force-types, threat-levels, investigation-statuses, case-tags, post-tags\n');
    } else {
      listEntries(args[1]);
    }
    break;
    
  case 'add-agency':
    if (!args[1]) {
      console.log('\n❌ Please provide agency name\n');
    } else {
      const aliases = args[2] ? args[2].split(',').map(a => a.trim()) : [];
      const county = args[3] || '';
      const city = args[4] || args[1].replace(' Police Department', '').replace(' PD', '');
      addAgency(args[1], aliases, county, city);
    }
    break;
    
  case 'add-tag':
    if (!args[1] || !args[2]) {
      console.log('\n❌ Please provide tag and type (case or post)\n');
    } else {
      addTag(args[1], args[2]);
    }
    break;
    
  case 'show-ai-format':
    const contentType = args[1] || 'case';
    console.log(formatRegistryForAI(contentType));
    break;
    
  case 'stats':
    showStats();
    break;
    
  case 'help':
  case '--help':
  case '-h':
  default:
    showHelp();
}
