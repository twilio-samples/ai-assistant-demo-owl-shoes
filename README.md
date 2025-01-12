# Twilio AI Assistant Deployment Tool

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
- Twilio account with AI Assistant access
- Twilio Account SID and Auth Token
- Twilio CLI installed globally (`npm install -g twilio-cli`)
- Twilio Serverless Plugin (`twilio plugins:install @twilio-labs/plugin-serverless`)

## Project Structure

```
twilio-ai-assistant/
├── package.json
├── .env.example
├── .gitignore
├── .twilioserverlessrc
├── README.md
├── functions/
│   └── tools/          # Serverless functions for each tool
├── prompts/
│   └── assistant-prompt.md     # AI Assistant personality configuration
└── src/
    ├── config/
    │   ├── assistant.js        # Assistant settings
    │   ├── tools.js           # Tool configurations
    │   └── knowledge.js       # Knowledge base settings
    ├── lib/
    │   ├── createAssistant.js # Assistant creation logic
    │   ├── createTools.js     # Tools creation and attachment
    │   └── createKnowledge.js # Knowledge base creation
    └── deploy.js              # Main deployment script
```

## Quick Start

1. Clone the repository:
```bash
git clone https://github.com/your-username/ai-assistant-owl-shoes.git
cd twilio-ai-assistant
```

2. Install dependencies:
```bash
npm install
```

3. Install Twilio CLI and Serverless Plugin (if not already installed):
```bash
npm install -g twilio-cli
twilio plugins:install @twilio-labs/plugin-serverless
```

4. Login to your Twilio account:
```bash
twilio login
```

5. Configure environment variables:
```bash
cp .env.example .env
# Edit .env and add your credentials:
# TWILIO_ACCOUNT_SID=your_account_sid
# TWILIO_AUTH_TOKEN=your_auth_token
# AIRTABLE_API_KEY=your_airtable_api_key
# AIRTABLE_BASE_ID=your_airtable_base_id
```

6. Deploy the serverless functions:
```bash
twilio serverless:deploy
```

7. Update your .env with the deployed functions domain:
```bash
# Add the domain from the serverless deploy output to your .env file:
# FUNCTIONS_DOMAIN=your-domain-1234-dev.twil.io
```

8. Deploy the assistant:
```bash
npm run deploy
```

## Configuration

### Assistant Personality
- Edit `prompts/assistant-prompt.md` to modify the assistant's behavior and personality
- The prompt is written in markdown format for better organization
- Changes require redeployment of the assistant

### Tools Configuration
- Tool settings are in `src/config/tools.js`
- Each tool includes:
  - Name and description
  - Webhook URL (automatically configured using FUNCTIONS_DOMAIN)
  - Input schema (if required)
  - Usage rules and requirements

### Knowledge Base
- Knowledge base configuration is in `src/config/knowledge.js`
- Includes FAQ sources and usage instructions
- Can be extended with additional knowledge sources

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

[ADD MORE INFO HERE]

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

## Support

For issues and questions:
1. Check the [Issues](https://github.com/your-username/twilio-ai-assistant/issues) page
2. Submit a new issue if needed
3. Refer to [Twilio's Documentation](https://www.twilio.com/docs/assistants) for AI Assistant details