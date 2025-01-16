const dotenv = require('dotenv');
const fs = require('node:fs/promises');
const path = require('node:path');
const pkgJson = require('../../package.json');
const { TwilioServerlessApiClient } = require('@twilio-labs/serverless-api');

/**
 * Get the environment variables from the project
 * @returns {Promise<Record<string, string>>}
 */
async function getEnvironmentVariables() {
  const envContents = await fs.readFile(
    path.resolve(process.cwd(), '.env'),
    'utf-8'
  );
  const variables = dotenv.parse(envContents);

  // removing these variables since Functions will automatically insert them
  delete variables.TWILIO_ACCOUNT_SID;
  delete variables.TWILIO_AUTH_TOKEN;

  // removing because it's not necessary for the deployed functions
  if (variables.FUNCTIONS_DOMAIN) {
    delete variables.FUNCTIONS_DOMAIN;
  }

  for (const key in variables) {
    if (!variables[key]) {
      delete variables[key];
    }
  }

  return variables;
}

/**
 * Deploys the Twilio Functions backend
 * @param {TwilioServerlessApiClient} serverlessClient
 * @returns {Promise<import("@twilio-labs/serverless-api").DeployLocalProjectConfig>}
 */
async function deployFunctions(serverlessClient) {
  serverlessClient.on('status-update', (evt) => {
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write(`  ${evt.message}`);
  });

  const result = await serverlessClient.deployLocalProject({
    cwd: process.cwd(),
    serviceName: 'ai-assistant-retail-owl-shoes',
    functionsEnv: 'dev',
    env: await getEnvironmentVariables(),
    uiEditable: true,
    overrideExistingService: true,
    pkgJson: {
      dependencies: pkgJson.dependencies,
    },
  });
  console.log(''); // intentionally empty line to separate the output

  return result;
}

module.exports = deployFunctions;
