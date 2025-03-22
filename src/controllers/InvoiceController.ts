import { Request, Response } from 'express';
import { createInvoice } from '../services/InvoiceService';

export const testCreateInvoice = async (req: Request, res: Response) => {
  try {
    const orderData = req.body;
    const result = await createInvoice(orderData);
    
    res.status(result.success ? 200 : 500).json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}; 