# AI Assistant Evaluation Suite

This directory contains the evaluation setup for testing and validating the AI assistant's responses across different conversation flows and scenarios.

## Overview

The evaluation suite uses [promptfoo](https://promptfoo.dev/) to test various conversation flows and ensure the AI assistant provides accurate and consistent responses. The tests cover multiple scenarios including order status, returns (both WhatsApp and Voice), price adjustments, and order management.

## Prerequisites

- Node.js and npm installed
- Environment variables properly configured in `.env` file

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure your environment variables in the `.env` file

## Available Tests

The evaluation suite includes the following test flows:

- Order Status Flow
- Returns WhatsApp Flow
- Returns Voice Flow
- Price Adjustment Flow
- Order Management Flow

## Running Tests

You can run all tests using:
```bash
npm run eval
```

Or run individual test flows:
```bash
npm run eval:order
npm run eval:returns-whatsapp
npm run eval:returns-voice
npm run eval:price-adjustment
npm run eval:order-management
```

## Viewing Results

After running the tests, you can view the results using:
```bash
npm run view
```

## Test Configuration

Test configurations are stored in the `config/tests/` directory as YAML files. Each file defines the test cases, expected responses, and evaluation criteria for a specific conversation flow.

## Dependencies

- `@twilio-alpha/assistants-eval`: Twilio's evaluation framework for AI assistants
- `promptfoo`: Testing framework for AI prompts and responses
- `env-cmd`: Environment variable management 