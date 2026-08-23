const Razorpay = require('razorpay');
require('dotenv').config();

const PORT = process.env.PORT || 8003;

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

module.exports = {
  PORT,
  razorpay
};
