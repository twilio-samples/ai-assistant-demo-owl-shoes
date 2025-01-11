module.exports = {
    customerLookup: {
      name: "Customer Lookup",
      description: "Use this tool at the beginning of every conversation to learn about the customer.\n\nTool Rules:\n - Mandatory at conversation start\n - Accessible fields: first name, last name, address, email, phone\n - Use to personalize greeting",
      type: "WEBHOOK",
      method: "GET",
      url: "https://retail-demo-advanced-1065.twil.io/customer-lookup"
    },
    supervisorTransfer: {
      name: "Supervisor Transfer",
      description: "Use this tool when the user wants to speak with a supervisor or when you are not able to fulfill their request. ALWAYS tell the user you are transferring them to a Supervisor before using this tool.",
      type: "WEBHOOK",
      method: "POST",
      url: "https://retail-demo-advanced-1065.twil.io/transfer-escalation"
    },
    orderLookup: {
      name: "Order Look Up",
      description: "Use this tool to look up the customers order. ALWAYS ask the user to confirm the last four characters of their order number to ensure you are referencing the correct one.\n\nTool Rules:\n - Require customer confirmation of last 4 order ID characters\n - Never reference item IDs\n - Verify exact 4 characters match before sharing order details\n - If there is not match, tell the user to repeat the order ID again",
      type: "WEBHOOK",
      method: "GET",
      url: "https://retail-demo-advanced-1065.twil.io/order-lookup"
    },
    returnOrder: {
      name: "Return Order",
      description: 'Use this tool to return a customers order using the order id. Only use this tool if the order status is "delivered".\n\nTool Rules:\n - Usage restricted to "delivered" status orders\n - Requires valid order ID\n - Verify delivery status before processing',
      type: "WEBHOOK",
      method: "POST",
      url: "https://retail-demo-advanced-1065.twil.io/return-order",
      schema: {
        order_id: "string",
        return_reason: "string"
      }
    },
    customerSurvey: {
      name: "Customer Survey",
      description: "Use this tool when you have conducted the customer survey after you have handled all the users questions and requests. ALWAYS use this tool before ending the conversation.\n\nTool Rules:\n - Mandatory before conversation end\n - Must collect 1-5 rating\n - Must collect feedback comments\n - Must confirm submission success",
      type: "WEBHOOK",
      method: "POST",
      url: "https://retail-demo-advanced-1065.twil.io/survey",
      schema: {
        rating: "number",
        feedback: "string"
      }
    },
    productInventory: {
      name: "Product Inventory",
      description: "Use this tool to provide product recommendations to the user. Only recommend products with the user's shoe size from their last order. Ensure you highlight products that have a current discount.",
      type: "WEBHOOK",
      method: "GET",
      url: "https://retail-demo-advanced-1065.twil.io/products"
    },
    placeOrder: {
      name: "Place Order",
      description: "User this tool to place an order, ALWAYS confirm with user if you'd like to place the order using the same billing and shipping information as their last order. Ensure you confirm with the user once their order has been place.",
      type: "WEBHOOK",
      method: "POST",
      url: "https://retail-demo-advanced-1065.twil.io/place-order",
      schema: {
        product_id: "string"
      }
    }
  };