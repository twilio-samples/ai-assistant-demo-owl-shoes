const Airtable = require('airtable');

exports.handler = async function(context, event, callback) {
  const response = new Twilio.Response();
  response.appendHeader('Content-Type', 'application/json');
  
  try {
    // Validate Airtable configuration
    if (!context.AIRTABLE_API_KEY || !context.AIRTABLE_BASE_ID) {
      response.setStatusCode(500);
      response.setBody({ error: 'Airtable configuration error. Please check environment variables.' });
      return callback(null, response);
    }

    const base = new Airtable({apiKey: context.AIRTABLE_API_KEY}).base(context.AIRTABLE_BASE_ID);

    // Extract and validate the x-identity header
    const identityHeader = event.request.headers["x-identity"];
    if (!identityHeader) {
      response.setStatusCode(400);
      response.setBody({ 
        error: 'Missing x-identity header. Provide email or phone in the format: "email:<email>" or "phone:<phone>".' 
      });
      return callback(null, response);
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
      response.setStatusCode(400);
      response.setBody({ 
        error: 'Invalid x-identity format. Use "email:<email>" or "phone:<phone>".' 
      });
      return callback(null, response);
    }

    // Lookup customer
    const customerRecords = await base('customers')
      .select({
        filterByFormula: `{${queryField}} = '${queryValue}'`,
        maxRecords: 1
      })
      .firstPage();

    if (!customerRecords || customerRecords.length === 0) {
      response.setStatusCode(404);
      response.setBody({ error: `No customer found for ${queryField}: ${queryValue}` });
      return callback(null, response);
    }

    const customer = customerRecords[0].fields;

    // Validate survey data
    const { rating, feedback } = event;
    
    if (rating === undefined) {
      response.setStatusCode(400);
      response.setBody({ error: 'Rating is required' });
      return callback(null, response);
    }

    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
      response.setStatusCode(400);
      response.setBody({ error: 'Rating must be a number between 1 and 5' });
      return callback(null, response);
    }

    // Create survey record
    const surveyData = {
      customer_id: customer.id,
      rating: rating,
      feedback: feedback || null,
      created_at: new Date().toISOString()
    };

    const newSurvey = await base('surveys').create([
      { fields: surveyData }
    ]);

    if (!newSurvey || newSurvey.length === 0) {
      response.setStatusCode(500);
      response.setBody({ error: 'Failed to create survey record' });
      return callback(null, response);
    }

    // Return success response
    response.setStatusCode(200);
    response.setBody({
      message: 'Survey submitted successfully',
      survey_id: newSurvey[0].id
    });

    return callback(null, response);

  } catch (error) {
    console.error('Unexpected error:', error);
    response.setStatusCode(500);
    response.setBody({ error: 'Internal server error' });
    return callback(null, response);
  }
};