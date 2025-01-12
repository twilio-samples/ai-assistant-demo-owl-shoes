const Airtable = require('airtable');

exports.handler = async function (context, event, callback) {
  try {
    // Validate Airtable configuration
    if (!context.AIRTABLE_API_KEY || !context.AIRTABLE_BASE_ID) {
      return callback(null, {
        status: 500,
        message: 'Airtable configuration error. Please check environment variables.',
      });
    }

    // Validate the order confirmation digits
    if (!event.order_confirmation_digits) {
      return callback(null, {
        status: 400,
        message: 'Missing order confirmation digits.',
      });
    }

    // Clean the order confirmation digits
    // 1. Convert to string in case we receive a number
    // 2. Remove all spaces (including multiple spaces and different types of whitespace)
    // 3. Remove special characters
    // 4. Get the last 4 characters
    const cleanDigits = String(event.order_confirmation_digits)
      .trim() // Remove leading/trailing whitespace
      .replace(/\s+/g, '') // Remove all whitespace characters (spaces, tabs, etc)
      .replace(/[^a-zA-Z0-9]/g, '') // Remove special characters
      .slice(-4); // Get last 4 characters

    console.log('Original input:', event.order_confirmation_digits);
    console.log('Cleaned digits:', cleanDigits);

    if (cleanDigits.length !== 4) {
      return callback(null, {
        status: 400,
        message: 'Invalid order confirmation digits. Must be 4 characters.',
      });
    }

    console.log(`Looking up order with confirmation digits: ${cleanDigits}`);

    // Airtable setup
    const base = new Airtable({apiKey: context.AIRTABLE_API_KEY}).base(context.AIRTABLE_BASE_ID);

    // Query the orders table in Airtable
    // We'll use REGEX_MATCH to match the last 4 characters of the order_id
    const records = await base('orders')
      .select({
        filterByFormula: `REGEX_MATCH(LOWER({order_id}), '${cleanDigits}$')`
      })
      .firstPage();

    if (!records || records.length === 0) {
      console.log(`No order found with confirmation digits: ${cleanDigits}`);
      return callback(null, {
        status: 404,
        message: `No order found with confirmation digits: ${cleanDigits}`,
      });
    }

    if (records.length > 1) {
      console.log(`Multiple orders found with confirmation digits: ${cleanDigits}`);
      return callback(null, {
        status: 409,
        message: 'Multiple orders found with these confirmation digits.',
      });
    }

    const order = records[0].fields;
    console.log(`Found order: ${order.order_id}`);

    return callback(null, {
      status: 200,
      order: order,
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