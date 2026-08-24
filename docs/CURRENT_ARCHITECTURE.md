# Current Architecture — AgentPay Autonomous Commerce

## Overview
AgentPay is a policy-governed autonomous commerce framework designed for Razorpay. It enables AI shopping agents to discover, evaluate, authorize, purchase, and pay for goods and digital services with zero human intervention whenever user spending policies permit, while enforcing strict backend security boundaries and deterministic policy enforcement.

```
┌────────────────────────────────────────────────────────────────┐
│                   React 19 Frontend Dashboard                  │
│   (Shopping Chat • Voice STT/TTS • Policies • Transactions)    │
└───────────────────────────────┬────────────────────────────────┘
                                │ JSON API
┌───────────────────────────────▼────────────────────────────────┐
│                  Express Backend Control Layer                 │
│                                                                │
│  ┌──────────────────┐  ┌────────────────┐  ┌────────────────┐  │
│  │ Gemini 3.6 Flash │  │  PolicyEngine  │  │ SpendingLedger │  │
│  │ (Intent Extract) │  │(Deterministic) │  │(Atomic Locking)│  │
│  └────────┬─────────┘  └───────┬────────┘  └───────┬────────┘  │
│           │                    │                   │           │
│  ┌────────▼────────────────────▼───────────────────▼────────┐  │
│  │                     Tools & Orchestrator                 │  │
│  │           (Search • Select • Validate • Order • Pay)     │  │
│  └─────────────────────────────┬────────────────────────────┘  │
│                                │                               │
│  ┌─────────────────────────────▼────────────────────────────┐  │
│  │                 RazorpayProvider Abstraction             │  │
│  │        (Test Cards • 3DS / Bank Mock • HMAC Signatures)  │  │
│  └─────────────────────────────┬────────────────────────────┘  │
└────────────────────────────────┼───────────────────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
┌────────▼──────────┐ ┌──────────▼────────┐ ┌────────────▼─────────┐
│ LearnHub (Courses)│ │TechGear (Hardware)│ │ FoodExpress (Zomato) │
│    Port 8000      │ │    Port 8002      │ │     Port 8003        │
└───────────────────┘ └───────────────────┘ └──────────────────────┘
```

## System Components

### 1. Frontend Client (`Buying Agent/frontend/`)
- **Framework**: React 19 + Vite 8
- **Audio Feedback**: ElevenLabs Multilingual TTS + Browser Web Speech API fallback
- **State Management**: React state hooks with persistent localStorage authentication tokens
- **Dashboards**:
  - `AuthorizationDashboard`: Policy controls, per-transaction limits, daily budgets, category toggles
  - `TransactionDashboard`: Status history, payment IDs, policy decision traces
  - `MerchantDashboard`: Merchant AI-commerce controls & autonomous limits

### 2. Backend Orchestration (`Buying Agent/backend/`)
- **Server**: Express 5 on Node.js
- **Database**: PostgreSQL 15 via `pg` connection pool
- **AI Intent Engine**: Gemini 3.6 Flash for structured JSON extraction with fallback regex heuristics
- **Policy Engine**: Deterministic authorization rules checking limits, daily spending, expiry, and categories
- **Spending Ledger**: Atomic spending reservations protected with PostgreSQL row-level locks (`SELECT ... FOR UPDATE`)
- **Razorpay Provider**: Clean abstraction over Razorpay REST API with test mode validation and HMAC SHA256 signature verification
