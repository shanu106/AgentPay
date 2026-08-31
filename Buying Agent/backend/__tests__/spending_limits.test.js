/**
 * Spending Limits & Boundary Condition Tests (Phase 4, 5, 9)
 * 
 * Verifies:
 * - Case A: Under limit
 * - Case B: Exactly at limit
 * - Case C: Above limit
 * - Case D: Negative amount
 * - Case E: Zero amount
 * - Case F: Currency manipulation
 * - Case G: Decimal / floating-point precision
 * - TOCTOU Price Change Defense
 */

const assert = require('assert');
const PolicyEngine = require('../services/policy/PolicyEngine');
const { initDatabase, query } = require('../db/index');

async function runSpendingLimitTests() {
  console.log('\n--- Running Comprehensive Spending Limit & Boundary Tests ---');
  await initDatabase();

  const mockAuth = {
    id: 999,
    user_id: 1,
    max_transaction_amount: 5000.00,
    daily_spending_limit: 10000.00,
    spent_today: 0.00,
    spent_today_reset_date: new Date().toISOString().split('T')[0],
    currency: 'INR',
    allowed_categories: ['courses', 'food', 'electronics'],
    allowed_merchants: [],
    allowed_payment_methods: [],
    require_confirmation_above: 3000.00,
    status: 'active',
    starts_at: new Date(Date.now() - 3600000).toISOString(),
    expires_at: new Date(Date.now() + 86400000 * 30).toISOString()
  };

  // Case A: Under Limit (₹3,000 < ₹5,000)
  const caseA = await PolicyEngine.evaluate({
    userId: 1,
    amount: 3000,
    currency: 'INR',
    authorization: mockAuth
  });
  assert.strictEqual(caseA.decision, 'ALLOW', 'Amount under limit should be approved');
  console.log('✓ Case A: Under limit (₹3,000 < ₹5,000) -> ALLOW');

  // Case B: Exactly at Limit (₹5,000 == ₹5,000)
  const caseB = await PolicyEngine.evaluate({
    userId: 1,
    amount: 5000,
    currency: 'INR',
    authorization: mockAuth
  });
  assert.strictEqual(caseB.decision, 'REQUIRES_CONFIRMATION', 'Amount at limit (> 3000 confirmation threshold) should require confirmation');
  assert.strictEqual(caseB.reasonCodes.includes('AMOUNT_WITHIN_LIMIT'), true, 'Should be within limit');
  console.log('✓ Case B: Exactly at limit (₹5,000 == ₹5,000) -> ALLOW / REQUIRES_CONFIRMATION');

  // Case C: Above Limit (₹5,001 > ₹5,000)
  const caseC = await PolicyEngine.evaluate({
    userId: 1,
    amount: 5001,
    currency: 'INR',
    authorization: mockAuth
  });
  assert.strictEqual(caseC.decision, 'DENY', 'Amount above limit must be rejected');
  assert.strictEqual(caseC.reasonCodes.includes('AMOUNT_EXCEEDS_TRANSACTION_LIMIT'), true);
  console.log('✓ Case C: Above limit (₹5,001 > ₹5,000) -> DENY (AMOUNT_EXCEEDS_TRANSACTION_LIMIT)');

  // Case D: Negative Amount (-₹500)
  const caseD = await PolicyEngine.evaluate({
    userId: 1,
    amount: -500,
    currency: 'INR',
    authorization: mockAuth
  });
  assert.strictEqual(caseD.decision, 'DENY', 'Negative amount must be strictly rejected');
  assert.strictEqual(caseD.reasonCodes.includes('INVALID_AMOUNT'), true);
  console.log('✓ Case D: Negative amount (-₹500) -> DENY (INVALID_AMOUNT)');

  // Case E: Zero Amount (₹0)
  const caseE = await PolicyEngine.evaluate({
    userId: 1,
    amount: 0,
    currency: 'INR',
    authorization: mockAuth
  });
  assert.strictEqual(caseE.decision, 'DENY', 'Zero amount must be strictly rejected');
  assert.strictEqual(caseE.reasonCodes.includes('INVALID_AMOUNT'), true);
  console.log('✓ Case E: Zero amount (₹0) -> DENY (INVALID_AMOUNT)');

  // Case F: Currency Manipulation ($5000 USD)
  const caseF = await PolicyEngine.evaluate({
    userId: 1,
    amount: 500,
    currency: 'USD',
    authorization: mockAuth
  });
  assert.strictEqual(caseF.decision, 'DENY', 'Foreign/unsupported currency must be rejected');
  assert.strictEqual(caseF.reasonCodes.includes('UNSUPPORTED_CURRENCY'), true);
  console.log('✓ Case F: Currency manipulation (USD) -> DENY (UNSUPPORTED_CURRENCY)');

  // Case G: Decimal / Floating Point Manipulation (₹4,999.99 vs ₹5,000.01)
  const caseG1 = await PolicyEngine.evaluate({
    userId: 1,
    amount: 4999.99,
    currency: 'INR',
    authorization: mockAuth
  });
  assert.strictEqual(caseG1.reasonCodes.includes('AMOUNT_WITHIN_LIMIT'), true, '₹4,999.99 is within limit');

  const caseG2 = await PolicyEngine.evaluate({
    userId: 1,
    amount: 5000.01,
    currency: 'INR',
    authorization: mockAuth
  });
  assert.strictEqual(caseG2.decision, 'DENY', '₹5,000.01 exceeds ₹5,000.00 limit');
  console.log('✓ Case G: Decimal boundaries (₹4,999.99 vs ₹5,000.01) -> Deterministically bounded');

  // TOCTOU Price Change Defense Simulation (Phase 9)
  console.log('Testing TOCTOU Price Change Defense...');
  const originalPrice = 3999;
  const initialEvaluation = await PolicyEngine.evaluate({
    userId: 1,
    amount: originalPrice,
    currency: 'INR',
    authorization: mockAuth
  });
  assert.strictEqual(initialEvaluation.reasonCodes.includes('AMOUNT_WITHIN_LIMIT'), true);

  // Price changes at merchant to ₹5,999 before payment execution
  const updatedMerchantPrice = 5999;
  const revalidatedEvaluation = await PolicyEngine.evaluate({
    userId: 1,
    amount: updatedMerchantPrice,
    currency: 'INR',
    authorization: mockAuth
  });
  assert.strictEqual(revalidatedEvaluation.decision, 'DENY', 'Changed price exceeding limit must be blocked immediately at revalidation');
  console.log('✓ TOCTOU Defense: Price jump from ₹3,999 to ₹5,999 blocked at revalidation point');

  console.log('All Spending Limit & Boundary Tests Passed!\n');
}

module.exports = { runSpendingLimitTests };

if (require.main === module) {
  runSpendingLimitTests().catch(err => {
    console.error('Spending Limit Tests Failed:', err);
    process.exit(1);
  });
}
