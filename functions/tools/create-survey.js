const { createClient } = require('@supabase/supabase-js');

exports.handler = async function(context, event, callback) {
    // Set up response object
    const response = new Twilio.Response();
    response.appendHeader('Content-Type', 'application/json');
    
    try {
        // Validate Supabase configuration
        const SUPABASE_URL = context.SUPABASE_URL;
        const SUPABASE_KEY = context.SUPABASE_KEY;

        if (!SUPABASE_URL || !SUPABASE_KEY) {
            response.setStatusCode(500);
            response.setBody({ error: 'Supabase configuration error. Please check environment variables.' });
            return callback(null, response);
        }

        const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

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
        let queryColumn, queryValue;
        if (identityHeader.startsWith('email:')) {
            queryColumn = 'email';
            queryValue = identityHeader.replace('email:', '').trim();
        } else if (identityHeader.startsWith('phone:')) {
            queryColumn = 'phone';
            queryValue = identityHeader.replace('phone:', '').trim();
        } else {
            response.setStatusCode(400);
            response.setBody({ 
                error: 'Invalid x-identity format. Use "email:<email>" or "phone:<phone>".' 
            });
            return callback(null, response);
        }

        // Lookup customer
        const { data: customers, error: customerError } = await supabase
            .from('customers')
            .select('id')
            .eq(queryColumn, queryValue);

        if (customerError) {
            response.setStatusCode(500);
            response.setBody({ error: 'Error querying customers table' });
            return callback(null, response);
        }

        if (!customers || customers.length === 0) {
            response.setStatusCode(404);
            response.setBody({ error: `No customer found for ${queryColumn}: ${queryValue}` });
            return callback(null, response);
        }

        const customer_id = customers[0].id;

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
            customer_id,
            rating,
            feedback: feedback || null,  // Make feedback optional
            created_at: new Date().toISOString()
        };

        const { data: newSurvey, error: surveyError } = await supabase
            .from('surveys')
            .insert([surveyData])
            .select()
            .single();

        if (surveyError) {
            response.setStatusCode(500);
            response.setBody({ error: 'Failed to create survey record' });
            return callback(null, response);
        }

        // Return success response
        response.setStatusCode(200);
        response.setBody({
            message: 'Survey submitted successfully',
            survey_id: newSurvey.id
        });

        return callback(null, response);

    } catch (error) {
        console.error('Unexpected error:', error);
        response.setStatusCode(500);
        response.setBody({ error: 'Internal server error' });
        return callback(null, response);
    }
};