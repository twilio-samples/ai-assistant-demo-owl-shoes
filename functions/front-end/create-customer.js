// functions/front-end/create-customer.js
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
    if (!context.AIRTABLE_API_KEY || !context.AIRTABLE_BASE_ID) {
      response.setStatusCode(500);
      response.setBody({ error: 'Airtable configuration error' });
      return callback(null, response);
    }

    const base = new Airtable({apiKey: context.AIRTABLE_API_KEY}).base(context.AIRTABLE_BASE_ID);

    // Check if customer already exists
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

    response.setStatusCode(200);
    response.setBody(newCustomer[0].fields);
    return callback(null, response);

  } catch (error) {
    console.error('Error:', error);
    response.setStatusCode(500);
    response.setBody({ error: 'Internal server error', details: error.message });
    return callback(null, response);
  }
};