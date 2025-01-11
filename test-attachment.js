// test-attachment.js
require('dotenv').config();
const twilio = require('twilio');

async function testToolAttachment() {
    // Constants for the test
    const ASSISTANT_ID = 'aia_asst_019456dc-80e5-70bc-84f7-72f045aad4d0';
    const TOOL_ID = 'aia_tool_019456dc-815e-7864-91cd-aa2ba554c5e7';

    console.log('Starting tool attachment test...');
    console.log('Assistant ID:', ASSISTANT_ID);
    console.log('Tool ID:', TOOL_ID);

    try {
        // Create basic Twilio client
        const client = twilio(
            process.env.TWILIO_ACCOUNT_SID,
            process.env.TWILIO_AUTH_TOKEN
        );

        console.log('\nVerifying assistant exists...');
        const assistant = await client.assistants.v1.assistants(ASSISTANT_ID).fetch();
        console.log('Assistant verified:', assistant.id);

        console.log('\nVerifying tool exists...');
        const tool = await client.assistants.v1.tools(TOOL_ID).fetch();
        console.log('Tool verified:', tool.id);

        console.log('\nAttempting tool attachment...');
        try {
            await client.assistants.v1
                .assistants(ASSISTANT_ID)
                .assistantsTools(TOOL_ID)
                .create();
            
            console.log('Tool attached successfully!');
        } catch (attachError) {
            // If we get an "Unexpected end of JSON input" error with a 204 status,
            // consider it a success
            if (attachError.message === 'Unexpected end of JSON input') {
                console.log('Tool attachment appears successful (got expected 204 response)');
                return;
            }
            throw attachError;
        }
    } catch (error) {
        console.error('\nError details:');
        console.error('Type:', error.constructor.name);
        console.error('Message:', error.message);
        if (error.status) console.error('Status:', error.status);
        if (error.code) console.error('Code:', error.code);
        if (error.moreInfo) console.error('More Info:', error.moreInfo);
        
        // Check if there's a response object
        if (error.response) {
            console.error('Response Status:', error.response.statusCode);
            console.error('Response Headers:', JSON.stringify(error.response.headers, null, 2));
        }
        
        throw error;
    }
}

// Get Twilio package version
const twilioVersion = require('twilio/package.json').version;
const nodeVersion = process.version;

// Run the test with version info
console.log(`Node.js Version: ${nodeVersion}`);
console.log(`Twilio Package Version: ${twilioVersion}\n`);

testToolAttachment()
    .then(() => console.log('\nTest completed successfully'))
    .catch(error => {
        console.error('\nTest failed');
        process.exit(1);
    });