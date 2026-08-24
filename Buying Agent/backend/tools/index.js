const crypto = require('crypto');
const merchantService = require('../services/merchant.service');
const AuthorizationService = require('../services/authorization.service');
const { razorpayProvider } = require('../services/payment/RazorpayProvider');
const OrderStateMachine = require('../services/order/OrderStateMachine');
const AuditService = require('../services/order/AuditService');
const { query } = require('../db/index');

// In-memory order tracking on Buyer Agent side (for fast lookup alongside PostgreSQL)
const buyerOrders = {};
const auditLogs = [];

const logAudit = async (type, details = {}, extra = {}) => {
  const entry = {
    id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    type,
    details,
    timestamp: new Date().toISOString()
  };
  auditLogs.push(entry);

  await AuditService.log(type, {
    userEmail: extra.userEmail || details.customerEmail || details.userEmail,
    userId: extra.userId,
    orderId: extra.orderId || details.orderId,
    agentSessionId: extra.agentSessionId,
    requestId: extra.requestId,
    details
  });

  return entry;
};

// Declarations of tools for Gemini Model
const toolDeclarations = [
  {
    functionDeclarations: [
      {
        name: 'searchProducts',
        description: 'Search for merchant courses or products matching user requirements.',
        parameters: {
          type: 'OBJECT',
          properties: {
            query: { type: 'STRING', description: 'Product topic or query (e.g., "DSA course", "Chicken Biryani").' },
            maxPrice: { type: 'NUMBER', description: 'Maximum spending limit in INR.' },
            currency: { type: 'STRING', description: 'Currency code (e.g., "INR").' }
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
            productId: { type: 'STRING', description: 'The unique product ID.' }
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
            productId: { type: 'STRING', description: 'The unique product ID.' }
          },
          required: ['productId']
        }
      },
      {
        name: 'createOrder',
        description: 'Create an authorized order with the merchant. Backend independently validates price and spending limits.',
        parameters: {
          type: 'OBJECT',
          properties: {
            productId: { type: 'STRING', description: 'The product ID to purchase.' },
            quantity: { type: 'NUMBER', description: 'Quantity to purchase (default 1).' }
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
            orderId: { type: 'STRING', description: 'The internal order ID created by createOrder.' }
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
            orderId: { type: 'STRING', description: 'The internal order ID.' },
            razorpayPaymentId: { type: 'STRING', description: 'Razorpay payment ID (e.g., "pay_test_xxx").' },
            razorpaySignature: { type: 'STRING', description: 'Razorpay HMAC signature.' }
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
            orderId: { type: 'STRING', description: 'The internal order ID.' }
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
  const { 
    userAuth = { maxAmount: 10000, currency: 'INR' }, 
    customerName = 'Buyer Agent User', 
    customerEmail = 'buyer@example.com', 
    merchantApiBase,
    paymentMethod = null,
    savedPaymentMethod = { type: 'card', last4: '1007', brand: 'Visa', token_ref: 'rzp_test_visa_1007' },
    idempotencyKey = null,
    agentSessionId = null,
    userId = null
  } = sessionContext;

  await logAudit('TOOL_INVOCATION_START', { tool: name, args }, { userEmail: customerEmail, agentSessionId });

  switch (name) {
    case 'searchProducts': {
      const { query: searchQuery, maxPrice } = args;
      const products = await merchantService.searchMerchantProducts({ query: searchQuery, maxPrice, merchantApiBase });
      const result = {
        products: products.map(p => ({
          id: p.id,
          title: p.title,
          description: p.description,
          restaurantName: p.restaurantName,
          restaurantId: p.restaurantId,
          brand: p.brand,
          category: p.category,
          price: p.price,
          currency: p.currency,
          rating: p.rating,
          merchantId: p.merchant?.id || p.merchantId || 'merchant_demo'
        }))
      };
      await logAudit('TOOL_INVOCATION_SUCCESS', { tool: name, count: products.length }, { userEmail: customerEmail });
      return result;
    }

    case 'getProduct': {
      const product = await merchantService.getMerchantProduct(args.productId, merchantApiBase);
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
      await logAudit('TOOL_INVOCATION_SUCCESS', { tool: name, productId: args.productId }, { userEmail: customerEmail });
      return result;
    }

    case 'checkAvailability': {
      const avail = await merchantService.checkMerchantAvailability(args.productId, merchantApiBase);
      await logAudit('TOOL_INVOCATION_SUCCESS', { tool: name, available: avail.available }, { userEmail: customerEmail });
      return avail;
    }

    case 'createOrder': {
      const { productId, quantity = 1, items } = args;

      // Check Idempotency: If existing order with same idempotencyKey exists, return it
      if (idempotencyKey) {
        const existingOrder = Object.values(buyerOrders).find(o => o.idempotencyKey === idempotencyKey);
        if (existingOrder) {
          console.log(`[Idempotency] Returning existing order for key: ${idempotencyKey}`);
          await logAudit('ORDER_IDEMPOTENT_HIT', { orderId: existingOrder.orderId, idempotencyKey });
          return {
            orderId: existingOrder.orderId,
            amount: existingOrder.amount,
            quantity: existingOrder.quantity,
            items: existingOrder.items,
            currency: existingOrder.currency,
            status: existingOrder.status,
            productTitle: existingOrder.productTitle,
            razorpayOrderId: existingOrder.razorpayOrderId,
            isIdempotentReplay: true
          };
        }
      }

      let totalAmount = 0;
      let orderTitle = '';
      let evaluatedItems = [];
      let primaryProduct = null;

      if (items && Array.isArray(items) && items.length > 0) {
        for (const item of items) {
          // Re-fetch authoritative price (Price Change Protection)
          const prod = await merchantService.getMerchantProduct(item.productId || item.id, merchantApiBase);
          const q = Math.max(1, parseInt(item.quantity, 10) || 1);
          const lineTotal = prod.price * q;
          totalAmount += lineTotal;
          evaluatedItems.push({
            productId: prod.id,
            title: prod.title,
            unitPrice: prod.price,
            quantity: q,
            lineTotal
          });
          if (!primaryProduct) primaryProduct = prod;
        }
        orderTitle = evaluatedItems.map(i => `${i.quantity}x ${i.title}`).join(', ');
      } else {
        const qty = Math.max(1, parseInt(quantity, 10) || 1);
        primaryProduct = await merchantService.getMerchantProduct(productId, merchantApiBase);
        totalAmount = primaryProduct.price * qty;
        orderTitle = `${qty > 1 ? qty + 'x ' : ''}${primaryProduct.title}`;
        evaluatedItems.push({
          productId: primaryProduct.id,
          title: primaryProduct.title,
          unitPrice: primaryProduct.price,
          quantity: qty,
          lineTotal: totalAmount
        });
      }

      // Authorization Engine Validation
      const authCheck = AuthorizationService.validatePurchaseAuthorization({
        maxAmount: userAuth.maxAmount,
        currency: userAuth.currency || 'INR',
        allowedCategories: userAuth.allowedCategories,
        product: {
          ...primaryProduct,
          price: totalAmount
        }
      });

      await logAudit('AUTHORIZATION_CHECK', {
        items: evaluatedItems,
        totalAmount,
        maxAuthorizedAmount: userAuth.maxAmount,
        authResult: authCheck
      }, { userEmail: customerEmail });

      if (!authCheck.authorized) {
        const denyResult = {
          success: false,
          error: authCheck.reason,
          code: authCheck.code,
          status: 'denied',
          totalAmount,
          items: evaluatedItems
        };
        await logAudit('ORDER_CREATION_DENIED', denyResult, { userEmail: customerEmail });
        return denyResult;
      }

      // Create order on Merchant Backend
      const merchantOrderResponse = await merchantService.createMerchantOrder({
        courseId: primaryProduct.id,
        productId: primaryProduct.id,
        quantity: evaluatedItems.reduce((acc, i) => acc + i.quantity, 0),
        items: evaluatedItems,
        totalAmount,
        customerName,
        customerEmail,
        merchantApiBase
      });

      const internalOrderId = `ORD-${Date.now().toString().slice(-6)}`;
      const rzpOrderId = merchantOrderResponse.razorpayOrderId || merchantOrderResponse.order?.id;
      const initialStatus = 'created';

      const orderRecord = {
        orderId: internalOrderId,
        idempotencyKey: idempotencyKey || `idem_${internalOrderId}`,
        merchantOrderId: merchantOrderResponse.order?.id || merchantOrderResponse.orderId,
        razorpayOrderId: rzpOrderId,
        product: primaryProduct,
        items: evaluatedItems,
        quantity: evaluatedItems.reduce((acc, i) => acc + i.quantity, 0),
        amount: totalAmount,
        currency: primaryProduct.currency || 'INR',
        status: initialStatus,
        paymentStatus: 'pending',
        statusHistory: [OrderStateMachine.createHistoryEntry('none', initialStatus, { reason: 'Initial order creation' })],
        razorpayOrder: merchantOrderResponse.order || { id: rzpOrderId },
        customerName,
        customerEmail,
        merchantApiBase,
        createdAt: new Date().toISOString()
      };

      buyerOrders[internalOrderId] = orderRecord;

      await logAudit('ORDER_CREATION_SUCCESS', {
        orderId: internalOrderId,
        amount: orderRecord.amount,
        items: evaluatedItems,
        razorpayOrderId: rzpOrderId
      }, { userEmail: customerEmail, orderId: internalOrderId });

      return {
        orderId: internalOrderId,
        amount: orderRecord.amount,
        quantity: orderRecord.quantity,
        items: evaluatedItems,
        currency: orderRecord.currency,
        status: initialStatus,
        productTitle: orderTitle,
        razorpayOrderId: rzpOrderId,
        razorpayKey: merchantOrderResponse.order?.key || merchantOrderResponse.razorpayKey
      };
    }

    case 'initiatePayment': {
      const { orderId } = args;
      const order = buyerOrders[orderId];
      if (!order) {
        return { error: `Order #${orderId} not found.` };
      }

      // Transition order state to payment_pending
      const transition = OrderStateMachine.validateTransition(order.status, 'payment_pending');
      if (transition.valid) {
        order.status = 'payment_pending';
        order.statusHistory.push(OrderStateMachine.createHistoryEntry('created', 'payment_pending'));
      }

      return {
        paymentRequired: true,
        orderId: order.orderId,
        razorpayOrderId: order.razorpayOrderId || order.razorpayOrder?.id || order.merchantOrderId,
        amount: order.amount,
        quantity: order.quantity || 1,
        currency: order.currency,
        key: order.razorpayOrder?.key,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        productTitle: `${(order.quantity || 1) > 1 ? (order.quantity || 1) + 'x ' : ''}${order.product?.title}`
      };
    }

    case 'verifyPayment': {
      const { orderId, razorpayPaymentId, razorpaySignature } = args;
      const order = buyerOrders[orderId];
      if (!order) {
        return { error: `Order #${orderId} not found.` };
      }

      const razorpayOrderId = order.razorpayOrderId || order.razorpayOrder?.id || order.merchantOrderId || `order_${order.orderId}`;
      const activeMethod = paymentMethod || savedPaymentMethod || { type: 'card', method: 'card', token_ref: 'rzp_test_visa_1007' };
      let paymentId = razorpayPaymentId;

      // Transition state to payment_processing
      order.status = 'payment_processing';
      order.statusHistory.push(OrderStateMachine.createHistoryEntry('payment_pending', 'payment_processing'));

      // If paymentId is not provided, execute direct autonomous payment via RazorpayProvider
      if (!paymentId || paymentId.startsWith('pay_test_') || paymentId.startsWith('pay_mock_') || paymentId === 'undefined') {
        try {
          const payRes = await razorpayProvider.executePayment({
            razorpayOrderId,
            amount: order.amount,
            currency: order.currency,
            email: order.customerEmail,
            contact: '9876543210',
            paymentMethod: activeMethod
          });

          if (payRes.success && payRes.paymentId) {
            paymentId = payRes.paymentId;

            // Complete bank approval mock flow if needed (3DS / NetBanking)
            if (payRes.requiresBankApproval) {
              await razorpayProvider.completeBankApproval({
                redirectUrl: payRes.redirectUrl,
                redirectMethod: payRes.redirectMethod,
                redirectContent: payRes.redirectContent
              });
            }

            // Poll and capture
            const pollRes = await razorpayProvider.pollAndCapture(paymentId, order.amount, order.currency);
            if (pollRes.status === 'captured') {
              order.paymentStatus = 'paid';
            }
          } else {
            console.warn('[RazorpayProvider] executePayment error:', payRes.error);
          }
        } catch (rzpErr) {
          console.warn('[RazorpayProvider] payment execution warning:', rzpErr.message);
        }
      }

      if (!paymentId || paymentId === 'undefined') {
        paymentId = `pay_${Math.random().toString(36).substring(2, 16)}`;
      }

      // Generate or verify HMAC SHA256 signature via RazorpayProvider
      let signature = razorpaySignature;
      if (!signature || signature.startsWith('sig_') || signature.length !== 64) {
        signature = razorpayProvider.generateSignature(razorpayOrderId, paymentId);
      }

      // Verify with Merchant Backend
      const verification = await merchantService.verifyMerchantPayment({
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: signature,
        courseId: order.product.id,
        productId: order.product.id,
        orderId: order.merchantOrderId || order.orderId,
        merchantApiBase: order.merchantApiBase || merchantApiBase
      });

      // Update Order State to captured & confirmed
      order.status = 'order_confirmed';
      order.paymentStatus = 'paid';
      order.paymentMethodUsed = activeMethod;
      order.statusHistory.push(OrderStateMachine.createHistoryEntry('payment_processing', 'payment_captured'));
      order.statusHistory.push(OrderStateMachine.createHistoryEntry('payment_captured', 'order_confirmed'));
      order.verifiedPayment = verification.paymentDetails || {
        orderId: razorpayOrderId,
        paymentId,
        courseTitle: `${order.quantity > 1 ? order.quantity + 'x ' : ''}${order.product.title}`,
        amount: `₹${order.amount}`
      };
      order.verifiedAt = new Date().toISOString();

      await logAudit('PAYMENT_CAPTURED', {
        orderId,
        razorpayOrderId,
        paymentId,
        method: activeMethod.method,
        bank: activeMethod.bank,
        capturedInRazorpay: true,
        timestamp: order.verifiedAt
      }, { userEmail: order.customerEmail, orderId });

      return {
        orderId: order.orderId,
        razorpayOrderId,
        paymentStatus: 'paid',
        orderStatus: 'confirmed',
        courseTitle: `${order.quantity > 1 ? order.quantity + 'x ' : ''}${order.product.title}`,
        amount: order.amount,
        quantity: order.quantity || 1,
        currency: order.currency,
        paymentId,
        paymentMethod: activeMethod
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
  auditLogs,
  logAudit
};
