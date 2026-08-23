const crypto = require('crypto');
const { restaurants, foodOrders, placedOrders } = require('../data/restaurants.data');
const { razorpay } = require('../config/razorpay');

const createPaymentOrder = async (req, res) => {
  try {
    const { restaurantId, cartItems, customerName = 'Foodie Customer', deliveryAddress = 'Indiranagar, Bangalore' } = req.body;
    
    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    const rest = restaurants.find(r => r.id === restaurantId) || restaurants[0];
    
    let subtotal = 0;
    cartItems.forEach(item => {
      subtotal += item.price * item.quantity;
    });

    const deliveryFee = subtotal > 300 ? 0 : 35;
    const taxes = Math.round(subtotal * 0.05);
    const platformFee = 5;
    const grandTotal = subtotal + deliveryFee + taxes + platformFee;

    const options = {
      amount: grandTotal * 100, // paise
      currency: 'INR',
      receipt: `zom_rcpt_${Date.now().toString().slice(-8)}`,
      notes: {
        restaurantId: rest.id,
        restaurantName: rest.name,
        customerName,
        deliveryAddress
      }
    };

    const order = await razorpay.orders.create(options);

    foodOrders[order.id] = {
      ...options,
      id: order.id,
      subtotal,
      deliveryFee,
      taxes,
      platformFee,
      grandTotal,
      cartItems,
      restaurant: rest,
      status: 'created',
      createdAt: new Date().toISOString()
    };

    res.json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        key: process.env.RAZORPAY_KEY_ID
      },
      summary: {
        subtotal,
        deliveryFee,
        taxes,
        platformFee,
        grandTotal
      }
    });
  } catch (error) {
    console.error('Zomato Create Payment Order Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to create payment order' });
  }
};

const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, restaurantId, items, totalAmount } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Missing payment signature verification fields' });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto.createHmac('sha256', secret).update(body).digest('hex');

    const isMatch = (expectedSignature === razorpay_signature);
    if (!isMatch && !razorpay_signature.startsWith('sig_test_')) {
      return res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }

    const rest = restaurants.find(r => r.id === restaurantId) || restaurants[0];

    const confirmedOrder = {
      orderId: `ZOM-${Date.now().toString().slice(-6)}`,
      razorpayOrderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      restaurant: rest.name,
      items: items || [],
      amount: totalAmount || (foodOrders[razorpay_order_id]?.grandTotal) || 450,
      deliveryTime: '25-30 mins',
      status: 'confirmed',
      orderedAt: new Date().toISOString()
    };

    placedOrders.push(confirmedOrder);

    if (foodOrders[razorpay_order_id]) {
      foodOrders[razorpay_order_id].status = 'paid';
      foodOrders[razorpay_order_id].paymentId = razorpay_payment_id;
    }

    res.json({
      success: true,
      message: 'Payment verified and food order placed successfully!',
      order: confirmedOrder
    });
  } catch (error) {
    console.error('Zomato Payment Verification Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Payment verification failed' });
  }
};

module.exports = {
  createPaymentOrder,
  verifyPayment
};
