const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async function(context, event, callback) {
    // Set up response object
    const response = new Twilio.Response();
    response.appendHeader('Content-Type', 'application/json');
    
    try {
        const { order_id, return_reason } = event;
        
        // Validate required fields
        if (!order_id || !return_reason) {
            response.setStatusCode(400);
            response.setBody({ error: 'Missing required fields: order_id and return_reason' });
            return callback(null, response);
        }
        
        // Get order details
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('*')
            .eq('id', order_id)
            .single();
            
        if (orderError || !order) {
            response.setStatusCode(404);
            response.setBody({ error: 'Order not found' });
            return callback(null, response);
        }

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
        const { data: existingReturn } = await supabase
            .from('returns')
            .select('id')
            .eq('order_id', order_id)
            .single();
            
        if (existingReturn) {
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
        
        const { data: newReturn, error: returnError } = await supabase
            .from('returns')
            .insert([returnData])
            .select()
            .single();
            
        if (returnError) {
            response.setStatusCode(500);
            response.setBody({ error: 'Failed to create return record' });
            return callback(null, response);
        }

        // Update order with return_status and return_id
        const { error: updateError } = await supabase
            .from('orders')
            .update({ 
                return_id: newReturn.id 
            })
            .eq('id', order_id);
            
        if (updateError) {
            // Rollback return creation if order update fails
            await supabase
                .from('returns')
                .delete()
                .eq('id', newReturn.id);
                
            response.setStatusCode(500);
            response.setBody({ error: 'Failed to update order with return information' });
            return callback(null, response);
        }
        
        // Return success response
        response.setStatusCode(200);
        response.setBody({
            message: 'Return initiated successfully',
            return_id: newReturn.id
        });
        
        return callback(null, response);
        
    } catch (error) {
        console.error('Unexpected error:', error);
        response.setStatusCode(500);
        response.setBody({ error: 'Internal server error' });
        return callback(null, response);
    }
};