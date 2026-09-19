"""
FraudLens AI — Investigations, Customers, Accounts, Networks, Analytics,
Dashboard, Reports, and Assistant API Routes (combined for efficiency).
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from typing import Optional, List
from datetime import datetime
import json

from app.database import get_db
from app.api.deps import get_current_active_user
from app.models.user import User
from app.models.customer import Customer
from app.models.account import Account
from app.models.transaction import Transaction
from app.models.risk_score import RiskScore, RiskLevel
from app.models.fraud_alert import FraudAlert
from app.models.investigation import Investigation, InvestigationStatus, InvestigationPriority
from app.models.device import Device
from app.models.beneficiary import Beneficiary
from app.models.merchant import Merchant
from app.models.location import Location
from app.models.audit_log import AuditLog
from app.schemas import (
    InvestigationCreate, InvestigationUpdate, InvestigationNote,
    InvestigationClose, AssistantMessage,
)
from app.services.analytics_service import (
    get_dashboard_overview, get_recent_transactions, get_fraud_trends,
    get_risk_distribution, get_payment_method_stats, get_time_pattern_stats,
)
from app.services.network_service import (
    get_networks, get_network_by_id, get_network_graph,
    get_suspicious_networks, build_account_network,
)
from app.services.assistant_service import chat

# ============================================
# Dashboard Routes
# ============================================

dashboard_router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@dashboard_router.get("/overview")
def dashboard_overview(db: Session = Depends(get_db),
                       user: User = Depends(get_current_active_user)):
    return get_dashboard_overview(db)


@dashboard_router.get("/summary")
def dashboard_summary(db: Session = Depends(get_db),
                      user: User = Depends(get_current_active_user)):
    """Alias endpoint for /overview returning high-level KPI summary."""
    return get_dashboard_overview(db)


@dashboard_router.get("/recent-transactions")
def dashboard_recent(db: Session = Depends(get_db),
                     user: User = Depends(get_current_active_user)):
    return get_recent_transactions(db)


@dashboard_router.get("/fraud-trends")
def dashboard_trends(days: int = 30, db: Session = Depends(get_db),
                     user: User = Depends(get_current_active_user)):
    return get_fraud_trends(db, days)


@dashboard_router.get("/risk-distribution")
def dashboard_risk_dist(db: Session = Depends(get_db),
                        user: User = Depends(get_current_active_user)):
    return get_risk_distribution(db)


# ============================================
# Customer Routes
# ============================================

customers_router = APIRouter(prefix="/api/customers", tags=["Customers"])


@customers_router.get("")
def list_customers(skip: int = 0, limit: int = 50,
                   db: Session = Depends(get_db),
                   user: User = Depends(get_current_active_user)):
    customers = db.query(Customer).offset(skip).limit(limit).all()
    return [
        {
            "id": c.id, "customer_number": c.customer_number, "name": c.name,
            "email": c.email, "phone": c.phone, "risk_level": c.risk_level.value,
            "created_at": c.created_at.isoformat() if c.created_at else None,
        }
        for c in customers
    ]


@customers_router.get("/{customer_id}")
def get_customer(customer_id: int, db: Session = Depends(get_db),
                 user: User = Depends(get_current_active_user)):
    c = db.query(Customer).filter(Customer.id == customer_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Customer not found")
    accounts = db.query(Account).filter(Account.customer_id == c.id).all()
    return {
        "id": c.id, "customer_number": c.customer_number, "name": c.name,
        "email": c.email, "phone": c.phone, "risk_level": c.risk_level.value,
        "date_of_birth": c.date_of_birth.isoformat() if c.date_of_birth else None,
        "account_created_at": c.account_created_at.isoformat() if c.account_created_at else None,
        "accounts": [
            {"id": a.id, "account_number_masked": a.account_number_masked,
             "bank": a.bank, "balance": a.balance, "status": a.status.value}
            for a in accounts
        ],
    }


@customers_router.get("/{customer_id}/transactions")
def customer_transactions(customer_id: int, db: Session = Depends(get_db),
                          user: User = Depends(get_current_active_user)):
    accounts = db.query(Account).filter(Account.customer_id == customer_id).all()
    account_ids = [a.id for a in accounts]
    txns = db.query(Transaction, RiskScore).outerjoin(
        RiskScore, RiskScore.transaction_id == Transaction.id
    ).filter(Transaction.account_id.in_(account_ids)).order_by(
        desc(Transaction.timestamp)
    ).limit(50).all()

    return [
        {
            "id": t.id, "transaction_id": t.transaction_id, "amount": t.amount,
            "payment_method": t.payment_method.value if t.payment_method else "",
            "timestamp": t.timestamp.isoformat(),
            "risk_score": r.final_score if r else 0,
            "risk_level": r.risk_level.value if r else "LOW",
        }
        for t, r in txns
    ]


@customers_router.get("/{customer_id}/behavior")
def customer_behavior(customer_id: int, db: Session = Depends(get_db),
                      user: User = Depends(get_current_active_user)):
    from ml.behavioral_model import get_customer_profile
    accounts = db.query(Account).filter(Account.customer_id == customer_id).all()
    if not accounts:
        raise HTTPException(status_code=404, detail="No accounts found")

    profiles = []
    for acc in accounts:
        profile = get_customer_profile(db, acc.id)
        profiles.append({
            "account_id": acc.id,
            "avg_transaction_amount": round(profile["avg_amount"], 2),
            "median_transaction_amount": round(profile["median_amount"], 2),
            "daily_transaction_count": round(profile["daily_count"], 2),
            "normal_transaction_hours": profile["normal_hours"],
            "known_devices": len(profile["known_devices"]),
            "known_locations": len(profile["known_locations"]),
            "known_beneficiaries": len(profile["known_beneficiaries"]),
            "total_transactions": profile["total_transactions"],
        })
    return profiles


@customers_router.get("/{customer_id}/risk")
def customer_risk(customer_id: int, db: Session = Depends(get_db),
                  user: User = Depends(get_current_active_user)):
    c = db.query(Customer).filter(Customer.id == customer_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Customer not found")

    accounts = db.query(Account).filter(Account.customer_id == customer_id).all()
    account_ids = [a.id for a in accounts]
    risk_scores = db.query(RiskScore).join(
        Transaction, Transaction.id == RiskScore.transaction_id
    ).filter(Transaction.account_id.in_(account_ids)).order_by(
        desc(RiskScore.created_at)
    ).limit(20).all()

    return {
        "customer_risk_level": c.risk_level.value,
        "recent_risk_scores": [
            {"score": r.final_score, "level": r.risk_level.value, "date": r.created_at.isoformat()}
            for r in risk_scores
        ],
    }


# ============================================
# Account Routes
# ============================================

accounts_router = APIRouter(prefix="/api/accounts", tags=["Accounts"])


@accounts_router.get("")
def list_accounts(skip: int = 0, limit: int = 50,
                  db: Session = Depends(get_db),
                  user: User = Depends(get_current_active_user)):
    accounts = db.query(Account).offset(skip).limit(limit).all()
    return [
        {
            "id": a.id, "customer_id": a.customer_id,
            "account_number_masked": a.account_number_masked,
            "account_type": a.account_type.value if a.account_type else "",
            "bank": a.bank, "balance": a.balance, "currency": a.currency,
            "status": a.status.value if a.status else "",
        }
        for a in accounts
    ]


@accounts_router.get("/{account_id}")
def get_account(account_id: int, db: Session = Depends(get_db),
                user: User = Depends(get_current_active_user)):
    a = db.query(Account).filter(Account.id == account_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Account not found")
    return {
        "id": a.id, "customer_id": a.customer_id,
        "account_number_masked": a.account_number_masked,
        "account_type": a.account_type.value if a.account_type else "",
        "bank": a.bank, "balance": a.balance, "currency": a.currency,
        "status": a.status.value if a.status else "",
    }


@accounts_router.get("/{account_id}/transactions")
def account_transactions(account_id: int, db: Session = Depends(get_db),
                         user: User = Depends(get_current_active_user)):
    txns = db.query(Transaction, RiskScore).outerjoin(
        RiskScore, RiskScore.transaction_id == Transaction.id
    ).filter(Transaction.account_id == account_id).order_by(
        desc(Transaction.timestamp)
    ).limit(50).all()
    return [
        {
            "id": t.id, "transaction_id": t.transaction_id, "amount": t.amount,
            "payment_method": t.payment_method.value if t.payment_method else "",
            "timestamp": t.timestamp.isoformat(),
            "risk_score": r.final_score if r else 0,
            "risk_level": r.risk_level.value if r else "LOW",
        }
        for t, r in txns
    ]


# ============================================
# Investigation Routes
# ============================================

investigations_router = APIRouter(prefix="/api/investigations", tags=["Investigations"])


@investigations_router.get("")
def list_investigations(status: Optional[str] = None,
                        db: Session = Depends(get_db),
                        user: User = Depends(get_current_active_user)):
    query = db.query(Investigation)
    if status:
        query = query.filter(Investigation.status == status)
    investigations = query.order_by(desc(Investigation.created_at)).limit(50).all()

    results = []
    for inv in investigations:
        alert = db.query(FraudAlert).filter(FraudAlert.id == inv.alert_id).first()
        results.append({
            "id": inv.id, "alert_id": inv.alert_id,
            "investigator_id": inv.investigator_id,
            "priority": inv.priority.value if inv.priority else "MEDIUM",
            "status": inv.status.value if inv.status else "OPEN",
            "notes": inv.notes, "resolution": inv.resolution,
            "created_at": inv.created_at.isoformat(),
            "updated_at": inv.updated_at.isoformat() if inv.updated_at else None,
            "closed_at": inv.closed_at.isoformat() if inv.closed_at else None,
            "alert": {
                "id": alert.id, "title": alert.title, "severity": alert.severity.value,
                "status": alert.status.value,
            } if alert else None,
        })
    return results


@investigations_router.post("")
def create_investigation(data: InvestigationCreate,
                         db: Session = Depends(get_db),
                         user: User = Depends(get_current_active_user)):
    alert = db.query(FraudAlert).filter(FraudAlert.id == data.alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    inv = Investigation(
        alert_id=data.alert_id,
        investigator_id=user.id,
        priority=InvestigationPriority(data.priority),
        status=InvestigationStatus.OPEN,
        notes=data.notes,
    )
    db.add(inv)
    alert.status = "INVESTIGATING"
    db.commit()
    db.refresh(inv)
    return {"message": "Investigation created", "id": inv.id}


@investigations_router.get("/{inv_id}")
def get_investigation(inv_id: int, db: Session = Depends(get_db),
                      user: User = Depends(get_current_active_user)):
    inv = db.query(Investigation).filter(Investigation.id == inv_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")

    alert = db.query(FraudAlert).filter(FraudAlert.id == inv.alert_id).first()
    txn = db.query(Transaction).filter(Transaction.id == alert.transaction_id).first() if alert else None
    risk = db.query(RiskScore).filter(RiskScore.transaction_id == txn.id).first() if txn else None

    return {
        "id": inv.id, "alert_id": inv.alert_id,
        "investigator_id": inv.investigator_id,
        "priority": inv.priority.value if inv.priority else "MEDIUM",
        "status": inv.status.value if inv.status else "OPEN",
        "notes": inv.notes, "resolution": inv.resolution,
        "created_at": inv.created_at.isoformat(),
        "closed_at": inv.closed_at.isoformat() if inv.closed_at else None,
        "alert": {
            "id": alert.id, "title": alert.title, "severity": alert.severity.value,
            "description": alert.description,
        } if alert else None,
        "transaction": {
            "id": txn.id, "transaction_id": txn.transaction_id, "amount": txn.amount,
            "payment_method": txn.payment_method.value if txn.payment_method else "",
            "timestamp": txn.timestamp.isoformat(),
        } if txn else None,
        "risk": {
            "final_score": risk.final_score, "risk_level": risk.risk_level.value,
            "decision": risk.decision.value,
            "reasons": json.loads(risk.reasons) if risk.reasons else [],
        } if risk else None,
    }


@investigations_router.patch("/{inv_id}")
def update_investigation(inv_id: int, data: InvestigationUpdate,
                         db: Session = Depends(get_db),
                         user: User = Depends(get_current_active_user)):
    inv = db.query(Investigation).filter(Investigation.id == inv_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")

    if data.status:
        inv.status = InvestigationStatus(data.status.value)
    if data.priority:
        inv.priority = InvestigationPriority(data.priority)
    if data.notes:
        existing = inv.notes or ""
        inv.notes = existing + "\n---\n" + data.notes if existing else data.notes
    inv.updated_at = datetime.utcnow()
    db.commit()
    return {"message": "Investigation updated"}


@investigations_router.post("/{inv_id}/notes")
def add_note(inv_id: int, data: InvestigationNote,
             db: Session = Depends(get_db),
             user: User = Depends(get_current_active_user)):
    inv = db.query(Investigation).filter(Investigation.id == inv_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")

    timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M")
    note_entry = f"[{timestamp}] {user.name}: {data.note}"
    existing = inv.notes or ""
    inv.notes = existing + "\n" + note_entry if existing else note_entry
    inv.updated_at = datetime.utcnow()
    db.commit()
    return {"message": "Note added"}


@investigations_router.post("/{inv_id}/close")
def close_investigation(inv_id: int, data: InvestigationClose,
                        db: Session = Depends(get_db),
                        user: User = Depends(get_current_active_user)):
    inv = db.query(Investigation).filter(Investigation.id == inv_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")

    inv.status = InvestigationStatus.CLOSED
    inv.resolution = data.resolution
    inv.closed_at = datetime.utcnow()
    inv.updated_at = datetime.utcnow()
    db.commit()
    return {"message": "Investigation closed"}


# ============================================
# Network Routes
# ============================================

networks_router = APIRouter(prefix="/api/networks", tags=["Fraud Networks"])


@networks_router.get("")
def list_networks(db: Session = Depends(get_db),
                  user: User = Depends(get_current_active_user)):
    networks = get_networks(db)
    return [
        {"id": n.id, "network_name": n.network_name, "network_type": n.network_type.value,
         "risk_score": n.risk_score, "status": n.status.value,
         "created_at": n.created_at.isoformat()}
        for n in networks
    ]


@networks_router.get("/suspicious")
def suspicious_networks(db: Session = Depends(get_db),
                        user: User = Depends(get_current_active_user)):
    networks = get_suspicious_networks(db)
    return [
        {"id": n.id, "network_name": n.network_name, "risk_score": n.risk_score,
         "status": n.status.value}
        for n in networks
    ]


@networks_router.get("/{network_id}")
def get_network(network_id: int, db: Session = Depends(get_db),
                user: User = Depends(get_current_active_user)):
    n = get_network_by_id(db, network_id)
    if not n:
        raise HTTPException(status_code=404, detail="Network not found")
    return {"id": n.id, "network_name": n.network_name, "network_type": n.network_type.value,
            "risk_score": n.risk_score, "status": n.status.value}


@networks_router.get("/{network_id}/graph")
def network_graph(network_id: int, db: Session = Depends(get_db),
                  user: User = Depends(get_current_active_user)):
    return get_network_graph(db, network_id)


@networks_router.get("/account/{account_id}/graph")
def account_network_graph(account_id: int, db: Session = Depends(get_db),
                          user: User = Depends(get_current_active_user)):
    return build_account_network(db, account_id)


# ============================================
# Analytics Routes
# ============================================

analytics_router = APIRouter(prefix="/api/analytics", tags=["Analytics"])


@analytics_router.get("/overview")
def analytics_overview(db: Session = Depends(get_db),
                       user: User = Depends(get_current_active_user)):
    return get_dashboard_overview(db)


@analytics_router.get("/fraud-trends")
def analytics_fraud_trends(days: int = 30, db: Session = Depends(get_db),
                           user: User = Depends(get_current_active_user)):
    return get_fraud_trends(db, days)


@analytics_router.get("/payment-methods")
def analytics_payment_methods(db: Session = Depends(get_db),
                              user: User = Depends(get_current_active_user)):
    return get_payment_method_stats(db)


@analytics_router.get("/time-patterns")
def analytics_time_patterns(db: Session = Depends(get_db),
                            user: User = Depends(get_current_active_user)):
    return get_time_pattern_stats(db)


@analytics_router.get("/risk-distribution")
def analytics_risk_dist(db: Session = Depends(get_db),
                        user: User = Depends(get_current_active_user)):
    return get_risk_distribution(db)


@analytics_router.get("/locations")
def analytics_locations(db: Session = Depends(get_db),
                        user: User = Depends(get_current_active_user)):
    results = db.query(
        Location.city, func.count(Transaction.id).label("count")
    ).join(Transaction, Transaction.location_id == Location.id).group_by(
        Location.city
    ).order_by(desc("count")).limit(15).all()
    return [{"city": r.city, "count": r.count} for r in results]


@analytics_router.get("/merchants")
def analytics_merchants(db: Session = Depends(get_db),
                        user: User = Depends(get_current_active_user)):
    results = db.query(
        Merchant.merchant_name, Merchant.risk_score,
        func.count(Transaction.id).label("count")
    ).join(Transaction, Transaction.merchant_id == Merchant.id).group_by(
        Merchant.merchant_name, Merchant.risk_score
    ).order_by(desc(Merchant.risk_score)).limit(15).all()
    return [{"merchant": r.merchant_name, "risk_score": r.risk_score, "count": r.count}
            for r in results]


# ============================================
# Reports Routes
# ============================================

reports_router = APIRouter(prefix="/api/reports", tags=["Reports"])


@reports_router.get("/fraud")
def fraud_report(db: Session = Depends(get_db),
                 user: User = Depends(get_current_active_user)):
    results = db.query(Transaction, RiskScore).join(
        RiskScore, RiskScore.transaction_id == Transaction.id
    ).filter(
        RiskScore.risk_level.in_([RiskLevel.HIGH, RiskLevel.CRITICAL])
    ).order_by(desc(RiskScore.final_score)).limit(100).all()

    return [
        {
            "transaction_id": t.transaction_id, "amount": t.amount,
            "payment_method": t.payment_method.value if t.payment_method else "",
            "timestamp": t.timestamp.isoformat(),
            "risk_score": r.final_score, "risk_level": r.risk_level.value,
            "decision": r.decision.value,
            "reasons": json.loads(r.reasons) if r.reasons else [],
        }
        for t, r in results
    ]


@reports_router.get("/investigations")
def investigations_report(db: Session = Depends(get_db),
                          user: User = Depends(get_current_active_user)):
    invs = db.query(Investigation).order_by(desc(Investigation.created_at)).limit(100).all()
    return [
        {
            "id": i.id, "alert_id": i.alert_id,
            "priority": i.priority.value if i.priority else "",
            "status": i.status.value if i.status else "",
            "resolution": i.resolution,
            "created_at": i.created_at.isoformat(),
            "closed_at": i.closed_at.isoformat() if i.closed_at else None,
        }
        for i in invs
    ]


@reports_router.post("/export")
def export_report(db: Session = Depends(get_db),
                  user: User = Depends(get_current_active_user)):
    """Generate exportable report data."""
    return {
        "message": "Report data generated. Download via frontend export feature.",
        "format": "csv",
    }


# ============================================
# AI Assistant Routes
# ============================================

assistant_router = APIRouter(prefix="/api/assistant", tags=["AI Assistant"])


@assistant_router.post("/chat")
def assistant_chat(data: AssistantMessage, db: Session = Depends(get_db),
                   user: User = Depends(get_current_active_user)):
    """Chat with FraudLens Copilot."""
    result = chat(db, data.message)
    return result


# ============================================
# Misc Data Routes
# ============================================

data_router = APIRouter(prefix="/api/data", tags=["Data"])


@data_router.get("/devices")
def list_devices(db: Session = Depends(get_db),
                 user: User = Depends(get_current_active_user)):
    devices = db.query(Device).order_by(desc(Device.risk_score)).limit(50).all()
    return [
        {"id": d.id, "device_fingerprint": d.device_fingerprint[:12] + "...",
         "device_type": d.device_type, "operating_system": d.operating_system,
         "browser": d.browser, "risk_score": d.risk_score}
        for d in devices
    ]


@data_router.get("/beneficiaries")
def list_beneficiaries(db: Session = Depends(get_db),
                       user: User = Depends(get_current_active_user)):
    bens = db.query(Beneficiary).order_by(desc(Beneficiary.risk_score)).limit(50).all()
    return [
        {"id": b.id, "account_id": b.account_id,
         "beneficiary_account_masked": b.beneficiary_account_masked,
         "bank": b.bank, "risk_score": b.risk_score, "status": b.status.value}
        for b in bens
    ]


@data_router.get("/merchants")
def list_merchants(db: Session = Depends(get_db),
                   user: User = Depends(get_current_active_user)):
    merchants = db.query(Merchant).order_by(desc(Merchant.risk_score)).limit(50).all()
    return [
        {"id": m.id, "merchant_id": m.merchant_id, "merchant_name": m.merchant_name,
         "category": m.category, "risk_score": m.risk_score, "status": m.status.value}
        for m in merchants
    ]


@data_router.get("/locations")
def list_locations(db: Session = Depends(get_db),
                   user: User = Depends(get_current_active_user)):
    locations = db.query(Location).all()
    return [
        {"id": l.id, "city": l.city, "state": l.state, "country": l.country}
        for l in locations
    ]


# ============================================
# Audit Logs Router (Compliance & Governance)
# ============================================

audit_router = APIRouter(prefix="/api/audit-logs", tags=["Audit Logs"])


@audit_router.get("")
def list_audit_logs(
    action: Optional[str] = None,
    entity_type: Optional[str] = None,
    user_id: Optional[int] = None,
    limit: int = 50,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_active_user),
):
    """Retrieve immutable compliance audit trail with filtering."""
    query = db.query(AuditLog)

    if action:
        query = query.filter(AuditLog.action.ilike(f"%{action}%"))
    if entity_type:
        query = query.filter(AuditLog.entity_type == entity_type)
    if user_id:
        query = query.filter(AuditLog.user_id == user_id)

    logs = query.order_by(desc(AuditLog.timestamp)).limit(limit).all()

    return [
        {
            "id": log.id,
            "user_id": log.user_id,
            "user_name": log.user_name,
            "action": log.action,
            "entity_type": log.entity_type,
            "entity_id": log.entity_id,
            "details": log.details,
            "ip_address": log.ip_address,
            "timestamp": log.timestamp.isoformat(),
        }
        for log in logs
    ]

