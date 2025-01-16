// src/lib/createVoiceIntel.js

/**
 * Creates a Voice Intelligence Service and attaches custom operators
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

    // Create first custom operator for call scoring
    const callScoringOperator = await client.intelligence.v2.customOperators.create({
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
    console.log('Call Scoring operator created successfully:', callScoringOperator.sid);

    // Create second custom operator for competitive escalation
    const competitiveEscalationOperator = await client.intelligence.v2.customOperators.create({
      config: {
        "prompt": "Use the following parameters to evaluate the phone call between the agent and the customer. Answer following questions based on the transcript. \n1.Competitor Mentions: Did the customer mention any competitors during the call? (Yes/No)\n2. Objections Raised: Did the customer express dissatisfaction, concerns, or objections related to the product/service or pricing? (Yes/No)\n3. Agent's Response to Objections: How effectively did the agent address the customer's objections or concerns? (1–5)\n4. Escalation Need: Does the call indicate a need for escalation (e.g., customer dissatisfaction, unresolved issue)? (Yes/No)\n5. Next Best Action: Based on the call, what is the recommended next step for the agent (e.g., follow-up call, transfer to sales, offer a discount)? (String)",
        "result_schema": {
          "$schema": "http://json-schema.org/draft-04/schema#",
          "type": "object",
          "properties": {
            "competitor_mentions": {
              "type": "boolean"
            },
            "objections_raised": {
              "type": "boolean"
            },
            "agent_response_to_objections_score": {
              "type": "integer"
            },
            "escalation_needed": {
              "type": "boolean"
            },
            "next_best_action": {
              "type": "string"
            }
          }
        },
        "examples": []
      },
      friendlyName: "CompetitiveEscalation",
      operatorType: "PromptUserDefined",
    });
    console.log('Competitive Escalation operator created successfully:', competitiveEscalationOperator.sid);

    // Attach first operator to service
    const callScoringAttachment = await client.intelligence.v2
      .operatorAttachment(
        service.sid,
        callScoringOperator.sid
      )
      .create();
    console.log('Call Scoring operator attached successfully to service');

    // Attach second operator to service
    const competitiveEscalationAttachment = await client.intelligence.v2
      .operatorAttachment(
        service.sid,
        competitiveEscalationOperator.sid
      )
      .create();
    console.log('Competitive Escalation operator attached successfully to service');

    return {
      serviceSid: service.sid,
      callScoringOperatorSid: callScoringOperator.sid,
      competitiveEscalationOperatorSid: competitiveEscalationOperator.sid
    };
  } catch (error) {
    console.error('Failed to create Voice Intelligence Service:', error);
    throw error;
  }
}

module.exports = createVoiceIntel;