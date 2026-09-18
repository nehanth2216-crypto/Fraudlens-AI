"""
FraudLens AI — Fraud Analysis API Routes
Core fraud analysis endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List

from app.database import get_db
from app.api.deps import get_current_active_user
from app.models.user import User
from app.models.transaction import Transaction
from app.models.risk_score import RiskScore, RiskLevel
from app.models.fraud_prediction import FraudPrediction
from app.schemas import FraudAnalyzeRequest, FraudAnalyzeResponse
from app.services.fraud_service import analyze_transaction

router = APIRouter(prefix="/api/fraud", tags=["Fraud Analysis"])


@router.post("/analyze", response_model=FraudAnalyzeResponse)
def analyze_fraud(
    data: FraudAnalyzeRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_active_user),
):
    """
    Full fraud analysis pipeline for a new transaction.
    Runs ML prediction, anomaly detection, behavioral analysis,
    rule engine, and risk calculation.
    """
    result = analyze_transaction(
        db=db,
        account_id=data.account_id,
        amount=data.amount,
        payment_method=data.payment_method,
        transaction_type=data.transaction_type,
        beneficiary_id=data.beneficiary_id,
        merchant_id=data.merchant_id,
        device_id=data.device_id,
        location_id=data.location_id,
        ip_address_id=data.ip_address_id,
        timestamp=data.timestamp,
    )
    return result


@router.get("/high-risk")
def get_high_risk_transactions(
    limit: int = 20,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_active_user),
):
    """Get transactions with HIGH or CRITICAL risk level."""
    results = db.query(Transaction, RiskScore).join(
        RiskScore, RiskScore.transaction_id == Transaction.id
    ).filter(
        RiskScore.risk_level.in_([RiskLevel.HIGH, RiskLevel.CRITICAL])
    ).order_by(desc(RiskScore.final_score)).limit(limit).all()

    return [
        {
            "id": txn.id,
            "transaction_id": txn.transaction_id,
            "amount": txn.amount,
            "payment_method": txn.payment_method.value if txn.payment_method else "",
            "timestamp": txn.timestamp.isoformat(),
            "risk_score": risk.final_score,
            "risk_level": risk.risk_level.value,
            "decision": risk.decision.value,
        }
        for txn, risk in results
    ]


@router.get("/statistics")
def get_fraud_statistics(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_active_user),
):
    """Get fraud detection statistics."""
    from sqlalchemy import func
    total = db.query(func.count(RiskScore.id)).scalar() or 0
    high = db.query(func.count(RiskScore.id)).filter(RiskScore.risk_level == RiskLevel.HIGH).scalar() or 0
    critical = db.query(func.count(RiskScore.id)).filter(RiskScore.risk_level == RiskLevel.CRITICAL).scalar() or 0
    avg_score = db.query(func.avg(RiskScore.final_score)).scalar() or 0

    return {
        "total_analyzed": total,
        "high_risk": high,
        "critical_risk": critical,
        "average_risk_score": round(avg_score, 2),
    }


@router.get("/{transaction_id}")
def get_fraud_details(
    transaction_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_active_user),
):
    """Get fraud analysis details for a specific transaction."""
    import json
    txn = db.query(Transaction).filter(Transaction.transaction_id == transaction_id).first()
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")

    risk = db.query(RiskScore).filter(RiskScore.transaction_id == txn.id).first()
    prediction = db.query(FraudPrediction).filter(FraudPrediction.transaction_id == txn.id).first()

    return {
        "transaction_id": txn.transaction_id,
        "amount": txn.amount,
        "fraud_probability": prediction.fraud_probability if prediction else 0,
        "anomaly_score": prediction.anomaly_score if prediction else 0,
        "risk_score": risk.final_score if risk else 0,
        "risk_level": risk.risk_level.value if risk else "LOW",
        "decision": risk.decision.value if risk else "APPROVE",
        "ml_score": risk.ml_score if risk else 0,
        "behavior_score": risk.behavior_score if risk else 0,
        "rule_score": risk.rule_score if risk else 0,
        "reasons": json.loads(risk.reasons) if risk and risk.reasons else [],
    }
