"""
FraudLens AI V2 — Customer Complaint Intelligence Service
NLP sentiment scoring, regulatory compliance risk detection (CFPB, EFTA Reg E, RBI Ombudsman),
and dispute triage automation.
"""

from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import re
import uuid

from app.models.customer import Customer
from app.models.transaction import Transaction
from app.models.v2_models import (
    CustomerComplaint, ComplaintCategory, ComplaintUrgency
)


REGULATORY_KEYWORDS = [
    "cfpb", "reg e", "efta", "consumer financial protection", "ombudsman",
    "rbi", "fca", "lawyer", "attorney", "legal action", "police report",
    "fincen", "formal complaint", "court", "lawsuit", "unauthorized debit"
]

CATEGORY_PATTERNS = {
    ComplaintCategory.UNAUTHORIZED_TRANSACTION: [
        "unauthorized", "didn't make this", "did not authorize", "fraudulent charge", "card skimmed", "stolen"
    ],
    ComplaintCategory.SCAM_VICTIM_REPORT: [
        "scammed", "conned", "impersonator", "fake police", "blackmailed", "tricked into sending", "telegram investment"
    ],
    ComplaintCategory.DOUBLE_DEBIT: [
        "charged twice", "double debit", "deducted two times", "duplicate charge", "double charged"
    ],
    ComplaintCategory.SERVICE_NOT_DELIVERED: [
        "never received", "merchandise not delivered", "order missing", "seller ghosted", "undelivered"
    ],
    ComplaintCategory.ACCOUNT_UNFAIRLY_LOCKED: [
        "account locked", "cannot access my money", "unfreeze my funds", "blocked without reason", "unfair freeze"
    ]
}


def analyze_complaint_text(body: str) -> Dict[str, Any]:
    """Extracts sentiment polarity, regulatory exposure, and categories from complaint text."""
    lower_body = body.lower()

    # 1. Regulatory check
    has_regulatory_flag = any(kw in lower_body for kw in REGULATORY_KEYWORDS)

    # 2. Categorization
    matched_cat = ComplaintCategory.UNAUTHORIZED_TRANSACTION
    for cat, keywords in CATEGORY_PATTERNS.items():
        if any(kw in lower_body for kw in keywords):
            matched_cat = cat
            break

    # 3. Sentiment score estimation
    negative_words = ["furious", "unacceptable", "scam", "fraud", "stolen", "lawyer", "terrible", "worst", "illegal", "threat"]
    neg_count = sum(1 for w in negative_words if w in lower_body)
    sentiment = max(-1.0, -0.2 - (neg_count * 0.15))

    # 4. Urgency
    if has_regulatory_flag or neg_count >= 3:
        urgency = ComplaintUrgency.REGULATORY_ESCALATION
    elif neg_count >= 2 or "immediate" in lower_body or "urgent" in lower_body:
        urgency = ComplaintUrgency.HIGH
    else:
        urgency = ComplaintUrgency.MEDIUM

    # 5. Suggested resolution
    if matched_cat == ComplaintCategory.UNAUTHORIZED_TRANSACTION:
        suggested = "Immediately initiate provisional credit under Reg E / RBI guideline, freeze compromised card, and generate fraud investigation ticket."
    elif matched_cat == ComplaintCategory.SCAM_VICTIM_REPORT:
        suggested = "Issue immediate recall request on beneficiary rail, file digital crime report payload, and provide victim support helpline resources."
    elif matched_cat == ComplaintCategory.DOUBLE_DEBIT:
        suggested = "Check gateway settlement logs for duplicate authorization hold; automatically release second hold within 2 business hours."
    else:
        suggested = "Assign senior dispute specialist for expedited 24-hour SLA review."

    return {
        "category": matched_cat.value,
        "urgency": urgency.value,
        "sentiment_score": round(sentiment, 2),
        "regulatory_exposure": has_regulatory_flag,
        "key_themes": [w for w in negative_words if w in lower_body][:4],
        "suggested_action": suggested
    }


def list_complaints(db: Session, limit: int = 50) -> List[Dict[str, Any]]:
    """Returns complaints stream with regulatory risk tags."""
    complaints = db.query(CustomerComplaint).order_by(CustomerComplaint.created_at.desc()).limit(limit).all()

    if not complaints:
        # Pre-seed rich demo dataset
        return [
            {
                "id": 1,
                "complaint_id": "CMP-2026-1049",
                "customer_name": "Aarav Sharma",
                "channel": "REGULATOR_PORTAL",
                "subject": "Formal Complaint regarding ₹75,000 unauthorized UPI debit and CFPB escalation",
                "body": "I woke up to find ₹75,000 debited via UPI while I was asleep. Your support told me to wait 7 days. This is an explicit violation of Reg E. I will escalate to the Banking Ombudsman and CFPB immediately if provisional credit is not issued today.",
                "category": "UNAUTHORIZED_TRANSACTION",
                "urgency": "REGULATORY_ESCALATION",
                "sentiment_score": -0.92,
                "regulatory_flag": True,
                "status": "ESCALATED",
                "suggested_resolution": "Immediately issue provisional credit of ₹75,000, secure account tokens, and request transaction log from NPCI switch.",
                "created_at": (datetime.utcnow() - timedelta(hours=2)).isoformat()
            },
            {
                "id": 2,
                "complaint_id": "CMP-2026-1044",
                "customer_name": "Priya Patel",
                "channel": "EMAIL",
                "subject": "Scammed by fake customs authority demanding penalty payment",
                "body": "A caller posing as Federal Customs claimed my package had illegal items and pressured me to transfer ₹45,000 for verification. I realized it was a scam 10 minutes later. Please stop the transfer!",
                "category": "SCAM_VICTIM_REPORT",
                "urgency": "HIGH",
                "sentiment_score": -0.78,
                "regulatory_flag": False,
                "status": "IN_TRIAGE",
                "suggested_resolution": "Trigger immediate inter-bank recall signal and freeze beneficiary account via FIU alert network.",
                "created_at": (datetime.utcnow() - timedelta(hours=5)).isoformat()
            },
            {
                "id": 3,
                "complaint_id": "CMP-2026-1039",
                "customer_name": "Karan Gupta",
                "channel": "CHAT",
                "subject": "Double charged at electronics store POS",
                "body": "My card was swiped twice at Croma electronics for ₹32,000 because the merchant machine gave a receipt error on the first attempt.",
                "category": "DOUBLE_DEBIT",
                "urgency": "MEDIUM",
                "sentiment_score": -0.45,
                "regulatory_flag": False,
                "status": "OPEN",
                "suggested_resolution": "Auto-verify duplicate authorization hold on POS terminal and release second hold.",
                "created_at": (datetime.utcnow() - timedelta(hours=14)).isoformat()
            }
        ]

    return [
        {
            "id": c.id,
            "complaint_id": c.complaint_id,
            "customer_name": c.customer.name if c.customer else "Valued Customer",
            "channel": c.channel,
            "subject": c.subject,
            "body": c.body,
            "category": c.category.value,
            "urgency": c.urgency.value,
            "sentiment_score": c.sentiment_score,
            "regulatory_flag": c.regulatory_flag,
            "status": c.status,
            "suggested_resolution": c.suggested_resolution,
            "created_at": c.created_at.isoformat()
        }
        for c in complaints
    ]


def escalate_complaint(db: Session, complaint_id: int) -> Dict[str, Any]:
    """Escalates complaint to high-priority legal & compliance queue."""
    c = db.query(CustomerComplaint).filter(CustomerComplaint.id == complaint_id).first()
    if c:
        c.status = "ESCALATED"
        c.urgency = ComplaintUrgency.REGULATORY_ESCALATION
        db.commit()

    return {
        "complaint_id": complaint_id,
        "status": "ESCALATED",
        "assigned_queue": "Executive Regulatory & Compliance Desk",
        "sla_hours": 4
    }
