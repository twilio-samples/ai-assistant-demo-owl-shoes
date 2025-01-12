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
    
    const { order_id, return_reason } = event;
    
    // Validate required fields
    if (!order_id || !return_reason) {
      response.setStatusCode(400);
      response.setBody({ error: 'Missing required fields: order_id and return_reason' });
      return callback(null, response);
    }
    
    // Get order details
    const orderRecords = await base('orders')
      .select({
        filterByFormula: `{id} = '${order_id}'`,
        maxRecords: 1
      })
      .firstPage();
      
    if (!orderRecords || orderRecords.length === 0) {
      response.setStatusCode(404);
      response.setBody({ error: 'Order not found' });
      return callback(null, response);
    }

    const order = orderRecords[0].fields;

    // Check if order status is "delivered"
    if (order.shipping_status !== 'delivered') {
      response.setStatusCode(400);
      response.setBody({ 
        error: 'Cannot process return - order must be in delivered status',
        current_status: order.shipping_status 
      });
      return callback(null, response);
    }
    
    // Check if return already exists
    const returnRecords = await base('returns')
      .select({
        filterByFormula: `{order_id} = '${order_id}'`,
        maxRecords: 1
      })
      .firstPage();
      
    if (returnRecords && returnRecords.length > 0) {
      response.setStatusCode(409);
      response.setBody({ error: 'Return already exists for this order' });
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
    
    const newReturn = await base('returns').create([
      { fields: returnData }
    ]);
            
    if (!newReturn || newReturn.length === 0) {
      response.setStatusCode(500);
      response.setBody({ error: 'Failed to create return record' });
      return callback(null, response);
    }

    // Update order with return_id
    await base('orders').update([
      {
        id: orderRecords[0].id,  // Use the Airtable record ID
        fields: {
          return_id: newReturn[0].id
        }
      }
    ]);
    
    // Return success response
    response.setStatusCode(200);
    response.setBody({
      message: 'Return initiated successfully',
      return_id: newReturn[0].id
    });
    
    return callback(null, response);
    
  } catch (error) {
    console.error('Unexpected error:', error);
    response.setStatusCode(500);
    response.setBody({ error: 'Internal server error' });
    return callback(null, response);
  }
};