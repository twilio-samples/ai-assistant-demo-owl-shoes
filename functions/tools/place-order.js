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

    const { product_id } = event;
    if (!product_id) {
      response.setStatusCode(400);
      response.setBody({ error: 'Missing product_id in request body' });
      return callback(null, response);
    }

    // Parse identity header
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

    // Lookup product
    const productRecords = await base('products')
      .select({
        filterByFormula: `{id} = '${product_id}'`,
        maxRecords: 1
      })
      .firstPage();

    if (!productRecords || productRecords.length === 0) {
      response.setStatusCode(404);
      response.setBody({ error: `No product found with id: ${product_id}` });
      return callback(null, response);
    }

    const product = productRecords[0].fields;

    // Calculate final price considering any current discount
    let finalPrice = product.price;
    if (product.current_discount) {
      const discountAmount = parseFloat(product.current_discount);
      if (!isNaN(discountAmount)) {
        finalPrice = product.price * (1 - discountAmount / 100);
      }
    }

    // Generate random 6-digit order ID
    const orderId = Math.floor(100000 + Math.random() * 900000).toString();

    // Create order record
    const orderData = {
      id: orderId,
      customer_id: customer.id,
      email: customer.email,
      phone: customer.phone,
      items: JSON.stringify([{  // Airtable requires stringified JSON for complex objects
        id: product.id,
        name: product.name,
        price: finalPrice,
        quantity: 1,
        image_url: product.image_url,
        size: product.size,
        color: product.color,
        category: product.category,
        brand: product.brand
      }]),
      total_amount: finalPrice,
      shipping_status: 'pending'
    };

    const newOrder = await base('orders').create([
      { fields: orderData }
    ]);

    if (!newOrder || newOrder.length === 0) {
      response.setStatusCode(500);
      response.setBody({ error: 'Failed to create order record' });
      return callback(null, response);
    }

    // Return success response
    response.setStatusCode(200);
    response.setBody({
      message: 'Order created successfully',
      order_id: orderId,
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