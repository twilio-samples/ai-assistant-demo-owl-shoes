const Airtable = require('airtable');

exports.handler = async function (context, event, callback) {
  try {
    // Validate Airtable configuration
    if (!context.AIRTABLE_API_KEY || !context.AIRTABLE_BASE_ID) {
      console.error('Missing Airtable configuration');
      return callback(null, {
        status: 500,
        message: 'Airtable configuration error. Please check environment variables.',
      });
    }

    // Validate the order confirmation digits
    if (!event.order_confirmation_digits) {
      console.error('Missing order confirmation digits');
      return callback(null, {
        status: 400,
        message: 'Missing order confirmation digits.',
      });
    }

    // Clean the order confirmation digits
    const cleanDigits = String(event.order_confirmation_digits)
      .trim()
      .replace(/\s+/g, '')
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(-4);

    console.log('Original input:', event.order_confirmation_digits);
    console.log('Cleaned digits:', cleanDigits);

    if (cleanDigits.length !== 4) {
      console.error('Invalid order confirmation digits length');
      return callback(null, {
        status: 400,
        message: 'Invalid order confirmation digits. Must be 4 characters.',
      });
    }

    // Extract and validate the x-identity header
    const identityHeader = event.request.headers["x-identity"];
    if (!identityHeader) {
      console.error('Missing x-identity header');
      return callback(null, {
        status: 400,
        message: 'Missing x-identity header. Provide email or phone in the format: "email:<email>" or "phone:<phone>".',
      });
    }

    // Determine whether the x-identity header is for email or phone
    let queryField, queryValue;
    if (identityHeader.startsWith('email:')) {
      queryField = 'email';
      queryValue = identityHeader.replace('email:', '').trim();
    } else if (identityHeader.startsWith('phone:')) {
      queryField = 'phone';
      queryValue = identityHeader.replace('phone:', '').trim();
    } else if (identityHeader.startsWith('whatsapp:')) {
      queryField = 'phone';
      queryValue = identityHeader.replace('whatsapp:', '').trim();
    } else {
      console.error('Invalid x-identity format');
      return callback(null, {
        status: 400,
        message: 'Invalid x-identity format. Use "email:<email>" or "phone:<phone>".',
      });
    }

    console.log(`Querying orders for ${queryField}: ${queryValue}`);

    // Airtable setup
    const base = new Airtable({apiKey: context.AIRTABLE_API_KEY}).base(context.AIRTABLE_BASE_ID);

    // Get all orders for the specific user
    const records = await base('orders')
      .select({
        filterByFormula: `{${queryField}} = '${queryValue}'`
      })
      .firstPage();

    if (!records || records.length === 0) {
      console.log(`No orders found for ${queryField}: ${queryValue}`);
      return callback(null, {
        status: 404,
        message: `No orders found for ${queryField}: ${queryValue}`,
      });
    }

    // Filter user's orders to find those matching the last 4 digits
    const matchingOrders = records.filter(record => {
      const orderId = record.fields.id || '';
      const orderIdLast4 = String(orderId).slice(-4);
      return orderIdLast4 === cleanDigits;
    });

    if (matchingOrders.length === 0) {
      console.log(`No order found with confirmation digits: ${cleanDigits}`);
      return callback(null, {
        status: 404,
        message: `No order found with confirmation digits: ${cleanDigits}`,
      });
    }

    if (matchingOrders.length > 1) {
      console.log(`Multiple orders found with confirmation digits: ${cleanDigits}`);
      return callback(null, {
        status: 409,
        message: 'Multiple orders found with these confirmation digits.',
      });
    }

    console.log(`Found order with ID: ${matchingOrders[0].fields.id}`);
    return callback(null, {
      status: 200,
      order: matchingOrders[0].fields,
      message: 'Order found successfully',
    });

  } catch (err) {
    console.error('Unexpected error:', err.message);
    return callback(null, {
      status: 500,
      message: 'An unexpected error occurred. Please try again later.',
    });
  }
};