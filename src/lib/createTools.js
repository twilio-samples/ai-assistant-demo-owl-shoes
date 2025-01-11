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
                      JSON.stringify({
                          type: 'object',
                          properties: Object.entries(config.schema).reduce((acc, [key, type]) => {
                              acc[key] = { type };
                              return acc;
                          }, {})
                      }) : 
                      JSON.stringify({
                          type: 'object',
                          properties: {}
                      })
              }
          });
          
          console.log(`Tool ${config.name} created successfully. ID: ${tool.id}`);
          
          // Attach the tool to the assistant using the correct id format
          const assistantsTool = await client.assistants.v1
              .assistants(assistantId)
              .assistantsTools(tool.id)
              .create();
          
          console.log(`Tool ${config.name} attached successfully. Attachment id: ${assistantsTool.sid}`);
          createdTools.push(tool);
      } catch (error) {
          console.error(`Failed to create/attach tool ${config.name}:`, error);
          throw error;
      }
  }

  return createdTools;
}

module.exports = createTools;