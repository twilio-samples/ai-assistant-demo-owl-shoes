// src/lib/createKnowledge.js
/**
 * Creates and attaches knowledge bases to the specified assistant
 * @param {object} client - Twilio client instance
 * @param {string} assistantId - The assistant SID
 * @param {object} knowledgeConfig - Knowledge base configurations
 * @returns {Promise<Array>} Created knowledge base details
 */
async function createKnowledge(client, assistantId, knowledgeConfig) {
    const createdKnowledge = [];
  
    for (const [key, config] of Object.entries(knowledgeConfig)) {
      try {
        console.log(`Creating knowledge base: ${config.name}`);
        
        const knowledge = await client.assistants.v1.knowledge.create({
          name: config.name,
          type: config.type,
          description: config.description,
          knowledge_source_details: {
            source: config.source
          }
        });
  
        // Attach the knowledge base to the assistant
        await client.assistants.v1
          .assistants(assistantId)
          .assistantsKnowledge(knowledge.id)
          .create();
  
        console.log(`Knowledge base ${config.name} created and attached successfully`);
        createdKnowledge.push(knowledge);
      } catch (error) {
        console.error(`Failed to create knowledge base ${config.name}:`, error);
        throw error;
      }
    }
  
    return createdKnowledge;
  }
  
  module.exports = createKnowledge;