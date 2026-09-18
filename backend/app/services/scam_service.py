"""
FraudLens AI V2 — Scam Intelligence & Simulation Service
Analyzes Authorized Push Payment (APP) scams, impersonation, romance confidence scams,
investment schemes, and social engineering patterns.
"""

from typing import Dict, Any, List
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from app.models.transaction import Transaction, TransactionType, PaymentMethod
from app.models.account import Account
from app.models.beneficiary import Beneficiary
from app.models.v2_models import ScamIntelligenceRecord, ScamType


SCAM_PROFILES = {
    "AUTHORIZED_PUSH_PAYMENT": {
        "title": "Authorized Push Payment (APP) Scam",
        "description": "Victim is deceived into authorizing a direct bank transfer to a fraudster-controlled account.",
        "indicators": ["Newly added beneficiary within < 2 hours", "Rapid balance drain (> 70% in 1 day)", "Transfer via instant rail (UPI/IMPS)"],
        "typical_loss_inr": 85000,
        "coercion_type": "Authority deception or urgent invoice spoofing"
    },
    "IMPERSONATION_OFFICIAL": {
        "title": "Official / Law Enforcement Impersonation",
        "description": "Fraudster poses as tax agency, police, customs, or bank security officer demanding immediate fine payment or safe-keeping deposit.",
        "indicators": ["Threat of arrest or immediate account seizure", "Instructed to keep line open during transfer", "Off-hours transfer under extreme duress"],
        "typical_loss_inr": 150000,
        "coercion_type": "Legal intimidation and urgency pressure"
    },
    "ROMANCE_CONFIDENCE": {
        "title": "Romance & Confidence Scheme",
        "description": "Emotional manipulation leading to repeated emergency funds requests for medical bills, travel tickets, or crypto investments.",
        "indicators": ["Gradual increase in transfer amounts", "Beneficiary location mismatch with victim claims", "Recurrent round-figure transfers"],
        "typical_loss_inr": 320000,
        "coercion_type": "Emotional grooming and fabricated emergency"
    },
    "INVESTMENT_PONZI": {
        "title": "High-Yield Investment / Crypto Scam",
        "description": "Promises of 300%+ guaranteed daily returns via fake trading dashboards or telegram groups.",
        "indicators": ["Small initial deposit followed by huge transfer", "Multiple victims paying into same mule UPI", "Keywords: VIP Club, Arbitrage, Guaranteed Daily ROI"],
        "typical_loss_inr": 210000,
        "coercion_type": "Greed, FOMO, and artificial dashboard profit manipulation"
    },
    "TECH_SUPPORT_TAKEOVER": {
        "title": "Remote Tech Support Screen-Sharing Scam",
        "description": "Fraudster guides victim to install remote desktop tools (AnyDesk, TeamViewer) to fix a fake virus and steals credentials.",
        "indicators": ["Unusual browser agent or active remote desktop fingerprint", "Simultaneous login while user is on voice call", "Immediate password change attempt"],
        "typical_loss_inr": 95000,
        "coercion_type": "Technical confusion and active device control"
    }
}


def get_scam_intelligence_overview(db: Session) -> Dict[str, Any]:
    """Retrieve overview of ongoing scam campaigns and threat landscape."""
    records = db.query(ScamIntelligenceRecord).all()
    
    scam_breakdown = []
    total_prevented_loss = 14250000.0 # INR
    total_intercepted = 284

    for key, profile in SCAM_PROFILES.items():
        scam_breakdown.append({
            "scam_type": key,
            "title": profile["title"],
            "description": profile["description"],
            "indicators": profile["indicators"],
            "avg_loss": profile["typical_loss_inr"],
            "coercion_type": profile["coercion_type"],
            "current_threat_level": "CRITICAL" if key in ["AUTHORIZED_PUSH_PAYMENT", "IMPERSONATION_OFFICIAL"] else "HIGH",
            "active_campaigns": 3 if key == "AUTHORIZED_PUSH_PAYMENT" else 1,
        })

    return {
        "total_intercepted_scams": total_intercepted,
        "total_prevented_loss_inr": total_prevented_loss,
        "scam_types": scam_breakdown,
        "active_advisories": [
            {
                "id": "ADV-2026-01",
                "title": "Fake Digital Arrest & Police Video Call Scam Wave",
                "severity": "CRITICAL",
                "recommended_delay": "Enforce mandatory 4-hour cooldown on transfers > ₹50,000 to first-time beneficiaries."
            },
            {
                "id": "ADV-2026-02",
                "title": "Telegram Part-Time Rating / Crypto Task Scheme",
                "severity": "HIGH",
                "recommended_delay": "Flag any accounts receiving multiple deposits from different P2P senders within 30 minutes."
            }
        ]
    }


def simulate_scam_detection(
    db: Session,
    scam_type: str,
    victim_account_id: int,
    amount: float,
    beneficiary_name: str,
    urgency_trigger: str,
    coercive_channel: str
) -> Dict[str, Any]:
    """
    Simulates real-time behavioral heuristics for scam detection.
    Evaluates rapid beneficiary addition, extreme urgency, and high-loss indicators.
    """
    account = db.query(Account).filter(Account.id == victim_account_id).first()
    balance = account.balance if account else 100000.0

    red_flags = []
    risk_score = 45.0 # baseline

    # Check ratio of transfer to current account balance
    balance_depletion_ratio = amount / max(balance, 1.0)
    if balance_depletion_ratio > 0.6:
        red_flags.append(f"Severe liquidity drain: Transaction represents {round(balance_depletion_ratio*100, 1)}% of total account funds")
        risk_score += 25.0

    if urgency_trigger in ["IMMEDIATE_RELEASE", "POLICE_THREAT", "UNDER_DURESS"]:
        red_flags.append(f"High-pressure psychological trigger detected: {urgency_trigger}")
        risk_score += 20.0

    if coercive_channel in ["WHATSAPP_CALL", "TELEGRAM_BOT", "SCREEN_SHARE"]:
        red_flags.append(f"Unsanctioned high-risk communication channel: {coercive_channel}")
        risk_score += 15.0

    profile = SCAM_PROFILES.get(scam_type, SCAM_PROFILES["AUTHORIZED_PUSH_PAYMENT"])

    final_score = min(round(risk_score, 1), 98.5)
    scam_detected = final_score >= 70.0

    interception_action = (
        "MANDATORY_CALL_BACK_CHALLENGE" if final_score > 85.0 else
        "STEP_UP_BIOMETRIC_AND_2HR_DELAY" if final_score >= 70.0 else
        "STANDARD_MONITORING"
    )

    return {
        "scam_detected": scam_detected,
        "risk_score": final_score,
        "scam_type": scam_type,
        "scam_title": profile["title"],
        "confidence": round(final_score / 100.0, 2),
        "behavioral_red_flags": red_flags,
        "coercion_level": "EXTREME" if final_score > 80 else "MODERATE",
        "recommended_interception": interception_action,
        "simulated_at": datetime.utcnow().isoformat()
    }
