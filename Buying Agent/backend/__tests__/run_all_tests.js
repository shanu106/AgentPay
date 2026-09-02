/**
 * Master Test Runner for AgentPay Agentic Commerce System
 */

const { runPolicyTests } = require('./policy.test');
const { runSpendingLimitTests } = require('./spending_limits.test');
const { runKillSwitchTests } = require('./kill_switch.test');
const { runMerchantTrustTests } = require('./merchant_risk_score.test');
const { runOrderStateMachineTests } = require('./order_state_machine.test');
const { runAuditExplainabilityTests } = require('./audit_explainability.test');
const { runSecurityInjectionTests } = require('./security_injection.test');
const { runRaceConditionTests } = require('./race_condition.test');
const { runPaymentTests } = require('./payment.test');
const { runIdempotencyTests } = require('./idempotency.test');
const { runE2ETests } = require('./e2e.test');
const { runAuthCrossPlatformTests } = require('./auth_cross_platform.test');

async function runAll() {
  console.log('====================================================');
  console.log('  AgentPay Agentic Commerce — Automated Test Suite  ');
  console.log('====================================================');

  const startTime = Date.now();
  let passed = 0;
  let failed = 0;

  const suites = [
    { name: '1. Policy Engine Unit Tests', fn: runPolicyTests },
    { name: '2. Spending Limit & Boundary Tests', fn: runSpendingLimitTests },
    { name: '3. Kill Switch & Authorization Revocation', fn: runKillSwitchTests },
    { name: '4. Merchant Trust & AI Sellability Scoring', fn: runMerchantTrustTests },
    { name: '5. Order State Machine & Lifecycle Transitions', fn: runOrderStateMachineTests },
    { name: '6. Audit Trail, Redaction & Email Receipts', fn: runAuditExplainabilityTests },
    { name: '7. Security & Prompt Injection Defense', fn: runSecurityInjectionTests },
    { name: '8. Race Condition & Spending Ledger Safety', fn: runRaceConditionTests },
    { name: '9. Razorpay Provider & Signature Verification', fn: runPaymentTests },
    { name: '10. Idempotency & Replay Protection Tests', fn: runIdempotencyTests },
    { name: '11. End-to-End Autonomous Purchasing Tests', fn: runE2ETests },
    { name: '12. Cross-Platform Auth & Multi-Merchant Audit Trail Tests', fn: runAuthCrossPlatformTests }
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
    console.log(`✨ All ${suites.length} test suites passed successfully!\n`);
    process.exit(0);
  }
}

runAll();
