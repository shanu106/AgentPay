const { foodOrders, placedOrders, getAllDishesAsProducts } = require('../data/restaurants.data');
const { razorpay } = require('../config/razorpay');

const createOrder = async (req, res) => {
  try {
    const { productId, quantity = 1, items, customerName = 'Student Foodie', customerEmail = 'student@example.com' } = req.body;
    const products = getAllDishesAsProducts();

    let totalAmount = 0;
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
            price: prod.price,
            unitPrice: prod.price,
            quantity: q,
            lineTotal: prod.price * q,
            restaurantName: prod.subcategory || prod.restaurant?.name
          });
        }
      }
      orderTitle = orderItems.map(i => `${i.quantity}x ${i.title}`).join(', ');
    } else if (productId) {
      const product = products.find(p => p.id === productId);
      if (!product) {
        return res.status(404).json({ success: false, message: 'Dish product not found' });
      }
      const qty = Math.max(1, parseInt(quantity, 10) || 1);
      totalAmount = product.price * qty;
      orderItems.push({
        id: product.id,
        productId: product.id,
        title: product.title,
        price: product.price,
        unitPrice: product.price,
        quantity: qty,
        lineTotal: totalAmount,
        restaurantName: product.subcategory || product.restaurant?.name
      });
      orderTitle = `${qty > 1 ? qty + 'x ' : ''}${product.title}`;
    }

    if (orderItems.length === 0 || totalAmount <= 0) {
      return res.status(400).json({ success: false, message: 'No valid dishes in order.' });
    }

    const rzpOrder = await razorpay.orders.create({
      amount: totalAmount * 100,
      currency: 'INR',
      receipt: `zom_agent_${Date.now().toString().slice(-8)}`,
      notes: {
        orderTitle: orderTitle.slice(0, 100),
        itemCount: orderItems.length,
        customerName
      }
    });

    const orderId = `ORD-ZOM-${Math.floor(100000 + Math.random() * 900000)}`;

    const orderRecord = {
      orderId,
      razorpayOrderId: rzpOrder.id,
      amount: totalAmount,
      currency: 'INR',
      quantity: orderItems.reduce((acc, i) => acc + i.quantity, 0),
      productTitle: orderTitle,
      items: orderItems,
      status: 'created',
      createdAt: new Date().toISOString()
    };

    foodOrders[orderId] = orderRecord;
    foodOrders[rzpOrder.id] = orderRecord;

    res.json({
      success: true,
      orderId,
      amount: totalAmount,
      quantity: orderRecord.quantity,
      currency: 'INR',
      status: 'created',
      productTitle: orderTitle,
      items: orderItems,
      razorpayOrderId: rzpOrder.id,
      razorpayKey: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    console.error('Zomato Agent Order Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to create order' });
  }
};

const verifyOrder = async (req, res) => {
  try {
    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
    const key = orderId || razorpayOrderId;
    const orderData = foodOrders[key] || {
      orderId: key,
      amount: 698,
      productTitle: 'Hyderabadi Chicken Dum Biryani'
    };

    orderData.status = 'paid';
    orderData.paymentId = razorpayPaymentId || `pay_mock_${Date.now()}`;
    orderData.verifiedAt = new Date().toISOString();

    res.json({
      success: true,
      orderId: orderData.orderId,
      razorpayOrderId: orderData.razorpayOrderId || razorpayOrderId,
      paymentStatus: 'paid',
      orderStatus: 'confirmed',
      courseTitle: orderData.productTitle,
      amount: orderData.amount,
      currency: 'INR',
      paymentId: orderData.paymentId
    });
  } catch (error) {
    console.error('Zomato Order Verification Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to verify order' });
  }
};

const getOrderById = (req, res) => {
  const order = foodOrders[req.params.id];
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }
  res.json({ success: true, order });
};

const getOrderStatus = (req, res) => {
  const order = foodOrders[req.params.id];
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
  res.json({ success: true, count: placedOrders.length, orders: placedOrders });
};

module.exports = {
  createOrder,
  verifyOrder,
  getOrderById,
  getOrderStatus,
  listOrders
};
