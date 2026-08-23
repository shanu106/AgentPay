const Razorpay = require('razorpay');
require('dotenv').config();

const PORT = process.env.PORT || 8000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

module.exports = {
  PORT,
  CLIENT_URL,
  razorpay
};
