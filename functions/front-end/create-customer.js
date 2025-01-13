// functions/front-end/create-customer.js
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
    const requiredFields = ['first_name', 'last_name', 'email', 'phone', 'address', 'city', 'state', 'zip_code'];
    for (const field of requiredFields) {
      if (!event[field]) {
        response.setStatusCode(400);
        response.setBody({ error: `Missing required field: ${field}` });
        return callback(null, response);
      }
    }

    // Check if customer already exists with this email
    const existingCustomers = await base('customers')
      .select({
        filterByFormula: `{email} = '${event.email}'`,
        maxRecords: 1
      })
      .firstPage();

    if (existingCustomers && existingCustomers.length > 0) {
      // Return existing customer data
      response.setStatusCode(200);
      response.setBody(existingCustomers[0].fields);
      return callback(null, response);
    }

    // Create new customer record
    const customerData = {
      first_name: event.first_name,
      last_name: event.last_name,
      email: event.email,
      phone: event.phone,
      address: event.address,
      city: event.city,
      state: event.state,
      zip_code: event.zip_code,
      created_at: new Date().toISOString()
    };

    const newCustomer = await base('customers').create([
      { fields: customerData }
    ]);

    if (!newCustomer || newCustomer.length === 0) {
      response.setStatusCode(500);
      response.setBody({ error: 'Failed to create customer record' });
      return callback(null, response);
    }

    // Return success response
    response.setStatusCode(200);
    response.setBody(newCustomer[0].fields);
    return callback(null, response);

  } catch (error) {
    console.error('Unexpected error:', error);
    response.setStatusCode(500);
    response.setBody({ error: 'Internal server error' });
    return callback(null, response);
  }
};