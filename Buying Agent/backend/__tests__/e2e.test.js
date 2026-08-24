/**
 * End-to-End Autonomous Purchasing Test (Spec Phase 30)
 * 
 * Tests:
 * 1. Autonomous Zero-Click Auto-Paid: Item below confirmation threshold (₹380 < ₹3,000) -> paid & captured
 * 2. User Confirmation Threshold: Item above confirmation threshold (₹4,999 > ₹3,000) -> created & requires checkout
 * 3. Policy Deny: Item exceeding max transaction limit (> ₹5,000) -> BLOCKED & 0 charge
 */

const assert = require('assert');
const { processPurchaseRequest } = require('../services/buyerAgent');
const { initDatabase } = require('../db/index');

async function runE2ETests() {
  console.log('\n--- Running End-to-End Autonomous Purchase Tests ---');
  await initDatabase();

  // Test 1: Autonomous Auto-Paid Purchase (JS Course ₹499 < ₹3,000 auto-approval threshold)
  console.log('Testing Scenario 1: Autonomous 0-Click Auto-Paid (Amount < ₹3,000 confirmation threshold)...');
  const autoPaidResult = await processPurchaseRequest({
    message: 'Buy JavaScript mastery course',
    userEmail: 'nawaz@gmail.com',
    customerName: 'Nawaz Khan',
    customerEmail: 'nawaz@gmail.com',
    autoExecutePayment: true
  });

  assert.strictEqual(autoPaidResult.success, true, 'Autonomous purchase should succeed');
  assert.strictEqual(Boolean(autoPaidResult.order), true, 'Order should be created');
  assert.strictEqual(autoPaidResult.order.paymentStatus, 'paid', 'Order should be marked as paid');
  assert.strictEqual(autoPaidResult.autoPaid, true, 'autoPaid flag should be true');
  assert.strictEqual(Boolean(autoPaidResult.verification?.paymentId), true, 'Payment ID should exist');
  console.log(`✓ Scenario 1 Succeeded: Autonomous Auto-Paid Order ${autoPaidResult.order.orderId}, Payment ${autoPaidResult.verification?.paymentId}`);

  // Test 2: User Confirmation Threshold (DSA Course ₹4,999 > ₹3,000 threshold)
  console.log('Testing Scenario 2: Confirmation Threshold Triggered (Amount > ₹3,000 threshold)...');
  const confirmResult = await processPurchaseRequest({
    message: 'Buy Complete DSA Mastery course',
    userEmail: 'nawaz@gmail.com',
    customerName: 'Nawaz Khan',
    customerEmail: 'nawaz@gmail.com',
    autoExecutePayment: true
  });

  assert.strictEqual(confirmResult.success, true, 'Order creation should succeed');
  assert.strictEqual(confirmResult.requiresConfirmation, true, 'Should require explicit user confirmation');
  assert.strictEqual(confirmResult.autoPaid, false, 'Should NOT auto-debit when above confirmation threshold');
  assert.strictEqual(confirmResult.order.paymentStatus, 'pending', 'Payment status should be pending confirmation');
  console.log(`✓ Scenario 2 Succeeded: Correctly required confirmation for Order ${confirmResult.order.orderId} (₹${confirmResult.order.amount})`);

  // Test 3: Deny Path (Amount exceeds max per-transaction policy limit of ₹5,000)
  console.log('Testing Scenario 3: Deny Path (Amount exceeds ₹5,000 policy limit)...');
  const denyResult = await processPurchaseRequest({
    message: 'Buy 20 JavaScript mastery courses', // 20 * 499 = 9,980 > 5,000 limit
    userEmail: 'nawaz@gmail.com',
    customerName: 'Nawaz Khan',
    customerEmail: 'nawaz@gmail.com',
    autoExecutePayment: true
  });

  assert.strictEqual(denyResult.success, false, 'Over-limit purchase MUST be rejected');
  assert.strictEqual(denyResult.autoPaid, false, 'No autonomous payment should be executed');
  assert.strictEqual(denyResult.order, null, 'No order should be placed');
  assert.strictEqual(Boolean(denyResult.reply.includes('Blocked') || denyResult.reply.includes('exceeds')), true);
  console.log('✓ Scenario 3 Succeeded: Correctly blocked purchase exceeding spending policy limit');

  console.log('All E2E Autonomous Purchase Tests Passed!\n');
}

module.exports = { runE2ETests };

if (require.main === module) {
  runE2ETests().catch(err => {
    console.error('E2E Tests Failed:', err);
    process.exit(1);
  });
}
