import dotenv from 'dotenv';
import { generateJWTToken } from '../utils/jwt';

// Load biến môi trường
dotenv.config();

async function testJWTGeneration() {
    try {
        // Lấy API_KEY và SECRET_KEY từ biến môi trường
        const apiKey = process.env.API_KEY;
        const secretKey = process.env.SECRET_KEY;

        if (!apiKey || !secretKey) {
            throw new Error('API_KEY và SECRET_KEY phải được định nghĩa trong file .env');
        }

        console.log('=== Bắt đầu test tạo JWT token ===');
        console.log('API Key:', apiKey);
        console.log('Secret Key:', secretKey);

        // Tạo JWT token
        const jwtToken = generateJWTToken(apiKey, secretKey);
        
        console.log('\nJWT Token được tạo thành công:');
        console.log(jwtToken);

        // Phân tích token
        const [header, payload, signature] = jwtToken.split('.');
        console.log('\nPhân tích JWT Token:');
        console.log('Header:', Buffer.from(header, 'base64').toString());
        console.log('Payload:', Buffer.from(payload, 'base64').toString());
        console.log('Signature length:', signature.length);

        console.log('\n=== Test hoàn thành ===');
    } catch (error: any) {
        console.error('\n=== Test thất bại ===');
        console.error('Lỗi:', error.message);
    }
}

// Chạy test
testJWTGeneration(); 