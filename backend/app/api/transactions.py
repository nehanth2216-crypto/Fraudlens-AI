"""
FraudLens AI — Transaction API Routes
CRUD operations, filtering, and fraud analysis for transactions.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import Optional, List
from datetime import datetime

from app.database import get_db
from app.api.deps import get_current_active_user
from app.models.user import User
from app.models.transaction import Transaction
from app.models.risk_score import RiskScore
from app.models.account import Account
from app.models.location import Location
from app.models.device import Device
from app.models.beneficiary import Beneficiary
from app.models.merchant import Merchant
from app.schemas import TransactionResponse, TransactionCreate, TransactionDetail
from app.services.fraud_service import analyze_transaction

router = APIRouter(prefix="/api/transactions", tags=["Transactions"])


@router.get("", response_model=List[dict])
def list_transactions(
    skip: int = 0,
    limit: int = 50,
    risk_level: Optional[str] = None,
    payment_method: Optional[str] = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_active_user),
):
    """List transactions with optional filtering."""
    query = db.query(Transaction, RiskScore).outerjoin(
        RiskScore, RiskScore.transaction_id == Transaction.id
    )

    if risk_level:
        query = query.filter(RiskScore.risk_level == risk_level)
    if payment_method:
        query = query.filter(Transaction.payment_method == payment_method)

    results = query.order_by(desc(Transaction.timestamp)).offset(skip).limit(limit).all()

    return [
        {
            "id": txn.id,
            "transaction_id": txn.transaction_id,
            "account_id": txn.account_id,
            "amount": txn.amount,
            "currency": txn.currency,
            "transaction_type": txn.transaction_type.value if txn.transaction_type else "",
            "payment_method": txn.payment_method.value if txn.payment_method else "",
            "timestamp": txn.timestamp.isoformat(),
            "status": txn.status.value if txn.status else "",
            "risk_score": risk.final_score if risk else 0,
            "risk_level": risk.risk_level.value if risk else "LOW",
            "decision": risk.decision.value if risk else "APPROVE",
        }
        for txn, risk in results
    ]


@router.post("", response_model=dict, status_code=201)
def create_transaction(
    data: TransactionCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_active_user),
):
    """
    Create a new transaction and immediately execute the full ML fraud risk pipeline.
    Runs feature engineering, XGBoost inference, Isolation Forest anomaly scoring,
    behavioral checks, rule engine, and generates human-readable explanations.
    """
    result = analyze_transaction(
        db=db,
        account_id=data.account_id,
        amount=data.amount,
        payment_method=str(data.payment_method),
        transaction_type=str(data.transaction_type or "TRANSFER"),
        beneficiary_id=data.beneficiary_id,
        merchant_id=data.merchant_id,
        device_id=data.device_id,
        location_id=data.location_id,
        ip_address_id=data.ip_address_id,
        timestamp=data.timestamp or datetime.utcnow(),
    )
    return result


@router.get("/{txn_id}")
def get_transaction(txn_id: int, db: Session = Depends(get_db),
                    user: User = Depends(get_current_active_user)):
    """Get detailed transaction information."""
    txn = db.query(Transaction).filter(Transaction.id == txn_id).first()
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")

    risk = db.query(RiskScore).filter(RiskScore.transaction_id == txn.id).first()
    account = db.query(Account).filter(Account.id == txn.account_id).first()
    location = db.query(Location).filter(Location.id == txn.location_id).first() if txn.location_id else None
    device = db.query(Device).filter(Device.id == txn.device_id).first() if txn.device_id else None
    beneficiary = db.query(Beneficiary).filter(Beneficiary.id == txn.beneficiary_id).first() if txn.beneficiary_id else None
    merchant = db.query(Merchant).filter(Merchant.id == txn.merchant_id).first() if txn.merchant_id else None

    import json
    reasons = json.loads(risk.reasons) if risk and risk.reasons else []

    return {
        "id": txn.id,
        "transaction_id": txn.transaction_id,
        "account_id": txn.account_id,
        "amount": txn.amount,
        "currency": txn.currency,
        "transaction_type": txn.transaction_type.value if txn.transaction_type else "",
        "payment_method": txn.payment_method.value if txn.payment_method else "",
        "timestamp": txn.timestamp.isoformat(),
        "status": txn.status.value if txn.status else "",
        "risk_score": risk.final_score if risk else 0,
        "risk_level": risk.risk_level.value if risk else "LOW",
        "decision": risk.decision.value if risk else "APPROVE",
        "ml_score": risk.ml_score if risk else 0,
        "anomaly_score": risk.anomaly_score if risk else 0,
        "behavior_score": risk.behavior_score if risk else 0,
        "rule_score": risk.rule_score if risk else 0,
        "reasons": reasons,
        "account": {
            "id": account.id,
            "account_number_masked": account.account_number_masked,
            "bank": account.bank,
            "account_type": account.account_type.value if account and account.account_type else "",
        } if account else None,
        "location": {
            "id": location.id,
            "city": location.city,
            "state": location.state,
            "country": location.country,
        } if location else None,
        "device": {
            "id": device.id,
            "device_type": device.device_type,
            "operating_system": device.operating_system,
            "browser": device.browser,
            "risk_score": device.risk_score,
        } if device else None,
        "beneficiary": {
            "id": beneficiary.id,
            "beneficiary_account_masked": beneficiary.beneficiary_account_masked,
            "bank": beneficiary.bank,
            "risk_score": beneficiary.risk_score,
        } if beneficiary else None,
        "merchant": {
            "id": merchant.id,
            "merchant_name": merchant.merchant_name,
            "category": merchant.category,
            "risk_score": merchant.risk_score,
        } if merchant else None,
    }


@router.post("/{txn_id}/analyze")
def analyze_existing_transaction(txn_id: int, db: Session = Depends(get_db),
                                 user: User = Depends(get_current_active_user)):
    """Re-analyze an existing transaction."""
    txn = db.query(Transaction).filter(Transaction.id == txn_id).first()
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")

    result = analyze_transaction(
        db, txn.account_id, txn.amount,
        txn.payment_method.value,
        txn.transaction_type.value,
        txn.beneficiary_id, txn.merchant_id,
        txn.device_id, txn.location_id,
        txn.ip_address_id, txn.timestamp,
    )
    return result
