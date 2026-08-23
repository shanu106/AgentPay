require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 8001,
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID ,
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET ,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  GMAIL_USER: process.env.GMAIL_USER || '',
  GMAIL_APP_PASSWORD: process.env.GMAIL_APP_PASSWORD || '',
  MERCHANT_API_BASE: process.env.MERCHANT_API_BASE || 'http://localhost:8000/api'
};
