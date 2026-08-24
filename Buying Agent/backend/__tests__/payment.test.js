/**
 * Payment & Razorpay Provider Tests (Spec Phase 30)
 * Verifies signature generation, HMAC SHA256 verification, and error handling.
 */

const assert = require('assert');
const { razorpayProvider } = require('../services/payment/RazorpayProvider');

async function runPaymentTests() {
  console.log('\n--- Running Payment Provider Tests ---');

  const testOrderId = 'order_test_123456';
  const testPaymentId = 'pay_test_987654';

  // 1. Signature Generation and Verification
  const validSignature = razorpayProvider.generateSignature(testOrderId, testPaymentId);
  assert.strictEqual(typeof validSignature, 'string');
  assert.strictEqual(validSignature.length, 64, 'HMAC SHA256 hex string should be 64 characters');

  const isValid = razorpayProvider.verifyPaymentSignature(testOrderId, testPaymentId, validSignature);
  assert.strictEqual(isValid, true, 'Valid signature should verify to true');
  console.log('✓ 1. Valid signature generation and verification');

  // 2. Tampered Payment ID -> Invalid signature
  const isTamperedValid = razorpayProvider.verifyPaymentSignature(testOrderId, 'pay_tampered_id', validSignature);
  assert.strictEqual(isTamperedValid, false, 'Tampered payment ID must fail verification');
  console.log('✓ 2. Tampered payment ID correctly rejected');

  // 3. Tampered Order ID -> Invalid signature
  const isTamperedOrderValid = razorpayProvider.verifyPaymentSignature('order_tampered_id', testPaymentId, validSignature);
  assert.strictEqual(isTamperedOrderValid, false, 'Tampered order ID must fail verification');
  console.log('✓ 3. Tampered order ID correctly rejected');

  // 4. Test Mode indicator check
  assert.strictEqual(razorpayProvider.isTestMode, true, 'Razorpay provider must be configured in TEST MODE');
  console.log('✓ 4. Verified Razorpay is in TEST MODE');

  console.log('All Payment Provider Tests Passed!\n');
}

module.exports = { runPaymentTests };

if (require.main === module) {
  runPaymentTests().catch(err => {
    console.error('Payment Tests Failed:', err);
    process.exit(1);
  });
}
