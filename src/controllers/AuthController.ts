import { Request, Response } from 'express';
import { login } from '../services/AuthService';

export const handleLogin = async (req: Request, res: Response) => {
  try {
    const result = await login(req.body);
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(401).json(result);
    }
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const handleLogout = async (req: Request, res: Response) => {
  // Since we're using JWT, we don't need server-side logout
  // The client should simply remove the token
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
}; 