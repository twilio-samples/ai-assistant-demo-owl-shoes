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
      
      // Prepare the meta object with required input_schema
      const meta = {
        url: config.url,
        method: config.method,
        input_schema: 'export type Data = {}'  // Default empty schema
      };

      // If schema is provided in config, use it
      if (config.schema) {
        meta.input_schema = `export type Data = { ${
          Object.entries(config.schema)
            .map(([key, type]) => `${key}: ${type}`)
            .join(', ')
        } }`;
      }

      // Create the tool
      const tool = await client.assistants.v1.tools.create({
        name: config.name,
        type: config.type,
        description: config.description,
        enabled: true,
        meta: meta
      });
      
      console.log(`Tool ${config.name} created successfully. ID: ${tool.id}`);

      // Add delay before attempting attachment
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Attach the tool to the assistant
      console.log(`Attempting to attach tool ${tool.id} to assistant ${assistantId}`);
      
      await client.assistants.v1
        .assistants(assistantId)
        .assistantsTools(tool.id)
        .create();

      console.log(`Tool ${config.name} attached successfully`);
      createdTools.push(tool);

    } catch (error) {
      console.error(`Failed to handle tool ${config.name}:`, error);
      throw error;
    }
  }

  return createdTools;
}

module.exports = createTools;