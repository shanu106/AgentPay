export const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';
export const MERCHANT_DEFAULT_URL = import.meta.env.VITE_MERCHANT_DEFAULT_URL || 'http://localhost:8000/api';
export const APP_TITLE = import.meta.env.VITE_APP_TITLE || 'Razorpay Autonomous Buyer Agent';

export const EXAMPLE_QUERIES = [
  {
    label: '⚡ JavaScript Mastery (Price upto ₹500)',
    query: 'Buy me a JavaScript mastery course of price upto 500'
  },
  {
    label: '⭐ Benchmark Demo: Buy DSA Course up to ₹10,000',
    query: 'Buy me a DSA course up to ₹10,000 with good ratings'
  },
  {
    label: '🐍 Python for Data Science (Under ₹1,000)',
    query: 'Buy me a Python Data Science course under ₹1,000'
  },
  {
    label: '⚛️ React & Modern Web Dev (Under ₹800)',
    query: 'Buy me a React & modern web dev course under ₹800'
  },
  {
    label: '🛡️ Test Security: DSA Course under ₹3,000 (Expect Auth Denied)',
    query: 'Buy me a DSA course up to ₹3,000'
  }
];

export const DEFAULT_SAVED_PAYMENT = {
  enabled: true,
  type: 'card',
  brand: 'Visa (Domestic)',
  cardNumber: '4100 2800 0000 1007',
  last4: '1007',
  expiry: '12/28',
  holder: 'Student Buyer',
  autoDebitLimit: 15000
};
