const { courses, orders } = require('../data/courses.data');

const createMerchantOrder = (req, res) => {
  const { productId, items, quantity = 1, deliveryAddress, customerName, customerEmail } = req.body;

  let totalAmount = 0;
  let orderedItems = [];

  if (items && Array.isArray(items) && items.length > 0) {
    for (const it of items) {
      const c = courses.find(item => item.id === (it.productId || it.id));
      if (c) {
        const qty = it.quantity || 1;
        const lineTotal = (c.price / 100) * qty;
        totalAmount += lineTotal;
        orderedItems.push({
          productId: c.id,
          title: c.title,
          quantity: qty,
          unitPrice: c.price / 100,
          lineTotal
        });
      }
    }
  } else if (productId) {
    const c = courses.find(item => item.id === productId);
    if (c) {
      const qty = quantity || 1;
      const lineTotal = (c.price / 100) * qty;
      totalAmount = lineTotal;
      orderedItems.push({
        productId: c.id,
        title: c.title,
        quantity: qty,
        unitPrice: c.price / 100,
        lineTotal
      });
    }
  }

  if (orderedItems.length === 0) {
    return res.status(400).json({ success: false, message: 'Invalid items for order' });
  }

  const orderId = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
  const orderRecord = {
    orderId,
    items: orderedItems,
    productTitle: orderedItems.map(i => `${i.quantity}x ${i.title}`).join(', '),
    amount: totalAmount,
    currency: 'INR',
    quantity: orderedItems.reduce((acc, i) => acc + i.quantity, 0),
    deliveryAddress: deliveryAddress || 'Digital Delivery (Online Portal)',
    customerName: customerName || 'Learner',
    customerEmail: customerEmail || 'learner@example.com',
    status: 'created',
    createdAt: new Date().toISOString()
  };

  orders[orderId] = orderRecord;

  res.json({
    success: true,
    orderId,
    amount: totalAmount,
    currency: 'INR',
    quantity: orderRecord.quantity,
    items: orderedItems,
    productTitle: orderRecord.productTitle,
    order: orderRecord
  });
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

module.exports = {
  createMerchantOrder,
  getOrderById,
  getOrderStatus
};
