"""
FraudLens AI — Alerts API Routes
Fraud alert management endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import Optional, List
from datetime import datetime

from app.database import get_db
from app.api.deps import get_current_active_user
from app.models.user import User
from app.models.fraud_alert import FraudAlert, AlertStatus, AlertSeverity
from app.models.transaction import Transaction
from app.schemas import AlertResponse, AlertUpdate, AlertResolve, AlertAssign

router = APIRouter(prefix="/api/alerts", tags=["Alerts"])


@router.get("")
def list_alerts(
    status: Optional[str] = None,
    severity: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_active_user),
):
    """List fraud alerts with optional filtering."""
    query = db.query(FraudAlert)

    if status:
        query = query.filter(FraudAlert.status == status)
    if severity:
        query = query.filter(FraudAlert.severity == severity)

    alerts = query.order_by(desc(FraudAlert.created_at)).limit(limit).all()

    results = []
    for a in alerts:
        txn = db.query(Transaction).filter(Transaction.id == a.transaction_id).first()
        results.append({
            "id": a.id,
            "transaction_id": a.transaction_id,
            "alert_type": a.alert_type.value,
            "severity": a.severity.value,
            "title": a.title,
            "description": a.description,
            "status": a.status.value,
            "assigned_to": a.assigned_to,
            "created_at": a.created_at.isoformat(),
            "resolved_at": a.resolved_at.isoformat() if a.resolved_at else None,
            "transaction": {
                "transaction_id": txn.transaction_id,
                "amount": txn.amount,
                "payment_method": txn.payment_method.value if txn.payment_method else "",
                "timestamp": txn.timestamp.isoformat(),
            } if txn else None,
        })

    return results


@router.get("/{alert_id}")
def get_alert(alert_id: int, db: Session = Depends(get_db),
              user: User = Depends(get_current_active_user)):
    """Get alert details."""
    alert = db.query(FraudAlert).filter(FraudAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    txn = db.query(Transaction).filter(Transaction.id == alert.transaction_id).first()

    return {
        "id": alert.id,
        "transaction_id": alert.transaction_id,
        "alert_type": alert.alert_type.value,
        "severity": alert.severity.value,
        "title": alert.title,
        "description": alert.description,
        "status": alert.status.value,
        "assigned_to": alert.assigned_to,
        "created_at": alert.created_at.isoformat(),
        "resolved_at": alert.resolved_at.isoformat() if alert.resolved_at else None,
        "transaction": {
            "id": txn.id,
            "transaction_id": txn.transaction_id,
            "amount": txn.amount,
            "payment_method": txn.payment_method.value if txn.payment_method else "",
        } if txn else None,
    }


@router.patch("/{alert_id}")
def update_alert(alert_id: int, data: AlertUpdate,
                 db: Session = Depends(get_db),
                 user: User = Depends(get_current_active_user)):
    """Update alert status or assignment."""
    alert = db.query(FraudAlert).filter(FraudAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    if data.status:
        alert.status = AlertStatus(data.status.value)
    if data.assigned_to is not None:
        alert.assigned_to = data.assigned_to
    if data.severity:
        alert.severity = AlertSeverity(data.severity)

    db.commit()
    return {"message": "Alert updated", "id": alert.id}


@router.post("/{alert_id}/resolve")
def resolve_alert(alert_id: int, data: AlertResolve,
                  db: Session = Depends(get_db),
                  user: User = Depends(get_current_active_user)):
    """Resolve a fraud alert."""
    alert = db.query(FraudAlert).filter(FraudAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    if data.is_false_positive:
        alert.status = AlertStatus.FALSE_POSITIVE
    else:
        alert.status = AlertStatus.RESOLVED
    alert.resolved_at = datetime.utcnow()
    db.commit()

    return {"message": "Alert resolved", "id": alert.id}


@router.post("/{alert_id}/assign")
def assign_alert(alert_id: int, data: AlertAssign,
                 db: Session = Depends(get_db),
                 user: User = Depends(get_current_active_user)):
    """Assign alert to an investigator."""
    alert = db.query(FraudAlert).filter(FraudAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.assigned_to = data.user_id
    alert.status = AlertStatus.INVESTIGATING
    db.commit()

    return {"message": "Alert assigned", "id": alert.id}
