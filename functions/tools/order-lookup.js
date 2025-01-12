const { createClient } = require('@supabase/supabase-js');

exports.handler = async function (context, event, callback) {
  try {
    // Supabase setup
    const SUPABASE_URL = context.SUPABASE_URL;
    const SUPABASE_KEY = context.SUPABASE_KEY;

    if (!SUPABASE_URL || !SUPABASE_KEY) {
      console.error('Missing Supabase configuration');
      return callback(null, {
        status: 500,
        message: 'Supabase configuration error. Please check environment variables.',
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    // Extract and validate the x-identity header to use in DB Lookup
    const identityHeader = event.request.headers["x-identity"];
    if (!identityHeader) {
      console.error('Missing x-identity header');
      return callback(null, {
        status: 400,
        message: 'Missing x-identity header. Provide email or phone in the format: "email:<email>" or "phone:<phone>".',
      });
    }

    // Determine whether the x-identity header is for email or phone
    let queryColumn, queryValue;
    if (identityHeader.startsWith('email:')) {
      queryColumn = 'email';
      queryValue = identityHeader.replace('email:', '').trim();
    } else if (identityHeader.startsWith('phone:')) {
      queryColumn = 'phone';
      queryValue = identityHeader.replace('phone:', '').trim();
    } else {
      console.error('Invalid x-identity format');
      return callback(null, {
        status: 400,
        message: 'Invalid x-identity format. Use "email:<email>" or "phone:<phone>".',
      });
    }

    console.log(`Querying orders for ${queryColumn}: ${queryValue}`);

    // Query the orders table in supabase
    const { data, error } = await supabase
      .from('orders') // Replace with your table name if different
      .select('*')
      .eq(queryColumn, queryValue);

    if (error) {
      console.error('Supabase query error:', error.message);
      return callback(null, {
        status: 500,
        message: 'Error querying orders table. Please try again later.',
      });
    }

    if (data.length === 0) {
      console.log(`No order found for ${queryColumn}: ${queryValue}`);
      return callback(null, {
        status: 404,
        message: `No order found for ${queryColumn}: ${queryValue}`,
      });
    }

    console.log(`Found ${data.length} order for ${queryColumn}: ${queryValue}`);
    return callback(null, {
      status: 200,
      orders: data,
    });
  } catch (err) {
    console.error('Unexpected error:', err.message);
    return callback(null, {
      status: 500,
      message: 'An unexpected error occurred. Please try again later.',
    });
  }
};