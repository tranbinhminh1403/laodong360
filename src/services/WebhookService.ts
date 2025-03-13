import { WebhookPayload } from '../types/Types';
import * as OrderRepository from '../repositories/OrderRepository';
import { verifyWebhook } from '../utils/webhookVerify';
import { sendPaymentSuccessEmail, sendPaymentSuccessEmailToAccountant, sendPaymentSuccessEmailToAdmin } from './EmailService';
import { contactCenterLogin, createContactCenterCustomer, createContactCenterTicket, getCustomerByPhone } from './ContactCenterService';
export const handleWebhook = async (
  webhookData: string,
  secretKey: string
): Promise<{
  err_code: string;
  message: string;
}> => {
  try {
    const isValid = verifyWebhook(secretKey, webhookData);
    if (!isValid) {
      return {
        err_code: "1",
        message: "Invalid signature"
      };
    }

    const parsedData: WebhookPayload = typeof webhookData === 'string' 
      ? JSON.parse(webhookData) 
      : webhookData;

    const success = await processWebhook(parsedData);
    
    return {
      err_code: success ? "0" : "1",
      message: success ? "some message" : "Payment processing failed"
    };

  } catch (error: any) {
    return {
      err_code: "1",
      message: error.message.substring(0, 255)
    };
  }
};

const processWebhook = async (payload: WebhookPayload): Promise<boolean> => {
  try {
    console.log('\n=== Starting Webhook Processing ===');
    const { order, txn } = payload;

    // 1. Validate order status
    console.log('\n1. Validating order status...');
    if (order.stat !== 'c' || txn.stat !== 1) {
      console.log('❌ Order validation failed: Invalid status');
      return false;
    }
    console.log('✅ Order status validated');

    // 2. Get order from database
    console.log('\n2. Fetching order from database...');
    const existingOrder = await OrderRepository.getOrderByMrcOrderId(order.mrc_order_id);
    if (!existingOrder) {
      console.log('❌ Order not found in database');
      return false;
    }
    console.log('✅ Order found in database');

    // 3. Contact Center Integration
    console.log('\n3. Starting Contact Center Integration...');
    let contactCenterSuccess = false;
    let customerId: number | null = null;

    try {
      if (!process.env.CONTACT_CENTER_API_URL) {
        throw new Error('Contact Center API URL not configured');
      }

      // 3.1 Login to Contact Center
      console.log('3.1 Logging into Contact Center...');
      const loginResponse = await contactCenterLogin();
      if (!loginResponse.access_token) {
        throw new Error('Failed to get access token');
      }
      console.log('✅ Contact Center login successful');

      // 3.2 Try to create Customer (ignore if exists)
      console.log('\n3.2 Attempting to create Contact Center Customer...');
      try {
        // First, try to find existing customer
        customerId = await getCustomerByPhone(existingOrder.phoneNumber);
        
        if (!customerId) {
          // If customer doesn't exist, create new one
          const customerResponse = await createContactCenterCustomer({
            lastname: existingOrder.fullName,
            email: existingOrder.email,
            phonenumber: existingOrder.phoneNumber,
            country: 243,
            default_currency: 3,
            default_language: 'vietnamese'
          });
          console.log('✅ Customer created:', customerResponse);
          
          // Get the newly created customer's ID
          customerId = await getCustomerByPhone(existingOrder.phoneNumber);
        } else {
          console.log('✅ Existing customer found with ID:', customerId);
        }
      } catch (customerError: any) {
        console.error('❌ Customer operation failed:', customerError.message);
      }

      // 3.3 Create Ticket
      console.log("\n3.3 Creating Contact Center Ticket...");
      const ticketResponse = await createContactCenterTicket({
        name: existingOrder.fullName,
        email: existingOrder.email,
        contactid: customerId || undefined,
        department: 1,
        subject: `[Gói hỗ trợ: ${existingOrder.title}]\n
        Vấn đề: ${existingOrder.note}\n Ngày hẹn: ${existingOrder.time}`,
        priority: 2,
      });
      console.log('✅ Ticket created:', ticketResponse);
      
      contactCenterSuccess = true;
    } catch (error: any) {
      console.error('❌ Contact Center Integration failed:', {
        error: error.message,
        response: error.response?.data,
        stack: error.stack
      });
      // Continue processing even if contact center integration fails
    }

    console.log(`Contact Center Integration ${contactCenterSuccess ? 'succeeded' : 'failed'}`);

    // 4. Update order and send emails
    console.log('\n4. Updating order status and sending notifications...');
    await Promise.all([
      OrderRepository.updateOrderStatus(existingOrder.id, 'Completed'),
      existingOrder.email ? sendPaymentSuccessEmail(existingOrder) : Promise.resolve(true),
      sendPaymentSuccessEmailToAccountant(existingOrder)
    ]);
    console.log('✅ Order updated and notifications sent');

    console.log('\n=== Webhook Processing Completed Successfully ===');
    return true;

  } catch (error: any) {
    console.error('\n❌ Webhook Processing Failed:', error.message);
    return false;
  }
}; 