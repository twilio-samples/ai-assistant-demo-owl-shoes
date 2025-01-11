// src/deploy.js
require('dotenv').config();
const twilio = require('twilio');
const assistantConfig = require('./config/assistant');
const toolsConfig = require('./config/tools');
const knowledgeConfig = require('./config/knowledge');
const createAssistant = require('./lib/createAssistant');
const createTools = require('./lib/createTools');
const createKnowledge = require('./lib/createKnowledge');

/**
 * Main deployment script that orchestrates the creation of the assistant,
 * its tools, and knowledge bases
 */
async function deploy() {
  // Validate environment variables
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    throw new Error('Missing required environment variables. Please check .env file.');
  }

  const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );

  console.log('Starting AI Assistant deployment...\n');

  try {
    // Step 1: Create the assistant
    console.log('Step 1: Creating AI Assistant...');
    const assistant = await createAssistant(client, assistantConfig);
    console.log('✓ Assistant created successfully');
    console.log('Assistant SID:', assistant.sid);
    
    // Step 2: Create and attach tools
    console.log('\nStep 2: Creating and attaching tools...');
    const tools = await createTools(client, assistant.sid, toolsConfig);
    console.log(`✓ Successfully created and attached ${tools.length} tools`);
    
    // Step 3: Create and attach knowledge bases
    console.log('\nStep 3: Creating and attaching knowledge bases...');
    const knowledge = await createKnowledge(client, assistant.sid, knowledgeConfig);
    console.log(`✓ Successfully created and attached ${knowledge.length} knowledge bases`);
    
    // Deployment summary
    console.log('\n=== Deployment Summary ===');
    console.log('Assistant SID:', assistant.sid);
    console.log('Tools created:', tools.length);
    console.log('Knowledge bases created:', knowledge.length);
    console.log('\nDeployment completed successfully! 🎉');
    console.log('\nNext steps:');
    console.log('1. Visit the Twilio Console to view your assistant');
    console.log('2. Test the assistant functionality');
    console.log('3. Update webhook URLs if needed');
    
    return {
      assistant,
      tools,
      knowledge
    };
  } catch (error) {
    console.error('\n❌ Deployment failed:');
    console.error('Error:', error.message);
    
    // Provide helpful error context
    if (error.code) {
      console.error('Error Code:', error.code);
    }
    if (error.status) {
      console.error('Status Code:', error.status);
    }
    
    // Deployment recovery suggestions
    console.log('\nTroubleshooting suggestions:');
    console.log('1. Check your Twilio credentials');
    console.log('2. Verify your account has AI Assistant access');
    console.log('3. Ensure all webhook URLs are valid');
    console.log('4. Check for any duplicate resource names');

    throw error;
  }
}

// Add cleanup function for handling interruptions
process.on('SIGINT', async () => {
  console.log('\n\nReceived interrupt signal. Cleaning up...');
  // You could add cleanup logic here if needed
  process.exit(0);
});

// Run the deployment if this script is executed directly
if (require.main === module) {
  deploy()
    .then((result) => {
      // Log final success message
      console.log('\nYou can now find your assistant in the Twilio Console:');
      console.log(`https://www.twilio.com/console/assistant/${result.assistant.sid}`);
      process.exit(0);
    })
    .catch((error) => {
      // Log error and exit with failure code
      console.error('\nDeployment failed. See error details above.');
      process.exit(1);
    });
}

module.exports = deploy;