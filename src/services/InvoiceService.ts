import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { Orders } from "../entities/Orders";
import dotenv from "dotenv";

dotenv.config();    

const INVOICE_API_URL = process.env.INVOICE_API_URL;
const INVOICE_USERNAME = process.env.INVOICE_USERNAME;
const INVOICE_PASSWORD = process.env.INVOICE_PASSWORD;
const INVOICE_TEMPLATE_CODE = process.env.INVOICE_TEMPLATE_CODE;
const INVOICE_SIGN_SIGNATURE = process.env.INVOICE_SIGN_SIGNATURE;
const INVOICE_CERTIFICATE_SERIAL = process.env.INVOICE_CERTIFICATE_SERIAL;

const INVOICE_SELLER_NAME = process.env.INVOICE_SELLER_NAME;
const INVOICE_SELLER_TAX_CODE = process.env.INVOICE_SELLER_TAX_CODE;
const INVOICE_SELLER_ADDRESS = process.env.INVOICE_SELLER_ADDRESS;
const INVOICE_SELLER_PHONE = process.env.INVOICE_SELLER_PHONE;
const INVOICE_SELLER_EMAIL = process.env.INVOICE_SELLER_EMAIL;
const INVOICE_SELLER_WEBSITE = process.env.INVOICE_SELLER_WEBSITE;
const INVOICE_SELLER_BANK_ACCOUNT = process.env.INVOICE_SELLER_BANK_ACCOUNT;
const INVOICE_SELLER_BANK_NAME = process.env.INVOICE_SELLER_BANK_NAME;

interface InvoiceResponse {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
  details?: any;
}

interface SignInvoiceResponse {
  success: boolean;
  data?: {
    errorCode: number;
    description: string | null;
    result: {
      hashString: string;
    };
  };
  error?: string;
}

export const invoiceLogin = async () => {
  try {
    console.log('\n=== Starting Invoice Login Process ===');
    console.log('Login URL:', `${INVOICE_API_URL}/auth/login`);
    console.log('Username:', INVOICE_USERNAME);
    console.log('Password:', '********'); // Don't log actual password

    const response = await axios.post(`${INVOICE_API_URL}/auth/login`, {
      username: INVOICE_USERNAME,
      password: INVOICE_PASSWORD,
    });

    console.log('Login successful!');
    console.log('Access Token:', response.data.access_token);
    console.log('=== Login Process Completed ===\n');

    return response.data;
  } catch (error: any) {
    console.error('\n❌ Login Failed:', error.message);
    console.error('Response:', error.response?.data);
    throw error;
  }
};

export const signInvoice = async (hashString: string, accessToken: string): Promise<InvoiceResponse> => {
  try {
    console.log('\n=== Starting Invoice Signing Process ===');
    
    const signData = {
      supplierTaxCode: INVOICE_USERNAME,
      templateCode: INVOICE_TEMPLATE_CODE,
      hashString,
      signature: INVOICE_SIGN_SIGNATURE
    };

    console.log('Signing request data:', JSON.stringify(signData, null, 2));

    const response = await axios.post(
      `${INVOICE_API_URL}/services/einvoiceapplication/api/InvoiceAPI/InvoiceWS/createInvoiceUsbTokenInsertSignature`,
      signData,
      {
        headers: {
          'Cookie': `access_token=${accessToken}`,
        //   'Content-Type': 'application/json',
        //   'Accept': 'application/json'
        }
      }
    );

    console.log('✅ Invoice signing completed');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    return {
      success: true,
      data: response.data
    };
  } catch (error: any) {
    console.error('\n❌ Invoice Signing Failed:', error.message);
    console.error('Error Details:', error.response?.data || error);
    return {
      success: false,
      error: error.message,
      details: error.response?.data
    };
  }
};

export const createInvoice = async (orderData: Partial<Orders>): Promise<InvoiceResponse> => {
  try {
    // 1. Login
    console.log('\n1. Getting access token...');
    let loginResponse = await invoiceLogin();
    if (!loginResponse.access_token) {
      throw new Error('Failed to get invoice access token');
    }
    console.log('✅ Access token received');

    // 2. Create invoice and get hash
    let createResponse = await createInvoiceAndGetHash(orderData, loginResponse.access_token);
    
    // If token expired, try once more with new token
    if (!createResponse.success && createResponse.error === 'Token expired') {
      console.log('Token expired, getting new token...');
      loginResponse = await invoiceLogin();
      createResponse = await createInvoiceAndGetHash(orderData, loginResponse.access_token);
    }

    if (!createResponse.success || !createResponse.data?.result?.hashString) {
      throw new Error('Failed to get hash string from invoice creation');
    }

    // 3. Sign invoice with hash
    const signResponse = await signInvoice(
      createResponse.data.result.hashString,
      loginResponse.access_token
    );

    return signResponse;

  } catch (error: any) {
    console.error('\n❌ Invoice Process Failed:', error.message);
    return {
      success: false,
      error: error.message,
      message: "Failed to process invoice",
      details: error.response?.data
    };
  }
};

// Renamed the original createInvoice function to be more specific
const createInvoiceAndGetHash = async (orderData: Partial<Orders>, accessToken: string): Promise<SignInvoiceResponse> => {
  try {
    console.log('\n=== Starting Invoice Creation Process ===');
    
    // Calculate prices with proper rounding
    const price = Math.round(Number(orderData.price));
    const taxAmount = Math.round(price * 0.1);
    const totalAmount = price + taxAmount;

    const invoiceData = {
      generalInvoiceInfo: {
        transactionUuid: uuidv4(),
        invoiceType: "1",
        templateCode: INVOICE_TEMPLATE_CODE,
        invoiceSeries: "C25TAA",
        invoiceIssuedDate: Math.floor(Date.now() / 1000) * 1000,
        currencyCode: "VND",
        exchangeRate: 1,
        adjustmentType: "1",
        paymentStatus: true,
        cusGetInvoiceRight: true,
        certificateSerial: INVOICE_CERTIFICATE_SERIAL
      },
      sellerInfo: {
        sellerLegalName: INVOICE_SELLER_NAME,
        sellerTaxCode: INVOICE_SELLER_TAX_CODE,
        sellerAddressLine: INVOICE_SELLER_ADDRESS,
        sellerPhoneNumber: INVOICE_SELLER_PHONE,
        sellerEmail: INVOICE_SELLER_EMAIL,
        sellerWebsite: INVOICE_SELLER_WEBSITE,
        sellerBankAccount: INVOICE_SELLER_BANK_ACCOUNT,
        sellerBankName: INVOICE_SELLER_BANK_NAME
      },
      buyerInfo: {
        buyerName: orderData.fullName,
        buyerAddressLine: orderData.location || "N/A",
        buyerPhoneNumber: orderData.phoneNumber,
        buyerEmail: orderData.email || "N/A"
      },
      payments: [
        {
          paymentMethodName: "Chuyển khoản"
        }
      ],
      itemInfo: [
        {
          itemName: orderData.note || orderData.title,
          unitName: "Cái",
          unitPrice: price,
          quantity: 1,
          itemTotalAmountWithoutTax: price,
          taxPercentage: 10,
          taxAmount: taxAmount,
          itemTotalAmountWithTax: totalAmount
        }
      ],
      taxBreakdowns: [
        {
          taxPercentage: 10,
          taxableAmount: price,
          taxAmount: taxAmount
        }
      ],
      summarizeInfo: {
        totalAmountWithoutTax: price,
        totalTaxAmount: taxAmount,
        totalAmountWithTax: totalAmount
      }
    };

    console.log('Transaction UUID:', invoiceData.generalInvoiceInfo.transactionUuid);
    console.log('Invoice Issue Date:', invoiceData.generalInvoiceInfo.invoiceIssuedDate);
    console.log('Request URL:', `${INVOICE_API_URL}/services/einvoiceapplication/api/InvoiceAPI/InvoiceWS/createInvoiceUsbTokenGetHash/${INVOICE_USERNAME}`);
    console.log('Request Headers:', {
      'Cookie': `access_token=${accessToken.substring(0, 10)}...`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });
    console.log('Request Body:', JSON.stringify(invoiceData, null, 2));

    const response = await axios.post(
      `${INVOICE_API_URL}/services/einvoiceapplication/api/InvoiceAPI/InvoiceWS/createInvoiceUsbTokenGetHash/${INVOICE_USERNAME}`,
      invoiceData,
      {
        headers: {
          'Cookie': `access_token=${accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );

    console.log('Response:', JSON.stringify(response.data, null, 2));

    if (!response.data?.result?.hashString) {
      console.error('No hash string in response:', response.data);
      throw new Error('Invalid response format - missing hash string');
    }

    return {
      success: true,
      data: response.data
    };
  } catch (error: any) {
    console.error('\n❌ Invoice Creation Failed:', error.message);
    if (error.response) {
      console.error('Response Status:', error.response.status);
      console.error('Response Data:', error.response.data);
      
      // If token expired (usually 401 or specific error message)
      if (error.response.status === 401 || 
          (error.response.data?.message && error.response.data.message.includes('token'))) {
        throw new Error('Token expired');
      }
    }
    return {
      success: false,
      error: error.message,
    //   details: error.response?.data
    };
  }
};


