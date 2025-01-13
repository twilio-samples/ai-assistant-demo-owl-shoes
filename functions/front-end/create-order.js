// functions/front-end/create-order.js
const Airtable = require('airtable');

exports.handler = async function(context, event, callback) {
  const response = new Twilio.Response();
  response.appendHeader('Content-Type', 'application/json');
  // Enable CORS for frontend requests
  response.appendHeader('Access-Control-Allow-Origin', '*');
  response.appendHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.appendHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight requests
  if (event.request.method === 'OPTIONS') {
    return callback(null, response);
  }
  
  try {
    // Validate Airtable configuration
    if (!context.AIRTABLE_API_KEY || !context.AIRTABLE_BASE_ID) {
      response.setStatusCode(500);
      response.setBody({ error: 'Airtable configuration error' });
      return callback(null, response);
    }

    const base = new Airtable({apiKey: context.AIRTABLE_API_KEY}).base(context.AIRTABLE_BASE_ID);

    // Validate required fields
    if (!event.customer_id || !event.items || !event.total_amount) {
      response.setStatusCode(400);
      response.setBody({ error: 'Missing required fields: customer_id, items, or total_amount' });
      return callback(null, response);
    }

    // Get customer details
    const customerRecords = await base('customers')
      .select({
        filterByFormula: `{id} = '${event.customer_id}'`,
        maxRecords: 1
      })
      .firstPage();

    if (!customerRecords || customerRecords.length === 0) {
      response.setStatusCode(404);
      response.setBody({ error: 'Customer not found' });
      return callback(null, response);
    }

    const customer = customerRecords[0].fields;

    // Create order record
    const orderData = {
      customer_id: customer.id,
      email: customer.email,
      phone: customer.phone,
      items: JSON.stringify(event.items),
      total_amount: event.total_amount,
      shipping_status: 'pending',
      created_at: new Date().toISOString()
    };

    const newOrder = await base('orders').create([
      { fields: orderData }
    ]);

    if (!newOrder || newOrder.length === 0) {
      response.setStatusCode(500);
      response.setBody({ error: 'Failed to create order record' });
      return callback(null, response);
    }

    // Return success response
    response.setStatusCode(200);
    response.setBody({
      message: 'Order created successfully',
      order_id: newOrder[0].id,
      order_details: {
        customer: {
          name: `${customer.first_name} ${customer.last_name}`,
          email: customer.email,
          shipping_address: {
            address: customer.address,
            city: customer.city,
            state: customer.state,
            zip_code: customer.zip_code
          }
        },
        items: event.items,
        total_amount: event.total_amount
      }
    });

    return callback(null, response);

  } catch (error) {
    console.error('Unexpected error:', error);
    response.setStatusCode(500);
    response.setBody({ error: 'Internal server error' });
    return callback(null, response);
  }
};