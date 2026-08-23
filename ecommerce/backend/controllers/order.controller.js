const { products, orders, completedPurchases } = require('../data/products.data');
const { razorpay } = require('../config/razorpay');

const createOrder = async (req, res) => {
  try {
    const { courseId, productId, quantity = 1, items, customerName = 'Store Customer', customerEmail = 'customer@example.com' } = req.body;
    
    let totalAmount = 0; // in paise
    let orderTitle = '';
    const orderItems = [];

    if (items && Array.isArray(items) && items.length > 0) {
      for (const itm of items) {
        const prod = products.find(p => p.id === (itm.productId || itm.id));
        if (prod) {
          const q = Math.max(1, parseInt(itm.quantity, 10) || 1);
          totalAmount += prod.price * q;
          orderItems.push({
            id: prod.id,
            productId: prod.id,
            title: prod.title,
            price: prod.price / 100,
            unitPrice: prod.price / 100,
            quantity: q,
            lineTotal: (prod.price * q) / 100
          });
        }
      }
      orderTitle = orderItems.map(i => `${i.quantity}x ${i.title}`).join(', ');
    } else {
      const targetId = productId || courseId;
      const prod = products.find(p => p.id === targetId);
      if (!prod) {
        return res.status(404).json({ success: false, message: `Product not found: ${targetId}` });
      }
      const q = Math.max(1, parseInt(quantity, 10) || 1);
      totalAmount = prod.price * q;
      orderItems.push({
        id: prod.id,
        productId: prod.id,
        title: prod.title,
        price: prod.price / 100,
        unitPrice: prod.price / 100,
        quantity: q,
        lineTotal: (prod.price * q) / 100
      });
      orderTitle = `${q > 1 ? q + 'x ' : ''}${prod.title}`;
    }

    if (orderItems.length === 0 || totalAmount <= 0) {
      return res.status(400).json({ success: false, message: 'No valid products in order.' });
    }

    const options = {
      amount: totalAmount, // in paise
      currency: 'INR',
      receipt: `rcpt_nova_${Date.now().toString().slice(-8)}`,
      notes: {
        orderTitle: orderTitle.slice(0, 100),
        itemCount: orderItems.length,
        customerName,
        customerEmail,
        merchant: 'NovaStore'
      }
    };

    const rzpOrder = await razorpay.orders.create(options);

    orders[rzpOrder.id] = {
      orderId: rzpOrder.id,
      amount: totalAmount / 100,
      currency: rzpOrder.currency,
      quantity: orderItems.reduce((acc, i) => acc + i.quantity, 0),
      productTitle: orderTitle,
      items: orderItems,
      customerName,
      customerEmail,
      status: 'created',
      createdAt: new Date().toISOString()
    };

    res.json({
      success: true,
      orderId: rzpOrder.id,
      amount: totalAmount / 100,
      quantity: orderItems.reduce((acc, i) => acc + i.quantity, 0),
      currency: 'INR',
      status: 'created',
      productTitle: orderTitle,
      items: orderItems,
      razorpayOrderId: rzpOrder.id,
      razorpayKey: process.env.RAZORPAY_KEY_ID,
      order: {
        id: rzpOrder.id,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency,
        key: process.env.RAZORPAY_KEY_ID,
        productTitle: orderTitle,
        items: orderItems
      }
    });
  } catch (error) {
    console.error('Create Razorpay Order Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to create order' });
  }
};

const getOrderById = (req, res) => {
  const order = orders[req.params.id];
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }
  res.json({ success: true, order });
};

const getOrderStatus = (req, res) => {
  const order = orders[req.params.id];
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }
  res.json({
    success: true,
    orderId: order.orderId,
    status: order.status,
    amount: order.amount,
    paymentId: order.paymentId
  });
};

const listOrders = (req, res) => {
  res.json({ success: true, count: completedPurchases.length, orders: completedPurchases });
};

module.exports = {
  createOrder,
  getOrderById,
  getOrderStatus,
  listOrders
};
