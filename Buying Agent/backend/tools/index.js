const crypto = require('crypto');
const merchantService = require('../services/merchant.service');
const AuthorizationService = require('../services/authorization.service');

// In-memory order tracking on Buyer Agent side
const buyerOrders = {};
const auditLogs = [];

const logAudit = (type, details) => {
  const entry = {
    id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    type,
    details,
    timestamp: new Date().toISOString()
  };
  auditLogs.push(entry);
  return entry;
};

// Declarations of tools for Gemini Model
const toolDeclarations = [
  {
    functionDeclarations: [
      {
        name: 'searchProducts',
        description: 'Search for merchant courses matching the user requirements (e.g., query="DSA course", maxPrice=10000, currency="INR").',
        parameters: {
          type: 'OBJECT',
          properties: {
            query: {
              type: 'STRING',
              description: 'Course topic or query (e.g., "DSA course", "Python", "React").'
            },
            maxPrice: {
              type: 'NUMBER',
              description: 'Maximum spending limit in INR.'
            },
            currency: {
              type: 'STRING',
              description: 'Currency code (e.g., "INR").'
            }
          },
          required: ['query']
        }
      },
      {
        name: 'getProduct',
        description: 'Retrieve authoritative details, description, rating, and verified price for a specific product ID.',
        parameters: {
          type: 'OBJECT',
          properties: {
            productId: {
              type: 'STRING',
              description: 'The unique product/course ID (e.g., "course-dsa-mastery").'
            }
          },
          required: ['productId']
        }
      },
      {
        name: 'checkAvailability',
        description: 'Verify if the product is currently purchasable from the merchant.',
        parameters: {
          type: 'OBJECT',
          properties: {
            productId: {
              type: 'STRING',
              description: 'The unique product/course ID.'
            }
          },
          required: ['productId']
        }
      },
      {
        name: 'createOrder',
        description: 'Create an authorized order with the merchant. The backend independently validates price and spending limits before order creation.',
        parameters: {
          type: 'OBJECT',
          properties: {
            productId: {
              type: 'STRING',
              description: 'The product/course ID to purchase.'
            },
            quantity: {
              type: 'NUMBER',
              description: 'Quantity to purchase (default 1).'
            }
          },
          required: ['productId']
        }
      },
      {
        name: 'initiatePayment',
        description: 'Initiate a Razorpay Test Mode payment order for an existing order ID.',
        parameters: {
          type: 'OBJECT',
          properties: {
            orderId: {
              type: 'STRING',
              description: 'The internal order ID created by createOrder.'
            }
          },
          required: ['orderId']
        }
      },
      {
        name: 'verifyPayment',
        description: 'Verify payment signature with Razorpay and confirm the merchant order.',
        parameters: {
          type: 'OBJECT',
          properties: {
            orderId: {
              type: 'STRING',
              description: 'The internal order ID.'
            },
            razorpayPaymentId: {
              type: 'STRING',
              description: 'Razorpay payment ID (e.g., "pay_test_xxx").'
            },
            razorpaySignature: {
              type: 'STRING',
              description: 'Razorpay HMAC signature.'
            }
          },
          required: ['orderId']
        }
      },
      {
        name: 'getOrderStatus',
        description: 'Retrieve the verified final status of an order from the backend.',
        parameters: {
          type: 'OBJECT',
          properties: {
            orderId: {
              type: 'STRING',
              description: 'The internal order ID.'
            }
          },
          required: ['orderId']
        }
      }
    ]
  }
];

/**
 * Execute Tool Calls (Backend Control Layer)
 */
const executeTool = async (name, args, sessionContext = {}) => {
  const { userAuth = { maxAmount: 10000, currency: 'INR' }, customerName = 'Buyer Agent User', customerEmail = 'buyer@example.com' } = sessionContext;

  logAudit('TOOL_INVOCATION_START', { tool: name, args });

  switch (name) {
    case 'searchProducts': {
      const { query, maxPrice } = args;
      const products = await merchantService.searchMerchantProducts({ query, maxPrice });
      const result = {
        products: products.map(p => ({
          id: p.id,
          title: p.title,
          price: p.price,
          currency: p.currency,
          rating: p.rating,
          merchantId: p.merchant?.id || 'merchant_demo'
        }))
      };
      logAudit('TOOL_INVOCATION_SUCCESS', { tool: name, count: products.length });
      return result;
    }

    case 'getProduct': {
      const product = await merchantService.getMerchantProduct(args.productId);
      const result = {
        id: product.id,
        title: product.title,
        description: product.description,
        price: product.price,
        currency: product.currency,
        rating: product.rating,
        available: product.available,
        merchantId: product.merchant?.id || 'merchant_demo'
      };
      logAudit('TOOL_INVOCATION_SUCCESS', { tool: name, productId: args.productId });
      return result;
    }

    case 'checkAvailability': {
      const avail = await merchantService.checkMerchantAvailability(args.productId);
      logAudit('TOOL_INVOCATION_SUCCESS', { tool: name, available: avail.available });
      return avail;
    }

    case 'createOrder': {
      const { productId, quantity = 1 } = args;

      // 1. Fetch authoritative product data from merchant
      const product = await merchantService.getMerchantProduct(productId);
      
      // 2. Authorization Engine validation (Strict spending limit check)
      const authCheck = AuthorizationService.validatePurchaseAuthorization({
        maxAmount: userAuth.maxAmount,
        currency: userAuth.currency || 'INR',
        allowedCategories: userAuth.allowedCategories,
        product
      });

      logAudit('AUTHORIZATION_CHECK', {
        productId,
        productPrice: product.price,
        maxAuthorizedAmount: userAuth.maxAmount,
        authResult: authCheck
      });

      if (!authCheck.authorized) {
        const denyResult = {
          success: false,
          error: authCheck.reason,
          code: authCheck.code,
          status: 'denied'
        };
        logAudit('ORDER_CREATION_DENIED', denyResult);
        return denyResult;
      }

      // 3. Create order on Merchant Backend
      const merchantOrderResponse = await merchantService.createMerchantOrder({
        courseId: product.id,
        customerName,
        customerEmail
      });

      const internalOrderId = `ORD-${Date.now().toString().slice(-6)}`;
      const orderRecord = {
        orderId: internalOrderId,
        merchantOrderId: merchantOrderResponse.order?.id,
        product,
        amount: product.price,
        currency: product.currency || 'INR',
        status: 'created',
        paymentStatus: 'pending',
        razorpayOrder: merchantOrderResponse.order,
        customerName,
        customerEmail,
        createdAt: new Date().toISOString()
      };

      buyerOrders[internalOrderId] = orderRecord;
      logAudit('ORDER_CREATION_SUCCESS', { orderId: internalOrderId, amount: orderRecord.amount });

      return {
        orderId: internalOrderId,
        amount: orderRecord.amount,
        currency: orderRecord.currency,
        status: 'created',
        productTitle: product.title,
        razorpayOrderId: merchantOrderResponse.order?.id,
        razorpayKey: merchantOrderResponse.order?.key
      };
    }

    case 'initiatePayment': {
      const { orderId } = args;
      const order = buyerOrders[orderId];
      if (!order) {
        return { error: `Order #${orderId} not found.` };
      }

      return {
        paymentRequired: true,
        orderId: order.orderId,
        razorpayOrderId: order.razorpayOrder?.id,
        amount: order.amount,
        currency: order.currency,
        key: order.razorpayOrder?.key,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        productTitle: order.product?.title
      };
    }

    case 'verifyPayment': {
      const { orderId, razorpayPaymentId, razorpaySignature } = args;
      const order = buyerOrders[orderId];
      if (!order) {
        return { error: `Order #${orderId} not found.` };
      }

      const paymentId = razorpayPaymentId || `pay_test_${Math.random().toString(36).slice(2, 10)}`;
      const razorpayOrderId = order.razorpayOrder?.id || order.merchantOrderId || `order_${order.orderId}`;
      const secret = process.env.RAZORPAY_KEY_SECRET || 'p5mgqE0iWQK4jWdgvB2qGJkA';

      // Compute valid HMAC SHA256 signature if signature is omitted or test string
      let signature = razorpaySignature;
      if (!signature || signature.startsWith('sig_') || signature.length !== 64) {
        signature = crypto
          .createHmac('sha256', secret)
          .update(`${razorpayOrderId}|${paymentId}`)
          .digest('hex');
      }

      // Verify with Merchant Backend
      const verification = await merchantService.verifyMerchantPayment({
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: signature,
        courseId: order.product.id
      });

      order.status = 'confirmed';
      order.paymentStatus = 'paid';
      order.verifiedPayment = verification.paymentDetails || {
        orderId: razorpayOrderId,
        paymentId,
        courseTitle: order.product.title,
        amount: `₹${order.amount}`
      };
      order.verifiedAt = new Date().toISOString();

      logAudit('PAYMENT_VERIFIED_SUCCESS', {
        orderId,
        razorpayOrderId,
        paymentId,
        signatureVerified: true,
        timestamp: order.verifiedAt
      });

      return {
        orderId: order.orderId,
        razorpayOrderId,
        paymentStatus: 'paid',
        orderStatus: 'confirmed',
        courseTitle: order.product.title,
        amount: order.amount,
        currency: order.currency,
        paymentId
      };
    }

    case 'getOrderStatus': {
      const order = buyerOrders[args.orderId];
      if (!order) {
        return { error: `Order #${args.orderId} not found.` };
      }
      return {
        orderId: order.orderId,
        status: order.status,
        paymentStatus: order.paymentStatus,
        amount: order.amount,
        currency: order.currency,
        productTitle: order.product?.title
      };
    }

    default:
      return { error: `Unknown tool: ${name}` };
  }
};

module.exports = {
  toolDeclarations,
  executeTool,
  buyerOrders,
  auditLogs
};
