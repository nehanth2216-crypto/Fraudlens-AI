"""
FraudLens AI — Behavioral Analysis
Compares transaction against customer's historical behavior profile.
"""

import numpy as np
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.transaction import Transaction
from app.models.device import Device
from app.models.beneficiary import Beneficiary


def get_customer_profile(db: Session, account_id: int) -> dict:
    """Build a behavioral profile from customer's transaction history."""
    txns = db.query(Transaction).filter(
        Transaction.account_id == account_id
    ).order_by(Transaction.timestamp.desc()).limit(500).all()

    if not txns:
        return {
            "avg_amount": 0,
            "median_amount": 0,
            "std_amount": 1,
            "daily_count": 0,
            "normal_hours": list(range(8, 22)),
            "known_devices": set(),
            "known_locations": set(),
            "known_beneficiaries": set(),
            "known_merchants": set(),
            "total_transactions": 0,
        }

    amounts = [t.amount for t in txns]
    hours = [t.timestamp.hour for t in txns]

    # Unique entities
    known_devices = {t.device_id for t in txns if t.device_id}
    known_locations = {t.location_id for t in txns if t.location_id}
    known_beneficiaries = {t.beneficiary_id for t in txns if t.beneficiary_id}
    known_merchants = {t.merchant_id for t in txns if t.merchant_id}

    # Daily transaction count
    if len(txns) >= 2:
        days_span = max((txns[0].timestamp - txns[-1].timestamp).days, 1)
        daily_count = len(txns) / days_span
    else:
        daily_count = len(txns)

    return {
        "avg_amount": float(np.mean(amounts)),
        "median_amount": float(np.median(amounts)),
        "std_amount": float(np.std(amounts)) if len(amounts) > 1 else 1,
        "daily_count": daily_count,
        "normal_hours": list(set(hours)),
        "known_devices": known_devices,
        "known_locations": known_locations,
        "known_beneficiaries": known_beneficiaries,
        "known_merchants": known_merchants,
        "total_transactions": len(txns),
    }


def analyze_behavior(db: Session, account_id: int, amount: float,
                     timestamp: datetime, device_id: int = None,
                     beneficiary_id: int = None, location_id: int = None,
                     merchant_id: int = None) -> dict:
    """
    Compare a transaction against the customer's behavioral profile.
    Returns behavior_score (0-1, higher = more deviant from normal).
    """
    profile = get_customer_profile(db, account_id)

    signals = []

    # 1. Amount deviation from profile
    if profile["total_transactions"] > 0:
        z_score = abs(amount - profile["avg_amount"]) / max(profile["std_amount"], 1)
        amount_signal = min(z_score / 5, 1.0)  # Normalize
        signals.append(("amount_behavior", amount_signal, 0.25))
    else:
        signals.append(("amount_behavior", 0.3, 0.25))  # New customer

    # 2. Time behavior
    hour = timestamp.hour
    if profile["normal_hours"]:
        if hour not in profile["normal_hours"]:
            signals.append(("time_behavior", 0.8, 0.15))
        else:
            signals.append(("time_behavior", 0.0, 0.15))
    else:
        signals.append(("time_behavior", 0.2, 0.15))

    # 3. Device behavior
    if device_id and profile["known_devices"]:
        if device_id not in profile["known_devices"]:
            signals.append(("device_behavior", 0.9, 0.2))
        else:
            signals.append(("device_behavior", 0.0, 0.2))
    else:
        signals.append(("device_behavior", 0.2, 0.2))

    # 4. Location behavior
    if location_id and profile["known_locations"]:
        if location_id not in profile["known_locations"]:
            signals.append(("location_behavior", 0.85, 0.15))
        else:
            signals.append(("location_behavior", 0.0, 0.15))
    else:
        signals.append(("location_behavior", 0.15, 0.15))

    # 5. Beneficiary behavior
    if beneficiary_id and profile["known_beneficiaries"]:
        if beneficiary_id not in profile["known_beneficiaries"]:
            signals.append(("beneficiary_behavior", 0.85, 0.15))
        else:
            signals.append(("beneficiary_behavior", 0.0, 0.15))
    else:
        signals.append(("beneficiary_behavior", 0.15, 0.15))

    # 6. Merchant behavior
    if merchant_id and profile["known_merchants"]:
        if merchant_id not in profile["known_merchants"]:
            signals.append(("merchant_behavior", 0.5, 0.1))
        else:
            signals.append(("merchant_behavior", 0.0, 0.1))
    else:
        signals.append(("merchant_behavior", 0.1, 0.1))

    # Calculate weighted behavior score
    total_weight = sum(w for _, _, w in signals)
    behavior_score = sum(score * weight for _, score, weight in signals) / max(total_weight, 0.01)

    return {
        "behavior_score": round(min(behavior_score, 1.0), 4),
        "signals": {name: round(score, 4) for name, score, _ in signals},
        "profile_summary": {
            "avg_amount": round(profile["avg_amount"], 2),
            "median_amount": round(profile["median_amount"], 2),
            "total_transactions": profile["total_transactions"],
            "known_devices": len(profile["known_devices"]),
            "known_locations": len(profile["known_locations"]),
            "known_beneficiaries": len(profile["known_beneficiaries"]),
        }
    }
