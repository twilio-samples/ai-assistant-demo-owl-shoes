const Airtable = require('airtable');

exports.handler = async function(context, event, callback) {
  const response = new Twilio.Response();
  response.appendHeader('Content-Type', 'application/json');
  
  // Define base outside try-catch to ensure proper scope
  let base;
  
  try {
    // Validate Airtable configuration
    if (!context.AIRTABLE_API_KEY || !context.AIRTABLE_BASE_ID) {
      response.setStatusCode(500);
      response.setBody({ 
        message: 'Airtable configuration error. Please check environment variables.',
        error: 'Missing API key or Base ID'
      });
      return callback(null, response);
    }

    base = new Airtable({apiKey: context.AIRTABLE_API_KEY}).base(context.AIRTABLE_BASE_ID);
    
    const { order_id, return_reason } = event;
    
    // Rest of the code remains the same
    if (!order_id || !return_reason) {
      response.setStatusCode(400);
      response.setBody({ 
        message: 'Bad Request',
        error: 'Missing required fields: order_id and return_reason' 
      });
      return callback(null, response);
    }
    
    // Get order details
    let orderRecords;
    try {
      orderRecords = await base('orders')
        .select({
          filterByFormula: `{id} = '${order_id}'`,
          maxRecords: 1
        })
        .firstPage();
    } catch (orderError) {
      response.setStatusCode(500);
      response.setBody({ 
        message: 'Failed to fetch order details',
        error: orderError.message 
      });
      return callback(null, response);
    }
      
    if (!orderRecords || orderRecords.length === 0) {
      response.setStatusCode(404);
      response.setBody({ 
        message: 'Order not found',
        error: `No order found with ID: ${order_id}`
      });
      return callback(null, response);
    }

    const order = orderRecords[0].fields;

    // Check if order status is "delivered"
    if (order.shipping_status !== 'delivered') {
      response.setStatusCode(400);
      response.setBody({ 
        message: 'Cannot process return - order must be in delivered status',
        current_status: order.shipping_status,
        error: 'Invalid order status for return'
      });
      return callback(null, response);
    }
    
    // Check if return already exists
    let returnRecords;
    try {
      returnRecords = await base('returns')
        .select({
          filterByFormula: `{order_id} = '${order_id}'`,
          maxRecords: 1
        })
        .firstPage();
    } catch (returnCheckError) {
      response.setStatusCode(500);
      response.setBody({ 
        message: 'Failed to check existing returns',
        error: returnCheckError.message 
      });
      return callback(null, response);
    }
      
    if (returnRecords && returnRecords.length > 0) {
      response.setStatusCode(409);
      response.setBody({ 
        message: 'Return already exists for this order',
        existing_return_id: returnRecords[0].fields.id  // Updated to use fields.id
      });
      return callback(null, response);
    }
    
    // Create new return record
    const returnData = {
      order_id: order.id,
      customer_id: order.customer_id,
      reason: return_reason,
      status: 'submitted',
      refund_amount: order.total_amount,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    let newReturn;
    try {
      newReturn = await base('returns').create([
        { fields: returnData }
      ]);
      
      if (!newReturn || newReturn.length === 0) {
        response.setStatusCode(500);
        response.setBody({ 
          message: 'Failed to create return record',
          error: 'Return creation failed'
        });
        return callback(null, response);
      }

      // Get the auto-generated ID from the fields
      const returnId = newReturn[0].fields.id;
      
      if (!returnId) {
        response.setStatusCode(500);
        response.setBody({ 
          message: 'Return created but ID field is missing',
          error: 'Missing return ID in response',
          airtable_record_id: newReturn[0].id
        });
        return callback(null, response);
      }

    } catch (createReturnError) {
      response.setStatusCode(500);
      response.setBody({ 
        message: 'Failed to create return record',
        error: createReturnError.message
      });
      return callback(null, response);
    }

    // Update order with return_id
    try {
      await base('orders').update([
        {
          id: orderRecords[0].id,
          fields: {
            return_id: newReturn[0].fields.id
          }
        }
      ]);
    } catch (updateOrderError) {
      response.setStatusCode(500);
      response.setBody({ 
        message: 'Return created but failed to update order with return ID',
        error: updateOrderError.message,
        return_id: newReturn[0].fields.id
      });
      return callback(null, response);
    }
    
    // Return success response
    response.setStatusCode(200);
    response.setBody({
      message: 'Return initiated successfully',
      return_id: newReturn[0].fields.id,
      status: 'success'
    });
    
    return callback(null, response);
    
  } catch (error) {
    console.error('Unexpected error:', error);
    response.setStatusCode(500);
    response.setBody({ 
      message: 'Internal server error',
      error: error.message
    });
    return callback(null, response);
  }
};