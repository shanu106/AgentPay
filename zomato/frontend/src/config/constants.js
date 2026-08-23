export const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8003/api';
export const AGENT_SDK_URL = import.meta.env.VITE_AGENT_SDK_URL || 'http://localhost:8001/sdk/razorpay-agent.js';
export const AGENT_API_URL = import.meta.env.VITE_AGENT_API_URL || 'http://localhost:8001/api/agent';

export const CUISINES = [
  { name: 'Biryani', image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=200&auto=format&fit=crop&q=80' },
  { name: 'Pizza', image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=200&auto=format&fit=crop&q=80' },
  { name: 'Burgers', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&auto=format&fit=crop&q=80' },
  { name: 'Waffles', image: 'https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=200&auto=format&fit=crop&q=80' },
  { name: 'North Indian', image: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=200&auto=format&fit=crop&q=80' },
  { name: 'Chinese', image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=200&auto=format&fit=crop&q=80' },
  { name: 'Rolls', image: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=200&auto=format&fit=crop&q=80' },
  { name: 'Desserts', image: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=200&auto=format&fit=crop&q=80' }
];

export const DEFAULT_DELIVERY_ADDRESS = import.meta.env.VITE_DEFAULT_DELIVERY_ADDRESS || '100 Feet Rd, Indiranagar, Bangalore';
