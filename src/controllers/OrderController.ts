import { Request, Response } from 'express';
import { createOrder, getOrders } from '../services/OrderService';

const orderConfig = {
  API_KEY: process.env.API_KEY!,
  SECRET_KEY: process.env.SECRET_KEY!,
  MERCHANT_ID: process.env.MERCHANT_ID!,
  URL_SUCCESS: process.env.PAYMENT_URL_SUCCESS!,
  URL_CANCEL: process.env.PAYMENT_URL_CANCEL!,
  URL_WEBHOOK: process.env.PAYMENT_URL_WEBHOOK!,
  URL_DETAIL: process.env.PAYMENT_URL_DETAIL!
};

export const handleCreateOrder = async (req: Request, res: Response) => {
  try {
    const result = await createOrder(req.body, orderConfig);
    res.status(result.success ? 200 : 500).json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const handleGetOrders = async (req: Request, res: Response) : Promise<any> => {
  try {
    const { status } = req.query;
    let statusFilter: string | string[] | undefined;

    if (status) {
      if (Array.isArray(status)) {
        statusFilter = status as string[];
      } else {
        statusFilter = status as string;
      }
      
      // Validate status values
      const validStatuses = ['Pending', 'Completed'];
      if (Array.isArray(statusFilter)) {
        if (!statusFilter.every(s => validStatuses.includes(s))) {
          return res.status(400).json({
            success: false,
            error: 'Invalid status values. Must be Pending or Completed'
          });
        }
      } else if (!validStatuses.includes(statusFilter)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid status value. Must be Pending or Completed'
        });
      }
    }

    const result = await getOrders(statusFilter);
    res.status(result.success ? 200 : 500).json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}; 