"""
FraudLens AI V2 — Pydantic Schemas for V2 Endpoints
"""

from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field


# ============================================================================
# 1. Scam Prevention Schemas
# ============================================================================

class ScamSimulationRequest(BaseModel):
    scam_type: str = Field(..., example="ROMANCE_CONFIDENCE")
    victim_account_id: int = Field(..., example=1)
    amount: float = Field(..., example=45000.0)
    beneficiary_name: str = Field(..., example="Investment Advisor John")
    urgency_trigger: str = Field("IMMEDIATE_RELEASE", example="IMMEDIATE_RELEASE")
    coercive_channel: str = Field("WHATSAPP_CALL", example="WHATSAPP_CALL")


class ScamSimulationResponse(BaseModel):
    scam_detected: bool
    risk_score: float
    scam_type: str
    confidence: float
    behavioral_red_flags: List[str]
    coercion_level: str
    recommended_interception: str


# ============================================================================
# 2. Payment Failure Diagnosis & Smart Retry Schemas
# ============================================================================

class FailureDiagnoseRequest(BaseModel):
    transaction_id: int
    decline_code: Optional[str] = "51_INSUFFICIENT_FUNDS"
    raw_message: Optional[str] = "Decline: Insufficient Funds Available"


class SmartRetryRequest(BaseModel):
    transaction_id: int
    allow_rail_switch: bool = True


class SmartRetryResponse(BaseModel):
    transaction_id: int
    retry_eligible: bool
    recovery_probability: float
    recommended_backoff_sec: int
    alternative_rail: Optional[str]
    root_cause_summary: str
    action_plan: List[str]


# ============================================================================
# 3. Payment Recovery & Dispute Schemas
# ============================================================================

class DisputeCreate(BaseModel):
    transaction_id: int
    amount: float
    dispute_reason: str = "10.4 Fraud - Card-Absent Environment"
    refund_abuse_score: Optional[float] = 0.0


class DisputeRepresentmentSubmit(BaseModel):
    dispute_id: str
    action: str = "SUBMIT_REPRESENTMENT"
    evidence_notes: Optional[str] = "Signed delivery proof & verified 3DS v2.2 cryptogram attached."


# ============================================================================
# 4. Account Takeover (ATO) Schemas
# ============================================================================

class ATOSessionEvaluationRequest(BaseModel):
    account_id: int
    current_ip: str = "185.220.101.5" # Tor exit node or distant city
    device_fingerprint: str = "fp_unknown_linux_curl"
    prev_ip: Optional[str] = "103.21.124.1" # Mumbai
    prev_timestamp: Optional[str] = None
    failed_attempts_in_5min: int = 6


class ATORemediateRequest(BaseModel):
    event_id: int
    action: str = Field(..., example="TERMINATE_SESSION") # TERMINATE_SESSION, STEP_UP_MFA, FREEZE_ACCOUNT


# ============================================================================
# 5. Customer Complaint Intelligence Schemas
# ============================================================================

class ComplaintCreateRequest(BaseModel):
    customer_id: int
    transaction_id: Optional[int] = None
    subject: str
    body: str
    channel: str = "EMAIL"


class ComplaintAnalysisResponse(BaseModel):
    category: str
    urgency: str
    sentiment_score: float
    regulatory_exposure: bool
    key_themes: List[str]
    suggested_action: str


# ============================================================================
# 6. Merchant Health Schemas
# ============================================================================

class MerchantActionRequest(BaseModel):
    merchant_id: int
    action: str = Field(..., example="HOLD_PAYOUT") # HOLD_PAYOUT, RELEASE_PAYOUT, INCREASE_RESERVE, TIER_UPDATE
    reserve_percentage: Optional[float] = 10.0
    reason: Optional[str] = "Exceeded 0.9% CTR threshold"


# ============================================================================
# 7. Explainable AI & Counterfactual Schemas
# ============================================================================

class CounterfactualRequest(BaseModel):
    transaction_id: int
    hypothetical_amount: Optional[float] = None
    hypothetical_payment_method: Optional[str] = None
    simulate_known_device: Optional[bool] = None
    simulate_3ds_success: Optional[bool] = None


# ============================================================================
# 8. AI Copilot Schemas
# ============================================================================

class CopilotChatRequest(BaseModel):
    message: str
    mode: str = Field("ANALYST", example="ANALYST") # "ANALYST" or "CUSTOMER_SUPPORT"
    context_id: Optional[str] = None # optional txn_id, account_id, or customer_id


class CopilotActionRequest(BaseModel):
    action_type: str = Field(..., example="EXPLAIN_DECLINE") # EXPLAIN_DECLINE, UNFREEZE_ACCOUNT, FILE_DISPUTE, RUN_SMART_RETRY
    target_id: str = Field(..., example="TXN001")
    notes: Optional[str] = None


# ============================================================================
# 9. SAR Report Schemas
# ============================================================================

class GenerateSARRequest(BaseModel):
    investigation_id: int
    suspect_name: str
    suspect_account: Optional[str] = None
    violation_types: List[str] = ["MONEY_LAUNDERING", "SUSPECTED_FRAUD_RING"]
    suspicious_amount: float
    core_narrative: str
