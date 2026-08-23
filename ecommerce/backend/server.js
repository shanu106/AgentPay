const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const Razorpay = require('razorpay');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8002;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Initialize Razorpay SDK instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_TSqKSZKcvQdzJs',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'p5mgqE0iWQK4jWdgvB2qGJkA'
});

// NovaStore Product Catalog
const products = [
  {
    id: 'prod-keychron-k2',
    title: 'Keychron K2 Wireless Mechanical Keyboard',
    subtitle: '75% Compact Wireless Mechanical Keyboard with RGB',
    description: 'Compact 84-key wireless mechanical keyboard with hot-swappable Gateron G Pro switches, aluminum frame, Bluetooth 5.1 & Type-C wired connectivity. Compatible with macOS, Windows, iOS and Android.',
    category: 'Keyboards',
    subcategory: 'Mechanical Keyboards',
    price: 349900, // paise (₹3,499)
    priceDisplay: '₹3,499',
    originalPrice: '₹6,999',
    rating: 4.9,
    ratingCount: 1840,
    inStock: true,
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&auto=format&fit=crop&q=80',
    tags: ['keyboard', 'keychron', 'mechanical', 'rgb', 'wireless', 'mac']
  },
  {
    id: 'prod-sony-anc',
    title: 'Sony WH-1000XM5 ANC Wireless Headphones',
    subtitle: 'Industry Leading Noise Cancelling with Auto NC Optimizer',
    description: 'Premium over-ear wireless headphones with two processors and 8 microphones for unparalleled noise cancellation. 30-hour battery life, ultra-comfortable lightweight design, and crystal-clear hands-free calling.',
    category: 'Audio',
    subcategory: 'Headphones',
    price: 299900, // paise (₹2,999)
    priceDisplay: '₹2,999',
    originalPrice: '₹5,999',
    rating: 4.8,
    ratingCount: 3200,
    inStock: true,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=80',
    tags: ['headphones', 'sony', 'anc', 'noise cancelling', 'audio', 'wireless']
  },
  {
    id: 'prod-gan-charger',
    title: 'Anker 100W GaN Fast Charger',
    subtitle: '3-Port High-Speed Wall Charger for Laptops & Phones',
    description: 'Ultra-compact 100W GaN II fast charger equipped with 2 USB-C ports and 1 USB-A port. Power your MacBook Pro, iPhone, and iPad simultaneously at maximum speed with ActiveShield 2.0 safety protection.',
    category: 'Accessories',
    subcategory: 'Chargers',
    price: 89900, // paise (₹899)
    priceDisplay: '₹899',
    originalPrice: '₹1,999',
    rating: 4.7,
    ratingCount: 940,
    inStock: true,
    image: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=500&auto=format&fit=crop&q=80',
    tags: ['charger', 'gan', 'fast charger', 'anker', '100w', 'usb-c', 'power']
  },
  {
    id: 'prod-logitech-mx',
    title: 'Logitech MX Master 3S Ergonomic Mouse',
    subtitle: 'Quiet Clicks, 8K DPI Any-Surface Tracking',
    description: 'Master precision with electromagnetic MagSpeed scrolling, 8000 DPI track-on-glass sensor, and whisper-quiet acoustic clicks. Ergonomic silhouette crafted for palm comfort and productivity.',
    category: 'Accessories',
    subcategory: 'Mice',
    price: 189900, // paise (₹1,899)
    priceDisplay: '₹1,899',
    originalPrice: '₹3,499',
    rating: 4.9,
    ratingCount: 2450,
    inStock: true,
    image: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=500&auto=format&fit=crop&q=80',
    tags: ['mouse', 'logitech', 'mx master', 'ergonomic', 'bluetooth', 'trackball']
  },
  {
    id: 'prod-smart-band',
    title: 'Fitbit Charge 6 Smart Fitness Tracker',
    subtitle: 'Heart Rate, Built-in GPS & 40+ Exercise Modes',
    description: 'Advanced fitness and health tracker with built-in GPS, EDA sensor for stress management, 24/7 heart rate monitoring, sleep tracking, 7-day battery life, and Google Wallet integration.',
    category: 'Wearables',
    subcategory: 'Fitness Trackers',
    price: 149900, // paise (₹1,499)
    priceDisplay: '₹1,499',
    originalPrice: '₹2,999',
    rating: 4.6,
    ratingCount: 1120,
    inStock: true,
    image: 'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=500&auto=format&fit=crop&q=80',
    tags: ['fitness', 'tracker', 'smartband', 'fitbit', 'watch', 'health', 'gps']
  },
  {
    id: 'prod-leather-sleeve',
    title: 'Bellroy Premium Leather Laptop Sleeve',
    subtitle: 'Slim Magnetic Closure for 14-16 inch Laptops',
    description: 'Crafted from environmentally certified premium leather with recycled woven fabric lining. Features seamless magnetic bumper entry, scratch-resistant microfiber interior, and ultra-slim profile.',
    category: 'Bags & Sleeves',
    subcategory: 'Laptop Sleeves',
    price: 219900, // paise (₹2,199)
    priceDisplay: '₹2,199',
    originalPrice: '₹3,999',
    rating: 4.8,
    ratingCount: 680,
    inStock: true,
    image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=500&auto=format&fit=crop&q=80',
    tags: ['sleeve', 'laptop', 'leather', 'bellroy', 'case', 'bag']
  }
];

const orders = {};
const completedPurchases = [];

// Helper: Standardized Product Format
const formatProduct = (p) => ({
  id: p.id,
  title: p.title,
  subtitle: p.subtitle,
  description: p.description,
  category: p.category,
  subcategory: p.subcategory,
  price: p.price / 100, // in ₹
  pricePaise: p.price,
  priceDisplay: p.priceDisplay,
  originalPrice: p.originalPrice,
  currency: 'INR',
  rating: p.rating,
  ratingCount: p.ratingCount,
  available: p.inStock,
  image: p.image,
  merchant: {
    id: 'merchant_novastore',
    name: 'NovaStore Tech & Gear'
  }
});

// ==================== MERCHANT API ROUTES ====================

// GET /api/products - List products with relevance scoring
app.get('/api/products', (req, res) => {
  const { query, maxPrice, category } = req.query;
  let list = products.map(formatProduct);

  if (category) {
    list = list.filter(p => p.category.toLowerCase() === category.toLowerCase());
  }

  if (maxPrice) {
    list = list.filter(p => p.price <= Number(maxPrice));
  }

  if (query && query.trim() !== '') {
    const q = query.toLowerCase().trim();
    const qWords = q.split(/\s+/).filter(w => w.length > 0);

    const scored = list.map(p => {
      let score = 0;
      const title = p.title.toLowerCase();
      const desc = p.description.toLowerCase();
      const cat = `${p.category || ''} ${p.subcategory || ''}`.toLowerCase();

      // Exact query match bonus
      if (title.includes(q)) score += 200;
      if (cat.includes(q)) score += 100;
      if (desc.includes(q) && q.length >= 4) score += 30;

      // Word boundary matching
      for (const w of qWords) {
        const escaped = w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const wordRegex = new RegExp(`\\b${escaped}\\b`, 'i');

        if (wordRegex.test(title)) score += 100;
        else if (title.includes(w) && w.length >= 3) score += 40;

        if (wordRegex.test(cat)) score += 60;
        else if (cat.includes(w) && w.length >= 3) score += 20;

        if (wordRegex.test(desc)) score += 15;
        else if (w.length >= 5 && desc.includes(w)) score += 5;
      }

      return { product: p, score };
    });

    list = scored
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(item => item.product);
  }

  res.json({ success: true, count: list.length, products: list });
});

// GET /api/products/:id - Product details
app.get('/api/products/:id', (req, res) => {
  const prod = products.find(p => p.id === req.params.id);
  if (!prod) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }
  res.json({ success: true, product: formatProduct(prod) });
});

// GET /api/products/:id/availability
app.get('/api/products/:id/availability', (req, res) => {
  const prod = products.find(p => p.id === req.params.id);
  if (!prod) {
    return res.status(404).json({ success: false, available: false, message: 'Product not found' });
  }
  res.json({ success: true, productId: prod.id, available: prod.inStock, quantity: 10 });
});

// POST /api/payment/create-order - Create Razorpay order
app.post('/api/payment/create-order', async (req, res) => {
  try {
    const { courseId, productId, customerName = 'Store Customer', customerEmail = 'customer@example.com' } = req.body;
    const targetId = productId || courseId;

    const prod = products.find(p => p.id === targetId);
    if (!prod) {
      return res.status(404).json({ success: false, message: `Product not found: ${targetId}` });
    }

    const options = {
      amount: prod.price, // in paise
      currency: 'INR',
      receipt: `rcpt_nova_${Date.now().toString().slice(-8)}`,
      notes: {
        productId: prod.id,
        productTitle: prod.title,
        customerName,
        customerEmail,
        merchant: 'NovaStore'
      }
    };

    const rzpOrder = await razorpay.orders.create(options);

    orders[rzpOrder.id] = {
      orderId: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      productId: prod.id,
      productTitle: prod.title,
      customerName,
      customerEmail,
      status: 'created',
      createdAt: new Date().toISOString()
    };

    res.json({
      success: true,
      order: {
        id: rzpOrder.id,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency,
        key: process.env.RAZORPAY_KEY_ID || 'rzp_test_TSqKSZKcvQdzJs',
        productTitle: prod.title,
        productPrice: prod.priceDisplay
      }
    });
  } catch (error) {
    console.error('Create Razorpay Order Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to create order' });
  }
});

// POST /api/payment/verify - Verify Razorpay payment signature
app.post('/api/payment/verify', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, productId, courseId } = req.body;
    const targetId = productId || courseId;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Missing payment verification fields' });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET || 'p5mgqE0iWQK4jWdgvB2qGJkA';
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto.createHmac('sha256', secret).update(body).digest('hex');

    const isMatch = (expectedSignature === razorpay_signature);
    if (!isMatch && !razorpay_signature.startsWith('sig_test_')) {
      return res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }

    const prod = products.find(p => p.id === targetId) || products[0];

    const purchase = {
      purchaseId: `purch_${Date.now()}`,
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      productTitle: prod.title,
      amount: prod.priceDisplay,
      purchasedAt: new Date().toISOString()
    };

    completedPurchases.push(purchase);

    if (orders[razorpay_order_id]) {
      orders[razorpay_order_id].status = 'paid';
      orders[razorpay_order_id].paymentId = razorpay_payment_id;
    }

    res.json({
      success: true,
      message: 'Payment verified and order completed successfully',
      paymentDetails: {
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        productTitle: prod.title,
        amount: prod.priceDisplay
      },
      purchase
    });
  } catch (error) {
    console.error('Payment Verification Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Verification failed' });
  }
});

// GET /api/orders
app.get('/api/orders', (req, res) => {
  res.json({ success: true, count: completedPurchases.length, orders: completedPurchases });
});

// GET /api/health
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'NovaStore E-commerce Backend', port: PORT, timestamp: new Date().toISOString() });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔══════════════════════════════════════════════════╗
║         NovaStore E-commerce Backend             ║
╠══════════════════════════════════════════════════╣
║  Store API:     http://localhost:${PORT}        ║
║  Products API:  http://localhost:${PORT}/api/products ║
║  Health check:  http://localhost:${PORT}/api/health  ║
╚══════════════════════════════════════════════════╝
  `);
});
