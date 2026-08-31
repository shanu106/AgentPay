# 🤖 Autonomous Multi-Merchant AI Shopping Agent & Commerce Ecosystem

An end-to-end, production-grade **Autonomous AI Buyer Agent** powered by **Google Gemini API** (Function Calling & Reasoning Engine) and **ElevenLabs Multilingual Voice AI**, integrated with multiple merchant platforms across domains (**Courses, E-Commerce, and Food Delivery/Zomato**) using **Razorpay Test Mode** payments and HMAC SHA256 cryptographic verification.

---

## 📑 Table of Contents

- [Overview & What This System Does](#-overview--what-this-system-does)
- [System Architecture](#-system-architecture)
- [Repository Structure & Requirements](#-repository-structure--requirements)
- [Environment Variables Reference](#-environment-variables-reference)
- [Developer Setup & Quick Start](#-developer-setup--quick-start)
  - [1. Mandatory: Buyer Agent Setup](#1-mandatory-ai-buyer-agent-setup)
  - [2. Select At Least 1 Merchant Platform](#2-select-at-least-1-merchant-platform-pick-1-required-others-optional)
- [How Multi-Merchant Testing Works](#-how-multi-merchant-testing-works)
- [Security Boundaries & Policy Engine](#-security-boundaries--policy-engine)
- [Voice AI (ElevenLabs & Multilingual TTS)](#-voice-ai-elevenlabs--multilingual-tts)
- [API Endpoints Summary](#-api-endpoints-summary)
- [Conclusion](#-conclusion)

---

## 🎯 Overview & What This System Does

This platform demonstrates a complete **Autonomous Agentic Commerce** workflow where an AI agent acts on behalf of a user to discover, verify, authorize, and purchase goods across multiple independent merchant backends:

1. **Natural Language Intent Parsing**: The user speaks or types queries in English or Hindi (e.g., *"Order 1 Chicken Biryani from Zomato and buy a React course under ₹5,000"*).
2. **Autonomous Tool Calling**: Gemini 2.0 Flash coordinates multi-step tool calls to query catalogs across active stores, verify live stock and pricing, and draft orders.
3. **Strict Policy Engine & Spending Limits**: An independent backend security layer enforces auto-approval thresholds (e.g., auto-pay orders under ₹3,000, require manual confirmation for higher amounts, block orders exceeding overall limits).
4. **Cryptographic Payment Verification**: Generates Razorpay Test Mode orders and validates payments via server-side HMAC SHA256 signature verification.
5. **Real-time Activity Trace & Voice Feedback**: Visual step-by-step reasoning trace in the UI combined with natural ElevenLabs audio feedback in English and Hindi.

---

## 🏗️ System Architecture

```text
                                     USER
                         (Voice Input / Text Query)
                                       │
                                       ▼
                       +───────────────────────────────+
                       │   BUYER AGENT UI (Port 5174)  │
                       │   • Real-time Activity Trace  │
                       │   • Voice Recognition & Audio │
                       │   • Policy & Ledger Controls  │
                       +───────────────────────────────+
                                       │
                                       │ POST /api/agent/purchase
                                       ▼
                       +───────────────────────────────+
                       │   BUYER AGENT BACKEND (8001)  │
                       │   • Gemini 2.0 Reasoning Loop │
                       │   • Policy Engine & Security  │
                       │   • ElevenLabs Multilingual   │
                       +───────────────────────────────+
                                       │
                ┌──────────────────────┼──────────────────────┐
                │                      │                      │
                ▼                      ▼                      ▼
    +──────────────────────+ +───────────────────+ +────────────────────+
    │   Course Platform    │ │ E-Commerce Store  │ │    Zomato Food     │
    │  (Port 8000 / 5173)  │ │(Port 8002 / 5175) │ │ (Port 8003 / 5176) │
    │     [MERCHANT 1]     │ │   [MERCHANT 2]    │ │    [MERCHANT 3]    │
    +──────────────────────+ +───────────────────+ +────────────────────+
                │                      │                      │
                └──────────────────────┼──────────────────────┘
                                       │
                                       ▼
                          Razorpay Test Mode Checkout
                                       │
                                       ▼
                          Cryptographic HMAC SHA256
                           Verification & Invoicing
```

---

## 📂 Repository Structure & Requirements

```text
.
├── Buying Agent/              # 🔴 REQUIRED: Core AI Agent Brain & UI
│   ├── backend/               # Express API, Gemini loop, Policy Engine (Port 8001)
│   └── frontend/              # React + Vite interface & live trace (Port 5174)
│
├── course website/            # 🟢 MERCHANT OPTION 1: Education Platform
│   ├── backend/               # Express API, Course Catalog, Razorpay (Port 8000)
│   └── frontend/              # Course store UI & enrollment view (Port 5173)
│
├── ecommerce/                 # 🟢 MERCHANT OPTION 2: Electronics & Retail Store
│   ├── backend/               # Express API, Product Catalog, Razorpay (Port 8002)
│   └── frontend/              # Tech store UI & order status (Port 5175)
│
└── zomato/                    # 🟢 MERCHANT OPTION 3: Food Delivery Platform
    ├── backend/               # Express API, Restaurant Dishes, Razorpay (Port 8003)
    └── frontend/              # Food ordering UI & live order status (Port 5176)
```

### 📋 Setup Requirements:
- **`Buying Agent`**: **MANDATORY (Required)** — Contains the agent reasoning logic, policy engine, voice synthesis, and control dashboard.
- **Merchant Directories**: **1 of 3 REQUIRED (Others OPTIONAL)**:
  - Run **`course website`** (Port 8000) OR **`ecommerce`** (Port 8002) OR **`zomato`** (Port 8003).
  - *Optional / Recommended:* Run 2 or all 3 merchants simultaneously to test multi-store agent basket checkout!

---

## 🔑 Environment Variables Reference

### 1. Buyer Agent Backend (`Buying Agent/backend/.env`) — **REQUIRED**

Create file `Buying Agent/backend/.env`:

| Variable | Required | Description | Example |
| :--- | :---: | :--- | :--- |
| `GEMINI_API_KEY` | **Yes** | Google Gemini API Key for autonomous reasoning | `AIzaSy...` |
| `RAZORPAY_KEY_ID` | **Yes** | Razorpay Test Key ID | `rzp_test_TWMrSC5dL0M41b` |
| `RAZORPAY_KEY_SECRET` | **Yes** | Razorpay Test Key Secret | `D7505A4iy6RtGyR12ulGOLCc` |
| `PORT` | No | Server port (Default: `8001`) | `8001` |
| `CLIENT_URL` | No | Buyer Frontend origin | `http://localhost:5174` |
| `MERCHANT_API_BASE` | No | Course Platform backend URL | `http://localhost:8000/api` |
| `ECOMMERCE_API_BASE` | No | E-Commerce backend URL | `http://localhost:8002/api` |
| `ZOMATO_API_BASE` | No | Zomato backend URL | `http://localhost:8003/api` |
| `ELEVENLABS_API_KEY` | Optional | ElevenLabs API key for high-fidelity voice | `sk_9c3a02...` |
| `ELEVENLABS_VOICE_ID` | Optional | ElevenLabs Voice ID (or instant cloned voice) | `EXAVITQu4vr4xnSDxMaL` |
| `ELEVENLABS_MODEL_ID`| Optional | Multilingual TTS model | `eleven_multilingual_v2` |

---

### 2. Course Platform Backend (`course website/backend/.env`) — **Merchant 1**

Create file `course website/backend/.env`:

| Variable | Required | Description | Default / Example |
| :--- | :---: | :--- | :--- |
| `RAZORPAY_KEY_ID` | **Yes** | Razorpay Test Key ID | `rzp_test_...` |
| `RAZORPAY_KEY_SECRET` | **Yes** | Razorpay Test Key Secret | `your_secret` |
| `PORT` | No | Server port | `8000` |
| `CLIENT_URL` | No | Merchant Frontend origin | `http://localhost:5173` |

---

### 3. E-Commerce Backend (`ecommerce/backend/.env`) — **Merchant 2**

Create file `ecommerce/backend/.env`:

| Variable | Required | Description | Default / Example |
| :--- | :---: | :--- | :--- |
| `RAZORPAY_KEY_ID` | **Yes** | Razorpay Test Key ID | `rzp_test_...` |
| `RAZORPAY_KEY_SECRET` | **Yes** | Razorpay Test Key Secret | `your_secret` |
| `PORT` | No | Server port | `8002` |
| `MERCHANT_NAME` | No | Store label | `Ecommerce` |

---

### 4. Zomato Food Backend (`zomato/backend/.env`) — **Merchant 3**

Create file `zomato/backend/.env`:

| Variable | Required | Description | Default / Example |
| :--- | :---: | :--- | :--- |
| `RAZORPAY_KEY_ID` | **Yes** | Razorpay Test Key ID | `rzp_test_...` |
| `RAZORPAY_KEY_SECRET` | **Yes** | Razorpay Test Key Secret | `your_secret` |
| `PORT` | No | Server port | `8003` |
| `APP_NAME` | No | Merchant label | `Zomato` |

---

## 🚀 Developer Setup & Quick Start

### Prerequisites
- **Node.js** v18+ installed
- Free **Google Gemini API Key** from [Google AI Studio](https://aistudio.google.com/app/apikey)
- Free **Razorpay Test Keys** from [Razorpay Dashboard](https://dashboard.razorpay.com/app/keys)

---

### 1. Mandatory: AI Buyer Agent Setup

Open two terminals for the Buyer Agent:

#### Terminal 1 — Buyer Agent Backend (Port 8001):
```bash
cd "Buying Agent/backend"
cp .env.example .env
# Fill in GEMINI_API_KEY, RAZORPAY_KEY_ID, and RAZORPAY_KEY_SECRET in .env
npm install
npm start
```

#### Terminal 2 — Buyer Agent Frontend (Port 5174):
```bash
cd "Buying Agent/frontend"
npm install
npm run dev
```

---

### 2. Select At Least 1 Merchant Platform (Pick 1 Required, Others Optional)

Choose one or more of the following merchant stores to run:

#### Option A: Course Website (Port 8000 / 5173)
```bash
# Backend (Terminal 3)
cd "course website/backend"
cp .env.example .env
npm install
npm start

# Frontend (Terminal 4 - Optional)
cd "course website/frontend"
npm install
npm run dev
```

#### Option B: E-Commerce Store (Port 8002 / 5175)
```bash
# Backend (Terminal 3)
cd "ecommerce/backend"
cp .env.example .env
npm install
npm start

# Frontend (Terminal 4 - Optional)
cd "ecommerce/frontend"
npm install
npm run dev
```

#### Option C: Zomato Food Delivery (Port 8003 / 5176)
```bash
# Backend (Terminal 3)
cd "zomato/backend"
cp .env.example .env
npm install
npm start

# Frontend (Terminal 4 - Optional)
cd "zomato/frontend"
npm install
npm run dev
```

---

## 🧪 How Multi-Merchant Testing Works

Once the Buyer Agent (`http://localhost:5174`) and at least 1 merchant backend are running, test various agent scenarios:

### Scenario 1: Single-Store Auto-Approval (< ₹3,000)
- **Prompt**: *"Buy me a Beginner Python course"* or *"Order a Pepperoni Pizza"*
- **Agent Action**:
  1. Searches catalog and verifies live price.
  2. Evaluates policy: Price < Auto-approval threshold.
  3. Automatically drafts order and executes test payment.
  4. Delivers natural spoken confirmation via ElevenLabs TTS.

### Scenario 2: High-Value Confirmation Gate (> ₹3,000)
- **Prompt**: *"Buy the Fullstack Masterclass for ₹4,999"*
- **Agent Action**:
  1. Identifies product and authoritative price.
  2. Policy Engine triggers `REQUIRES_USER_CONFIRMATION`.
  3. Displays interactive checkout modal for manual user approval before charging.

### Scenario 3: Spending Limit Rejection
- **Prompt**: *"Buy 50 Gaming Laptops for ₹500,000"*
- **Agent Action**:
  1. Policy Engine intercepts order: `AMOUNT_EXCEEDS_LIMIT`.
  2. Blocks order creation immediately with zero transaction side effects.

### Scenario 4: Cross-Store Multi-Item Basket (All 3 Stores Running)
- **Prompt**: *"Buy a Data Science course, an RGB keyboard, and order Chicken Biryani"*
- **Agent Action**:
  1. Concurrently queries all 3 active merchant backends (`8000`, `8002`, `8003`).
  2. Assembles multi-store cart and executes coordinated checkout.

---

## 🛡️ Security Boundaries & Policy Engine

1. **Independent Verification Layer**: The LLM is strictly the *reasoning* layer, never the financial authority. Prices and availability are always re-fetched server-side from authoritative merchant endpoints.
2. **Cryptographic Payment Integrity**: Razorpay payment signatures are validated using HMAC SHA256 with the server-held `RAZORPAY_KEY_SECRET`.
3. **Secret Isolation**: Sensitive API keys (`GEMINI_API_KEY`, `RAZORPAY_KEY_SECRET`, `ELEVENLABS_API_KEY`) remain strictly server-side and are never exposed in client bundles.
4. **Configurable Policy Limits**:
   - Single Transaction Auto-Approval Cap (Default: ₹3,000)
   - Daily Aggregate Spending Cap (Default: ₹25,000)
   - Merchant Whitelisting & Category Restrictions

---

## 🎙️ Voice AI (ElevenLabs & Multilingual TTS)

- **Bilingual Speech Synthesis**: Supports natural English and Hindi (`hi-IN`).
- **Resilient Fallback**: If a custom Voice ID encounters tier limitations (such as ElevenLabs Free-tier library voice limits), the service automatically retries using standard multilingual voices (`eleven_multilingual_v2`), ensuring seamless voice playback without degrading to robotic browser voices.
- **Personal VoiceLab Clones**: Users on free ElevenLabs accounts can create an Instant Voice Clone in their ElevenLabs dashboard and set `ELEVENLABS_VOICE_ID` in `.env`.

---

## 🔌 API Endpoints Summary

### Buyer Agent Backend (`http://localhost:8001`)
- `POST /api/agent/purchase` — Core natural language reasoning & purchase execution endpoint
- `POST /api/agent/voice/speak` — ElevenLabs multilingual TTS synthesis
- `POST /api/agent/verify-checkout` — Razorpay payment signature verification
- `GET /api/agent/orders` — User order history & status
- `GET /api/agent/audit-logs` — Security & policy decision trace logs
- `GET /api/agent/config` — Safe environment configuration status

### Merchant Backends (`8000`, `8002`, `8003`)
- `GET /api/products` — Catalog search (supports `query`, `category`, `maxPrice`)
- `GET /api/products/:id` — Authoritative single product detail
- `POST /api/orders` — Create Razorpay order
- `POST /api/orders/verify` — Verify HMAC SHA256 payment signature and confirm order

---

## 🏁 Conclusion

This project illustrates a production-ready blueprint for **Autonomous Agentic Commerce**:

- **Decoupled Intelligence & Authority**: The Gemini LLM acts purely as a reasoning agent, while authoritative financial decisions and payment executions are strictly governed by backend deterministic policy guardrails.
- **Pluggable Merchant Ecosystem**: Independent merchant backends (Courses, E-Commerce, Food/Zomato) can be easily attached, searched, and checked out within a single unified conversation.
- **Complete End-to-End Safety**: Built-in spending limits, manual confirmation thresholds for high-ticket orders, HMAC SHA256 payment verification, and real-time decision transparency ensure complete security and user control.
- **Multimodal Usability**: Seamless bilingual speech recognition and ElevenLabs text-to-speech bridge the gap between conversational AI and real-world transactions.