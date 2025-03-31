import { WebhookPayload } from '../types/Types';
import * as OrderRepository from '../repositories/OrderRepository';
import { verifyWebhook } from '../utils/webhookVerify';
import { sendPaymentSuccessEmail, sendPaymentSuccessEmailToAccountant, sendPaymentSuccessEmailToAdmin } from './EmailService';
import { contactCenterLogin, createContactCenterCustomer, createContactCenterTicket, getCustomerByPhone } from './ContactCenterService';
import { createInvoice } from './InvoiceService';
import { sendZNS } from './CpassService';

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
    const { order, txn } = payload;

    // 1. Validate order status
    if (order.stat !== 'c' || txn.stat !== 1) {
      return false;
    }

    // 2. Get order from database
    const existingOrder = await OrderRepository.getOrderByMrcOrderId(order.mrc_order_id);
    if (!existingOrder) {
      return false;
    }

    // 3. Contact Center Integration
    let contactCenterSuccess = false;
    let customerId: number | null = null;

    try {
      if (!process.env.CONTACT_CENTER_API_URL) {
        throw new Error('Contact Center API URL not configured');
      }

      // 3.1 Login to Contact Center
      const loginResponse = await contactCenterLogin();
      if (!loginResponse.access_token) {
        throw new Error('Failed to get access token');
      }

      // 3.2 Try to create Customer (ignore if exists)
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
          
          // Get the newly created customer's ID
          customerId = await getCustomerByPhone(existingOrder.phoneNumber);
        }
      } catch (customerError: any) {
        // Silent error handling
      }

      // 3.3 Create Ticket
      const ticketResponse = await createContactCenterTicket({
        name: existingOrder.fullName,
        email: existingOrder.email,
        contactid: customerId || undefined,
        department: 1,
        subject: `[Gói hỗ trợ: ${existingOrder.title}]\n
        Vấn đề: ${existingOrder.note}\n Ngày hẹn: ${existingOrder.time}`,
        priority: 2,
      });
      
      contactCenterSuccess = true;
    } catch (error: any) {
      // Silent error handling - continue processing even if contact center integration fails
    }

    // 4. Update order and send emails
    await Promise.all([
      OrderRepository.updateOrderStatus(existingOrder.id, 'Completed'),
      existingOrder.email ? sendPaymentSuccessEmail(existingOrder) : Promise.resolve(true),
      sendPaymentSuccessEmailToAccountant(existingOrder),
      createInvoice(existingOrder),
      sendZNS(existingOrder)
    ]);

    return true;

  } catch (error: any) {
    return false;
  }
}; 