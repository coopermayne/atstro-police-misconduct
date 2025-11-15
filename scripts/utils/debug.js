/**
 * Debug Mode Utilities
 * 
 * Functions for interactive debugging of AI prompts and responses.
 */

import prompts from 'prompts';

/**
 * Display prompt to user and ask for confirmation before sending to AI
 * @param {string} prompt - The prompt to display
 * @param {string} promptName - Name/description of the prompt
 * @param {boolean} debugMode - Whether debug mode is enabled
 * @returns {Promise<boolean>} - True if user confirms, false otherwise
 */
export async function displayPromptAndConfirm(prompt, promptName, debugMode = false) {
  if (!debugMode) {
    // In normal mode, just return true without displaying
    return true;
  }
  
  console.log('\n' + '═'.repeat(80));
  console.log(`📋 ${promptName}`);
  console.log('═'.repeat(80) + '\n');
  
  // Display prompt with word wrapping
  console.log(prompt);
  
  console.log('\n' + '═'.repeat(80));
  console.log(`Total characters: ${prompt.length}`);
  console.log('═'.repeat(80) + '\n');
  
  const response = await prompts({
    type: 'confirm',
    name: 'proceed',
    message: 'Send this prompt to Claude AI?',
    initial: true
  });
  
  if (!response.proceed) {
    console.log('\n❌ Cancelled by user\n');
    process.exit(0);
  }
  
  console.log('\n✓ Sending to Claude...\n');
  return true;
}

/**
 * Display AI response to user and ask for confirmation before continuing
 * @param {string} response - The AI response text to display
 * @param {string} responseName - Name/description of the response
 * @param {boolean} debugMode - Whether debug mode is enabled
 * @returns {Promise<boolean>} - True if user confirms, false otherwise
 */
export async function displayResponseAndConfirm(response, responseName, debugMode = false) {
  if (!debugMode) {
    // In normal mode, just return true without displaying
    return true;
  }
  
  console.log('\n' + '═'.repeat(80));
  console.log(`🤖 ${responseName}`);
  console.log('═'.repeat(80) + '\n');
  
  // Display response
  console.log(response);
  
  console.log('\n' + '═'.repeat(80));
  console.log(`Total characters: ${response.length}`);
  console.log('═'.repeat(80) + '\n');
  
  const confirmResponse = await prompts({
    type: 'confirm',
    name: 'proceed',
    message: 'Continue with this response?',
    initial: true
  });
  
  if (!confirmResponse.proceed) {
    console.log('\n❌ Cancelled by user\n');
    process.exit(0);
  }
  
  console.log('\n✓ Continuing...\n');
  return true;
}
