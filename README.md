# 🤖 AI Shopping Agent & Merchant Course Platform

An end-to-end, production-grade **Autonomous AI Buyer Agent** powered by **Google Gemini API** and integrated with a **Merchant Course Platform** using **Razorpay Test Mode** payments and HMAC SHA256 cryptographic verification.

---

## 🏗️ Architecture Overview

```text
                                USER
                                  │
                                  │ Natural-Language Purchase Request
                                  ▼
                         +-----------------+
                         │  BUYER AGENT UI │ (Port 5174)
                         +-----------------+
                                  │
                                  │ POST /api/agent/purchase
                                  ▼
                         +-----------------+
                         │  BUYER BACKEND  │ (Port 8001)
                         │ Gemini 2.0/1.5  │
                         +-----------------+
                                  │
                    ┌─────────────┼─────────────┐
                    ▼             ▼             ▼
              Tool Calling   Authorization   Razorpay
              (7 Tools)        Engine        Service
                    │             │             │
                    └─────────────┼─────────────┘
                                  │
                                  │ Controlled Merchant API Calls
                                  ▼
                      +----------------------+
                      |    MERCHANT SYSTEM   | (Port 8000)
                      | Course Platform API  |
                      +----------------------+
                                  │
                                  ▼
                         Razorpay Test Mode
                                  │
                                  ▼
                      Payment Signature Verified
                                  │
                                  ▼
                      Student Enrolled & Confirmed
```

---

## 📂 Repository Structure

```text
.
├── .gitignore                      # Master gitignore (ignoring all .env, node_modules, dist)
├── README.md                       # Main documentation
│
├── Buying Agent/                   # 🤖 AI Buyer Agent System
│   ├── backend/
│   │   ├── .env.example            # Backend env template (GEMINI_API_KEY, RAZORPAY keys)
│   │   ├── index.js                # Express API server (Port 8001)
│   │   ├── package.json
│   │   ├── services/
│   │   │   ├── buyerAgent.js       # Gemini 2.0 reasoning engine & purchase loop
│   │   │   ├── authorization.service.js # Strict spending limit security boundary
│   │   │   └── merchant.service.js # Merchant API communication service
│   │   └── tools/
│   │       └── index.js            # 7 Registered Tools & HMAC verification
│   │
│   └── frontend/
│       ├── package.json
│       ├── vite.config.js          # Port 5174, proxies /api -> http://localhost:8001
│       └── src/
│           ├── App.jsx             # Main Buyer Agent interface & scenario chips
│           ├── components/
│           │   ├── AgentActivityPanel.jsx  # Real-time visual decision trace
│           │   ├── RazorpayModal.jsx       # Razorpay Test Checkout modal
│           │   ├── OrderConfirmationView.jsx # Verified receipt & confirmation
│           │   ├── AuditLogsModal.jsx      # Security audit log inspector
│           │   └── ApiKeyModal.jsx         # Gemini API key settings
│           └── api/
│               └── agentApi.js     # API client functions
│
└── [Course Platform]               # 📚 Merchant Course Website
    ├── backend/
    │   ├── .env.example            # Merchant env template (RAZORPAY_KEY_ID, SECRET)
    │   ├── package.json
    │   └── server.js               # Merchant Express server (Port 8000)
    │
    └── frontend/
        ├── package.json
        ├── vite.config.js          # Port 5173, proxies /api -> http://localhost:8000
        └── src/
            ├── App.jsx
            └── components/         # Course listings, detail view, checkout & enrollments
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js** v18+ installed
- Free **Google Gemini API Key** (from [Google AI Studio](https://aistudio.google.com/app/apikey))
- Free **Razorpay Test Keys** (from [Razorpay Dashboard](https://dashboard.razorpay.com/app/keys))

---

### 2. Setup Environment Files

#### A. Merchant Backend (`backend/`)
```bash
cd backend
cp .env.example .env
```
Edit `backend/.env`:
```env
RAZORPAY_KEY_ID=rzp_test_YOUR_KEY_ID
RAZORPAY_KEY_SECRET=YOUR_KEY_SECRET
PORT=8000
CLIENT_URL=http://localhost:5173
```

#### B. Buyer Agent Backend (`Buying Agent/backend/`)
```bash
cd "Buying Agent/backend"
cp .env.example .env
```
Edit `Buying Agent/backend/.env`:
```env
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
RAZORPAY_KEY_ID=rzp_test_YOUR_KEY_ID
RAZORPAY_KEY_SECRET=YOUR_KEY_SECRET
MERCHANT_API_BASE=http://localhost:8000/api
PORT=8001
CLIENT_URL=http://localhost:5174
```

---

### 3. Install Dependencies & Start Services

#### Terminal 1: Merchant Backend (Port 8000)
```bash
cd backend
npm install
npm start
```

#### Terminal 2: Merchant Frontend (Port 5173)
```bash
cd frontend
npm install
npm run dev
```

#### Terminal 3: Buyer Agent Backend (Port 8001)
```bash
cd "Buying Agent/backend"
npm install
npm start
```

#### Terminal 4: Buyer Agent Frontend (Port 5174)
```bash
cd "Buying Agent/frontend"
npm install
npm run dev
```

---

## 🧪 Testing the Primary End-to-End Demo

1. Open **AI Shopping Buyer Agent** in browser: **`http://localhost:5174`**
2. Click on the demo chip or type:
   > *"Buy me a DSA course up to ₹10,000 with good ratings"*
3. Watch the **Live Activity & Decision Trace**:
   - `✓ Understanding purchase intent (Query="DSA", MaxBudget=₹10,000)`
   - `✓ Searching merchant courses (Found Complete DSA Mastery)`
   - `✓ Authoritative Price Verified: ₹4,999`
   - `✓ Backend Authorization Check: ₹4,999 <= ₹10,000 (AUTHORIZED)`
   - `✓ Merchant Order Created`
   - `→ Razorpay Test Mode Order Ready`
4. Click **Authorize & Pay (Test Mode)** in the Razorpay Modal.
5. Receive the verified confirmation with HMAC SHA256 signature verification and view active enrollment in the merchant platform!

---

## 🛡️ Security Boundaries

1. **Authorization Engine**: The LLM is the reasoning layer, but the backend is the authority. It strictly enforces spending limits against authoritative merchant prices before any order can be created.
2. **Secret Isolation**: `RAZORPAY_KEY_SECRET` and `GEMINI_API_KEY` are never exposed to the frontend or sent to client browsers.
3. **Cryptographic Verification**: Payment verification uses HMAC SHA256 signatures validated server-side by the merchant backend.