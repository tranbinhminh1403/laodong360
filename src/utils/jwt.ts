import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

const API_KEY = process.env.API_KEY;
const SECRET_KEY = process.env.SECRET_KEY;

if (!API_KEY || !SECRET_KEY) {
    throw new Error('API_KEY and SECRET_KEY must be defined in environment variables');
}

// console.log(API_KEY, SECRET_KEY)

// Hàm mã hóa HMAC
function hmacEncode(data: string, key: string): string {
    const hmac = crypto.createHmac('sha256', key);
    hmac.update(data);
    return hmac.digest('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
}

// Hàm tạo JWT token
export function generateJWTToken(apiKey: string, secretKey: string): string {
    // Tạo header
    const header = {
        typ: 'JWT',
        alg: 'HS256'
    };
    const base64UrlHeader = Buffer.from(JSON.stringify(header))
        .toString('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');

    // Tạo payload
    const timeSecs = Math.floor(Date.now() / 1000);
    const payload = {
        iat: timeSecs,
        iss: apiKey,
        exp: timeSecs + 600 // Thêm 600 giây (10 phút) cho thời gian hết hạn
    };
    const base64UrlPayload = Buffer.from(JSON.stringify(payload))
        .toString('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');

    try {
        // Tạo signature
        const signature = hmacEncode(`${base64UrlHeader}.${base64UrlPayload}`, secretKey);
        return `${base64UrlHeader}.${base64UrlPayload}.${signature}`;
    } catch (error: any) {
        throw new Error(`Unable to generate a JWT token: ${error.message}`);
    }
}

// Hàm set key (nếu cần)
export function setApiCredentials(key: string, secret: string): void {
    process.env.API_KEY = key;
    process.env.SECRET_KEY = secret;
}

// Sử dụng
// const jwt = getJwtBaoKim('your_api_key', 'your_secret_key');

console.log(generateJWTToken(API_KEY, SECRET_KEY))