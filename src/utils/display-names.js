/**
 * Display name utility for looking up shortened versions from JSON dictionary
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DISPLAY_NAMES_PATH = join(__dirname, '../../data/display-names.json');

/**
 * Load the display names from file
 */
function loadDisplayNames() {
  try {
    const fileContent = readFileSync(DISPLAY_NAMES_PATH, 'utf-8');
    return JSON.parse(fileContent);
  } catch (err) {
    console.warn('⚠️  Could not load display-names.json:', err.message);
    return {};
  }
}

/**
 * Get shortened display name from dictionary
 * If not found, adds it to the JSON file with the full name as placeholder
 * 
 * @param {string} fullName - The full name to look up
 * @returns {string} Shortened name from dictionary or original if not found
 */
export function getShortName(fullName) {
  // Load fresh data on each call
  const displayNamesData = loadDisplayNames();
  
  console.log(`🔍 Looking up short name for: "${fullName}"`);
  
  const shortName = displayNamesData[fullName];
  
  if (shortName) {
    console.log(`✅ Found: "${shortName}"`);
    return shortName;
  }
  
  // Not found - add it to the file with full name as placeholder
  console.log(`📝 Adding to display-names.json: "${fullName}"`);
  displayNamesData[fullName] = fullName;
  
  try {
    writeFileSync(DISPLAY_NAMES_PATH, JSON.stringify(displayNamesData, null, 2));
    console.log(`✅ Successfully added to display-names.json`);
  } catch (err) {
    console.warn(`⚠️  Could not save to display-names.json: ${err.message}`);
  }
  
  return fullName;
}