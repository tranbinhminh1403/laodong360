import axios from 'axios';
import { ContactCenterCreateCustomer, ContactCenterCreateResponse, ContactCenterCreateTicket, ContactCenterLoginResponse } from '../types/Types';

let accessToken: string | null = null;

const getAccessToken = async (): Promise<string> => {
  if (!accessToken) {
    const loginResponse = await contactCenterLogin();
    accessToken = loginResponse.access_token;
  }
  return accessToken;
};

export const contactCenterLogin = async (): Promise<ContactCenterLoginResponse> => {
  try {
    console.log('Attempting Contact Center login with URL:', process.env.CONTACT_CENTER_API_URL);
    console.log('Using email:', process.env.CONTACT_CENTER_ACCOUNT_EMAIL);
    console.log('Using password:', process.env.CONTACT_CENTER_ACCOUNT_PASSWORD);
    
    if (!process.env.CONTACT_CENTER_API_URL || !process.env.CONTACT_CENTER_ACCOUNT_EMAIL || !process.env.CONTACT_CENTER_ACCOUNT_PASSWORD) {
      throw new Error('Missing Contact Center configuration');
    }

    const response = await axios.post(`${process.env.CONTACT_CENTER_API_URL}/login`, {
      email: process.env.CONTACT_CENTER_ACCOUNT_EMAIL,
      password: process.env.CONTACT_CENTER_ACCOUNT_PASSWORD
    });

    if (!response.data || !response.data.access_token) {
      console.error('Invalid login response:', response.data);
      throw new Error('Invalid login response structure');
    }

    console.log('Contact Center login successful with status:', response.status);
    return response.data;
  } catch (error: any) {
    console.error('Contact Center login failed:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers
      }
    });
    throw error;
  }
};

export const createContactCenterCustomer = async (customerData: ContactCenterCreateCustomer): Promise<ContactCenterCreateResponse> => {
  try {
    console.log('Creating Contact Center customer:', customerData);
    const token = await getAccessToken();
    const response = await axios.post(
      `${process.env.CONTACT_CENTER_API_URL}/clients`, 
      customerData,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    console.log('Customer created successfully');
    return response.data;
  } catch (error: any) {
    console.error('Create customer failed:', error.response?.data || error.message);
    throw error;
  }
};

export const getCustomerId = async (customerData: ContactCenterCreateCustomer): Promise<ContactCenterCreateResponse> => {
  try {
    const token = await getAccessToken();
    const response = await axios.get(`${process.env.CONTACT_CENTER_API_URL}/contacts?q=${customerData.phonenumber}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const createContactCenterTicket = async (ticketData: ContactCenterCreateTicket): Promise<ContactCenterCreateResponse> => {
  try {
    const token = await getAccessToken();
    const response = await axios.post(
      `${process.env.CONTACT_CENTER_API_URL}/tickets`, 
      ticketData,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const getCustomerByPhone = async (phoneNumber: string): Promise<number | null> => {
  try {
    const token = await getAccessToken();
    const response = await axios.get(
      `${process.env.CONTACT_CENTER_API_URL}/contacts?q=${phoneNumber}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (response.data?.data?.[0]?.id) {
      return response.data.data[0].id;
    }
    return null;
  } catch (error: any) {
    console.error('Failed to get customer by phone:', error.message);
    return null;
  }
};
