import { ContactCenterCreateTicket, WebhookPayload } from '../types/Types';
import * as OrderRepository from '../repositories/OrderRepository';
import { verifyWebhook } from '../utils/webhookVerify';
import { sendPaymentSuccessEmail, sendPaymentSuccessEmailToAccountant, sendPaymentSuccessEmailToAdmin } from './EmailService';
import { contactCenterLogin, createContactCenterCustomer, createContactCenterTicket, getCustomerByPhone } from './ContactCenterService';
import { createInvoice } from './InvoiceService';
import { sendZNS } from './CpassService';
import { Orders } from '../entities/Orders';

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

    const { order, txn } = parsedData;
    if (order.stat !== 'c' || txn.stat !== 1) {
      return { err_code: "1", message: "Invalid order status" };
    }

    const existingOrder = await OrderRepository.getOrderByMrcOrderId(order.mrc_order_id);
    if (!existingOrder) {
      return { err_code: "1", message: "Order not found" };
    }

    // Update order status first
    await OrderRepository.updateOrderStatus(existingOrder.id, 'Completed');

    // Process other operations asynchronously
    processOrderNotifications(existingOrder).catch(console.error);

    return {
      err_code: "0",
      message: "some message"
    };

  } catch (error: any) {
    return {
      err_code: "1",
      message: error.message.substring(0, 255)
    };
  }
};

// Separate function for async operations
const processOrderNotifications = async (order: Partial<Orders>) => {
  try {
    // 1. Contact Center Integration
    let customerId: number | null = null;
    
    if (process.env.CONTACT_CENTER_API_URL) {
      try {
        // 1.1 Login to Contact Center
        const loginResponse = await contactCenterLogin();
        if (loginResponse.access_token) {
          // 1.2 Try to find or create Customer
          try {
              customerId = await getCustomerByPhone(order.phoneNumber || '');
            
            if (!customerId) {
              await createContactCenterCustomer({
                lastname: order.fullName || '',
                email: order.email || '',
                phonenumber: order.phoneNumber || '',
                country: 243,
                default_currency: 3,
                default_language: 'vietnamese'
              });
              
              customerId = await getCustomerByPhone(order.phoneNumber || '');
            }
          } catch (customerError) {
            // Silent error for customer operations
          }

          // 1.3 Create Ticket
          await createContactCenterTicket({
            name: order.fullName || '',
            email: order.email || '',
            contactid: customerId || undefined,
            department: 1,
            subject: `[Gói hỗ trợ: ${order.title}]\nVấn đề: ${order.note}\nNgày hẹn: ${order.time}`,
            priority: 2,
          });
        }
      } catch (error) {
        // Silent error for contact center operations
      }
    }

    // 2. Process other notifications in parallel
    await Promise.all([
      sendPaymentSuccessEmail(order),
      sendPaymentSuccessEmailToAccountant(order),
      createInvoice(order),
      sendZNS(order)
    ]);
  } catch (error) {
    console.error('Error processing notifications:', error);
  }
}; 