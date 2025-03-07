import { Request, Response } from 'express';
import { transporter } from '../config/emailTransporter';
import nodemailer from 'nodemailer';

export const testEmailLogging = async (req: Request, res: Response) => {
  try {
    // Log the exact credentials being used (be careful with this in production)
    console.log('Testing with credentials:', {
      host: 'smtp.eu.mailgun.org',
      port: 465,
      username: process.env.MAIL_USERNAME,
      // Don't log the full password
      passwordProvided: !!process.env.MAIL_PASSWORD
    });

    // Create a test transporter with explicit options
    // const testTransporter = nodemailer.createTransport({
    //   host: 'smtp.eu.mailgun.org',
    //   port: 465,
    // //   secure: true,
    //   auth: {
    //     user: process.env.MAIL_USERNAME,
    //     pass: process.env.MAIL_PASSWORD
    //   },
    //   debug: true,
    //   logger: true
    // });

    const testTransporter = transporter;
    // Test the connection first
    await testTransporter.verify();
    console.log('Connection verified successfully');

    // Then try to send email
    const info = await testTransporter.sendMail({
      from: process.env.MAIL_USERNAME,
      to: process.env.MAIL_USERNAME,
      subject: 'Test Email Configuration',
      text: `Test email sent at: ${new Date().toISOString()}`
    });

    res.status(200).json({
      success: true,
      message: 'Test email sent successfully',
      details: {
        messageId: info.messageId,
        response: info.response
      }
    });
  } catch (error: any) {
    console.error('Email test failed with details:', {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response
    });
    
    res.status(500).json({
      success: false,
      message: 'Email test failed',
      error: error.message,
      details: {
        code: error.code,
        command: error.command,
        response: error.response
      }
    });
  }
}; 