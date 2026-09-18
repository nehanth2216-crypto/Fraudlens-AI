"""
FraudLens AI — Feature Engineering
Generates ML features from transaction and customer data.
"""

import numpy as np
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.transaction import Transaction
from app.models.account import Account
from app.models.beneficiary import Beneficiary
from app.models.device import Device


def engineer_features(db: Session, account_id: int, amount: float,
                      payment_method: str, timestamp: datetime,
                      device_id: int = None, beneficiary_id: int = None,
                      location_id: int = None, merchant_id: int = None) -> dict:
    """Generate all ML features for a transaction."""

    now = timestamp or datetime.utcnow()
    one_hour_ago = now - timedelta(hours=1)
    one_day_ago = now - timedelta(days=1)
    thirty_days_ago = now - timedelta(days=30)

    # Get account info
    account = db.query(Account).filter(Account.id == account_id).first()
    account_age_days = 0
    if account and account.created_at:
        account_age_days = (now - account.created_at).days

    # Historical transactions for this account
    hist_txns = db.query(Transaction).filter(
        Transaction.account_id == account_id,
        Transaction.timestamp < now
    ).all()

    hist_amounts = [t.amount for t in hist_txns] if hist_txns else [0]
    prev_avg = np.mean(hist_amounts) if hist_amounts else 0
    prev_std = np.std(hist_amounts) if len(hist_amounts) > 1 else 1

    # Amount deviation (z-score)
    amount_deviation = abs(amount - prev_avg) / max(prev_std, 1)
    amount_deviation = min(amount_deviation, 10)  # Cap at 10

    # Transaction velocity
    txns_last_hour = db.query(func.count(Transaction.id)).filter(
        Transaction.account_id == account_id,
        Transaction.timestamp >= one_hour_ago,
        Transaction.timestamp < now
    ).scalar() or 0

    txns_last_day = db.query(func.count(Transaction.id)).filter(
        Transaction.account_id == account_id,
        Transaction.timestamp >= one_day_ago,
        Transaction.timestamp < now
    ).scalar() or 0

    # Velocity score (0-1): high if many recent transactions
    velocity_score = min(txns_last_hour / 5, 1.0) * 0.6 + min(txns_last_day / 20, 1.0) * 0.4

    # Location deviation
    location_deviation = 0.0
    if location_id:
        known_locations = set()
        for t in hist_txns:
            if t.location_id:
                known_locations.add(t.location_id)
        if known_locations and location_id not in known_locations:
            location_deviation = 1.0
        elif not known_locations:
            location_deviation = 0.3  # First transaction, mild risk

    # Device change detection
    device_change = 0.0
    if device_id:
        known_devices = set()
        for t in hist_txns:
            if t.device_id:
                known_devices.add(t.device_id)
        if known_devices and device_id not in known_devices:
            device_change = 1.0
        elif not known_devices:
            device_change = 0.2

    # Beneficiary change detection
    beneficiary_change = 0.0
    if beneficiary_id:
        known_beneficiaries = set()
        for t in hist_txns:
            if t.beneficiary_id:
                known_beneficiaries.add(t.beneficiary_id)
        if known_beneficiaries and beneficiary_id not in known_beneficiaries:
            beneficiary_change = 1.0
        elif not known_beneficiaries:
            beneficiary_change = 0.2

    # Time anomaly (transactions between midnight and 5 AM are unusual)
    hour = now.hour
    time_anomaly = 0.0
    if 0 <= hour <= 5:
        time_anomaly = 0.8
    elif 22 <= hour <= 23:
        time_anomaly = 0.4

    # Also check if this hour is unusual for the customer
    if hist_txns:
        hist_hours = [t.timestamp.hour for t in hist_txns]
        if hour not in hist_hours and len(hist_hours) > 5:
            time_anomaly = max(time_anomaly, 0.6)

    # Merchant frequency (how often customer uses this merchant)
    merchant_frequency = 0.0
    if merchant_id and hist_txns:
        merchant_count = sum(1 for t in hist_txns if t.merchant_id == merchant_id)
        total_with_merchant = sum(1 for t in hist_txns if t.merchant_id is not None)
        if total_with_merchant > 0:
            merchant_frequency = 1.0 - (merchant_count / total_with_merchant)
        else:
            merchant_frequency = 0.5

    return {
        "amount_deviation": round(amount_deviation, 4),
        "velocity_score": round(velocity_score, 4),
        "location_deviation": round(location_deviation, 4),
        "device_change": round(device_change, 4),
        "beneficiary_change": round(beneficiary_change, 4),
        "time_anomaly": round(time_anomaly, 4),
        "merchant_frequency": round(merchant_frequency, 4),
        "account_age_days": account_age_days,
        "previous_avg_amount": round(prev_avg, 2),
        "transactions_last_hour": txns_last_hour,
        "transactions_last_day": txns_last_day,
        # Additional features for ML model
        "amount": amount,
        "payment_method": payment_method,
        "hour_of_day": hour,
        "day_of_week": now.weekday(),
        "amount_to_avg_ratio": round(amount / max(prev_avg, 1), 4),
    }
