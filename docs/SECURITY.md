# AgentPay Security Architecture & Best Practices

## 1. Zero Trust in LLM Decisions
- The LLM is treated as an untrusted natural language parser and conversational agent.
- No LLM prompt or output can override policy constraints, approve transactions, or increase spending limits.
- The backend `PolicyEngine.js` performs authoritative validations of product prices, user authorizations, daily caps, and category permissions.

## 2. Cardholder Data Security (PCI-DSS Principles)
- **No Raw Card Number Storage**: The database does not store credit or debit card numbers, CVVs, or full PANs.
- `payment_methods` stores only:
  - `brand` (e.g. "Visa", "MasterCard")
  - `last4` (e.g. "1007")
  - `token_ref` (Razorpay test token identifier)
  - `auto_debit_limit`
- Test card numbers are isolated in `RazorpayProvider.js` solely for mock sandbox execution and are never recorded to persistent disk or logs.

## 3. Atomic Row-Level Locking (`SpendingLedger.js`)
- Protects daily spending limits against concurrent race conditions.
- Uses PostgreSQL transactions with `SELECT ... FOR UPDATE` row locks.
- If two transactions of ₹4,000 and ₹3,000 arrive concurrently against a ₹5,000 daily budget, the second transaction is safely blocked with `DAILY_LIMIT_EXCEEDED`.

## 4. Idempotency & Replay Protection
- `orders.idempotency_key` (UNIQUE constraint) ensures network retries or duplicated user prompts never charge a user twice or create multiple merchant orders.

## 5. Webhook Signature Verification
- Webhook endpoints verify incoming `X-Razorpay-Signature` headers using HMAC SHA256 against `RAZORPAY_WEBHOOK_SECRET`.
- `webhook_events` table enforces deduplication of duplicate webhook events.

## 6. Audit Trail Redaction
- `AuditService.js` automatically redacts sensitive keywords (`password`, `cvv`, `cardNumber`, `jwt`, `token`, `secret`) from all audit event payloads before writing to PostgreSQL.

## 7. Rate Limiting
- `rateLimit.middleware.js` protects `/api/agent/purchase`, `/api/user/login`, and `/api/webhooks/razorpay` against brute-force attacks and abuse.
