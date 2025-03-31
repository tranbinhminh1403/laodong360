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

    // Only verify payment and update order status
    const { order, txn } = parsedData;
    if (order.stat !== 'c' || txn.stat !== 1) {
      return { err_code: "1", message: "Invalid order status" };
    }

    const existingOrder = await OrderRepository.getOrderByMrcOrderId(order.mrc_order_id);
    if (!existingOrder) {
      return { err_code: "1", message: "Order not found" };
    }

    // Update order status
    await OrderRepository.updateOrderStatus(existingOrder.id, 'Completed');

    // Process other operations asynchronously
    processOrderNotifications(existingOrder).catch(console.error);

    // Respond immediately after status update
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
    await Promise.all([
      sendPaymentSuccessEmail(order),
      sendPaymentSuccessEmailToAccountant(order),
      createInvoice(order),
      sendZNS(order),
      createContactCenterTicket(order as ContactCenterCreateTicket)
    ]);
  } catch (error) {
    console.error('Error processing notifications:', error);
  }
}; 