const { TwilioServerlessApiClient } = require('@twilio-labs/serverless-api');
const deployFunctions = require('./deployFunctions');

/**
 * Redeploys only the Twilio Functions and assets
 * @param {Object} options Configuration options
 * @param {boolean} options.updateEnvironmentVariables Whether to update environment variables during redeployment
 * @returns {Promise<import('@twilio-labs/serverless-api').DeployLocalProjectConfig>}
 */
async function redeploy(options = { updateEnvironmentVariables: true }) {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    throw new Error('Missing required environment variables. Please check .env file.');
  }

  console.log('Starting Functions redeployment...\n');

  const serverlessClient = new TwilioServerlessApiClient({
    username: process.env.TWILIO_ACCOUNT_SID,
    password: process.env.TWILIO_AUTH_TOKEN,
  });

  try {
    const result = await deployFunctions(serverlessClient, { 
      updateEnvironmentVariables: options.updateEnvironmentVariables 
    });
    console.log('✓ Twilio Functions redeployed successfully\n');

    return result;
  } catch (error) {
    console.error('\n❌ Redeployment failed:');
    console.error('Error:', error.message);

    if (error.code) {
      console.error('Error Code:', error.code);
    }
    if (error.status) {
      console.error('Status Code:', error.status);
    }

    throw error;
  }
}

module.exports = redeploy; 