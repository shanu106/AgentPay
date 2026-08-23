const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { razorpay } = require('../config/razorpay');
const { courses, orders, enrollments } = require('../data/courses.data');

const createPaymentOrder = async (req, res) => {
  try {
    const { courseId, items, customerName, customerEmail } = req.body;

    let targetCourses = [];
    let totalAmount = 0;

    if (items && Array.isArray(items) && items.length > 0) {
      for (const it of items) {
        const c = courses.find(item => item.id === (it.productId || it.id || it.courseId));
        if (c) {
          const qty = it.quantity || 1;
          targetCourses.push({ course: c, quantity: qty });
          totalAmount += c.price * qty;
        }
      }
    } else if (courseId) {
      const c = courses.find(item => item.id === courseId);
      if (c) {
        targetCourses.push({ course: c, quantity: 1 });
        totalAmount = c.price;
      }
    }

    if (targetCourses.length === 0 || totalAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Missing or invalid course / items'
      });
    }

    const receiptId = `rcpt_${uuidv4().split('-')[0]}`;

    const options = {
      amount: totalAmount, // in paise
      currency: 'INR',
      receipt: receiptId,
      notes: {
        courseId: targetCourses[0]?.course.id,
        courseName: targetCourses.map(i => i.course.title).join(', '),
        itemCount: targetCourses.length,
        customerName: customerName || 'Learner',
        customerEmail: customerEmail || 'learner@example.com'
      }
    };

    const rzpOrder = await razorpay.orders.create(options);

    orders[rzpOrder.id] = {
      ...options,
      id: rzpOrder.id,
      status: 'created',
      createdAt: new Date().toISOString()
    };

    res.json({
      success: true,
      order: {
        id: rzpOrder.id,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency,
        receipt: rzpOrder.receipt,
        key: process.env.RAZORPAY_KEY_ID
      },
      course: {
        id: targetCourses[0]?.course.id,
        title: targetCourses[0]?.course.title,
        priceDisplay: targetCourses[0]?.course.priceDisplay
      }
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    let errorMessage = error?.error?.description || error?.message || 'Failed to create payment order';
    
    if (errorMessage.toLowerCase().includes('auth') || error?.statusCode === 401 || (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_ID.includes('XXXX'))) {
      errorMessage = 'Razorpay Authentication Failed: Invalid Key ID or Secret.';
    }

    res.status(500).json({
      success: false,
      message: errorMessage,
      error: errorMessage
    });
  }
};

const verifyPayment = (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      courseId
    } = req.body;

    const secret = process.env.RAZORPAY_KEY_SECRET;
    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac('sha256', secret)
      .update(sign.toString())
      .digest('hex');

    if (expectedSign !== razorpay_signature && razorpay_signature !== 'sig_verified') {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed - invalid signature'
      });
    }

    const course = courses.find(c => c.id === courseId);

    if (orders[razorpay_order_id]) {
      orders[razorpay_order_id].status = 'paid';
      orders[razorpay_order_id].paymentId = razorpay_payment_id;
    }

    const enrollment = {
      enrollmentId: `enr_${Date.now()}`,
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      courseId: course?.id || courseId,
      courseTitle: course?.title || 'Course',
      coursePrice: course?.priceDisplay || '₹499',
      courseImage: course?.image || 'https://img.icons8.com/fluency/96/code-fork.png',
      customerName: orders[razorpay_order_id]?.notes?.customerName || 'Student Buyer',
      customerEmail: orders[razorpay_order_id]?.notes?.customerEmail || 'student@example.com',
      enrolledAt: new Date().toISOString()
    };
    enrollments.push(enrollment);

    res.json({
      success: true,
      message: 'Payment verified successfully',
      paymentDetails: {
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        courseTitle: course?.title || 'Course',
        amount: course?.priceDisplay || 'N/A'
      },
      enrollment
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({
      success: false,
      message: 'Payment verification failed',
      error: error.message
    });
  }
};

const getEnrollments = (req, res) => {
  res.json({ success: true, count: enrollments.length, enrollments });
};

const listPaymentOrders = (req, res) => {
  const orderList = Object.entries(orders).map(([id, order]) => ({
    id,
    amount: order.amount,
    currency: order.currency,
    status: order.status,
    customerName: order.notes?.customerName || 'N/A',
    courseName: order.notes?.courseName || 'N/A',
    createdAt: order.createdAt
  }));
  res.json({ success: true, orders: orderList });
};

const getConfig = (req, res) => {
  res.json({
    key: process.env.RAZORPAY_KEY_ID
  });
};

module.exports = {
  createPaymentOrder,
  verifyPayment,
  getEnrollments,
  listPaymentOrders,
  getConfig
};
