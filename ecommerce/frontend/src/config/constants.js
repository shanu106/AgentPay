export const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8002/api';
export const AGENT_SDK_URL = import.meta.env.VITE_AGENT_SDK_URL || 'http://localhost:8001/sdk/razorpay-agent.js';
export const AGENT_API_URL = import.meta.env.VITE_AGENT_API_URL || 'http://localhost:8001/api/agent';

export const CATEGORIES = [
  'All',
  'Keyboards',
  'Audio',
  'Accessories',
  'Wearables',
  'Bags & Sleeves'
];

export const STORE_CONFIG = {
  name: import.meta.env.VITE_APP_TITLE || 'NovaStore',
  tagline: 'Next-Gen Tech & Gear',
  brandColor: '#0284c7'
};
