"""
FraudLens AI — Audit Service
Centralized helper for immutable audit logging of financial crime operations.
"""

from typing import Optional
from sqlalchemy.orm import Session
from app.models.audit_log import AuditLog
from app.models.user import User


def log_audit_event(
    db: Session,
    action: str,
    entity_type: Optional[str] = None,
    entity_id: Optional[int] = None,
    details: Optional[str] = None,
    user: Optional[User] = None,
    user_id: Optional[int] = None,
    user_name: Optional[str] = None,
    ip_address: Optional[str] = None,
) -> AuditLog:
    """
    Record an action into the immutable compliance audit log.
    Can accept either a User object or direct user_id/user_name.
    """
    uid = user.id if user else user_id
    uname = user.name if user else user_name

    audit_entry = AuditLog(
        user_id=uid,
        user_name=uname,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        details=details,
        ip_address=ip_address,
    )
    db.add(audit_entry)
    try:
        db.flush()
    except Exception as e:
        print(f"[WARN] Failed to flush audit log: {e}")
    return audit_entry
