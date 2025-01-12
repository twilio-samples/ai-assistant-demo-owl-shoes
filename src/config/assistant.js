const fs = require('fs');
const path = require('path');

const promptPath = path.join(__dirname, '../../prompts/assistant-prompt.md');
const personalityPrompt = fs.readFileSync(promptPath, 'utf8');

module.exports = {
  name: "Retail Demo Assistant - Owl Shoes",
  personality_prompt: personalityPrompt
};