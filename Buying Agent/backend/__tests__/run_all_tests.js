/**
 * Master Test Runner for AgentPay Agentic Commerce System
 */

const { runPolicyTests } = require('./policy.test');
const { runRaceConditionTests } = require('./race_condition.test');
const { runPaymentTests } = require('./payment.test');
const { runIdempotencyTests } = require('./idempotency.test');
const { runE2ETests } = require('./e2e.test');

async function runAll() {
  console.log('====================================================');
  console.log('  AgentPay Agentic Commerce — Automated Test Suite  ');
  console.log('====================================================');

  const startTime = Date.now();
  let passed = 0;
  let failed = 0;

  const suites = [
    { name: 'Policy Engine Unit Tests', fn: runPolicyTests },
    { name: 'Race Condition & Spending Ledger Safety', fn: runRaceConditionTests },
    { name: 'Razorpay Provider & Signature Tests', fn: runPaymentTests },
    { name: 'Idempotency & Replay Protection Tests', fn: runIdempotencyTests },
    { name: 'End-to-End Autonomous Purchasing Tests', fn: runE2ETests }
  ];

  for (const suite of suites) {
    try {
      await suite.fn();
      passed++;
    } catch (err) {
      console.error(`\n❌ [FAILED] ${suite.name}:`, err.message);
      if (err.stack) console.error(err.stack);
      failed++;
    }
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log('====================================================');
  console.log(`Test Summary: ${passed} passed, ${failed} failed (${duration}s)`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('✨ All 5 test suites passed successfully!\n');
    process.exit(0);
  }
}

runAll();
