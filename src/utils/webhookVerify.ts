import crypto from 'crypto';
import { WebhookPayload } from '../types/Types';

export function verifyWebhook(secretKey: string, webhookData: string): boolean {
    try {
        // Convert JSON to string with escaped forward slashes
        const dataString = JSON.stringify(JSON.parse(webhookData)).replace(/\//g, '\\/');
        
        // Get signature from parsed data
        const parsedData = JSON.parse(webhookData);
        const receivedSignature = parsedData.sign;

        // Create dataHash by removing the last 75 characters and adding back }
        const dataHash = dataString.substring(0, dataString.length - 75) + '}';

        // Calculate signature
        const calculatedSignature = crypto
            .createHmac('sha256', secretKey)
            .update(dataHash)
            .digest('hex')
            .toLowerCase();


        // console.log('Secret Key:', secretKey);
        console.log('Data Hash:', dataHash);
        console.log('===========================================');
        console.log("isValid:", calculatedSignature === receivedSignature);
        console.log('Calculated Signature:', calculatedSignature);
        console.log('Received Signature:', receivedSignature);

        return calculatedSignature === receivedSignature;
    } catch (error) {
        console.error('Webhook verification error:', error);
        return false;
    }
}