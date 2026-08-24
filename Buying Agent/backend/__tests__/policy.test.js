/**
 * Policy Engine Unit Tests (Spec Phase 30)
 * Verifies all deterministic rules: amount limits, daily spending, expiry,
 * category restrictions, merchant restrictions, payment methods, and confirmation thresholds.
 */

const assert = require('assert');
const PolicyEngine = require('../services/policy/PolicyEngine');

async function runPolicyTests() {
  console.log('\n--- Running Policy Engine Tests ---');

  const baseAuth = {
    id: 999,
    user_id: 1,
    status: 'active',
    max_transaction_amount: 5000,
    daily_spending_limit: 10000,
    spent_today: 0,
    spent_today_reset_date: new Date().toISOString().split('T')[0],
    currency: 'INR',
    allowed_categories: ['courses', 'food'],
    allowed_merchants: ['merchant_courses', 'merchant_zomato'],
    allowed_payment_methods: ['pm_visa_1007', 'nb_sbi'],
    require_confirmation_above: 3000,
    starts_at: new Date(Date.now() - 3600000).toISOString(),
    expires_at: new Date(Date.now() + 30 * 86400000).toISOString()
  };

  // 1. Amount below limit -> ALLOW
  let res = await PolicyEngine.evaluate({
    userId: 1,
    amount: 1500,
    currency: 'INR',
    merchantId: 'merchant_courses',
    productCategory: 'courses',
    paymentMethodId: 'pm_visa_1007',
    authorization: { ...baseAuth }
  });
  assert.strictEqual(res.decision, 'ALLOW', 'Amount below limit should be ALLOW');
  assert.strictEqual(res.reasonCodes.includes('AMOUNT_WITHIN_LIMIT'), true);
  console.log('✓ 1. Amount below limit -> ALLOW');

  // 2. Amount equal to limit -> ALLOW
  res = await PolicyEngine.evaluate({
    userId: 1,
    amount: 5000,
    currency: 'INR',
    merchantId: 'merchant_courses',
    productCategory: 'courses',
    paymentMethodId: 'pm_visa_1007',
    authorization: { ...baseAuth, require_confirmation_above: 6000 }
  });
  assert.strictEqual(res.decision, 'ALLOW', 'Amount equal to limit should be ALLOW');
  console.log('✓ 2. Amount equal to limit -> ALLOW');

  // 3. Amount above transaction limit -> DENY
  res = await PolicyEngine.evaluate({
    userId: 1,
    amount: 5001,
    currency: 'INR',
    merchantId: 'merchant_courses',
    productCategory: 'courses',
    paymentMethodId: 'pm_visa_1007',
    authorization: { ...baseAuth }
  });
  assert.strictEqual(res.decision, 'DENY', 'Amount above limit should be DENY');
  assert.strictEqual(res.reasonCodes.includes('AMOUNT_EXCEEDS_TRANSACTION_LIMIT'), true);
  console.log('✓ 3. Amount above limit -> DENY');

  // 4. Daily limit available -> ALLOW
  res = await PolicyEngine.evaluate({
    userId: 1,
    amount: 2000,
    currency: 'INR',
    merchantId: 'merchant_courses',
    productCategory: 'courses',
    paymentMethodId: 'pm_visa_1007',
    authorization: { ...baseAuth, spent_today: 4000 }
  });
  assert.strictEqual(res.decision, 'ALLOW', 'When spent_today + amount <= dailyLimit, ALLOW');
  console.log('✓ 4. Daily limit available -> ALLOW');

  // 5. Daily limit exceeded -> DENY
  res = await PolicyEngine.evaluate({
    userId: 1,
    amount: 2500,
    currency: 'INR',
    merchantId: 'merchant_courses',
    productCategory: 'courses',
    paymentMethodId: 'pm_visa_1007',
    authorization: { ...baseAuth, spent_today: 8000 }
  });
  assert.strictEqual(res.decision, 'DENY', 'When spent_today + amount > dailyLimit, DENY');
  assert.strictEqual(res.reasonCodes.includes('DAILY_SPENDING_LIMIT_EXCEEDED'), true);
  console.log('✓ 5. Daily limit exceeded -> DENY');

  // 6. Expired authorization -> DENY
  res = await PolicyEngine.evaluate({
    userId: 1,
    amount: 500,
    currency: 'INR',
    merchantId: 'merchant_courses',
    productCategory: 'courses',
    paymentMethodId: 'pm_visa_1007',
    authorization: {
      ...baseAuth,
      expires_at: new Date(Date.now() - 86400000).toISOString()
    }
  });
  assert.strictEqual(res.decision, 'DENY', 'Expired authorization should be DENY');
  assert.strictEqual(res.reasonCodes.includes('AUTHORIZATION_EXPIRED'), true);
  console.log('✓ 6. Expired authorization -> DENY');

  // 7. Future authorization (not yet active) -> DENY
  res = await PolicyEngine.evaluate({
    userId: 1,
    amount: 500,
    currency: 'INR',
    merchantId: 'merchant_courses',
    productCategory: 'courses',
    paymentMethodId: 'pm_visa_1007',
    authorization: {
      ...baseAuth,
      starts_at: new Date(Date.now() + 86400000).toISOString()
    }
  });
  assert.strictEqual(res.decision, 'DENY', 'Future authorization should be DENY');
  assert.strictEqual(res.reasonCodes.includes('AUTHORIZATION_NOT_YET_ACTIVE'), true);
  console.log('✓ 7. Future authorization -> DENY');

  // 8. Allowed category -> ALLOW
  res = await PolicyEngine.evaluate({
    userId: 1,
    amount: 500,
    currency: 'INR',
    merchantId: 'merchant_courses',
    productCategory: 'food',
    paymentMethodId: 'pm_visa_1007',
    authorization: { ...baseAuth }
  });
  assert.strictEqual(res.decision, 'ALLOW', 'Allowed category should be ALLOW');
  console.log('✓ 8. Allowed category -> ALLOW');

  // 9. Disallowed category -> DENY
  res = await PolicyEngine.evaluate({
    userId: 1,
    amount: 500,
    currency: 'INR',
    merchantId: 'merchant_courses',
    productCategory: 'cryptocurrency',
    paymentMethodId: 'pm_visa_1007',
    authorization: { ...baseAuth }
  });
  assert.strictEqual(res.decision, 'DENY', 'Disallowed category should be DENY');
  assert.strictEqual(res.reasonCodes.includes('CATEGORY_NOT_ALLOWED'), true);
  console.log('✓ 9. Disallowed category -> DENY');

  // 10. Disallowed merchant -> DENY
  res = await PolicyEngine.evaluate({
    userId: 1,
    amount: 500,
    currency: 'INR',
    merchantId: 'unauthorized_dark_web_merchant',
    productCategory: 'courses',
    paymentMethodId: 'pm_visa_1007',
    authorization: { ...baseAuth }
  });
  assert.strictEqual(res.decision, 'DENY', 'Disallowed merchant should be DENY');
  assert.strictEqual(res.reasonCodes.includes('MERCHANT_NOT_ALLOWED'), true);
  console.log('✓ 10. Disallowed merchant -> DENY');

  // 11. Disallowed payment method -> DENY
  res = await PolicyEngine.evaluate({
    userId: 1,
    amount: 500,
    currency: 'INR',
    merchantId: 'merchant_courses',
    productCategory: 'courses',
    paymentMethodId: 'unauthorized_card_9999',
    authorization: { ...baseAuth }
  });
  assert.strictEqual(res.decision, 'DENY', 'Disallowed payment method should be DENY');
  assert.strictEqual(res.reasonCodes.includes('PAYMENT_METHOD_NOT_ALLOWED'), true);
  console.log('✓ 11. Disallowed payment method -> DENY');

  // 12. Above confirmation threshold -> REQUIRES_CONFIRMATION
  res = await PolicyEngine.evaluate({
    userId: 1,
    amount: 3500, // threshold is 3000
    currency: 'INR',
    merchantId: 'merchant_courses',
    productCategory: 'courses',
    paymentMethodId: 'pm_visa_1007',
    authorization: { ...baseAuth }
  });
  assert.strictEqual(res.decision, 'REQUIRES_CONFIRMATION', 'Amount above confirmation threshold requires confirmation');
  assert.strictEqual(res.requiresConfirmation, true);
  console.log('✓ 12. Above confirmation threshold -> REQUIRES_CONFIRMATION');

  console.log('All Policy Engine Unit Tests Passed!\n');
}

module.exports = { runPolicyTests };

if (require.main === module) {
  runPolicyTests().catch(err => {
    console.error('Policy Tests Failed:', err);
    process.exit(1);
  });
}
