"""
FraudLens AI — Analytics Service
Aggregation queries for dashboard KPIs, charts, and analytics.
"""

from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func, case, and_, extract
from app.models.transaction import Transaction, TransactionStatus
from app.models.risk_score import RiskScore, RiskLevel
from app.models.fraud_alert import FraudAlert, AlertStatus, AlertSeverity
from app.models.fraud_prediction import FraudPrediction
from app.models.investigation import Investigation, InvestigationStatus


def get_dashboard_overview(db: Session) -> dict:
    """Get KPI metrics for the dashboard."""
    total_txns = db.query(func.count(Transaction.id)).scalar() or 0

    # Fraud detected (risk HIGH or CRITICAL)
    fraud_detected = db.query(func.count(RiskScore.id)).filter(
        RiskScore.risk_level.in_([RiskLevel.HIGH, RiskLevel.CRITICAL])
    ).scalar() or 0

    high_risk = db.query(func.count(RiskScore.id)).filter(
        RiskScore.risk_level == RiskLevel.HIGH
    ).scalar() or 0

    critical_alerts = db.query(func.count(FraudAlert.id)).filter(
        FraudAlert.severity == AlertSeverity.CRITICAL,
        FraudAlert.status == AlertStatus.OPEN
    ).scalar() or 0

    total_amount = db.query(func.sum(Transaction.amount)).scalar() or 0

    amount_at_risk = db.query(func.sum(Transaction.amount)).join(
        RiskScore, RiskScore.transaction_id == Transaction.id
    ).filter(
        RiskScore.risk_level.in_([RiskLevel.HIGH, RiskLevel.CRITICAL])
    ).scalar() or 0

    fraud_rate = (fraud_detected / total_txns * 100) if total_txns > 0 else 0

    open_investigations = db.query(func.count(Investigation.id)).filter(
        Investigation.status.in_([InvestigationStatus.OPEN, InvestigationStatus.IN_PROGRESS])
    ).scalar() or 0

    return {
        "total_transactions": total_txns,
        "fraud_detected": fraud_detected,
        "high_risk_transactions": high_risk,
        "critical_alerts": critical_alerts,
        "amount_processed": round(total_amount, 2),
        "amount_at_risk": round(amount_at_risk, 2),
        "fraud_detection_rate": round(fraud_rate, 2),
        "open_investigations": open_investigations,
    }


def get_recent_transactions(db: Session, limit: int = 20) -> list:
    """Get recent transactions with risk scores."""
    txns = db.query(Transaction, RiskScore).outerjoin(
        RiskScore, RiskScore.transaction_id == Transaction.id
    ).order_by(Transaction.timestamp.desc()).limit(limit).all()

    results = []
    for txn, risk in txns:
        results.append({
            "id": txn.id,
            "transaction_id": txn.transaction_id,
            "amount": txn.amount,
            "currency": txn.currency,
            "payment_method": txn.payment_method.value if txn.payment_method else "",
            "transaction_type": txn.transaction_type.value if txn.transaction_type else "",
            "timestamp": txn.timestamp.isoformat(),
            "status": txn.status.value if txn.status else "",
            "risk_score": risk.final_score if risk else 0,
            "risk_level": risk.risk_level.value if risk else "LOW",
            "decision": risk.decision.value if risk else "APPROVE",
        })

    return results


def get_fraud_trends(db: Session, days: int = 30) -> list:
    """Get fraud trends over time."""
    since = datetime.utcnow() - timedelta(days=days)

    results = db.query(
        func.date(Transaction.timestamp).label("date"),
        func.count(Transaction.id).label("total"),
        func.sum(case(
            (RiskScore.risk_level.in_([RiskLevel.HIGH, RiskLevel.CRITICAL]), 1),
            else_=0
        )).label("fraudulent"),
    ).outerjoin(
        RiskScore, RiskScore.transaction_id == Transaction.id
    ).filter(
        Transaction.timestamp >= since
    ).group_by(
        func.date(Transaction.timestamp)
    ).order_by(
        func.date(Transaction.timestamp)
    ).all()

    trends = []
    for row in results:
        total = row.total or 0
        fraudulent = row.fraudulent or 0
        trends.append({
            "date": str(row.date),
            "total": total,
            "fraudulent": fraudulent,
            "fraud_rate": round(fraudulent / max(total, 1) * 100, 2),
        })

    return trends


def get_risk_distribution(db: Session) -> list:
    """Get distribution of risk levels."""
    results = db.query(
        RiskScore.risk_level,
        func.count(RiskScore.id).label("count"),
    ).group_by(RiskScore.risk_level).all()

    total = sum(r.count for r in results) or 1
    distribution = []
    for r in results:
        distribution.append({
            "risk_level": r.risk_level.value,
            "count": r.count,
            "percentage": round(r.count / total * 100, 2),
        })

    return distribution


def get_payment_method_stats(db: Session) -> list:
    """Get fraud statistics by payment method."""
    results = db.query(
        Transaction.payment_method,
        func.count(Transaction.id).label("total"),
        func.sum(case(
            (RiskScore.risk_level.in_([RiskLevel.HIGH, RiskLevel.CRITICAL]), 1),
            else_=0
        )).label("fraudulent"),
    ).outerjoin(
        RiskScore, RiskScore.transaction_id == Transaction.id
    ).group_by(Transaction.payment_method).all()

    stats = []
    for r in results:
        total = r.total or 0
        fraudulent = r.fraudulent or 0
        stats.append({
            "payment_method": r.payment_method.value if r.payment_method else "UNKNOWN",
            "total": total,
            "fraudulent": fraudulent,
            "fraud_rate": round(fraudulent / max(total, 1) * 100, 2),
        })
    return stats


def get_time_pattern_stats(db: Session) -> list:
    """Get fraud patterns by hour of day."""
    results = db.query(
        extract('hour', Transaction.timestamp).label("hour"),
        func.count(Transaction.id).label("total"),
        func.sum(case(
            (RiskScore.risk_level.in_([RiskLevel.HIGH, RiskLevel.CRITICAL]), 1),
            else_=0
        )).label("fraudulent"),
    ).outerjoin(
        RiskScore, RiskScore.transaction_id == Transaction.id
    ).group_by(
        extract('hour', Transaction.timestamp)
    ).order_by(
        extract('hour', Transaction.timestamp)
    ).all()

    stats = []
    for r in results:
        total = r.total or 0
        fraudulent = r.fraudulent or 0
        stats.append({
            "hour": int(r.hour),
            "total": total,
            "fraudulent": fraudulent,
            "fraud_rate": round(fraudulent / max(total, 1) * 100, 2),
        })
    return stats


def get_analytics_overview(db: Session) -> dict:
    """Comprehensive analytics data."""
    return {
        "overview": get_dashboard_overview(db),
        "fraud_trends": get_fraud_trends(db),
        "risk_distribution": get_risk_distribution(db),
        "payment_methods": get_payment_method_stats(db),
        "time_patterns": get_time_pattern_stats(db),
    }
