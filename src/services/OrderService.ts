import axios from 'axios';
import { IOrderRequest, IOrderResponse } from '../types/Types';
import { generateJWTToken } from '../utils/jwt';
import * as OrderRepository from '../repositories/OrderRepository';
import { Orders } from '../entities/Orders';

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
    const jwtToken = generateJWTToken(config.API_KEY, config.SECRET_KEY);
    const mrc_order_id = `ORDER_${Math.floor(Date.now() / 1000)}`;
    
    // 2. Call API tạo order
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

    console.log(response.data);

    if (response.data.data.order_id) {
      const order = {
        ...orderData,
        email: orderData.email || null,
        location: orderData.location || null,
        mrc_order_id,
        order_id: response.data.data.order_id,
        status: "Pending"
      };

      // 3. Lưu order vào database
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