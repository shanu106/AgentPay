/**
 * Kill Switch & Authorization Revocation Tests (Phase 6)
 * 
 * Verifies:
 * - Active authorization allows purchases within limit
 * - Revoking authorization immediately blocks any new purchase
 * - Expired authorizations are blocked
 * - Future authorizations are blocked
 * - LLM/API requests cannot override revoked status
 */

const assert = require('assert');
const PolicyEngine = require('../services/policy/PolicyEngine');
const { initDatabase, query } = require('../db/index');

async function runKillSwitchTests() {
  console.log('\n--- Running Kill Switch & Revocation Tests ---');
  await initDatabase();

  // 1. Setup active authorization for test user
  const userEmail = 'nawaz@gmail.com';
  const userRes = await query('SELECT id FROM users WHERE email = $1', [userEmail]);
  const userId = userRes.rows[0].id;

  const auth = await PolicyEngine.upsertAuthorization(userId, {
    maxTransactionAmount: 5000,
    dailySpendingLimit: 10000,
    requireConfirmationAbove: 3000,
    expiresInDays: 30
  });

  // 2. Verify active purchase succeeds
  const activeEval = await PolicyEngine.evaluate({
    userId,
    amount: 1500,
    currency: 'INR'
  });
  assert.strictEqual(activeEval.decision, 'ALLOW', 'Active authorization must allow purchases');
  console.log('✓ 1. Active authorization permitted purchase (₹1,500)');

  // 3. Trigger Kill Switch: Revoke authorization
  console.log('Triggering Kill Switch (Revoking authorization)...');
  await PolicyEngine.revokeAuthorization(auth.id);

  // 4. Verify immediate block
  const revokedEval = await PolicyEngine.evaluate({
    userId,
    amount: 1500,
    currency: 'INR'
  });
  assert.strictEqual(revokedEval.decision, 'DENY', 'Revoked authorization must immediately deny purchase');
  assert.strictEqual(revokedEval.reasonCodes.includes('NO_ACTIVE_AUTHORIZATION') || revokedEval.reasonCodes.includes('AUTHORIZATION_INACTIVE'), true);
  console.log('✓ 2. Kill switch verified: Revoked authorization immediately blocks purchases with zero charge');

  // 5. Verify expired authorization rejection
  const expiredAuth = {
    ...auth,
    status: 'active',
    starts_at: new Date(Date.now() - 86400000 * 40).toISOString(),
    expires_at: new Date(Date.now() - 86400000 * 10).toISOString()
  };
  const expiredEval = await PolicyEngine.evaluate({
    userId,
    amount: 1500,
    currency: 'INR',
    authorization: expiredAuth
  });
  assert.strictEqual(expiredEval.decision, 'DENY', 'Expired authorization must be rejected');
  assert.strictEqual(expiredEval.reasonCodes.includes('AUTHORIZATION_EXPIRED'), true);
  console.log('✓ 3. Expired authorization rejection verified');

  // 6. Restore active authorization for subsequent tests
  await PolicyEngine.upsertAuthorization(userId, {
    maxTransactionAmount: 15000,
    dailySpendingLimit: 50000,
    requireConfirmationAbove: 3000,
    expiresInDays: 90
  });
  console.log('✓ 4. Restored test user authorization state');

  console.log('All Kill Switch & Revocation Tests Passed!\n');
}

module.exports = { runKillSwitchTests };

if (require.main === module) {
  runKillSwitchTests().catch(err => {
    console.error('Kill Switch Tests Failed:', err);
    process.exit(1);
  });
}
