/**
 * @param {import('@twilio-labs/serverless-runtime-types/types').Context} context
 * @param {{}} event
 * @param {import('@twilio-labs/serverless-runtime-types/types').ServerlessCallback} callback
 */
exports.handler = async function (context, event, callback) {
    const client = context.getTwilioClient();
  
    // Extract the session ID from headers
    const sessionId = event.request.headers['x-session-id'];
    
    // Check if the session is for a voice interaction
    if (sessionId.startsWith('voice:')) {
      const [callSid] = sessionId.replace('voice:', '').split('/');
      try {
        // Update the call with new TwiML
        await client.calls(callSid).update({
          twiml: `
            <Response>
              <Say>Escalting to Human</Say>
              <Dial>111-222-3333</Dial>
            </Response>
          `
        });
        return callback(null, 'Call forwarded');
      } catch (err) {
        console.error('Failed to update call:', err);
        return callback(new Error('Failed to forward the call'));
      }
    }
  
    // If not a voice session, return an error
    return callback(new Error('Invalid session type. Only voice sessions are handled.'));
  };