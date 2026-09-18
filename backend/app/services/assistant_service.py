"""
FraudLens AI — AI Assistant Service
Rule-based assistant that queries the database for fraud insights.
"""

import re
import json
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.transaction import Transaction
from app.models.risk_score import RiskScore, RiskLevel
from app.models.fraud_alert import FraudAlert, AlertStatus, AlertSeverity
from app.models.investigation import Investigation
from app.models.customer import Customer
from app.models.account import Account
from app.models.device import Device


def chat(db: Session, message: str) -> dict:
    """
    Process a user message and return a data-driven response.
    Uses pattern matching to understand intent, then queries the database.
    Never fabricates data.
    """
    msg = message.lower().strip()

    # Intent: Transaction lookup
    txn_match = re.search(r'txn[a-z0-9]+', msg, re.IGNORECASE)
    if txn_match or "transaction" in msg and ("why" in msg or "flag" in msg or "detail" in msg):
        return _handle_transaction_query(db, message, txn_match)

    # Intent: Critical/high alerts
    if any(w in msg for w in ["critical alert", "high alert", "critical", "alerts"]):
        return _handle_alerts_query(db, msg)

    # Intent: High-risk transactions
    if "high risk" in msg or "high-risk" in msg or "risky" in msg:
        return _handle_high_risk_query(db)

    # Intent: Device query
    if "device" in msg:
        return _handle_device_query(db, msg)

    # Intent: Investigation summary
    if "investigation" in msg or "inv" in msg:
        return _handle_investigation_query(db, msg)

    # Intent: Statistics / overview
    if any(w in msg for w in ["stats", "statistics", "overview", "summary", "how many"]):
        return _handle_stats_query(db)

    # Intent: Customer query
    if "customer" in msg:
        return _handle_customer_query(db, msg)

    # Default help response
    return {
        "response": (
            "I'm **FraudLens Copilot** — I can help you investigate fraud cases using live data. "
            "Here's what you can ask me:\n\n"
            "• **\"Why was TXN... flagged?\"** — Get details on a specific transaction\n"
            "• **\"Show critical alerts\"** — View current critical alerts\n"
            "• **\"Show high-risk transactions\"** — List high-risk transactions\n"
            "• **\"Find devices connected to account X\"** — Device analysis\n"
            "• **\"Summarize investigations\"** — Investigation overview\n"
            "• **\"Show statistics\"** — Dashboard overview\n"
            "• **\"Customer risk for [name]\"** — Customer risk profile"
        ),
        "suggestions": [
            "Show critical alerts",
            "Show high-risk transactions today",
            "Show statistics overview",
            "Summarize open investigations",
        ],
    }


def _handle_transaction_query(db: Session, msg: str, txn_match) -> dict:
    """Look up a specific transaction and explain its risk."""
    txn = None
    if txn_match:
        txn_id = txn_match.group(0).upper()
        txn = db.query(Transaction).filter(Transaction.transaction_id == txn_id).first()

    if not txn:
        # Try to find by partial match
        return {
            "response": "I couldn't find that transaction. Please provide a valid transaction ID (e.g., TXN10094).",
            "suggestions": ["Show recent transactions", "Show high-risk transactions"],
        }

    risk = db.query(RiskScore).filter(RiskScore.transaction_id == txn.id).first()
    reasons = json.loads(risk.reasons) if risk and risk.reasons else []

    response = f"## Transaction {txn.transaction_id}\n\n"
    response += f"**Amount:** ₹{txn.amount:,.0f}\n"
    response += f"**Type:** {txn.transaction_type.value}\n"
    response += f"**Payment Method:** {txn.payment_method.value}\n"
    response += f"**Timestamp:** {txn.timestamp.strftime('%Y-%m-%d %H:%M:%S')}\n\n"

    if risk:
        response += f"**Risk Score:** {risk.final_score}/100 ({risk.risk_level.value})\n"
        response += f"**Decision:** {risk.decision.value}\n\n"
        response += f"**ML Score:** {risk.ml_score:.1f} | "
        response += f"**Anomaly:** {risk.anomaly_score:.1f} | "
        response += f"**Behavior:** {risk.behavior_score:.1f} | "
        response += f"**Rules:** {risk.rule_score:.1f}\n\n"

        if reasons:
            response += "### Why was this flagged?\n\n"
            for reason in reasons:
                response += f"• {reason}\n"

    return {"response": response, "data": {"transaction_id": txn.transaction_id}}


def _handle_alerts_query(db: Session, msg: str) -> dict:
    """Get current fraud alerts."""
    if "critical" in msg:
        alerts = db.query(FraudAlert).filter(
            FraudAlert.severity == AlertSeverity.CRITICAL,
            FraudAlert.status == AlertStatus.OPEN
        ).order_by(FraudAlert.created_at.desc()).limit(10).all()
        label = "Critical"
    else:
        alerts = db.query(FraudAlert).filter(
            FraudAlert.status == AlertStatus.OPEN
        ).order_by(FraudAlert.created_at.desc()).limit(10).all()
        label = "Open"

    if not alerts:
        return {"response": f"No {label.lower()} alerts found. ✅", "data": {"count": 0}}

    response = f"## {label} Alerts ({len(alerts)})\n\n"
    for a in alerts:
        response += f"• **#{a.id}** — {a.title} | {a.severity.value} | {a.created_at.strftime('%Y-%m-%d %H:%M')}\n"

    return {"response": response, "data": {"count": len(alerts)}}


def _handle_high_risk_query(db: Session) -> dict:
    """Get high-risk transactions."""
    results = db.query(Transaction, RiskScore).join(
        RiskScore, RiskScore.transaction_id == Transaction.id
    ).filter(
        RiskScore.risk_level.in_([RiskLevel.HIGH, RiskLevel.CRITICAL])
    ).order_by(RiskScore.final_score.desc()).limit(10).all()

    if not results:
        return {"response": "No high-risk transactions found. ✅"}

    response = f"## High-Risk Transactions ({len(results)})\n\n"
    response += "| Transaction | Amount | Risk Score | Level | Decision |\n"
    response += "|-------------|--------|------------|-------|----------|\n"
    for txn, risk in results:
        response += (f"| {txn.transaction_id} | ₹{txn.amount:,.0f} | "
                     f"{risk.final_score}/100 | {risk.risk_level.value} | {risk.decision.value} |\n")

    return {"response": response, "data": {"count": len(results)}}


def _handle_device_query(db: Session, msg: str) -> dict:
    """Analyze device connections."""
    devices = db.query(Device).filter(Device.risk_score > 30).order_by(
        Device.risk_score.desc()
    ).limit(10).all()

    if not devices:
        return {"response": "No high-risk devices found."}

    response = "## Suspicious Devices\n\n"
    for d in devices:
        response += (f"• **{d.device_type or 'Unknown'}** ({d.operating_system or 'N/A'}) "
                     f"— Risk: {d.risk_score:.0f}/100 | Browser: {d.browser or 'N/A'}\n")

    return {"response": response, "data": {"count": len(devices)}}


def _handle_investigation_query(db: Session, msg: str) -> dict:
    """Summarize investigations."""
    open_count = db.query(func.count(Investigation.id)).filter(
        Investigation.status.in_(["OPEN", "IN_PROGRESS"])
    ).scalar() or 0

    total = db.query(func.count(Investigation.id)).scalar() or 0

    response = f"## Investigation Summary\n\n"
    response += f"• **Total Investigations:** {total}\n"
    response += f"• **Open/In Progress:** {open_count}\n"
    response += f"• **Closed:** {total - open_count}\n"

    return {"response": response, "data": {"total": total, "open": open_count}}


def _handle_stats_query(db: Session) -> dict:
    """Dashboard statistics."""
    total_txns = db.query(func.count(Transaction.id)).scalar() or 0
    total_fraud = db.query(func.count(RiskScore.id)).filter(
        RiskScore.risk_level.in_([RiskLevel.HIGH, RiskLevel.CRITICAL])
    ).scalar() or 0
    total_alerts = db.query(func.count(FraudAlert.id)).filter(
        FraudAlert.status == AlertStatus.OPEN
    ).scalar() or 0
    total_amount = db.query(func.sum(Transaction.amount)).scalar() or 0

    response = f"## FraudLens Overview\n\n"
    response += f"• **Total Transactions:** {total_txns:,}\n"
    response += f"• **Fraud Detected:** {total_fraud:,}\n"
    response += f"• **Open Alerts:** {total_alerts:,}\n"
    response += f"• **Total Amount Processed:** ₹{total_amount:,.0f}\n"
    response += f"• **Fraud Rate:** {(total_fraud/max(total_txns,1)*100):.1f}%\n"

    return {"response": response}


def _handle_customer_query(db: Session, msg: str) -> dict:
    """Query customer information."""
    customers = db.query(Customer).filter(
        Customer.risk_level.in_(["HIGH", "CRITICAL"])
    ).order_by(Customer.updated_at.desc()).limit(10).all()

    if not customers:
        return {"response": "No high-risk customers found."}

    response = "## High-Risk Customers\n\n"
    for c in customers:
        response += f"• **{c.name}** ({c.customer_number}) — Risk: {c.risk_level.value}\n"

    return {"response": response, "data": {"count": len(customers)}}
