// src/lib/createVoiceIntel.js

/**
 * Creates a Voice Intelligence Service and attaches a custom operator
 * @param {object} client - Twilio client instance
 * @returns {Promise<object>} Created service details
 */
async function createVoiceIntel(client) {
    try {
      console.log('Creating Voice Intelligence Service...');
      
      // Create the service
      const service = await client.intelligence.v2.services.create({
        uniqueName: "ai-assistant-owl-shoes",
      });
      console.log('Voice Intelligence Service created successfully:', service.sid);
  
      // Create custom operator for call scoring
      const customOperator = await client.intelligence.v2.customOperators.create({
        config: {
          "prompt": "Use the following parameters to evaluate the phone call between the agent and the customer. Assign scores (1 to 5) to each KPI and provide comments to justify the score. \nEach KPI assesses the agent's performance in various aspects of the call.\n1. Greeting & Professionalism: Was the agent friendly, clear, and professional? (1–5)\n2. Listening & Empathy: Did the agent actively listen and show empathy? (1–5)\n3. Communication & Clarity: Was the information clear and easy to understand? (1–5)\n4. Problem-Solving: Did the agent resolve the issue efficiently? (1–5)\n5. Overall Experience: Was the customer satisfied, and was the call handled well? (1–5)",
          "result_schema": {
            "$schema": "http://json-schema.org/draft-04/schema#",
            "type": "object",
            "properties": {
              "greeting_professionalism": {
                "type": "integer"
              },
              "listening_empathy": {
                "type": "integer"
              },
              "communication_clarity": {
                "type": "integer"
              },
              "problem_solving": {
                "type": "integer"
              },
              "overall_experience": {
                "type": "integer"
              }
            }
          },
          "examples": []
        },
        friendlyName: "CallScoring",
        operatorType: "PromptUserDefined",
      });
      console.log('Custom operator created successfully:', customOperator.sid);
  
      // Attach operator to service
      const operatorAttachment = await client.intelligence.v2
        .operatorAttachment(
          service.sid,
          customOperator.sid
        )
        .create();
      console.log('Operator attached successfully to service');
  
      return {
        serviceSid: service.sid,
        operatorSid: customOperator.sid
      };
    } catch (error) {
      console.error('Failed to create Voice Intelligence Service:', error);
      throw error;
    }
  }
  
  module.exports = createVoiceIntel;