# AgentPay REST API Documentation

## Base URLs
- **Buying Agent Backend**: `http://localhost:8001/api`
- **Course Website Backend**: `http://localhost:8000/api`
- **TechGear Ecommerce Backend**: `http://localhost:8002/api`
- **FoodExpress Zomato Backend**: `http://localhost:8003/api`

---

## 1. Autonomous Agent Endpoints

### `POST /api/agent/purchase`
Executes an autonomous or policy-governed purchase request.
- **Headers**: `Content-Type: application/json`, `Authorization: Bearer <jwt>` (optional)
- **Body**:
  ```json
  {
    "message": "Buy JavaScript mastery course",
    "userEmail": "nawaz@gmail.com",
    "customerName": "Nawaz Khan",
    "customerEmail": "nawaz@gmail.com",
    "autoExecutePayment": true
  }
  ```
- **Responses**:
  - `200 OK` (Auto-paid within threshold):
    ```json
    {
      "success": true,
      "autoPaid": true,
      "requiresCheckout": false,
      "order": { "orderId": "ORD-123456", "paymentStatus": "paid", "amount": 499 },
      "verification": { "paymentId": "pay_xyz" }
    }
    ```
  - `200 OK` (Above confirmation threshold):
    ```json
    {
      "success": true,
      "autoPaid": false,
      "requiresConfirmation": true,
      "requiresCheckout": true,
      "order": { "orderId": "ORD-123456", "paymentStatus": "pending", "amount": 4999 }
    }
    ```
  - `200 OK` (Denied by PolicyEngine):
    ```json
    {
      "success": false,
      "autoPaid": false,
      "policy": {
        "decision": "DENY",
        "reasonCodes": ["AMOUNT_EXCEEDS_TRANSACTION_LIMIT"]
      },
      "reply": "🛡️ Purchase Blocked by Policy Engine..."
    }
    ```

---

## 2. Authorization & Spending Policy Endpoints

### `GET /api/user/authorization?email=nawaz@gmail.com`
Fetches the active policy and spending stats.
- **Response**:
  ```json
  {
    "success": true,
    "authorization": {
      "id": 1,
      "max_transaction_amount": "5000.00",
      "daily_spending_limit": "10000.00",
      "spent_today": "499.00",
      "allowed_categories": ["courses", "food", "electronics"],
      "require_confirmation_above": "3000.00",
      "status": "active"
    },
    "spendingStats": {
      "spentToday": 499,
      "dailyLimit": 10000,
      "remaining": 9501
    }
  }
  ```

### `POST /api/user/authorization`
Updates spending limits and policies in PostgreSQL.
- **Body**:
  ```json
  {
    "email": "nawaz@gmail.com",
    "maxTransactionAmount": 5000,
    "dailySpendingLimit": 10000,
    "requireConfirmationAbove": 3000,
    "allowedCategories": ["courses", "food", "electronics"],
    "expiresInDays": 30
  }
  ```

---

## 3. Razorpay Webhooks Endpoint

### `POST /api/webhooks/razorpay`
Receives asynchronous payment and refund notifications from Razorpay.
- **Headers**: `X-Razorpay-Signature: <hex_hmac>`
- **Body**: Razorpay webhook JSON payload
- **Features**: Cryptographic HMAC SHA256 signature verification, `webhook_events` deduplication, and order state machine synchronization.

---

## 4. Merchant AI-Commerce Endpoints

### `GET /api/user/merchants`
Lists registered merchant stores and their autonomous purchasing status.

### `POST /api/user/merchants/settings`
Enables/disables agent commerce for a merchant store and configures maximum autonomous order limits.
- **Body**:
  ```json
  {
    "merchantId": "merchant_courses",
    "agentCommerceEnabled": true,
    "maxAutonomousOrderAmount": 10000
  }
  ```
