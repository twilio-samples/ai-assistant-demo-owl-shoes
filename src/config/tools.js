// Ensure dotenv is loaded
require('dotenv').config();

const DOMAIN = process.env.FUNCTIONS_DOMAIN;

if (!DOMAIN) {
  throw new Error('FUNCTIONS_DOMAIN environment variable is required');
}

module.exports = {
    customerLookup: {
      name: "Customer Lookup",
      description: "Use this tool at the beginning of every conversation to learn about the customer.\n\nTool Rules:\n - Mandatory at conversation start\n - Accessible fields: first name, last name, address, email, phone\n - Use to personalize greeting",
      type: "WEBHOOK",
      method: "GET",
      url: `https://${DOMAIN}/tools/customer-lookup`
    },
    orderLookup: {
      name: "Order Look Up",
      description: "Use this tool to look up the customers order. ALWAYS ask the user to confirm the last four characters of their order number to ensure you are referencing the correct one.",
      type: "WEBHOOK",
      method: "GET",
      url: `https://${DOMAIN}/tools/order-lookup`,
      schema: {
        order_confirmation_digits: "string" //the last four characters of the order number
      }
    },
    returnOrder: {
      name: "Return Order",
      description: 'Use this tool to return a customers order using the order id. Only use this tool if the order status is "delivered".',
      type: "WEBHOOK",
      method: "POST",
      url: `https://${DOMAIN}/tools/return-order`,
      schema: {
        order_id: "string", //the order id to return
        return_reason: "string" //why the customer is returning the order
      }
    },
    customerSurvey: {
      name: "Customer Survey",
      description: "Use this tool when you have conducted the customer survey after you have handled all the users questions and requests. ALWAYS use this tool before ending the conversation.",
      type: "WEBHOOK",
      method: "POST",
      url: `https://${DOMAIN}/tools/create-survey`,
      schema: {
        rating: "number", //the rating the user gave 1-5
        feedback: "string" //the feedback the user gave
      }
    },
    productInventory: {
      name: "Product Inventory",
      description: "Use this tool to provide product recommendations to the user.",
      type: "WEBHOOK",
      method: "GET",
      url: `https://${DOMAIN}/tools/products`
    },
    sendToFelx: {
      name: "Send to Flex",
      description: "Use this tool when the user wants to speak with a supervisor or when you are not able to fulfill their request. ALWAYS tell the user you are transferring them to a Supervisor before using this tool.",
      type: "WEBHOOK",
      method: "GET",
      url: `https://${DOMAIN}/tools/send-to-flex`
    },
    placeOrder: {
      name: "Place Order",
      description: "User this tool to place an order, ALWAYS confirm with user if you'd like to place the order using the same billing and shipping information as their last order.",
      type: "WEBHOOK",
      method: "POST",
      url: `https://${DOMAIN}/tools/place-order`,
      schema: {
        product_id: "string" //the product id to order
      }
    }
};