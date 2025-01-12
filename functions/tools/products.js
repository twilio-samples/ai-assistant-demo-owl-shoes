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

    console.log('Querying all products from products table');

    // Query the products table in Supabase
    const { data, error } = await supabase
      .from('products')
      .select('*');

    if (error) {
      console.error('Supabase query error:', error.message);
      return callback(null, {
        status: 500,
        message: 'Error querying products table. Please try again later.',
      });
    }

    if (data.length === 0) {
      console.log('No products found in the database');
      return callback(null, {
        status: 404,
        message: 'No products found in the database',
      });
    }

    console.log(`Found ${data.length} products`);
    return callback(null, {
      status: 200,
      products: data,
    });
  } catch (err) {
    console.error('Unexpected error:', err.message);
    return callback(null, {
      status: 500,
      message: 'An unexpected error occurred. Please try again later.',
    });
  }
};