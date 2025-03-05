import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// const mailHost = process.env.MAIL_HOST;
// const port = process.env.MAIL_PORT;
const username = process.env.MAIL_USERNAME;
const password = process.env.MAIL_PASSWORD;

console.log(username + '\n' + password);

export const transporter = nodemailer.createTransport({
    host: 'smtp.mailgun.org',
    port: 465,
    secure: true,
    pool: true,
    maxConnections: 5,
    maxMessages: Infinity,
    auth: {
        user: username,
        pass: password
    }
}); 