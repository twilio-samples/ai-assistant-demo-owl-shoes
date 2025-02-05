// src/deploy.js
require('dotenv').config();
const twilio = require('twilio');
const { TwilioServerlessApiClient } = require('@twilio-labs/serverless-api');
const readline = require('readline');
const fs = require('fs');
const assistantConfig = require('./config/assistant');
const toolsConfig = require('./config/tools');
const knowledgeConfig = require('./config/knowledge');
const createAssistant = require('./lib/createAssistant');
const createTools = require('./lib/createTools');
const createKnowledge = require('./lib/createKnowledge');
const createVoiceIntel = require('./lib/createVoiceIntel');
const deployFunctions = require('./lib/deployFunctions');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Promisify readline question
const question = (query) =>
  new Promise((resolve) => rl.question(query, resolve));

// Helper function to update .env file
const updateEnvFile = (key, value) => {
  const envFilePath = '.env';
  const envContent = fs.readFileSync(envFilePath, 'utf8');
  const envLines = envContent.split('\n');

  // Check if key already exists
  const keyIndex = envLines.findIndex((line) => line.startsWith(`${key}=`));

  if (keyIndex !== -1) {
    // Update existing key
    envLines[keyIndex] = `${key}=${value}`;
  } else {
    // Add new key
    envLines.push(`${key}=${value}`);
  }

  fs.writeFileSync(envFilePath, envLines.join('\n'));
  console.log(`✓ Updated .env file with ${key}`);
};

/**
 * Main deployment script that orchestrates the creation of the assistant,
 * its tools, knowledge bases, and optionally Voice Intelligence Service
 */
async function deploy() {
  // Validate environment variables
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    throw new Error(
      'Missing required environment variables. Please check .env file.'
    );
  }

  console.log('Starting AI Assistant deployment...\n');

  const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );

  const serverlessClient = new TwilioServerlessApiClient({
    username: process.env.TWILIO_ACCOUNT_SID,
    password: process.env.TWILIO_AUTH_TOKEN,
  });

  try {
    // Step 1: Deploy Twilio Functions backend
    console.log('Step 1: Deploying Twilio Functions backend...');
    const result = await deployFunctions(serverlessClient);
    console.log('✓ Twilio Functions backend deployed successfully\n ');

    // Save Functions domain to .env
    updateEnvFile('FUNCTIONS_DOMAIN', result.domain);

    // Step 2: Create the assistant
    console.log('Step 2: Creating AI Assistant...');
    const assistant = await createAssistant(client, assistantConfig);
    console.log('✓ Assistant created successfully');
    console.log('Assistant SID:', assistant.id);

    // Save Assistant SID to .env
    updateEnvFile('ASSISTANT_ID', assistant.id);

    // Step 3: Create and attach tools
    console.log('\nStep 3: Creating and attaching tools...');
    const tools = await createTools(
      client,
      assistant.id,
      toolsConfig(result.domain)
    );
    console.log(`✓ Successfully created and attached ${tools.length} tools`);

    // Step 4: Create and attach knowledge bases
    console.log('\nStep 4: Creating and attaching knowledge bases...');
    const knowledge = await createKnowledge(
      client,
      assistant.id,
      knowledgeConfig
    );
    console.log(
      `✓ Successfully created and attached ${knowledge.length} knowledge bases`
    );

    // Step 5: Optional Voice Intelligence Service creation
    const createVoiceIntelService = await question(
      '\nWould you like to create a Voice Intelligence Service? (y/n): '
    );
    let voiceIntelService = null;

    if (createVoiceIntelService.toLowerCase() === 'y') {
      console.log('\nStep 5: Creating Voice Intelligence Service...');
      voiceIntelService = await createVoiceIntel(client);
      console.log('✓ Voice Intelligence Service created successfully');

      // Save Voice Intelligence Service SID to .env
      updateEnvFile('VOICE_INTEL_SERVICE_SID', voiceIntelService.serviceSid);
    }

    // Step 6: Finishing deployiment configuration
    console.log(
      `\nStep ${
        voiceIntelService ? 6 : 5
      }: Finishing deployment configuration...`
    );
    const variables = {
      ASSISTANT_ID: assistant.id,
    };
    if (voiceIntelService?.serviceSid) {
      variables['VOICE_INTEL_SERVICE_SID'] = voiceIntelService.serviceSid;
    }

    await serverlessClient.setEnvironmentVariables({
      serviceSid: result.serviceSid,
      environment: result.environmentSid,
      env: variables,
      append: true,
    });
    console.log('✓ Deployment configuration completed successfully');

    // Deployment summary
    console.log('\n=== Deployment Summary ===');
    console.log('Assistant SID:', assistant.id);
    console.log('Tools created:', tools.length);
    console.log('Knowledge bases created:', knowledge.length);
    if (voiceIntelService) {
      console.log(
        'Voice Intelligence Service SID:',
        voiceIntelService.serviceSid
      );
    }
    console.log('\nDeployment completed successfully! 🎉');
    console.log('\nNext steps:');
    console.log('1. Visit the Twilio Console to view your assistant');
    console.log('2. Test the assistant functionality');
    console.log('3. Update webhook URLs if needed');

    // Close readline interface
    rl.close();

    return {
      assistant,
      tools,
      knowledge,
      voiceIntelService,
    };
  } catch (error) {
    console.error('\n❌ Deployment failed:');
    console.error('Error:', error.message);

    if (error.code) {
      console.error('Error Code:', error.code);
    }
    if (error.status) {
      console.error('Status Code:', error.status);
    }

    console.log('\nTroubleshooting suggestions:');
    console.log('1. Check your Twilio credentials');
    console.log('2. Verify your account has AI Assistant access');
    console.log('3. Ensure all webhook URLs are valid');
    console.log('4. Check for any duplicate resource names');

    // Close readline interface
    rl.close();
    throw error;
  }
}

// Add cleanup function for handling interruptions
process.on('SIGINT', async () => {
  console.log('\n\nReceived interrupt signal. Cleaning up...');
  rl.close();
  process.exit(0);
});

// Run the deployment if this script is executed directly
if (require.main === module) {
  deploy()
    .then((result) => {
      console.log('\nYou can now find your assistant in the Twilio Console:');
      console.log(
        `https://console.twilio.com/us1/develop/ai-assistants/assistants/${result.assistant.id}`
      );
      process.exit(0);
    })
    .catch((error) => {
      console.error('\nDeployment failed. See error details above.');
      process.exit(1);
    });
}

module.exports = deploy;
