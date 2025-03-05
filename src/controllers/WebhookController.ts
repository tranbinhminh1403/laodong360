import { Request, Response } from 'express';
import { handleWebhook } from '../services/WebhookService';

export const handleWebhookCallback = async (req: Request, res: Response) => {
  try {
    const webhookData = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    const result = await handleWebhook(webhookData, process.env.SECRET_KEY!);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(200).json({
      err_code: "1",
      message: error.message.substring(0, 255)
    });
  }
}; 