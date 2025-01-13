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

    // Airtable setup
    const base = new Airtable({apiKey: context.AIRTABLE_API_KEY}).base(context.AIRTABLE_BASE_ID);

    // Extract and validate the x-identity header
    const identityHeader = event.request.headers["x-identity"];
    if (!identityHeader) {
      return callback(null, {
        status: 400,
        message: 'Missing x-identity header. Provide email or phone in the format: "email:<email>" or "phone:<phone>".',
      });
    }

    // Parse the identity header
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
      return callback(null, {
        status: 400,
        message: 'Invalid x-identity format. Use "email:<email>" or "phone:<phone>".',
      });
    }

    console.log(`Querying customers for ${queryField}: ${queryValue}`);

    // Query Airtable
    const records = await base('customers')
      .select({
        filterByFormula: `{${queryField}} = '${queryValue}'`,
        maxRecords: 1
      })
      .firstPage();

    if (!records || records.length === 0) {
      console.log(`No customer found for ${queryField}: ${queryValue}`);
      return callback(null, {
        status: 404,
        message: `No customer found for ${queryField}: ${queryValue}`,
      });
    }

    console.log(`Found customer for ${queryField}: ${queryValue}`);
    return callback(null, {
      status: 200,
      customer: records.map(record => record.fields),
    });

  } catch (err) {
    console.error('Unexpected error:', err.message);
    return callback(null, {
      status: 500,
      message: 'An unexpected error occurred. Please try again later.',
    });
  }
};