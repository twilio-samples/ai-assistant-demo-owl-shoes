// functions/front-end/create-order.js
const Airtable = require('airtable');

exports.handler = async function(context, event, callback) {
  const response = new Twilio.Response();
  response.appendHeader('Content-Type', 'application/json');
  response.appendHeader('Access-Control-Allow-Origin', '*');
  response.appendHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.appendHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (event.request.method === 'OPTIONS') {
    return callback(null, response);
  }
  
  try {
    console.log('Received order data:', event);

    if (!context.AIRTABLE_API_KEY || !context.AIRTABLE_BASE_ID) {
      response.setStatusCode(500);
      response.setBody({ error: 'Airtable configuration error' });
      return callback(null, response);
    }

    const base = new Airtable({apiKey: context.AIRTABLE_API_KEY}).base(context.AIRTABLE_BASE_ID);

    // Create order record - ensuring data types match Airtable expectations
    const orderData = {
      customer_id: String(event.customer_id), // Ensure this is a string
      email: event.email,
      phone: event.phone,
      items: event.items, // This should already be a JSON string
      total_amount: Number(event.total_amount), // Ensure this is a number
      shipping_status: 'pending',
      created_at: new Date().toISOString()
    };

    console.log('Creating order with data:', orderData);

    const newOrder = await base('orders').create([
      { fields: orderData }
    ]);

    if (!newOrder || newOrder.length === 0) {
      throw new Error('Failed to create order record');
    }

    response.setStatusCode(200);
    response.setBody({
      message: 'Order created successfully',
      order_id: newOrder[0].id,
      order_details: newOrder[0].fields
    });

    return callback(null, response);

  } catch (error) {
    console.error('Error:', error);
    response.setStatusCode(500);
    response.setBody({ error: 'Internal server error', details: error.message });
    return callback(null, response);
  }
};