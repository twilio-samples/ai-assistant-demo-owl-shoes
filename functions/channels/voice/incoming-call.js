const Airtable = require('airtable');

/**
 * @param {import('@twilio-labs/serverless-runtime-types/types').Context} context
 * @param {{}} event
 * @param {import('@twilio-labs/serverless-runtime-types/types').ServerlessCallback} callback
 */
exports.handler = async function(context, event, callback) {
  try {
    // Validate required configuration
    if (!context.AIRTABLE_API_KEY || !context.AIRTABLE_BASE_ID || !context.ASSISTANT_ID) {
      throw new Error('Missing required configuration');
    }

    // Airtable setup
    const base = new Airtable({apiKey: context.AIRTABLE_API_KEY}).base(context.AIRTABLE_BASE_ID);

    // Get the caller's phone number from the incoming call event
    const callerPhone = event.From;
    if (!callerPhone) {
      throw new Error('No caller phone number provided');
    }

    // Query the customers table for the caller's information
    const records = await base('customers')
      .select({
        fields: ['first_name', 'last_name', 'phone'],
        filterByFormula: `{phone} = '${callerPhone}'`,
        maxRecords: 1
      })
      .firstPage();

    // Generate TwiML response
    let twiml = '<Response>';
    
    if (records && records.length > 0) {
      // Customer found - personalized greeting
      const customer = records[0].fields;
      twiml += `
        <Connect>
          <Assistant 
            id="${context.ASSISTANT_ID}"
            welcomeGreeting="Hi ${customer.first_name}, thanks for calling Owl Shoes, How can I help you?"
            voice="en-US-Journey-O">
          </Assistant>
        </Connect>`;
    } else {
      // No customer found - generic greeting
      twiml += `
        <Connect>
          <Assistant 
            id="${context.ASSISTANT_ID}"
            welcomeGreeting="Thanks for calling Owl Shoes, How can I help you?"
            voice="en-US-Journey-O">
          </Assistant>
        </Connect>`;
    }
    
    twiml += '</Response>';
    // Return the TwiML response
    return callback(null, twiml);
  } catch (err) {
    console.error('Error in function:', err.message);
    
    // Return a generic TwiML response in case of errors
    const errorTwiml = `
      <Response>
        <Connect>
          <Assistant 
            id="${context.ASSISTANT_ID}"
            welcomeGreeting="Thanks for calling Owl Shoes, How can I help you?"
            voice="en-US-Journey-O">
          </Assistant>
        </Connect>
      </Response>`;
    
    return callback(null, errorTwiml);
  }
};