/**
 * Merchant Trust & AI Sellability Scoring Tests (Phases 7, 8, 17)
 * 
 * Verifies:
 * - Deterministic, reproducible AI-sellability score generation
 * - Complete, structured catalog receives 100/100 A+ rating
 * - Malformed / empty catalog receives structured point deductions
 * - Agent commerce disabled merchant gets flagged and deducted
 * - Pricing clarity & currency integrity checks
 */

const assert = require('assert');
const MerchantTrustEngine = require('../services/merchant/MerchantTrustEngine');

async function runMerchantTrustTests() {
  console.log('\n--- Running Merchant Trust & AI-Sellability Scoring Tests ---');

  // Test 1: Ideal Merchant (Complete structured catalog, Razorpay enabled, agent-commerce active)
  const perfectMerchant = {
    id: 'merchant_learnhub',
    name: 'LearnHub Online Courses',
    agent_commerce_enabled: true,
    max_autonomous_order_amount: 10000,
    api_base_url: 'http://localhost:8000/api'
  };

  const perfectProducts = [
    { id: 'c1', title: 'React Mastery', price: 2999, currency: 'INR', category: 'courses', rating: 4.8, description: 'Learn React from scratch.' },
    { id: 'c2', title: 'Node.js Backend', price: 3499, currency: 'INR', category: 'courses', rating: 4.9, description: 'Master Node.js & Express.' }
  ];

  const score1 = MerchantTrustEngine.evaluateMerchant(perfectMerchant, perfectProducts);
  assert.strictEqual(score1.sellabilityScore, 100, 'Perfect merchant should achieve 100/100 score');
  assert.strictEqual(score1.grade, 'A+', 'Grade should be A+');
  assert.strictEqual(score1.trustLevel, 'VERY_HIGH', 'Trust level should be VERY_HIGH');
  assert.strictEqual(score1.deductions.length, 0, 'Should have no deductions');
  console.log(`✓ 1. Ideal Merchant scored: ${score1.sellabilityScore}/100 (Grade ${score1.grade})`);

  // Test 2: Incomplete Catalog (Missing price, malformed items)
  const incompleteProducts = [
    { id: 'c1', title: 'React Mastery', price: 2999, currency: 'INR', category: 'courses' },
    { id: 'c2', title: 'Broken Product', price: -100, currency: 'USD' } // Negative price, wrong currency, missing category
  ];

  const score2 = MerchantTrustEngine.evaluateMerchant(perfectMerchant, incompleteProducts);
  assert.strictEqual(score2.sellabilityScore < 100, true, 'Malformed catalog must reduce sellability score');
  assert.strictEqual(score2.deductions.length > 0, true, 'Deductions must be recorded');
  console.log(`✓ 2. Incomplete catalog scored: ${score2.sellabilityScore}/100 with ${score2.deductions.length} penalty deductions`);

  // Test 3: Agent Commerce Disabled Merchant
  const disabledMerchant = {
    ...perfectMerchant,
    agent_commerce_enabled: false
  };

  const score3 = MerchantTrustEngine.evaluateMerchant(disabledMerchant, perfectProducts);
  assert.strictEqual(score3.agentCommerceAllowed, false, 'Should reflect agent commerce disabled');
  assert.strictEqual(score3.deductions.some(d => d.name === 'Agent Commerce Disabled'), true);
  console.log(`✓ 3. Agent commerce disabled merchant flagged with penalty: ${score3.sellabilityScore}/100`);

  // Test 4: Determinism Check (Same input must produce exact same score)
  const score4A = MerchantTrustEngine.evaluateMerchant(perfectMerchant, perfectProducts);
  const score4B = MerchantTrustEngine.evaluateMerchant(perfectMerchant, perfectProducts);
  assert.strictEqual(score4A.sellabilityScore, score4B.sellabilityScore, 'Score calculation must be 100% deterministic');
  console.log('✓ 4. Deterministic score reproducibility verified');

  console.log('All Merchant Trust & Sellability Tests Passed!\n');
}

module.exports = { runMerchantTrustTests };

if (require.main === module) {
  runMerchantTrustTests().catch(err => {
    console.error('Merchant Trust Tests Failed:', err);
    process.exit(1);
  });
}
