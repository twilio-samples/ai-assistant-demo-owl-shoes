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

        // Validate product_id in the request
        const { product_id } = event;
        if (!product_id) {
            response.setStatusCode(400);
            response.setBody({ error: 'Missing product_id in request body' });
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
            .select('*')
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

        const customer = customers[0];

        // Lookup product
        const { data: products, error: productError } = await supabase
            .from('products')
            .select('*')
            .eq('id', product_id);

        if (productError) {
            response.setStatusCode(500);
            response.setBody({ error: 'Error querying products table' });
            return callback(null, response);
        }

        if (!products || products.length === 0) {
            response.setStatusCode(404);
            response.setBody({ error: `No product found with id: ${product_id}` });
            return callback(null, response);
        }

        const product = products[0];

        // Calculate final price considering any current discount
        let finalPrice = product.price;
        if (product.current_discount) {
            const discountAmount = parseFloat(product.current_discount);
            if (!isNaN(discountAmount)) {
                finalPrice = product.price * (1 - discountAmount / 100);
            }
        }

        // Create order record
        const orderData = {
            customer_id: customer.id,
            email: customer.email,
            phone: customer.phone,
            items: [{
                id: product.id,
                name: product.name,
                price: finalPrice,
                quantity: 1, // Default to 1 since quantity wasn't specified in the event
                image_url: product.image_url,
                size: product.size,
                color: product.color,
                category: product.category,
                brand: product.brand
            }],
            total_amount: finalPrice, // Since quantity is 1
            shipping_status: 'pending'
        };

        const { data: newOrder, error: orderError } = await supabase
            .from('orders')
            .insert([orderData])
            .select()
            .single();

        if (orderError) {
            response.setStatusCode(500);
            response.setBody({ error: 'Failed to create order record' });
            return callback(null, response);
        }

        // Return success response
        response.setStatusCode(200);
        response.setBody({
            message: 'Order created successfully',
            order_id: newOrder.id,
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
                product: {
                    name: product.name,
                    price: finalPrice,
                    original_price: product.price,
                    discount_applied: product.current_discount || '0'
                }
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