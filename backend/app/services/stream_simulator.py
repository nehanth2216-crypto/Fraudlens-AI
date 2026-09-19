"""
FraudLens AI — Real-Time Transaction Stream Simulator
Modeled after Kaggle's PaySim & IEEE-CIS benchmark financial fraud datasets.
Generates continuous or burst transactions, runs full ML scoring, and streams events.
"""

import random
import asyncio
import uuid
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.account import Account
from app.models.beneficiary import Beneficiary
from app.models.merchant import Merchant
from app.models.device import Device
from app.models.location import Location
from app.models.ip_address import IPAddress
from app.models.transaction import TransactionType, PaymentMethod
from app.services.fraud_service import analyze_transaction
from app.services.audit_service import log_audit_event
from app.websocket_manager import ws_manager


PAYMENT_METHODS = ["UPI", "CARD", "NETBANKING", "WALLET"]
TXN_TYPES = ["TRANSFER", "PAYMENT", "WITHDRAWAL", "DEPOSIT"]

FRAUD_SCENARIOS = ["ATO", "VELOCITY_BURST", "HIGH_AMOUNT", "MULE_SYNDICATE", "STRUCTURING"]



class StreamState:
    is_streaming: bool = False
    task: Optional[asyncio.Task] = None
    interval_seconds: float = 3.0
    total_emitted: int = 0
    fraud_emitted: int = 0
    last_emitted_at: Optional[datetime] = None


stream_state = StreamState()


def _get_random_or_create_context(db: Session):
    """Fetch existing foreign entities from DB or generate fallback identifiers."""
    account = db.query(Account).order_by(Account.id.asc()).first()
    beneficiary = db.query(Beneficiary).first()
    merchant = db.query(Merchant).first()
    device = db.query(Device).first()
    location = db.query(Location).first()
    ip = db.query(IPAddress).first()

    account_id = account.id if account else 1
    beneficiary_id = beneficiary.id if beneficiary else None
    merchant_id = merchant.id if merchant else None
    device_id = device.id if device else None
    location_id = location.id if location else None
    ip_id = ip.id if ip else None

    return account_id, beneficiary_id, merchant_id, device_id, location_id, ip_id


def generate_single_transaction(
    db: Session,
    is_fraud: bool = False,
    scenario: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Generate one realistic transaction modeled after PaySim features,
    run it through the complete ML fraud scoring pipeline, and return analysis.
    """
    account_id, ben_id, merch_id, dev_id, loc_id, ip_id = _get_random_or_create_context(db)
    selected_scenario = scenario or (random.choice(FRAUD_SCENARIOS) if is_fraud else "NORMAL")

    now = datetime.utcnow()

    if is_fraud or selected_scenario != "NORMAL":
        if selected_scenario == "ATO":
            # Sudden high transfer to unverified beneficiary from new device
            amount = round(random.uniform(95000, 350000), 2)
            payment_method = "UPI"
            txn_type = "TRANSFER"
            dev_id = None  # Simulates new unrecognised device
        elif selected_scenario == "VELOCITY_BURST":
            # Rapid high-frequency transaction
            amount = round(random.uniform(45000, 85000), 2)
            payment_method = "UPI"
            txn_type = "TRANSFER"
        elif selected_scenario == "HIGH_AMOUNT":
            # Massive single transaction 10x normal average
            amount = round(random.uniform(180000, 500000), 2)
            payment_method = random.choice(["NETBANKING", "UPI"])
            txn_type = "TRANSFER"
        elif selected_scenario == "STRUCTURING":
            # Just under ₹50,000 threshold (e.g. ₹48,990)
            amount = round(random.uniform(48000, 49999), 2)
            payment_method = "UPI"
            txn_type = "TRANSFER"
        else:
            amount = round(random.uniform(75000, 200000), 2)
            payment_method = random.choice(PAYMENT_METHODS)
            txn_type = random.choice(TXN_TYPES)
    else:
        # Normal everyday transaction
        amount = round(random.uniform(120, 8500), 2)
        payment_method = random.choice(PAYMENT_METHODS)
        txn_type = random.choice(["PAYMENT", "TRANSFER", "WITHDRAWAL"])


    # Run through full ML analysis pipeline
    analysis = analyze_transaction(
        db=db,
        account_id=account_id,
        amount=amount,
        payment_method=payment_method,
        transaction_type=txn_type,
        beneficiary_id=ben_id,
        merchant_id=merch_id,
        device_id=dev_id,
        location_id=loc_id,
        ip_address_id=ip_id,
        timestamp=now,
    )

    # Attach scenario metadata for frontend display
    analysis["scenario"] = selected_scenario
    analysis["is_synthetic_stream"] = True
    analysis["dataset_benchmark"] = "PaySim / IEEE-CIS"

    # Broadcast transaction event over WebSocket
    ws_manager.broadcast_sync("NEW_TRANSACTION", {
        "transaction_id": analysis["transaction_id"],
        "amount": amount,
        "payment_method": payment_method,
        "transaction_type": txn_type,
        "risk_score": analysis["risk_score"],
        "risk_level": analysis["risk_level"],
        "decision": analysis["decision"],
        "timestamp": now.isoformat(),
        "scenario": selected_scenario,
    })

    # If alert generated, broadcast alert event as well
    if analysis.get("alert"):
        ws_manager.broadcast_sync("NEW_ALERT", analysis["alert"])

    # Update stream metrics
    stream_state.total_emitted += 1
    if analysis["risk_level"] in ("HIGH", "CRITICAL"):
        stream_state.fraud_emitted += 1
    stream_state.last_emitted_at = now

    return analysis


def simulate_stream_batch(
    db: Session,
    count: int = 5,
    inject_fraud: bool = True,
    scenario: Optional[str] = None,
    user=None,
) -> List[Dict[str, Any]]:
    """Generate a batch of transactions and process them immediately."""
    results = []
    # If fraud injection enabled, ensure at least 1-2 fraudulent transactions in batch
    fraud_indices = set()
    if inject_fraud and count > 0:
        fraud_count = max(1, count // 3)
        fraud_indices = set(random.sample(range(count), min(fraud_count, count)))

    for i in range(count):
        is_fraud = i in fraud_indices
        sc = scenario if is_fraud else ("NORMAL" if not is_fraud else None)
        result = generate_single_transaction(db, is_fraud=is_fraud, scenario=sc)
        results.append(result)

    # Log audit event
    log_audit_event(
        db=db,
        action="STREAM_BATCH_SIMULATED",
        entity_type="STREAM_GENERATOR",
        details=f"Simulated batch of {count} PaySim transactions (injected fraud: {inject_fraud})",
        user=user,
    )

    return results


async def _background_streaming_loop():
    """Async generator task that pushes transactions at fixed intervals."""
    while stream_state.is_streaming:
        db = SessionLocal()
        try:
            # 25% chance of simulating fraud pattern
            is_fraud = random.random() < 0.25
            generate_single_transaction(db, is_fraud=is_fraud)
        except Exception as e:
            print(f"[WARN] Stream simulator error: {e}")
        finally:
            db.close()

        await asyncio.sleep(stream_state.interval_seconds)


def start_streaming(interval_seconds: float = 3.0, user=None) -> Dict[str, Any]:
    """Start background transaction stream."""
    if stream_state.is_streaming:
        return {"status": "already_running", "interval_seconds": stream_state.interval_seconds}

    stream_state.is_streaming = True
    stream_state.interval_seconds = max(1.0, interval_seconds)
    stream_state.task = asyncio.create_task(_background_streaming_loop())

    db = SessionLocal()
    try:
        log_audit_event(
            db=db,
            action="STREAM_STARTED",
            entity_type="STREAM_GENERATOR",
            details=f"Live PaySim transaction telemetry started with interval {stream_state.interval_seconds}s",
            user=user,
        )
    finally:
        db.close()

    return {"status": "started", "interval_seconds": stream_state.interval_seconds}


def stop_streaming(user=None) -> Dict[str, Any]:
    """Stop background transaction stream."""
    if not stream_state.is_streaming:
        return {"status": "not_running"}

    stream_state.is_streaming = False
    if stream_state.task:
        stream_state.task.cancel()
        stream_state.task = None

    db = SessionLocal()
    try:
        log_audit_event(
            db=db,
            action="STREAM_STOPPED",
            entity_type="STREAM_GENERATOR",
            details=f"Live PaySim stream stopped. Total emitted: {stream_state.total_emitted}",
            user=user,
        )
    finally:
        db.close()

    return {
        "status": "stopped",
        "total_emitted": stream_state.total_emitted,
        "fraud_emitted": stream_state.fraud_emitted,
    }


def get_stream_status() -> Dict[str, Any]:
    """Get current status of real-time transaction stream."""
    return {
        "is_streaming": stream_state.is_streaming,
        "interval_seconds": stream_state.interval_seconds,
        "total_emitted": stream_state.total_emitted,
        "fraud_emitted": stream_state.fraud_emitted,
        "last_emitted_at": stream_state.last_emitted_at.isoformat() if stream_state.last_emitted_at else None,
    }
