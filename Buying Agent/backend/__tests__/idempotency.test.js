/**
 * Idempotency Tests (Spec Phase 7 & 30)
 * 
 * Verifies that repeating the same purchase with an identical idempotency key
 * returns the existing order and prevents duplicate orders/charges.
 */

const assert = require('assert');
const { executeTool, buyerOrders } = require('../tools/index');

async function runIdempotencyTests() {
  console.log('\n--- Running Idempotency Tests ---');

  const testIdempotencyKey = `idem_test_${Date.now()}_abc123`;
  const sessionContext = {
    userId: 1,
    idempotencyKey: testIdempotencyKey,
    userAuth: { maxAmount: 10000, currency: 'INR' },
    customerName: 'Idempotency Tester',
    customerEmail: 'nawaz@gmail.com',
    merchantApiBase: 'http://localhost:8000/api'
  };

  // 1. First order creation
  const order1 = await executeTool('createOrder', {
    productId: 'course-dsa-mastery',
    quantity: 1
  }, sessionContext);

  assert.strictEqual(Boolean(order1.orderId), true, 'Order 1 should be created');
  assert.strictEqual(order1.isIdempotentReplay, undefined);
  console.log(`✓ 1. Initial order created: ${order1.orderId}`);

  // 2. Replay with identical idempotencyKey
  const order2 = await executeTool('createOrder', {
    productId: 'course-dsa-mastery',
    quantity: 1
  }, sessionContext);

  assert.strictEqual(order2.orderId, order1.orderId, 'Order 2 should return the same order ID');
  assert.strictEqual(order2.isIdempotentReplay, true, 'Order 2 should be flagged as idempotent replay');
  console.log(`✓ 2. Idempotent replay returned existing order: ${order2.orderId}`);

  console.log('All Idempotency Tests Passed!\n');
}

module.exports = { runIdempotencyTests };

if (require.main === module) {
  runIdempotencyTests().catch(err => {
    console.error('Idempotency Tests Failed:', err);
    process.exit(1);
  });
}
