<div align="center">

# 🔍 FraudLens AI

### Intelligent Real-Time Financial Fraud Detection & Investigation Platform

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![XGBoost](https://img.shields.io/badge/XGBoost-2.4-FF6600?style=for-the-badge)](https://xgboost.ai)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-black?style=for-the-badge&logo=vercel)](https://fraudlens-ai-sable.vercel.app)
[![API Docs](https://img.shields.io/badge/API%20Docs-Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://fraudlens-ai-1-pfvy.onrender.com/docs)

<br/>

### 🌐 [Live Web App: fraudlens-ai-sable.vercel.app](https://fraudlens-ai-sable.vercel.app)
**Swagger API Docs:** [fraudlens-ai-1-pfvy.onrender.com/docs](https://fraudlens-ai-1-pfvy.onrender.com/docs)  
**Demo Account:** `admin@fraudlens.ai` &nbsp;|&nbsp; **Password:** `admin123`

---

> **FraudLens AI V2** is a production-grade, full-stack financial crime intelligence platform featuring real-time ML fraud scoring, multi-hop network graph analysis, explainable AI, and 10 enterprise-grade investigation modules.

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [10 Enterprise Pillars](#-10-enterprise-pillars)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Quick Start](#-quick-start)
- [Demo Credentials](#-demo-credentials)
- [API Reference](#-api-reference)
- [ML Architecture](#-ml-architecture)
- [Environment Variables](#-environment-variables)
- [Database Setup](#-database-setup)

---

## 🌐 Overview

FraudLens AI is a complete, end-to-end fraud intelligence platform built for financial institutions, fintechs, and payment processors. It goes far beyond basic anomaly detection — combining ML models, rule-based risk engines, behavioral analysis, and an AI copilot into a single investigation command center.

**Key Capabilities:**
- ⚡ **Real-time** transaction risk scoring via XGBoost + Isolation Forest
- 🕸️ **Multi-hop fraud network** graph with money mule syndicate detection
- 🧠 **Explainable AI** with SHAP-style waterfall attribution
- 🤖 **Dual-mode AI Copilot** — Fraud Analyst Forensics & Customer Support Agent
- 📋 **FinCEN SAR** (Form 111) automated narrative generator
- 🔐 **JWT-based RBAC** with 4 role tiers (Admin, Analyst, Investigator, Viewer)
- 📡 **WebSocket** live alert streaming

---

## 🛡️ 10 Enterprise Pillars

| # | Module | Route | Key Features |
|---|--------|--------|-------------|
| 1 | **Fraud & Scam Prevention** | `/scam-prevention` | APP scams, UPI VPA surveillance, RAT detection, mule account velocity scoring, interactive scam simulator |
| 2 | **Payment Failure Diagnosis** | `/payment-failures` | 4-domain decline taxonomy, root-cause decomposition, smart retry orchestrator with backoff & rail alternatives |
| 3 | **Payment & Refund Recovery** | `/payment-recovery` | Compelling Evidence 3.0 dossier compiler, chargeback representment, refund abuse / wardrobing detection |
| 4 | **Account Takeover (ATO)** | `/account-takeover` | Impossible travel geovelocity, credential stuffing detection, device fingerprint anomalies, session killswitch |
| 5 | **Customer Complaint Intelligence** | `/customer-complaints` | NLP sentiment scoring, CFPB / EFTA Reg E / Ombudsman regulatory risk flags, auto-escalation to legal |
| 6 | **Merchant Health & Risk** | `/merchant-health` | CTR monitoring (0.9% warning / 1.5% breach), bust-out risk velocity, payout reserve & freeze controls |
| 7 | **Fraud Network Analysis** | `/fraud-network` | Interactive multi-hop entity graph, shared device/IP/card clusters, money mule syndicate detection |
| 8 | **Explainable AI (XAI)** | `/explainable-ai` | SHAP waterfall attribution, feature importance ranking, counterfactual what-if simulation sandbox |
| 9 | **AI Copilot (Dual-Mode)** | `/copilot` | Fraud Analyst Forensics Mode (MITRE ATT&CK, SAR drafts) + Customer Support Mode (plain-language scripts) |
| 10 | **Investigation & Audit** | `/investigations` | Case management lifecycle, evidence locker (SHA-256 integrity), FinCEN SAR generator, immutable audit trail |

---

## 🧰 Tech Stack

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| **FastAPI** | 0.115+ | REST API + WebSocket server |
| **SQLAlchemy** | 2.0 | ORM (PostgreSQL & SQLite) |
| **Pydantic v2** | 2.x | Schema validation |
| **XGBoost** | 2.4 | Supervised fraud classification |
| **Scikit-Learn** | 1.5 | Isolation Forest anomaly detection |
| **VADER / NLP** | — | Complaint sentiment analysis |
| **JWT / bcrypt** | — | Auth & password hashing |

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 19 | UI framework |
| **Vite** | 6 | Build tool & dev server |
| **Tailwind CSS** | 4 | Utility-first styling |
| **Recharts** | 2.x | Charts & data visualization |
| **Lucide React** | — | Icon system |
| **React Router** | 7 | Client-side routing |

### Database
| Mode | Technology | Notes |
|------|-----------|-------|
| **Production** | PostgreSQL 16+ | Recommended |
| **Development** | SQLite (auto-fallback) | Zero-config, no setup needed |

---

## 📁 Project Structure

```
fraudlens-ai/
├── backend/
│   ├── app/
│   │   ├── api/                  # FastAPI routers
│   │   │   ├── auth.py           # JWT authentication
│   │   │   ├── transactions.py   # Transaction endpoints
│   │   │   ├── alerts.py         # Fraud alert endpoints
│   │   │   ├── fraud.py          # Core fraud endpoints
│   │   │   └── v2_routes.py      # All 10 V2 enterprise routes
│   │   ├── models/               # SQLAlchemy ORM models
│   │   │   ├── user.py
│   │   │   ├── transaction.py
│   │   │   ├── investigation.py
│   │   │   └── v2_models.py      # V2 enterprise models
│   │   ├── services/             # Business logic layer
│   │   │   ├── scam_service.py
│   │   │   ├── payment_diagnostics_service.py
│   │   │   ├── recovery_service.py
│   │   │   ├── ato_service.py
│   │   │   ├── complaint_service.py
│   │   │   ├── merchant_risk_service.py
│   │   │   ├── network_service.py
│   │   │   ├── xai_service.py
│   │   │   ├── copilot_service.py
│   │   │   └── investigation_service.py
│   │   ├── schemas/              # Pydantic request/response schemas
│   │   ├── config.py             # Environment settings
│   │   ├── database.py           # Engine + session factory
│   │   └── main.py               # FastAPI app entrypoint
│   ├── ml/
│   │   ├── supervised_model.py   # XGBoost classifier
│   │   ├── anomaly_model.py      # Isolation Forest
│   │   ├── behavioral_model.py   # Velocity & pattern scoring
│   │   ├── risk_engine.py        # Weighted ensemble scorer
│   │   ├── rule_engine.py        # Rule-based flag engine
│   │   ├── explainability.py     # SHAP attribution
│   │   └── feature_engineering.py
│   ├── scripts/
│   │   ├── seed_data.py          # V1 seed (users, txns, alerts)
│   │   └── seed_v2.py            # V2 seed (all 10 enterprise tables)
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── pages/                # One page per module
│   │   │   ├── Dashboard.jsx
│   │   │   ├── ScamPrevention.jsx
│   │   │   ├── PaymentFailureDiagnosis.jsx
│   │   │   ├── PaymentRecovery.jsx
│   │   │   ├── AccountTakeover.jsx
│   │   │   ├── CustomerComplaints.jsx
│   │   │   ├── MerchantHealth.jsx
│   │   │   ├── FraudNetwork.jsx
│   │   │   ├── ExplainableAI.jsx
│   │   │   ├── AICopilot.jsx
│   │   │   ├── Investigations.jsx
│   │   │   ├── Transactions.jsx
│   │   │   ├── Alerts.jsx
│   │   │   └── Analytics.jsx
│   │   ├── components/
│   │   │   └── layout/Layout.jsx  # Sidebar + nav shell
│   │   ├── context/
│   │   │   └── AuthContext.jsx    # JWT auth state
│   │   ├── api/
│   │   │   └── client.js          # Axios API modules
│   │   ├── App.jsx                # Router config
│   │   └── index.css              # Global Tailwind styles
│   ├── package.json
│   └── vite.config.js
│
├── .env.example                   # Safe config template (no secrets)
├── .gitignore
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 20+
- Git

### 1. Clone the repository
```bash
git clone https://github.com/nehanth2216-crypto/Fraudlens-AI.git
cd Fraudlens-AI
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env — minimum required: JWT_SECRET
# PostgreSQL is optional; SQLite is used automatically as fallback
```

### 3. Backend setup
```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Seed the database (creates all tables + demo data)
python scripts/seed_data.py
python scripts/seed_v2.py

# Start the API server
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

> API docs available at: **http://127.0.0.1:8000/docs**

### 4. Frontend setup
```bash
cd frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

> Frontend available at: **http://127.0.0.1:5173**

---

## 🔑 Demo Credentials

| Role | Email | Password | Access Level |
|------|-------|----------|-------------|
| **Admin** | `admin@fraudlens.ai` | `admin123` | Full system access |
| **Fraud Analyst** | `analyst@fraudlens.ai` | `analyst123` | All modules, read-write |
| **Investigator** | `investigator@fraudlens.ai` | `invest123` | Investigation & SAR modules |
| **Viewer** | `viewer@fraudlens.ai` | `viewer123` | Read-only dashboard |

---

## 📡 API Reference

### Authentication
```http
POST /api/auth/login
Content-Type: application/json

{ "email": "admin@fraudlens.ai", "password": "admin123" }
```

### V2 Enterprise Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v2/scams` | Scam intelligence records |
| `GET` | `/api/v2/payment-failures` | Payment failure diagnoses |
| `GET` | `/api/v2/recovery` | Recovery & dispute cases |
| `GET` | `/api/v2/ato/events` | ATO detection events |
| `GET` | `/api/v2/complaints` | Customer complaint feed |
| `GET` | `/api/v2/merchants/risk` | Merchant risk profiles |
| `GET` | `/api/v2/network/graph` | Fraud network entity graph |
| `GET` | `/api/v2/xai/explain/{transaction_id}` | SHAP explanation for transaction |
| `POST` | `/api/v2/copilot/query` | AI Copilot query (dual-mode) |
| `GET` | `/api/v2/investigations` | Investigation case list |
| `POST` | `/api/v2/investigations/{id}/sar` | Generate FinCEN SAR report |

> Full interactive docs: **http://127.0.0.1:8000/docs**

---

## 🧠 ML Architecture

```
Transaction Input
       │
       ▼
┌─────────────────────────────────────────┐
│          Feature Engineering            │
│  (velocity, geo-distance, time-of-day,  │
│   amount z-score, device entropy)       │
└──────────────┬──────────────────────────┘
               │
       ┌───────┴────────┐
       │                │
       ▼                ▼
┌──────────────┐  ┌─────────────────┐
│  XGBoost     │  │ Isolation Forest│
│  Classifier  │  │ Anomaly Scorer  │
│  (35% weight)│  │  (25% weight)   │
└──────┬───────┘  └───────┬─────────┘
       │                  │
       └────────┬─────────┘
                │
       ┌────────┴──────────┐
       │  Behavioral Model │  (25% weight)
       │  Velocity scoring │
       └────────┬──────────┘
                │
       ┌────────┴──────────┐
       │   Rule Engine     │  (15% weight)
       │  Flag-based rules │
       └────────┬──────────┘
                │
                ▼
       ┌────────────────┐
       │  Risk Engine   │
       │  (0–100 score) │
       └────────────────┘
                │
       ┌────────┴────────┐
       │  SHAP Explainer │
       │ (feature attrs) │
       └─────────────────┘
```

**Risk Score Thresholds:**
- 🟢 `0–29` — Low Risk
- 🟡 `30–59` — Medium Risk
- 🟠 `60–79` — High Risk
- 🔴 `80–100` — Critical / Block

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env` and configure:

```env
# Database (leave as-is for SQLite auto-fallback)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/fraudlens

# JWT (CHANGE THIS in production)
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRY_MINUTES=480

# AI Copilot (optional — leave empty for rule-based mode)
AI_API_KEY=

# ML Risk Engine Weights (must sum to 1.0)
RISK_WEIGHT_ML=0.35
RISK_WEIGHT_ANOMALY=0.25
RISK_WEIGHT_BEHAVIOR=0.25
RISK_WEIGHT_RULES=0.15

# Risk Thresholds
RISK_THRESHOLD_LOW=30
RISK_THRESHOLD_MEDIUM=60
RISK_THRESHOLD_HIGH=80
```

---

## 🗄️ Database Setup

### Option A — SQLite (Zero Config, Default)
No setup needed. The backend automatically creates `fraudlens.db` in the project root when PostgreSQL is unavailable.

### Option B — PostgreSQL (Production)
```sql
CREATE DATABASE fraudlens;
CREATE USER fraudlens_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE fraudlens TO fraudlens_user;
```

Then update `.env`:
```env
DATABASE_URL=postgresql://fraudlens_user:your_password@localhost:5432/fraudlens
```

---

## 📄 License

This project is licensed under the **MIT License**.

---

<div align="center">

Built with ❤️ for the modern financial crime intelligence era.

**FraudLens AI** — *See Through Every Transaction.*

</div>
