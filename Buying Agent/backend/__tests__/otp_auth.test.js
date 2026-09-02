/**
 * OTP Authentication & Order History Verification Test Suite
 */

const assert = require('assert');
const userStore = require('../services/userStore.service');
const AuditService = require('../services/order/AuditService');
const { initDatabase } = require('../db/index');

async function runOtpAuthTests() {
  console.log('\n--- Running OTP Authentication & Order History Tests ---');
  await initDatabase();

  const testEmail = `otp_user_${Date.now()}@example.com`;
  const testName = 'OTP Verified Shopper';

  // 1. Send OTP
  console.log(`1. Testing OTP Generation & Dispatch to ${testEmail}...`);
  const sendRes = await userStore.sendOtp(testEmail, testName);
  assert.strictEqual(sendRes.success, true, 'OTP dispatch should succeed');
  assert.strictEqual(sendRes.email, testEmail);
  console.log('✓ 1. OTP generated and sent');

  // 2. Reject Invalid OTP
  console.log('2. Testing rejection of invalid OTP...');
  let invalidRejected = false;
  try {
    await userStore.verifyOtp({ email: testEmail, otp: '000000', name: testName });
  } catch (err) {
    invalidRejected = true;
    assert.ok(err.message.includes('Invalid or expired OTP code'));
  }
  assert.strictEqual(invalidRejected, true, 'Invalid OTP must be rejected');
  console.log('✓ 2. Invalid OTP correctly rejected');

  // 3. Verify Demo / Master OTP (123456)
  console.log('3. Testing OTP Verification with code 123456...');
  const verifyRes = await userStore.verifyOtp({ email: testEmail, otp: '123456', name: testName });
  assert.ok(verifyRes.user, 'User object should be returned on successful OTP verification');
  assert.strictEqual(verifyRes.user.email, testEmail);
  assert.ok(verifyRes.token, 'JWT Token must be issued');
  console.log('✓ 3. OTP verified, account initialized, and JWT token issued');

  // 4. Test Orders Query
  console.log('4. Testing Order History Retrieval for verified user...');
  const orders = await userStore.getOrderHistory(testEmail);
  assert.ok(Array.isArray(orders), 'Orders should return an array');
  console.log(`✓ 4. Orders list query successful (${orders.length} orders found)`);

  console.log('All OTP Authentication Tests Passed!\n');
}

if (require.main === module) {
  runOtpAuthTests()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('❌ OTP Auth Test Failed:', err);
      process.exit(1);
    });
}

module.exports = { runOtpAuthTests };
