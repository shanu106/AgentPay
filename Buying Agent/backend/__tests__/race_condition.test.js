/**
 * Race Condition & Spending Ledger Concurrent Safety Test (Spec Phase 5 & 30)
 * 
 * Simulates concurrent purchases:
 *   Daily limit = ₹5,000
 *   Request A = ₹4,000 (concurrent)
 *   Request B = ₹3,000 (concurrent)
 * 
 * Verifies that row-level locking ensures total spending NEVER exceeds ₹5,000.
 */

const assert = require('assert');
const SpendingLedger = require('../services/policy/SpendingLedger');
const { query } = require('../db/index');

async function runRaceConditionTests() {
  console.log('\n--- Running Race Condition Safety Tests ---');

  // 1. Setup a test user and authorization with limit ₹5,000
  const testEmail = `race_test_${Date.now()}@example.com`;
  const userRes = await query(
    `INSERT INTO users (name, email, spending_limit_total) VALUES ($1, $2, 50000) RETURNING id`,
    ['Race Tester', testEmail]
  );
  const testUserId = userRes.rows[0].id;

  const authRes = await query(
    `INSERT INTO agent_authorizations (
      user_id, max_transaction_amount, daily_spending_limit, spent_today,
      spent_today_reset_date, currency, status, starts_at, expires_at
    ) VALUES (
      $1, 5000.00, 5000.00, 0.00,
      CURRENT_DATE, 'INR', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '30 days'
    ) RETURNING id`,
    [testUserId]
  );
  const testAuthId = authRes.rows[0].id;

  console.log(`Initialized Test User #${testUserId} with Daily Limit ₹5,000`);

  // 2. Launch two simultaneous concurrent reservations
  // Request A = ₹4,000
  // Request B = ₹3,000
  // Exactly one must succeed, and one must be rejected with DAILY_LIMIT_EXCEEDED
  const [resA, resB] = await Promise.all([
    SpendingLedger.reserveSpend(testUserId, 4000),
    SpendingLedger.reserveSpend(testUserId, 3000)
  ]);

  console.log('Concurrent Reservation A (₹4,000):', resA.success ? 'SUCCESS' : `DENIED (${resA.reason})`);
  console.log('Concurrent Reservation B (₹3,000):', resB.success ? 'SUCCESS' : `DENIED (${resB.reason})`);

  // Exactly one succeeded
  const successCount = [resA.success, resB.success].filter(Boolean).length;
  assert.strictEqual(successCount, 1, 'Exactly one concurrent request should succeed when combined amount exceeds limit');

  // 3. Verify final DB state
  const finalAuth = await query(`SELECT spent_today FROM agent_authorizations WHERE id = $1`, [testAuthId]);
  const finalSpent = parseFloat(finalAuth.rows[0].spent_today);
  console.log(`Final spent_today in DB: ₹${finalSpent}`);

  assert.strictEqual(finalSpent <= 5000, true, 'Final spent_today must never exceed daily limit of ₹5,000');
  assert.strictEqual(finalSpent === 4000 || finalSpent === 3000, true, 'Final spent_today must be exactly equal to the single winning reservation');

  // 4. Test atomic rollback
  const winningAmount = resA.success ? 4000 : 3000;
  const rollbackRes = await SpendingLedger.rollbackSpend(testUserId, winningAmount);
  assert.strictEqual(rollbackRes.success, true, 'Rollback should succeed');

  const afterRollback = await query(`SELECT spent_today FROM agent_authorizations WHERE id = $1`, [testAuthId]);
  assert.strictEqual(parseFloat(afterRollback.rows[0].spent_today), 0, 'Spent today should return to 0 after rollback');
  console.log('✓ Atomic Rollback verified successfully');

  // Cleanup
  await query('DELETE FROM agent_authorizations WHERE id = $1', [testAuthId]);
  await query('DELETE FROM users WHERE id = $1', [testUserId]);

  console.log('All Race Condition Safety Tests Passed!\n');
}

module.exports = { runRaceConditionTests };

if (require.main === module) {
  runRaceConditionTests().catch(err => {
    console.error('Race Condition Tests Failed:', err);
    process.exit(1);
  });
}
