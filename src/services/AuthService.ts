import jwt, { SignOptions } from 'jsonwebtoken';
import { JWTPayload, LoginRequest, LoginResponse } from '../types/AuthTypes';
import dotenv from 'dotenv';
dotenv.config();
const adminUsername: string = process.env.ADMIN_USERNAME || 'admin@interits.com';
const adminPassword: string = process.env.ADMIN_PASSWORD || 'admin@interits.com';
const jwtSecret: string = process.env.JWT_SECRET || 'admin@interits.com';
const jwtExpiresIn: string = process.env.JWT_EXPIRES_IN || '24h';

export const login = async (credentials: LoginRequest): Promise<LoginResponse> => {
  try {
    if (!adminUsername || !adminPassword || !jwtSecret) {
      throw new Error('Missing environment variables');
    }

    if (
      credentials.username !== adminUsername ||
      credentials.password !== adminPassword
    ) {
      return {
        success: false,
        error: 'Invalid credentials'
      };
    }

    // Generate JWT token
    const token = jwt.sign(
      { username: credentials.username || 'admin@interits.com' } as JWTPayload,
      jwtSecret as string,
      { expiresIn: jwtExpiresIn } as SignOptions
    );

    return {
      success: true,
      token
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
};
