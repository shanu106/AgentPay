/**
 * Razorpay Webhook Route
 * 
 * Handles webhook events from Razorpay:
 * - Verifies webhook signature
 * - Deduplicates events via webhook_events table
 * - Reconciles payment/order state
 * - Creates audit trail entries
 */

const express = require('express');
const router = express.Router();
const { razorpayProvider } = require('../services/payment/RazorpayProvider');
const { query } = require('../db/index');

router.post('/razorpay', express.raw({ type: 'application/json' }), async (req, res) => {
  const requestId = `whreq_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  try {
    const signature = req.headers['x-razorpay-signature'];
    const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);

    // 1. Verify webhook signature (if webhook secret is configured)
    if (razorpayProvider.webhookSecret) {
      if (!signature) {
        console.warn(`[Webhook ${requestId}] Missing signature header`);
        return res.status(400).json({ success: false, error: 'Missing signature' });
      }

      const isValid = razorpayProvider.verifyWebhookSignature(rawBody, signature);
      if (!isValid) {
        console.warn(`[Webhook ${requestId}] Invalid signature`);
        await logWebhookAudit('WEBHOOK_SIGNATURE_INVALID', { requestId });
        return res.status(400).json({ success: false, error: 'Invalid signature' });
      }
    }

    const event = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const eventId = event.event_id || event.id || `evt_${Date.now()}`;
    const eventType = event.event || 'unknown';
    const payload = event.payload || {};

    console.log(`[Webhook ${requestId}] Received: ${eventType} (${eventId})`);

    // 2. Idempotency check — reject duplicate events
    try {
      const existing = await query('SELECT id FROM webhook_events WHERE id = $1', [eventId]);
      if (existing.rows.length > 0) {
        console.log(`[Webhook ${requestId}] Duplicate event ${eventId}, skipping`);
        return res.json({ success: true, message: 'Event already processed' });
      }
    } catch (_) {}

    // 3. Process event based on type
    const paymentEntity = payload.payment?.entity;
    const orderEntity = payload.order?.entity;
    const razorpayOrderId = paymentEntity?.order_id || orderEntity?.id;
    const razorpayPaymentId = paymentEntity?.id;

    if (eventType === 'payment.captured' && razorpayOrderId) {
      await reconcilePaymentCaptured(razorpayOrderId, razorpayPaymentId, paymentEntity, requestId);
    } else if (eventType === 'payment.failed' && razorpayOrderId) {
      await reconcilePaymentFailed(razorpayOrderId, razorpayPaymentId, paymentEntity, requestId);
    } else if (eventType === 'payment.authorized' && razorpayOrderId) {
      console.log(`[Webhook ${requestId}] Payment authorized: ${razorpayPaymentId}`);
    }

    // 4. Store webhook event for deduplication
    try {
      await query(
        `INSERT INTO webhook_events (id, event_type, razorpay_order_id, razorpay_payment_id, payload, status)
         VALUES ($1, $2, $3, $4, $5, 'processed')
         ON CONFLICT (id) DO NOTHING`,
        [eventId, eventType, razorpayOrderId, razorpayPaymentId, JSON.stringify(event)]
      );
    } catch (storeErr) {
      console.warn(`[Webhook ${requestId}] Store error:`, storeErr.message);
    }

    // 5. Audit
    await logWebhookAudit('WEBHOOK_PROCESSED', {
      requestId,
      eventId,
      eventType,
      razorpayOrderId,
      razorpayPaymentId
    });

    res.json({ success: true, message: 'Webhook processed' });
  } catch (err) {
    console.error(`[Webhook ${requestId}] Error:`, err.message);
    res.status(500).json({ success: false, error: 'Webhook processing failed' });
  }
});

/**
 * Reconcile a captured payment with local order state
 */
async function reconcilePaymentCaptured(razorpayOrderId, razorpayPaymentId, paymentEntity, requestId) {
  try {
    const orderRes = await query(
      `SELECT * FROM orders WHERE razorpay_order_id = $1 LIMIT 1`,
      [razorpayOrderId]
    );

    if (orderRes.rows.length === 0) {
      console.warn(`[Webhook ${requestId}] No local order found for ${razorpayOrderId}`);
      return;
    }

    const order = orderRes.rows[0];

    // Only update if not already confirmed
    if (order.payment_status !== 'paid' && order.status !== 'completed') {
      await query(
        `UPDATE orders SET 
          payment_status = 'paid', 
          status = 'order_confirmed',
          razorpay_payment_id = $1,
          status_history = status_history || $2::jsonb
         WHERE razorpay_order_id = $3`,
        [
          razorpayPaymentId,
          JSON.stringify([{
            from: order.status,
            to: 'order_confirmed',
            trigger: 'webhook_payment_captured',
            timestamp: new Date().toISOString()
          }]),
          razorpayOrderId
        ]
      );
      console.log(`[Webhook ${requestId}] Reconciled order ${order.order_id} → order_confirmed`);
    }
  } catch (err) {
    console.error(`[Webhook ${requestId}] Reconciliation error:`, err.message);
  }
}

/**
 * Reconcile a failed payment
 */
async function reconcilePaymentFailed(razorpayOrderId, razorpayPaymentId, paymentEntity, requestId) {
  try {
    const orderRes = await query(
      `SELECT * FROM orders WHERE razorpay_order_id = $1 LIMIT 1`,
      [razorpayOrderId]
    );

    if (orderRes.rows.length === 0) return;

    const order = orderRes.rows[0];
    if (order.payment_status !== 'paid') {
      await query(
        `UPDATE orders SET 
          payment_status = 'failed',
          status = 'payment_failed',
          failure_reason = $1,
          status_history = status_history || $2::jsonb
         WHERE razorpay_order_id = $3`,
        [
          paymentEntity?.error_description || 'Payment failed',
          JSON.stringify([{
            from: order.status,
            to: 'payment_failed',
            trigger: 'webhook_payment_failed',
            timestamp: new Date().toISOString()
          }]),
          razorpayOrderId
        ]
      );
      console.log(`[Webhook ${requestId}] Order ${order.order_id} → payment_failed`);
    }
  } catch (err) {
    console.error(`[Webhook ${requestId}] Failed reconciliation error:`, err.message);
  }
}

/**
 * Log webhook audit event
 */
async function logWebhookAudit(actionType, details) {
  try {
    await query(
      `INSERT INTO audit_logs (id, action_type, details)
       VALUES ($1, $2, $3)`,
      [`audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`, actionType, JSON.stringify(details)]
    );
  } catch (_) {}
}

module.exports = router;
