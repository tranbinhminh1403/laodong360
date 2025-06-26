import axios from 'axios';
import { IOrderRequest, IOrderResponse } from '../types/Types';
import { generateJWTToken } from '../utils/jwt';
import * as OrderRepository from '../repositories/OrderRepository';
import { Orders } from '../entities/Orders';
import { contactCenterLogin, createContactCenterCustomer, createContactCenterTicket, getCustomerByPhone } from './ContactCenterService';

interface OrderConfig {
  API_KEY: string;
  SECRET_KEY: string;
  MERCHANT_ID: string;
  URL_SUCCESS: string;
  URL_CANCEL: string;
  URL_WEBHOOK: string;
  URL_DETAIL: string;
}

export const createOrder = async (
  orderData: IOrderRequest, 
  config: OrderConfig
): Promise<IOrderResponse> => {
  try {
    // 1. Chuẩn bị dữ liệu trước
    const mrc_order_id = `ORDER_${Math.floor(Date.now() / 1000)}`;
    const order = {
      ...orderData,
      email: orderData.email || null,
      location: orderData.location || null,
      order_id: Math.floor(Math.random() * 1000000),
      mrc_order_id,
      status: "Pending"
    };

    // 2. Kiểm tra giá trị price
    if (orderData.price > 0) {
      // Chuẩn bị JWT token và gọi API
      const jwtToken = generateJWTToken(config.API_KEY, config.SECRET_KEY);
      
      // Call API tạo order
      const response = await axios.post(process.env.API_CREATE_ORDER_URL || '', {
        merchant_id: parseInt(config.MERCHANT_ID),
        mrc_order_id,
        total_amount: parseInt(orderData.price.toString()),
        description: `Thanh toán đơn hàng ${mrc_order_id}`,
        webhooks: config.URL_WEBHOOK,
        url_success: config.URL_SUCCESS,
        url_cancel: config.URL_CANCEL,
        url_detail: config.URL_DETAIL,
        lang: orderData.lang || 'vi'
      }, {
        headers: {
          'Content-Type': 'application/json',
          'jwt': `Bearer ${jwtToken}`
        }
      });

      if (response.data.data.order_id) {
        order.order_id = response.data.data.order_id;
        
        // Lưu order vào database
        await OrderRepository.createOrder(order as Partial<Orders>);

        return {
          success: true,
          data: {
            order_id: response.data.data.order_id,
            redirect_url: response.data.data.redirect_url,
            payment_url: response.data.data.payment_url,
          }
        };
      }

      throw new Error('Không thể tạo order');
    } else {
      // Nếu price <= 0, chỉ lưu vào database
      await OrderRepository.createOrder(order as Partial<Orders>);
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
                console.log('Ticket created successfully');
              }
            } catch (error) {
              // Silent error for contact center operations
            }
          }
      
        } catch (error) {
          console.error('Error processing notifications:', error);
        }
      
      return {
        success: true,
        data: {
          order_id: order.order_id,
          redirect_url: '',
          payment_url: '',
        }
      };
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      error_response: error.response?.data
    };
  }
};

export const getOrders = async (status?: string | string[]) => {
  try {
    const orders = await OrderRepository.getAllOrdersWithFilter(status);
    return {
      success: true,
      data: orders
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}; 