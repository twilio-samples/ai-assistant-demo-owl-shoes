// src/lib/createTools.js
/**
 * Creates and attaches tools to the specified assistant
 * @param {object} client - Twilio client instance
 * @param {string} assistantId - The assistant ID
 * @param {object} toolsConfig - Tool configurations
 * @returns {Promise<Array>} Created tools details
 */
async function createTools(client, assistantId, toolsConfig) {
    const createdTools = [];
  
    for (const [key, config] of Object.entries(toolsConfig)) {
      try {
        console.log(`Creating tool: ${config.name}`);
        
        // Create the tool
        const tool = await client.assistants.v1.tools.create({
          name: config.name,
          type: config.type,
          description: config.description,
          enabled: true,
          meta: {
            url: config.url,
            method: config.method,
            input_schema: config.schema ? 
              `export type Data = { ${Object.entries(config.schema)
                .map(([key, type]) => `\n  ${key}: ${type}`)
                .join(',')} \n}` : 
              `export type Data = { \n /* insert your schema here. */ \n}`
          }
        });
        console.log(`Tool ${config.name} created successfully. ID: ${tool.id}`);
        // Attach the tool to the assistant
        await client.assistants.v1
          .assistants(assistantId)
          .assistantsTools(tool.id)
          .create();
  
        console.log(`Tool ${config.name} created and attached successfully`);
        createdTools.push(tool);
      } catch (error) {
        console.error(`Failed to create tool ${config.name}:`, error);
        throw error;
      }
    }
  
    return createdTools;
  }
  
  module.exports = createTools;