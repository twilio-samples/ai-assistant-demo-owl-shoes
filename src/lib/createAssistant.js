// src/lib/createAssistant.js
/**
 * Creates a new AI Assistant with the specified configuration
 * @param {object} client - Twilio client instance
 * @param {object} config - Assistant configuration
 * @returns {Promise<object>} Created assistant details
 */
async function createAssistant(client, config) {
    try {
      console.log('Creating AI Assistant...');
      
      const assistant = await client.assistants.v1.assistants.create({
        name: config.name,
        personality_prompt: config.personality_prompt
      });
      
      console.log('Assistant created successfully:', assistant.id);
      return assistant;
    } catch (error) {
      console.error('Failed to create assistant:', error);
      throw error;
    }
  }
  
  module.exports = createAssistant;