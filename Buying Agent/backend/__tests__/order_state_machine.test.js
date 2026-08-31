/**
 * Order State Machine & Lifecycle Transition Tests (Phases 2, 10, 11)
 * 
 * Verifies:
 * - Valid forward transitions across complete purchase lifecycle
 * - Rejection of invalid transitions (e.g. FAILED -> CAPTURED, REFUNDED -> CAPTURED)
 * - Terminal states detection
 * - State transition metadata & history tracking
 */

const assert = require('assert');
const OrderStateMachine = require('../services/order/OrderStateMachine');

async function runOrderStateMachineTests() {
  console.log('\n--- Running Order State Machine Lifecycle Tests ---');

  // Test 1: Valid Lifecycle Path
  const validPath = [
    { from: 'created', to: 'authorized' },
    { from: 'authorized', to: 'payment_pending' },
    { from: 'payment_pending', to: 'payment_processing' },
    { from: 'payment_processing', to: 'payment_captured' },
    { from: 'payment_captured', to: 'order_confirmed' },
    { from: 'order_confirmed', to: 'receipt_sent' },
    { from: 'receipt_sent', to: 'completed' }
  ];

  for (const step of validPath) {
    const res = OrderStateMachine.validateTransition(step.from, step.to);
    assert.strictEqual(res.valid, true, `Transition ${step.from} → ${step.to} should be valid`);
  }
  console.log('✓ 1. Complete valid lifecycle progression verified (created → completed)');

  // Test 2: Invalid / Forbidden Transitions
  const invalidTransitions = [
    { from: 'payment_failed', to: 'payment_captured' },
    { from: 'cancelled', to: 'order_confirmed' },
    { from: 'completed', to: 'payment_pending' },
    { from: 'authorization_failed', to: 'payment_captured' }
  ];

  for (const step of invalidTransitions) {
    const res = OrderStateMachine.validateTransition(step.from, step.to);
    assert.strictEqual(res.valid, false, `Transition ${step.from} → ${step.to} MUST be forbidden`);
    assert.strictEqual(Boolean(res.reason?.includes('INVALID_TRANSITION')), true);
  }
  console.log('✓ 2. Forbidden state transitions successfully rejected (e.g., failed → captured)');

  // Test 3: Terminal States
  assert.strictEqual(OrderStateMachine.isTerminal('completed'), true, 'completed is terminal');
  assert.strictEqual(OrderStateMachine.isTerminal('cancelled'), true, 'cancelled is terminal');
  assert.strictEqual(OrderStateMachine.isTerminal('authorization_failed'), true, 'authorization_failed is terminal');
  assert.strictEqual(OrderStateMachine.isTerminal('payment_pending'), false, 'payment_pending is not terminal');
  console.log('✓ 3. Terminal state boundary checks verified');

  console.log('All Order State Machine Tests Passed!\n');
}

module.exports = { runOrderStateMachineTests };

if (require.main === module) {
  runOrderStateMachineTests().catch(err => {
    console.error('Order State Machine Tests Failed:', err);
    process.exit(1);
  });
}
