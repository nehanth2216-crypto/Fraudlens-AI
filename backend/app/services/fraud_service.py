"""
FraudLens AI — Fraud Detection Service
Orchestrates the complete fraud analysis pipeline.
"""

import time
import json
import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session

from app.models.transaction import Transaction, TransactionType, PaymentMethod, TransactionStatus
from app.models.transaction_feature import TransactionFeature
from app.models.fraud_prediction import FraudPrediction
from app.models.risk_score import RiskScore, RiskLevel, RiskDecision
from app.models.fraud_alert import FraudAlert, AlertType, AlertSeverity, AlertStatus

from ml.feature_engineering import engineer_features
from ml.supervised_model import predict_fraud
from ml.anomaly_model import detect_anomaly
from ml.behavioral_model import analyze_behavior
from ml.rule_engine import evaluate_rules
from ml.risk_engine import calculate_risk
from ml.explainability import generate_explanations, get_feature_contributions


from app.websocket_manager import ws_manager


def analyze_transaction(db: Session, account_id: int, amount: float,
                        payment_method: str, transaction_type: str = "TRANSFER",
                        beneficiary_id: int = None, merchant_id: int = None,
                        device_id: int = None, location_id: int = None,
                        ip_address_id: int = None,
                        timestamp: datetime = None) -> dict:
    """
    Complete fraud analysis pipeline:
    1. Create transaction record
    2. Feature engineering
    3. Supervised ML prediction
    4. Anomaly detection
    5. Behavioral analysis
    6. Rule engine evaluation
    7. Risk score calculation
    8. Explainability
    9. Alert creation (if needed)
    10. Return complete analysis
    """
    start_time = time.time()
    ts = timestamp or datetime.utcnow()

    # 1. Create transaction record
    txn_id = f"TXN{uuid.uuid4().hex[:8].upper()}"
    transaction = Transaction(
        transaction_id=txn_id,
        account_id=account_id,
        beneficiary_id=beneficiary_id,
        merchant_id=merchant_id,
        amount=amount,
        currency="INR",
        transaction_type=TransactionType(transaction_type),
        payment_method=PaymentMethod(payment_method),
        timestamp=ts,
        location_id=location_id,
        device_id=device_id,
        ip_address_id=ip_address_id,
        status=TransactionStatus.PENDING,
    )
    db.add(transaction)
    db.flush()

    # 2. Feature engineering
    features = engineer_features(
        db, account_id, amount, payment_method, ts,
        device_id, beneficiary_id, location_id, merchant_id
    )

    # Save features
    txn_features = TransactionFeature(
        transaction_id=transaction.id,
        amount_deviation=features["amount_deviation"],
        velocity_score=features["velocity_score"],
        location_deviation=features["location_deviation"],
        device_change=features["device_change"],
        beneficiary_change=features["beneficiary_change"],
        time_anomaly=features["time_anomaly"],
        merchant_frequency=features["merchant_frequency"],
        account_age_days=features["account_age_days"],
        previous_avg_amount=features["previous_avg_amount"],
        transactions_last_hour=features["transactions_last_hour"],
        transactions_last_day=features["transactions_last_day"],
    )
    db.add(txn_features)

    # 3. Supervised ML prediction
    ml_result = predict_fraud(features)
    fraud_prob = ml_result["fraud_probability"]

    # 4. Anomaly detection
    anomaly_score = detect_anomaly(features)

    # 5. Behavioral analysis
    behavior_result = analyze_behavior(
        db, account_id, amount, ts,
        device_id, beneficiary_id, location_id, merchant_id
    )
    behavior_score = behavior_result["behavior_score"]

    # 6. Rule engine
    rule_score, rule_reasons = evaluate_rules(features)

    # 7. Risk engine
    risk_result = calculate_risk(fraud_prob, anomaly_score, behavior_score, rule_score)
    final_score = risk_result["final_score"]
    risk_level = risk_result["risk_level"]
    decision = risk_result["decision"]

    # 8. Explainability
    explanations = generate_explanations(
        features, fraud_prob, anomaly_score,
        behavior_score, rule_reasons, risk_level
    )
    feature_contribs = get_feature_contributions(features)

    prediction_time = (time.time() - start_time) * 1000

    # Save prediction
    prediction = FraudPrediction(
        transaction_id=transaction.id,
        model_version="v1.0",
        fraud_probability=fraud_prob,
        fraud_prediction=fraud_prob >= 0.5,
        anomaly_score=anomaly_score,
        prediction_time=prediction_time,
    )
    db.add(prediction)

    # Save risk score
    risk_record = RiskScore(
        transaction_id=transaction.id,
        ml_score=risk_result["ml_score"],
        anomaly_score=risk_result["anomaly_score"],
        behavior_score=risk_result["behavior_score"],
        rule_score=risk_result["rule_score"],
        final_score=final_score,
        risk_level=RiskLevel(risk_level),
        decision=RiskDecision(decision),
        reasons=json.dumps(explanations),
    )
    db.add(risk_record)

    # Update transaction status based on decision
    status_map = {
        "APPROVE": TransactionStatus.COMPLETED,
        "VERIFY": TransactionStatus.PENDING,
        "REVIEW": TransactionStatus.PENDING,
        "HOLD": TransactionStatus.HELD,
    }
    transaction.status = status_map.get(decision, TransactionStatus.PENDING)

    # 9. Create alert if risk is HIGH or CRITICAL
    alert_data = None
    if risk_level in ("HIGH", "CRITICAL"):
        severity_map = {
            "HIGH": AlertSeverity.HIGH,
            "CRITICAL": AlertSeverity.CRITICAL,
        }
        alert = FraudAlert(
            transaction_id=transaction.id,
            alert_type=AlertType.HIGH_RISK_TRANSACTION,
            severity=severity_map.get(risk_level, AlertSeverity.HIGH),
            title=f"High-Risk Transaction Detected: {txn_id}",
            description=(
                f"Transaction of ₹{amount:,.0f} flagged with risk score "
                f"{final_score}/100 ({risk_level}). "
                f"{'|'.join(explanations[:3])}"
            ),
            status=AlertStatus.OPEN,
        )
        db.add(alert)
        db.flush()

        alert_data = {
            "type": "FRAUD_ALERT",
            "alert_id": alert.id,
            "transaction_id": txn_id,
            "amount": amount,
            "risk_score": final_score,
            "risk_level": risk_level,
            "severity": severity_map.get(risk_level, AlertSeverity.HIGH).value,
            "title": alert.title,
            "timestamp": ts.isoformat(),
        }
    elif risk_level == "MEDIUM":
        alert = FraudAlert(
            transaction_id=transaction.id,
            alert_type=AlertType.ANOMALY_DETECTED,
            severity=AlertSeverity.MEDIUM,
            title=f"Suspicious Activity: {txn_id}",
            description=(
                f"Transaction of ₹{amount:,.0f} flagged with risk score "
                f"{final_score}/100 ({risk_level}). Requires verification."
            ),
            status=AlertStatus.OPEN,
        )
        db.add(alert)

    db.commit()

    if alert_data:
        ws_manager.broadcast_sync("NEW_ALERT", alert_data)

    return {
        "transaction_id": txn_id,
        "fraud_probability": round(fraud_prob, 4),
        "anomaly_score": round(anomaly_score, 4),
        "behavior_score": round(behavior_score, 4),
        "rule_score": round(rule_score, 4),
        "risk_score": final_score,
        "risk_level": risk_level,
        "decision": decision,
        "reasons": explanations,
        "features": feature_contribs,
        "prediction_time_ms": round(prediction_time, 2),
        "alert": alert_data,
    }
