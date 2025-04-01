import { Request, Response } from 'express';
import { sendSurveyZNS, sendZNS } from '../services/CpassService';

export const testCpassService = async (req: Request, res: Response) => {
  try {
    const orderData = req.body;
    
    // Validate required fields
    if (!orderData.phoneNumber || !orderData.fullName || !orderData.title || !orderData.note || !orderData.time) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: phoneNumber, fullName, title, note, time'
      });
    }

    const result = await sendZNS(orderData);
    
    res.status(200).json({
      success: true,
      data: result.data
    });
  } catch (error: any) {
    console.error('CPASS test failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      details: error.response?.data
    });
  }
}; 