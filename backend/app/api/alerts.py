"""
FraudLens AI — Alerts API Routes
End-to-end fraud alert lifecycle management with assignment, status tracking,
investigation comments, audit logging, and real-time WebSocket broadcasting.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import Optional, List
from datetime import datetime

from app.database import get_db
from app.api.deps import get_current_active_user
from app.models.user import User
from app.models.fraud_alert import FraudAlert, AlertStatus, AlertSeverity, AlertType, AlertComment
from app.models.transaction import Transaction
from app.schemas import (
    AlertResponse, AlertUpdate, AlertResolve, AlertAssign,
    AlertCreate, AlertCommentCreate, AlertCommentResponse, AlertStatusUpdate
)
from app.services.audit_service import log_audit_event
from app.websocket_manager import ws_manager

router = APIRouter(prefix="/api/alerts", tags=["Alerts"])


@router.get("")
def list_alerts(
    status: Optional[str] = None,
    severity: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_active_user),
):
    """List fraud alerts with optional filtering and relationship details."""
    query = db.query(FraudAlert)

    if status:
        query = query.filter(FraudAlert.status == status)
    if severity:
        query = query.filter(FraudAlert.severity == severity)

    alerts = query.order_by(desc(FraudAlert.created_at)).limit(limit).all()

    results = []
    for a in alerts:
        txn = db.query(Transaction).filter(Transaction.id == a.transaction_id).first()
        assignee = db.query(User).filter(User.id == a.assigned_to).first() if a.assigned_to else None
        comment_count = db.query(AlertComment).filter(AlertComment.alert_id == a.id).count()

        results.append({
            "id": a.id,
            "transaction_id": a.transaction_id,
            "alert_type": a.alert_type.value if hasattr(a.alert_type, "value") else str(a.alert_type),
            "severity": a.severity.value if hasattr(a.severity, "value") else str(a.severity),
            "title": a.title,
            "description": a.description,
            "status": a.status.value if hasattr(a.status, "value") else str(a.status),
            "assigned_to": a.assigned_to,
            "assignee_name": assignee.name if assignee else None,
            "resolution": a.resolution,
            "notes": a.notes,
            "comment_count": comment_count,
            "created_at": a.created_at.isoformat(),
            "resolved_at": a.resolved_at.isoformat() if a.resolved_at else None,
            "transaction": {
                "id": txn.id,
                "transaction_id": txn.transaction_id,
                "amount": txn.amount,
                "payment_method": txn.payment_method.value if txn.payment_method else "",
                "timestamp": txn.timestamp.isoformat(),
            } if txn else None,
        })

    return results


@router.post("", status_code=201)
def create_alert(
    data: AlertCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_active_user),
):
    """Manually create a new fraud alert for a transaction."""
    txn = db.query(Transaction).filter(Transaction.id == data.transaction_id).first()
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")

    alert = FraudAlert(
        transaction_id=data.transaction_id,
        alert_type=AlertType(data.alert_type),
        severity=AlertSeverity(data.severity),
        title=data.title,
        description=data.description,
        status=AlertStatus.OPEN,
    )
    db.add(alert)
    db.flush()

    # Log audit event
    log_audit_event(
        db=db,
        action="ALERT_MANUALLY_CREATED",
        entity_type="FRAUD_ALERT",
        entity_id=alert.id,
        details=f"Alert #{alert.id} manually created: {alert.title}",
        user=user,
    )
    db.commit()

    # Broadcast via WebSocket
    ws_manager.broadcast_sync("NEW_ALERT", {
        "id": alert.id,
        "transaction_id": txn.transaction_id,
        "title": alert.title,
        "severity": alert.severity.value,
        "status": alert.status.value,
        "created_at": alert.created_at.isoformat(),
    })

    return {"message": "Alert created successfully", "id": alert.id}


@router.get("/{alert_id}")
def get_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_active_user),
):
    """Get complete alert details including comments and assignee."""
    alert = db.query(FraudAlert).filter(FraudAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    txn = db.query(Transaction).filter(Transaction.id == alert.transaction_id).first()
    assignee = db.query(User).filter(User.id == alert.assigned_to).first() if alert.assigned_to else None
    comments = db.query(AlertComment).filter(AlertComment.alert_id == alert.id).order_by(AlertComment.created_at.asc()).all()

    return {
        "id": alert.id,
        "transaction_id": alert.transaction_id,
        "alert_type": alert.alert_type.value if hasattr(alert.alert_type, "value") else str(alert.alert_type),
        "severity": alert.severity.value if hasattr(alert.severity, "value") else str(alert.severity),
        "title": alert.title,
        "description": alert.description,
        "status": alert.status.value if hasattr(alert.status, "value") else str(alert.status),
        "assigned_to": alert.assigned_to,
        "assignee_name": assignee.name if assignee else None,
        "resolution": alert.resolution,
        "notes": alert.notes,
        "created_at": alert.created_at.isoformat(),
        "resolved_at": alert.resolved_at.isoformat() if alert.resolved_at else None,
        "transaction": {
            "id": txn.id,
            "transaction_id": txn.transaction_id,
            "amount": txn.amount,
            "payment_method": txn.payment_method.value if txn.payment_method else "",
            "timestamp": txn.timestamp.isoformat(),
        } if txn else None,
        "comments": [
            {
                "id": c.id,
                "user_name": c.user_name,
                "comment": c.comment,
                "created_at": c.created_at.isoformat(),
            }
            for c in comments
        ],
    }


@router.patch("/{alert_id}")
def update_alert(
    alert_id: int,
    data: AlertUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_active_user),
):
    """Update alert status, assignment, severity, or notes."""
    alert = db.query(FraudAlert).filter(FraudAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    changes = []
    if data.status:
        alert.status = AlertStatus(data.status.value)
        changes.append(f"status -> {alert.status.value}")
    if data.assigned_to is not None:
        alert.assigned_to = data.assigned_to
        assignee = db.query(User).filter(User.id == data.assigned_to).first()
        changes.append(f"assigned_to -> {assignee.name if assignee else data.assigned_to}")
    if data.severity:
        alert.severity = AlertSeverity(data.severity)
        changes.append(f"severity -> {alert.severity.value}")
    if data.notes:
        alert.notes = data.notes

    log_audit_event(
        db=db,
        action="ALERT_UPDATED",
        entity_type="FRAUD_ALERT",
        entity_id=alert.id,
        details=f"Alert #{alert.id} updated: {', '.join(changes)}",
        user=user,
    )
    db.commit()

    ws_manager.broadcast_sync("ALERT_UPDATED", {
        "id": alert.id,
        "status": alert.status.value,
        "assigned_to": alert.assigned_to,
    })

    return {"message": "Alert updated", "id": alert.id}


@router.post("/{alert_id}/assign")
def assign_alert(
    alert_id: int,
    data: AlertAssign,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_active_user),
):
    """Assign alert to an investigator and transition status to INVESTIGATING."""
    alert = db.query(FraudAlert).filter(FraudAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    assignee = db.query(User).filter(User.id == data.user_id).first()
    assignee_label = assignee.name if assignee else f"User #{data.user_id}"

    alert.assigned_to = data.user_id
    alert.status = AlertStatus.INVESTIGATING

    log_audit_event(
        db=db,
        action="ALERT_ASSIGNED",
        entity_type="FRAUD_ALERT",
        entity_id=alert.id,
        details=f"Alert #{alert.id} assigned to {assignee_label}",
        user=user,
    )
    db.commit()

    ws_manager.broadcast_sync("ALERT_UPDATED", {
        "id": alert.id,
        "status": alert.status.value,
        "assigned_to": alert.assigned_to,
        "assignee_name": assignee_label,
    })

    return {"message": f"Alert assigned to {assignee_label}", "id": alert.id}


@router.post("/{alert_id}/resolve")
def resolve_alert(
    alert_id: int,
    data: AlertResolve,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_active_user),
):
    """Resolve a fraud alert or mark it as a False Positive with audit trail."""
    alert = db.query(FraudAlert).filter(FraudAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    new_status = AlertStatus.FALSE_POSITIVE if data.is_false_positive else AlertStatus.RESOLVED
    alert.status = new_status
    alert.resolution = data.resolution
    if data.notes:
        alert.notes = data.notes
    alert.resolved_at = datetime.utcnow()

    action_label = "ALERT_MARKED_FALSE_POSITIVE" if data.is_false_positive else "ALERT_RESOLVED"
    log_audit_event(
        db=db,
        action=action_label,
        entity_type="FRAUD_ALERT",
        entity_id=alert.id,
        details=f"Alert #{alert.id} resolved ({new_status.value}). Resolution: {data.resolution}. Notes: {data.notes or 'None'}",
        user=user,
    )
    db.commit()

    ws_manager.broadcast_sync("ALERT_RESOLVED", {
        "id": alert.id,
        "status": alert.status.value,
        "resolution": alert.resolution,
        "resolved_at": alert.resolved_at.isoformat(),
    })

    return {"message": "Alert resolved", "id": alert.id, "status": alert.status.value}


@router.post("/{alert_id}/comments")
def add_alert_comment(
    alert_id: int,
    data: AlertCommentCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_active_user),
):
    """Add a collaborative investigation note/comment to an alert."""
    alert = db.query(FraudAlert).filter(FraudAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    comment = AlertComment(
        alert_id=alert.id,
        user_id=user.id,
        user_name=user.name,
        comment=data.comment,
    )
    db.add(comment)
    db.flush()

    log_audit_event(
        db=db,
        action="ALERT_COMMENT_ADDED",
        entity_type="FRAUD_ALERT",
        entity_id=alert.id,
        details=f"Comment added to Alert #{alert.id} by {user.name}",
        user=user,
    )
    db.commit()

    ws_manager.broadcast_sync("ALERT_COMMENT_ADDED", {
        "alert_id": alert.id,
        "comment_id": comment.id,
        "user_name": user.name,
        "comment": comment.comment,
        "created_at": comment.created_at.isoformat(),
    })

    return {
        "message": "Comment posted",
        "comment": {
            "id": comment.id,
            "alert_id": alert.id,
            "user_name": comment.user_name,
            "comment": comment.comment,
            "created_at": comment.created_at.isoformat(),
        },
    }


@router.get("/{alert_id}/comments")
def get_alert_comments(
    alert_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_active_user),
):
    """Retrieve full collaborative comment thread for an alert."""
    comments = db.query(AlertComment).filter(
        AlertComment.alert_id == alert_id
    ).order_by(AlertComment.created_at.asc()).all()

    return [
        {
            "id": c.id,
            "alert_id": c.alert_id,
            "user_id": c.user_id,
            "user_name": c.user_name,
            "comment": c.comment,
            "created_at": c.created_at.isoformat(),
        }
        for c in comments
    ]
