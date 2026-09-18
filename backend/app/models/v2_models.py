"""
FraudLens AI V2 — Advanced Models
Extends schema for:
- Payment failure diagnosis & smart retry
- Payment / refund recovery & dispute pipeline
- Account takeover (ATO) detection
- Customer complaint intelligence & regulatory compliance
- Merchant health & risk scorecard
- Suspicious Activity Report (SAR) compliance filing
- Scam intelligence & scenario simulation
"""

import enum
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Enum, DateTime, Float, ForeignKey, Text, Boolean, JSON
)
from sqlalchemy.orm import relationship
from app.database import Base


# ============================================================================
# 1. Payment Failure Diagnosis Models
# ============================================================================

class FailureCategory(str, enum.Enum):
    CARDHOLDER_ACTION = "CARDHOLDER_ACTION"
    RISK_FRAUD_INTERCEPTION = "RISK_FRAUD_INTERCEPTION"
    ISSUER_NETWORK_OUTAGE = "ISSUER_NETWORK_OUTAGE"
    INTEGRATION_SYSTEM_ERROR = "INTEGRATION_SYSTEM_ERROR"


class DeclineCode(str, enum.Enum):
    INSUFFICIENT_FUNDS = "51_INSUFFICIENT_FUNDS"
    DO_NOT_HONOR = "05_DO_NOT_HONOR"
    SUSPECTED_FRAUD = "59_SUSPECTED_FRAUD"
    EXPIRED_CARD = "54_EXPIRED_CARD"
    INVALID_CVV_AVS = "82_INVALID_CVV_AVS"
    VELOCITY_LIMIT_EXCEEDED = "61_VELOCITY_LIMIT_EXCEEDED"
    THREE_DS_FAILED = "3DS_AUTH_FAILED"
    PROCESSOR_TIMEOUT = "91_PROCESSOR_TIMEOUT"
    NETWORK_DISCONNECT = "96_NETWORK_SYSTEM_MALFUNCTION"
    STOLEN_CARD_PICKUP = "43_STOLEN_CARD_PICKUP"


class PaymentFailureDiagnosis(Base):
    __tablename__ = "payment_failure_diagnoses"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(Integer, ForeignKey("transactions.id"), nullable=False, index=True)
    decline_code = Column(String(50), nullable=False)
    category = Column(Enum(FailureCategory), nullable=False)
    root_cause = Column(Text, nullable=False)
    raw_processor_message = Column(String(255), nullable=True)
    retry_eligible = Column(Boolean, default=True)
    recommended_retry_delay_sec = Column(Integer, default=300)
    estimated_recovery_probability = Column(Float, default=0.5)
    suggested_action = Column(String(255), nullable=False)
    alternative_rail_suggested = Column(String(50), nullable=True) # e.g. "UPI", "DEBIT_CARD"
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    transaction = relationship("Transaction")


# ============================================================================
# 2. Payment & Refund Recovery Models
# ============================================================================

class DisputeStage(str, enum.Enum):
    INQUIRY = "INQUIRY"
    CHARGEBACK_FILED = "CHARGEBACK_FILED"
    EVIDENCE_SUBMITTED = "EVIDENCE_SUBMITTED"
    UNDER_REVIEW = "UNDER_REVIEW"
    WON_RECOVERED = "WON_RECOVERED"
    LOST = "LOST"
    ARBITRATION = "ARBITRATION"


class PaymentRecovery(Base):
    __tablename__ = "payment_recoveries"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(Integer, ForeignKey("transactions.id"), nullable=False, index=True)
    dispute_id = Column(String(50), unique=True, nullable=False, index=True)
    amount = Column(Float, nullable=False)
    currency = Column(String(3), default="INR")
    dispute_reason = Column(String(100), nullable=False) # e.g., "10.4 Fraud - Card-Absent"
    stage = Column(Enum(DisputeStage), default=DisputeStage.CHARGEBACK_FILED)
    win_probability = Column(Float, default=0.65)
    evidence_dossier = Column(JSON, nullable=True) # Shipping, IP, 3DS logs, chat
    refund_abuse_flag = Column(Boolean, default=False)
    refund_abuse_score = Column(Float, default=0.0) # 0.0 - 1.0
    recovered_amount = Column(Float, default=0.0)
    deadline_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    transaction = relationship("Transaction")


# ============================================================================
# 3. Account Takeover (ATO) Models
# ============================================================================

class ATOTriggerType(str, enum.Enum):
    IMPOSSIBLE_TRAVEL = "IMPOSSIBLE_TRAVEL"
    CREDENTIAL_STUFFING = "CREDENTIAL_STUFFING"
    NEW_UNTRUSTED_DEVICE = "NEW_UNTRUSTED_DEVICE"
    SIM_SWAP_MFA_FATIGUE = "SIM_SWAP_MFA_FATIGUE"
    BEHAVIORAL_BIOMETRIC_ANOMALY = "BEHAVIORAL_BIOMETRIC_ANOMALY"
    HIGH_FREQUENCY_PASSWORD_RESET = "HIGH_FREQUENCY_PASSWORD_RESET"


class ATOSeverity(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class AccountTakeoverEvent(Base):
    __tablename__ = "account_takeover_events"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, ForeignKey("accounts.id"), nullable=False, index=True)
    trigger_type = Column(Enum(ATOTriggerType), nullable=False)
    severity = Column(Enum(ATOSeverity), nullable=False)
    risk_score = Column(Float, nullable=False) # 0 to 100
    details = Column(JSON, nullable=True) # e.g., {"prev_ip": "...", "curr_ip": "...", "distance_km": 8200, "speed_kmh": 1400}
    action_taken = Column(String(100), default="FLAGGED_FOR_REVIEW") # "SESSION_TERMINATED", "STEP_UP_MFA_ENFORCED", "ACCOUNT_FROZEN"
    is_mitigated = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    account = relationship("Account")


# ============================================================================
# 4. Customer Complaint Intelligence Models
# ============================================================================

class ComplaintCategory(str, enum.Enum):
    UNAUTHORIZED_TRANSACTION = "UNAUTHORIZED_TRANSACTION"
    SCAM_VICTIM_REPORT = "SCAM_VICTIM_REPORT"
    SERVICE_NOT_DELIVERED = "SERVICE_NOT_DELIVERED"
    DOUBLE_DEBIT = "DOUBLE_DEBIT"
    REFUND_DELAY_COMPLAINT = "REFUND_DELAY_COMPLAINT"
    ACCOUNT_UNFAIRLY_LOCKED = "ACCOUNT_UNFAIRLY_LOCKED"


class ComplaintUrgency(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    REGULATORY_ESCALATION = "REGULATORY_ESCALATION"


class CustomerComplaint(Base):
    __tablename__ = "customer_complaints"

    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(String(50), unique=True, nullable=False, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False, index=True)
    transaction_id = Column(Integer, ForeignKey("transactions.id"), nullable=True)
    channel = Column(String(30), default="EMAIL") # EMAIL, CHAT, PHONE, REGULATOR_PORTAL
    subject = Column(String(255), nullable=False)
    body = Column(Text, nullable=False)
    category = Column(Enum(ComplaintCategory), nullable=False)
    urgency = Column(Enum(ComplaintUrgency), default=ComplaintUrgency.MEDIUM)
    sentiment_score = Column(Float, default=-0.5) # -1.0 (very negative) to +1.0
    regulatory_flag = Column(Boolean, default=False) # e.g. mentions CFPB, EFTA Reg E, Legal action
    ai_summary = Column(Text, nullable=True)
    suggested_resolution = Column(Text, nullable=True)
    status = Column(String(30), default="OPEN") # OPEN, IN_TRIAGE, ESCALATED, RESOLVED
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    customer = relationship("Customer")
    transaction = relationship("Transaction")


# ============================================================================
# 5. Merchant Health & Risk Models
# ============================================================================

class MerchantRiskTier(str, enum.Enum):
    TIER_1_EXEMPLARY = "TIER_1_EXEMPLARY"
    TIER_2_STANDARD = "TIER_2_STANDARD"
    TIER_3_WATCHLIST = "TIER_3_WATCHLIST"
    TIER_4_HIGH_RISK = "TIER_4_HIGH_RISK"
    TIER_5_SUSPENDED = "TIER_5_SUSPENDED"


class MerchantRiskProfile(Base):
    __tablename__ = "merchant_risk_profiles"

    id = Column(Integer, primary_key=True, index=True)
    merchant_id = Column(Integer, ForeignKey("merchants.id"), unique=True, nullable=False, index=True)
    health_score = Column(Float, default=85.0) # 0 to 100
    chargeback_ratio = Column(Float, default=0.004) # e.g. 0.004 = 0.4%
    refund_rate = Column(Float, default=0.02) # 2%
    monthly_volume = Column(Float, default=500000.0)
    risk_tier = Column(Enum(MerchantRiskTier), default=MerchantRiskTier.TIER_2_STANDARD)
    is_payout_held = Column(Boolean, default=False)
    rolling_reserve_percent = Column(Float, default=0.0) # e.g. 5.0%
    bust_out_risk_score = Column(Float, default=0.1) # 0.0 - 1.0
    flagged_reasons = Column(JSON, nullable=True)
    last_audit_date = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    merchant = relationship("Merchant")


# ============================================================================
# 6. Suspicious Activity Report (SAR) Compliance Models
# ============================================================================

class SARReport(Base):
    __tablename__ = "sar_reports"

    id = Column(Integer, primary_key=True, index=True)
    sar_tracking_number = Column(String(50), unique=True, nullable=False, index=True)
    investigation_id = Column(Integer, ForeignKey("investigations.id"), nullable=True)
    suspect_name = Column(String(100), nullable=False)
    suspect_account = Column(String(100), nullable=True)
    suspect_type = Column(String(50), default="INDIVIDUAL") # INDIVIDUAL, ENTITY
    violation_types = Column(JSON, nullable=False) # e.g. ["MONEY_LAUNDERING", "STRUCTURING", "WIRE_FRAUD"]
    suspicious_amount = Column(Float, nullable=False)
    narrative = Column(Text, nullable=False) # FinCEN formatted narrative
    filing_status = Column(String(30), default="DRAFT") # DRAFT, APPROVED, TRANSMITTED
    fincen_bsa_id = Column(String(50), nullable=True)
    filed_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    investigation = relationship("Investigation")
    filed_by = relationship("User")


# ============================================================================
# 7. Scam Intelligence & Simulation Models
# ============================================================================

class ScamType(str, enum.Enum):
    AUTHORIZED_PUSH_PAYMENT = "AUTHORIZED_PUSH_PAYMENT"
    IMPERSONATION_OFFICIAL = "IMPERSONATION_OFFICIAL"
    ROMANCE_CONFIDENCE = "ROMANCE_CONFIDENCE"
    INVESTMENT_PONZI = "INVESTMENT_PONZI"
    TECH_SUPPORT_TAKEOVER = "TECH_SUPPORT_TAKEOVER"
    SYNTHETIC_IDENTITY = "SYNTHETIC_IDENTITY"
    MONEY_MULE_TRANSFER = "MONEY_MULE_TRANSFER"


class ScamIntelligenceRecord(Base):
    __tablename__ = "scam_intelligence_records"

    id = Column(Integer, primary_key=True, index=True)
    scam_type = Column(Enum(ScamType), nullable=False)
    campaign_name = Column(String(100), nullable=False)
    threat_level = Column(String(20), default="HIGH") # LOW, MEDIUM, HIGH, CRITICAL
    target_demographic = Column(String(100), nullable=True)
    tactics_summary = Column(Text, nullable=False)
    indicators_of_compromise = Column(JSON, nullable=True) # phone numbers, keywords, UPI handles
    detected_incidents_count = Column(Integer, default=1)
    total_financial_loss = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
