import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// const mailHost = process.env.MAIL_HOST;
// const port = process.env.MAIL_PORT;
const username = process.env.MAIL_USERNAME;
const password = process.env.MAIL_PASSWORD;

console.log(username + '\n' + password);

export const transporter = nodemailer.createTransport({
    host: 'smtp.eu.mailgun.org',
    port: 465,
  //   secure: true,
    auth: {
      user: process.env.MAIL_USERNAME,
      pass: process.env.MAIL_PASSWORD
    },
    debug: true,
    logger: true
  });