export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  token?: string;
  error?: string;
}

export interface JWTPayload {
  username: string;
  iat: number;
  exp: number;
} 

