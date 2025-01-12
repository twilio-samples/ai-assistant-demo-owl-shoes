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
      
      // Create the knowledge base
      const knowledge = await client.assistants.v1.knowledge.create({
        name: config.name,
        type: config.type,
        description: config.description,
        knowledge_source_details: {
          source: config.source
        }
      });

      console.log(`Knowledge base ${config.name} created successfully. ID: ${knowledge.id}`);

      // Add delay before attempting attachment
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Attach the knowledge base to the assistant
      console.log(`Attempting to attach knowledge base ${knowledge.id} to assistant ${assistantId}`);
      
      try {
        await client.assistants.v1
          .assistants(assistantId)
          .assistantsKnowledge(knowledge.id)
          .create();
        
        console.log(`Knowledge base ${config.name} attached successfully`);
      } catch (attachError) {
        // If we get an "Unexpected end of JSON input" error, this is actually a success (204 response)
        if (attachError.message === 'Unexpected end of JSON input') {
          console.log(`Knowledge base ${config.name} attached successfully (204 response)`);
        } else {
          // If it's any other error, rethrow it
          throw attachError;
        }
      }

      createdKnowledge.push(knowledge);

    } catch (error) {
      console.error(`Failed to handle knowledge base ${config.name}:`, error);
      throw error;
    }
  }

  return createdKnowledge;
}

module.exports = createKnowledge;