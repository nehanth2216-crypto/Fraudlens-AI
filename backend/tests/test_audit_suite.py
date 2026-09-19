"""
FraudLens AI — Comprehensive Production Audit & Test Suite
Tests all endpoints, authentication, real ML inference, dashboard,
alerts, AI Copilot, explainability, and live deployment connectivity.
"""

import sys
import os
import urllib.request
import json
import time

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

# Target base URL (defaults to live Render backend)
BASE_URL = os.environ.get("TEST_API_URL", "https://fraudlens-ai-1-pfvy.onrender.com")
TIMEOUT = 30

passed_tests = []
failed_tests = []

def warmup_server():
    print(f"⏳ Warming up live server at {BASE_URL} (allowing cold-start wake up)...", end=" ", flush=True)
    t0 = time.time()
    for attempt in range(4):
        try:
            req = urllib.request.Request(f"{BASE_URL}/health", headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=60) as res:
                print(f"🔥 Server is awake! ({time.time()-t0:.1f}s)\n")
                return True
        except Exception as e:
            print(f"(retry {attempt+1})...", end=" ", flush=True)
            time.sleep(2)
    print("❌ Failed to wake up server")
    return False

def run_test(name, fn):
    print(f"👉 Testing: {name}...", end=" ", flush=True)
    t0 = time.time()
    try:
        fn()
        elapsed = time.time() - t0
        print(f"✅ PASSED ({elapsed:.2f}s)")
        passed_tests.append(name)
    except Exception as e:
        elapsed = time.time() - t0
        print(f"❌ FAILED ({elapsed:.2f}s): {e}")
        failed_tests.append((name, str(e)))

token = None

# 1. Health Check
def test_health():
    url = f"{BASE_URL}/health"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=TIMEOUT) as res:
        assert res.status == 200, f"Expected 200, got {res.status}"
        data = json.loads(res.read().decode())
        assert data.get("status") == "healthy", f"Status not healthy: {data}"
        assert "FraudLens" in data.get("service", ""), f"Service name mismatch: {data}"

# 2. Interactive Swagger Docs
def test_docs():
    url = f"{BASE_URL}/docs"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=TIMEOUT) as res:
        assert res.status == 200, f"Expected 200, got {res.status}"

# 3. Authentication (Admin Login)
def test_auth_login():
    global token
    url = f"{BASE_URL}/api/auth/login"
    payload = json.dumps({"email": "admin@fraudlens.ai", "password": "admin123"}).encode()
    req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=TIMEOUT) as res:
        assert res.status == 200
        data = json.loads(res.read().decode())
        token = data.get("access_token")
        assert token, "No access token received"
        assert data.get("user", {}).get("role") == "ADMIN"

# 4. User Profile (Me endpoint)
def test_auth_me():
    url = f"{BASE_URL}/api/auth/me"
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}"})
    with urllib.request.urlopen(req, timeout=TIMEOUT) as res:
        assert res.status == 200
        data = json.loads(res.read().decode())
        assert data.get("email") == "admin@fraudlens.ai"

# 5. Dashboard Overview (Live Data)
def test_dashboard_overview():
    url = f"{BASE_URL}/api/dashboard/overview"
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}"})
    with urllib.request.urlopen(req, timeout=TIMEOUT) as res:
        assert res.status == 200
        data = json.loads(res.read().decode())
        assert "total_transactions" in data
        assert data["total_transactions"] > 0, "No transactions in database"
        assert "fraud_detected" in data

# 6. Transactions List
def test_transactions_list():
    url = f"{BASE_URL}/api/transactions?limit=10"
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}"})
    with urllib.request.urlopen(req, timeout=TIMEOUT) as res:
        assert res.status == 200
        data = json.loads(res.read().decode())
        assert isinstance(data, list)
        assert len(data) > 0, "Expected non-empty transactions list"
        first = data[0]
        assert "transaction_id" in first
        assert "risk_score" in first

# 7. Real ML Fraud Prediction Pipeline
def test_fraud_analysis():
    url = f"{BASE_URL}/api/fraud/analyze"
    payload = json.dumps({
        "account_id": 1,
        "amount": 95000.0,
        "payment_method": "UPI",
        "transaction_type": "TRANSFER",
        "device_id": 1,
        "location_id": 1,
    }).encode()
    req = urllib.request.Request(url, data=payload, headers={
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}"
    })
    with urllib.request.urlopen(req, timeout=TIMEOUT) as res:
        assert res.status == 200
        data = json.loads(res.read().decode())
        assert "risk_score" in data, "No risk_score in response"
        assert "fraud_probability" in data, "No fraud_probability in response"
        assert "reasons" in data, "No reasons in response"
        assert data.get("risk_level") in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]

# 8. Alerts System
def test_alerts_list():
    url = f"{BASE_URL}/api/alerts?limit=10"
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}"})
    with urllib.request.urlopen(req, timeout=TIMEOUT) as res:
        assert res.status == 200
        data = json.loads(res.read().decode())
        assert isinstance(data, list)
        assert len(data) > 0, "Expected alerts in database"

# 9. Dual-Mode AI Copilot
def test_copilot_chat():
    url = f"{BASE_URL}/api/v2/copilot/chat"
    payload = json.dumps({
        "message": "Why was the recent high risk transaction flagged?",
        "mode": "ANALYST"
    }).encode()
    req = urllib.request.Request(url, data=payload, headers={
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}"
    })
    with urllib.request.urlopen(req, timeout=TIMEOUT) as res:
        assert res.status == 200
        data = json.loads(res.read().decode())
        assert "reply" in data, "No reply from AI Copilot"
        assert "suggested_actions" in data

# 10. Explainable AI Attribution
def test_xai_attribution():
    url = f"{BASE_URL}/api/v2/xai/attribution/1"
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}"})
    with urllib.request.urlopen(req, timeout=TIMEOUT) as res:
        assert res.status == 200
        data = json.loads(res.read().decode())
        assert "waterfall_attributions" in data or "top_positive_drivers" in data or "model_confidence" in data

# 11. CORS Preflight
def test_cors_preflight():
    url = f"{BASE_URL}/api/auth/login"
    req = urllib.request.Request(url, headers={
        "Origin": "https://fraudlens-ai-sable.vercel.app",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "content-type",
    }, method="OPTIONS")
    with urllib.request.urlopen(req, timeout=TIMEOUT) as res:
        assert res.status == 200
        allow_origin = res.headers.get("access-control-allow-origin")
        assert allow_origin == "https://fraudlens-ai-sable.vercel.app" or allow_origin == "*", f"Unexpected origin header: {allow_origin}"

# 12. Frontend Live Reachability
def test_frontend_live():
    url = "https://fraudlens-ai-sable.vercel.app"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=TIMEOUT) as res:
        assert res.status == 200
        html = res.read().decode()
        assert "<html" in html.lower()

if __name__ == "__main__":
    print(f"==================================================")
    print(f"  FraudLens AI Production Audit Suite")
    print(f"  Target: {BASE_URL}")
    print(f"==================================================")

    warmup_server()

    run_test("Health Check (GET /health)", test_health)
    run_test("API Documentation (GET /docs)", test_docs)
    run_test("Authentication Login (POST /api/auth/login)", test_auth_login)
    run_test("User Profile (GET /api/auth/me)", test_auth_me)
    run_test("Dashboard Telemetry (GET /api/dashboard/overview)", test_dashboard_overview)
    run_test("Transactions List (GET /api/transactions)", test_transactions_list)
    run_test("ML Fraud Prediction (POST /api/fraud/analyze)", test_fraud_analysis)
    run_test("Alerts Stream (GET /api/alerts)", test_alerts_list)
    run_test("AI Copilot Forensics (POST /api/v2/copilot/chat)", test_copilot_chat)
    run_test("Explainable AI (GET /api/v2/xai/attribution/1)", test_xai_attribution)
    run_test("CORS Preflight (OPTIONS from Vercel Origin)", test_cors_preflight)
    run_test("Live Frontend Reachability (Vercel App)", test_frontend_live)

    print(f"\n==================================================")
    print(f"  TEST SUMMARY: {len(passed_tests)} Passed, {len(failed_tests)} Failed")
    print(f"==================================================")

    if failed_tests:
        sys.exit(1)
    else:
        print("🎉 ALL PRODUCTION AUDIT CHECKS PASSED SUCCESSFULLY!")
        sys.exit(0)
