> [!NOTE]
> Twilio AI Assistants is a [Twilio Alpha](https://twilioalpha.com) project that is currently in Developer Preview.

# Twilio AI Assistant Deployment Tool - Owl Shoes

A modular tool for deploying a Twilio AI Assistant with pre-configured tools and knowledge bases. This project provides a structured way to create and configure an AI Assistant for retail customer service.

## Features

- Automated assistant creation with retail-focused personality
- Pre-configured tools for common retail operations:
  - Customer lookup
  - Order management
  - Returns processing
  - Product recommendations
  - Customer surveys
- Knowledge base integration for FAQs
- Modular and maintainable codebase

## Prerequisites

- Node.js (v14 or higher)
- Twilio account with AI Assistant access (accept AI Assistants Terms & Conditions)
- Twilio Account SID and Auth Token
- Airtable account, [App ID](https://support.airtable.com/docs/finding-airtable-ids#finding-ids-in-the-airtable-api) and [API token](https://airtable.com/developers/web/guides/personal-access-tokens#creating-a-token)

## Project Structure

```
twilio-ai-assistant/
├── README.md                                # Project documentation and setup instructions
├── LICENSE                                  # MIT license file
├── package.json                             # Project dependencies and scripts
├── .env.example                             # Template for environment variables
├── .twilioserverlessrc                      # Twilio Serverless configuration
├── functions/                               # Serverless function implementations
│   ├── channels/                            # Channel-specific handlers
│   │   ├── conversations/                   # Twilio Conversations handlers
│   │   │   ├── flex-webchat.protected.js    # Flex webchat integration
│   │   │   ├── messageAdded.protected.js    # Message handling
│   │   │   └── response.js                  # Response handling
│   │   ├── messaging/                       # SMS/WhatsApp handlers
│   │   │   ├── incoming.protected.js        # Incoming message handling
│   │   │   └── response.js                  # Response handling
│   │   └── voice/                           # Voice call handlers
│   │       └── incoming-call.js             # Incoming call handling
│   ├── front-end/                           # Front-end integration endpoints
│   │   ├── create-customer.js               # Customer creation endpoint
│   │   └── create-order.js                  # Order creation endpoint
│   └── tools/                               # Assistant tool implementations
│       ├── create-survey.js                 # CSAT survey creation
│       ├── customer-lookup.js               # Customer information lookup
│       ├── order-lookup.js                  # Order status lookup
│       ├── place-order.js                   # Order placement
│       ├── products.js                      # Product catalog access
│       ├── return-order.js                  # Return processing
│       └── send-to-flex.js                  # Flex transfer handler
├── prompts/                                 # Assistant configuration
│   └── assistant-prompt.md                  # Core personality and behavior
└── src/                                     # Deployment and configuration
    ├── deploy.js                            # Main deployment script
    ├── config/                              # Configuration modules
    │   ├── assistant.js                     # Assistant settings
    │   ├── knowledge.js                     # Knowledge base config
    │   └── tools.js                         # Tool configurations
    └── lib/                                 # Core functionality
        ├── createAssistant.js               # Assistant creation
        ├── createKnowledge.js               # Knowledge base setup
        └── createTools.js                   # Tool creation and attachment
```

## Quick Start

1. Clone the repository:

```bash
git clone https://github.com/twilio-samples/ai-assistant-demo-owl-shoes.git
cd ai-assistant-demo-owl-shoes
```

2. Install dependencies:

```bash
npm install
```

3. Configure Airtable:

   a. Copy the Airtable base using [this link](https://airtable.com/appJpmkefU6JV7lfl/shr2bXI3Hv4bZkaeU)

   b. Once copied, you'll find the base ID in your Airtable URL (it looks like 'appXXXXXXXXXXXXX')

   c. Generate an Airtable access token:

   - Go to your [Airtable account](https://airtable.com/create/tokens)
   - Click "Create new token"
   - Give it a name and select the necessary scopes for your base
   - Copy the generated token

   The base includes tables for:

   - Customers: Customer information for personalization
   - Orders: Order history data
   - Inventory: Product catalog information
   - Surveys: CSAT surveys conducted by the Assistant
   - Returns: Returns proccessed by the Assistant

   Its recommend you add yourself and some additional data to the table for demo purposes.

4. Configure environment variables:

```bash
cp .env.example .env
# Edit .env and add your credentials:
# TWILIO_ACCOUNT_SID=your_account_sid
# TWILIO_AUTH_TOKEN=your_auth_token
# AIRTABLE_API_KEY=your_airtable_api_key
# AIRTABLE_BASE_ID=your_airtable_base_id
```
:warning: **Ensure you accept the Terms and Conditions in the Twilio Console by visiting the AI Assistants page before running the script.**

5. Deploy the assistant:

```bash
npm run deploy
```

## Connecting Channels

After deploying your functions and assistant, you'll need to connect various Twilio channels. Here's how to set up each channel:

- [Conversations](https://www.twilio.com/docs/alpha/ai-assistants/code-samples/channel-conversations)
- [SMS & Whatsapp](https://www.twilio.com/docs/alpha/ai-assistants/code-samples/channel-messaging)
- [Conversations with React](https://www.twilio.com/docs/alpha/ai-assistants/code-samples/react)
- [Transition to Flex](https://www.twilio.com/docs/alpha/ai-assistants/code-samples/transition-flex)
- [Flex Voice Handoff](https://docs.google.com/document/d/14RuOxt6FUAuc62A7BmeQFZWHr5WcXOoQZluZEF98GJA/edit?usp=sharing)
- [Transition to Sudio](https://www.twilio.com/docs/alpha/ai-assistants/code-samples/transition-studio)
- [Other Examples](https://github.com/twilio-labs/ai-assistants-samples)

### Voice Channel

:warning: **Add your Assistant ID to the incoming-call function**

Configure your Twilio voice number to use the AI Assistant:

**Via Twilio CLI:**

```bash
twilio phone_number <your-twilio-number> \
    --voice-url=https://<your-functions-domain>.twil.io/channels/voice/incoming-call
```

OR If Using Voice Intel.

```bash
twilio phone_number <your-twilio-number> \
    --voice-url=https://<your-functions-domain>.twil.io/channels/voice/incoming-call-voice-intel
```

**Via Twilio Console:**

1. Open your voice-capable phone number
2. Set the "When a call comes in" function to: `https://<your-functions-domain>.twil.io/channels/voice/incoming-call` or `https://<your-functions-domain>.twil.io/channels/voice/incoming-call-voice-intel`

### Messaging Channels

#### SMS

**Via Twilio CLI:**

```bash
twilio phone_number <your-twilio-number> \
    --sms-url=https://<your-functions-domain>.twil.io/channels/messaging/incoming
```

**Via Twilio Console:**

1. Open your SMS-capable phone number or Messaging Service
2. Set the "When a message comes in" webhook to: `https://<your-functions-domain>.twil.io/channels/messaging/incoming`

#### WhatsApp

1. Go to your WhatsApp Sandbox Settings in the Twilio Console
2. Configure the "When a message comes in" function to: `https://<your-functions-domain>.twil.io/channels/messaging/incoming`

**Note:** To use the same webhook for multiple assistants, add the AssistantSid as a parameter:

```
https://<your-functions-domain>.twil.io/channels/messaging/incoming?AssistantSid=AI1234561231237812312
```

### Conversations Channel

Set up Twilio Conversations integration:

1. Create a Conversations Service or use your default service
2. Run this Twilio CLI command to configure the webhook:

```bash
twilio api:conversations:v1:services:configuration:webhooks:update \
    --post-webhook-url=https://<your-functions-domain>.twil.io/channels/conversations/messageAdded \
    --chat-service-sid=<your-conversations-service-sid> \
    --filter=onMessageAdded
```

3. Follow the [Twilio Conversations documentation](https://www.twilio.com/docs/conversations/overview) to connect your preferred channels

## Tool Functions

The assistant uses several tool functions that need to be implemented:

1. Customer Lookup (`/tools/customer-lookup`)

   - GET request
   - Looks up customer information
   - Returns customer details

2. Order Lookup (`/tools/order-lookup`)

   - GET request
   - Retrieves order information
   - Validates order ID
   - Input schema:
     ```javascript
     {
       order_confirmation_digits: string; //Last 4 digits of customers order
     }
     ```

3. Create Survey (`/tools/create-survey`)

   - POST request
   - Creates customer satisfaction survey records
   - Captures rating and feedback
   - Requires customer identification via x-identity header
   - Input schema:
     ```javascript
     {
       rating: number,    // Required: 1-5 rating
       feedback: string   // Optional: customer feedback
     }
     ```

4. Order Return (`/tools/return-order`)

   - POST request
   - Initiates return process for delivered orders
   - Validates order status and existing returns
   - Creates return record and updates order
   - Input schema:
     ```javascript
     {
       order_id: string,      // Required: order identifier
       return_reason: string  // Required: reason for return
     }
     ```

5. Place Order (`/tools/place-order`)

   - POST request
   - Creates new orders using customer information
   - Handles product lookup and pricing
   - Calculates any applicable discounts
   - Input schema:
     ```javascript
     {
       product_id: string; // Required: product identifier
     }
     ```

6. Product Inventory (`/tools/products`)

   - GET request
   - Retrieves complete product catalog
   - Includes product details, pricing, and availability
   - Used for product recommendations
   - No input parameters required

7. Product Inventory (`/tools/send-to-flex`)
   - POST request
   - Transfers conversation to a flex queue

## Development

### Adding New Tools

1. Create your function in the `functions/tools` directory
2. Deploy the updated functions:

```bash
twilio serverless:deploy
```

3. Add tool configuration to `src/config/tools.js`:

```javascript
newTool: {
  name: "Tool Name",
  description: "Tool description and rules",
  type: "WEBHOOK",
  method: "GET",
  url: `https://${DOMAIN}/tools/your-new-tool`
}
```

4. Redeploy the assistant:

```bash
npm run deploy
```

### Modifying Assistant Behavior

1. Update the prompt in `prompts/assistant-prompt.md`
2. Modify tool configurations as needed
3. Redeploy the assistant

### Local Development

1. Create test credentials in Twilio
2. Use test credentials in `.env`
3. Deploy functions and assistant separately for easier debugging

## Error Handling

The deployment script includes comprehensive error handling:

- Environment variable validation
- Creation failure handling
- Detailed error logging

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT
