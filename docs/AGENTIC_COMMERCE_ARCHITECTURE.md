# AgentPay — Policy-Controlled Agentic Commerce Architecture

## Core Architectural Principles

1. **Deterministic Backend Policy Enforcement (Non-Negotiable)**
   - The LLM is an untrusted natural language parser and recommendation engine.
   - All spending decisions, daily caps, confirmation thresholds, and merchant approvals are executed by `PolicyEngine.js` in pure JavaScript before any API call is made.
   - The LLM cannot override or bypass policy constraints.

2. **Atomic Row-Level Locking with PostgreSQL (`SpendingLedger.js`)**
   - Concurrent autonomous transactions are serialized at the database row level using `SELECT ... FOR UPDATE`.
   - Prevents race conditions where two simultaneous transactions could exceed the daily spending budget.
   - Atomic rollback occurs automatically if payment capture or merchant order creation fails.

3. **Strict Zero Raw Card Storage (`Payment Methods`)**
   - Real or raw credit/debit card numbers are never stored in PostgreSQL.
   - Only tokenized references (`token_ref`), card brands, and masked digits (`last4`) are stored.
   - Razorpay test card identifiers are mapped in isolated provider layers (`RazorpayProvider.js`).

4. **Idempotency & Replay Protection (`orders.idempotency_key`)**
   - Every purchase request generates a deterministic or unique idempotency key based on session, user ID, and intent.
   - Duplicate purchase requests safely return the existing order without creating duplicate orders or duplicate Razorpay charges.

5. **Formal Order State Machine (`OrderStateMachine.js`)**
   - Strictly enforces linear order progression:
     `CREATED → AUTHORIZED → PAYMENT_PENDING → PAYMENT_PROCESSING → PAYMENT_CAPTURED → ORDER_CONFIRMED → RECEIPT_SENT → COMPLETED`
   - Rejects invalid or out-of-order transitions.

6. **Webhooks with Cryptographic Verification (`/api/webhooks/razorpay`)**
   - Asynchronous payment confirmations from Razorpay are verified using HMAC SHA256 signatures.
   - `webhook_events` table ensures duplicate webhook deliveries are safely deduplicated.

7. **Sanitized, Structured Audit Trail (`AuditService.js`)**
   - Every autonomous action (`INTENT_EXTRACTED`, `AUTHORIZATION_EVALUATED`, `PAYMENT_CAPTURED`, etc.) is recorded to the PostgreSQL `audit_logs` table.
   - Sensitive keys (`password`, `cvv`, `cardNumber`, `jwt`) are automatically redacted.
