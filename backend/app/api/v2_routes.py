"""
FraudLens AI V2 — Unified V2 API Router
Exposes enterprise endpoints across all 10 priority pillars:
1. Scam Prevention
2. Payment Failure Diagnosis
3. Payment & Refund Recovery
4. Account Takeover (ATO) Detection
5. Customer Complaint Intelligence
6. Merchant Health & Risk
7. Fraud Network Analysis & Rings
8. Explainable AI (XAI) & Counterfactuals
9. Dual-Mode AI Copilot
10. Investigation & FinCEN SAR Compliance
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any

from app.database import get_db
from app.api.deps import get_current_active_user
from app.models.user import User

# Schemas
from app.schemas.v2_schemas import (
    ScamSimulationRequest, ScamSimulationResponse,
    FailureDiagnoseRequest, SmartRetryRequest, SmartRetryResponse,
    DisputeCreate, DisputeRepresentmentSubmit,
    ATOSessionEvaluationRequest, ATORemediateRequest,
    ComplaintCreateRequest, ComplaintAnalysisResponse,
    MerchantActionRequest, CounterfactualRequest,
    CopilotChatRequest, CopilotActionRequest,
    GenerateSARRequest
)

# Services
from app.services.scam_service import (
    get_scam_intelligence_overview, simulate_scam_detection
)
from app.services.payment_diagnostics_service import (
    diagnose_transaction_failure, execute_smart_retry, get_failure_diagnostics_analytics
)
from app.services.recovery_service import (
    get_recovery_dashboard_stats, list_disputes,
    generate_evidence_dossier, submit_dispute_representment
)
from app.services.ato_service import (
    evaluate_login_session, list_ato_events, remediate_ato_event
)
from app.services.complaint_service import (
    analyze_complaint_text, list_complaints, escalate_complaint
)
from app.services.merchant_risk_service import (
    get_merchant_portfolio_overview, list_merchant_health_profiles, apply_merchant_action
)
from app.services.network_service import get_fraud_rings
from app.services.xai_service import (
    explain_transaction_risk, simulate_counterfactual
)
from app.services.copilot_service import (
    handle_copilot_chat, execute_copilot_action
)
from app.services.investigation_service import (
    list_investigation_cases, generate_fincen_sar_report, get_case_audit_trail
)

router = APIRouter(prefix="/api/v2", tags=["V2 Enterprise Modules"])


# ============================================================================
# 1. SCAM INTELLIGENCE & SIMULATION
# ============================================================================

@router.get("/scam/intelligence")
def scam_intelligence(db: Session = Depends(get_db)):
    """Overview of active scam campaigns, APP scam threat landscape, and advisories."""
    return get_scam_intelligence_overview(db)


@router.post("/scam/simulate", response_model=ScamSimulationResponse)
def scam_simulate(req: ScamSimulationRequest, db: Session = Depends(get_db)):
    """Simulates real-time behavioral scam detection on a transaction."""
    return simulate_scam_detection(
        db,
        scam_type=req.scam_type,
        victim_account_id=req.victim_account_id,
        amount=req.amount,
        beneficiary_name=req.beneficiary_name,
        urgency_trigger=req.urgency_trigger,
        coercive_channel=req.coercive_channel
    )


# ============================================================================
# 2. PAYMENT FAILURE DIAGNOSIS & SMART RETRY
# ============================================================================

@router.get("/failures/analytics")
def failure_analytics(db: Session = Depends(get_db)):
    """Returns decline rates, 4-tier category distribution, and recovery stats."""
    return get_failure_diagnostics_analytics(db)


@router.post("/failures/diagnose")
def failure_diagnose(req: FailureDiagnoseRequest, db: Session = Depends(get_db)):
    """Decomposes transaction decline into root causes and recommended actions."""
    return diagnose_transaction_failure(
        db,
        transaction_id=req.transaction_id,
        decline_code=req.decline_code,
        raw_message=req.raw_message
    )


@router.post("/failures/smart-retry", response_model=SmartRetryResponse)
def failure_smart_retry(req: SmartRetryRequest, db: Session = Depends(get_db)):
    """Calculates optimal smart retry window, rail swap recommendations, and probability."""
    return execute_smart_retry(
        db,
        transaction_id=req.transaction_id,
        allow_rail_switch=req.allow_rail_switch
    )


# ============================================================================
# 3. PAYMENT & REFUND RECOVERY
# ============================================================================

@router.get("/recovery/stats")
def recovery_stats(db: Session = Depends(get_db)):
    """Chargeback representment metrics, win rate, and recovered funds."""
    return get_recovery_dashboard_stats(db)


@router.get("/recovery/disputes")
def recovery_disputes(stage: Optional[str] = None, skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    """Lists disputes across representment lifecycle with refund abuse indicators."""
    return list_disputes(db, stage=stage, skip=skip, limit=limit)


@router.post("/recovery/generate-evidence/{dispute_id}")
def recovery_generate_evidence(dispute_id: str, db: Session = Depends(get_db)):
    """Compiles automated representment evidence dossier with 3DS logs and delivery proof."""
    return generate_evidence_dossier(db, dispute_id=dispute_id)


@router.post("/recovery/submit-representment")
def recovery_submit(req: DisputeRepresentmentSubmit, db: Session = Depends(get_db)):
    """Submits evidence dossier to card network."""
    return submit_dispute_representment(db, dispute_id=req.dispute_id, notes=req.evidence_notes)


# ============================================================================
# 4. ACCOUNT TAKEOVER (ATO) DETECTION
# ============================================================================

@router.get("/ato/events")
def ato_events(limit: int = 50, db: Session = Depends(get_db)):
    """Real-time stream of detected Account Takeover events (impossible travel, stuffing)."""
    return list_ato_events(db, limit=limit)


@router.post("/ato/evaluate-session")
def ato_evaluate(req: ATOSessionEvaluationRequest, db: Session = Depends(get_db)):
    """Evaluates login session for impossible travel, credential stuffing, and device risk."""
    return evaluate_login_session(
        db,
        account_id=req.account_id,
        current_ip=req.current_ip,
        device_fingerprint=req.device_fingerprint,
        prev_ip=req.prev_ip,
        failed_attempts_in_5min=req.failed_attempts_in_5min
    )


@router.post("/ato/remediate")
def ato_remediate(req: ATORemediateRequest, db: Session = Depends(get_db)):
    """Triggers instant defensive action: terminate session, force step-up MFA, or freeze."""
    return remediate_ato_event(db, event_id=req.event_id, action=req.action)


# ============================================================================
# 5. CUSTOMER COMPLAINT INTELLIGENCE
# ============================================================================

@router.get("/complaints")
def complaints_list(limit: int = 50, db: Session = Depends(get_db)):
    """Returns customer complaints stream with regulatory risk and sentiment tags."""
    return list_complaints(db, limit=limit)


@router.post("/complaints/analyze-text", response_model=ComplaintAnalysisResponse)
def complaints_analyze(body: str):
    """Analyzes text for sentiment, regulatory flags (CFPB, Reg E), and categorization."""
    return analyze_complaint_text(body=body)


@router.post("/complaints/{complaint_id}/escalate")
def complaints_escalate(complaint_id: int, db: Session = Depends(get_db)):
    """Escalates complaint to high-priority executive regulatory desk."""
    return escalate_complaint(db, complaint_id=complaint_id)


# ============================================================================
# 6. MERCHANT HEALTH & RISK
# ============================================================================

@router.get("/merchants/overview")
def merchant_overview(db: Session = Depends(get_db)):
    """Summary of portfolio health, CTR threshold monitors, and held payouts."""
    return get_merchant_portfolio_overview(db)


@router.get("/merchants/health")
def merchant_health(limit: int = 50, db: Session = Depends(get_db)):
    """Lists merchants with CTR ratios, refund velocity, and card network breach status."""
    return list_merchant_health_profiles(db, limit=limit)


@router.post("/merchants/apply-action")
def merchant_apply(req: MerchantActionRequest, db: Session = Depends(get_db)):
    """Applies underwriting intervention: hold payout, increase rolling reserve, etc."""
    return apply_merchant_action(
        db,
        merchant_id=req.merchant_id,
        action=req.action,
        reserve_percentage=req.reserve_percentage,
        reason=req.reason
    )


# ============================================================================
# 7. FRAUD NETWORK RINGS & GRAPH
# ============================================================================

@router.get("/network/rings")
def network_rings(db: Session = Depends(get_db)):
    """Returns detected organized fraud rings, money mule clusters, and shared pivots."""
    return get_fraud_rings(db)


# ============================================================================
# 8. EXPLAINABLE AI (XAI) & COUNTERFACTUALS
# ============================================================================

@router.get("/xai/attribution/{transaction_id}")
def xai_attribution(transaction_id: int, db: Session = Depends(get_db)):
    """Returns SHAP-style waterfall attribution, primary risk drivers, and decision narrative."""
    return explain_transaction_risk(db, transaction_id=transaction_id)


@router.post("/xai/counterfactual")
def xai_counterfactual(req: CounterfactualRequest, db: Session = Depends(get_db)):
    """Simulates what changes (lower amount, 3DS authentication, known device) flip the decision."""
    return simulate_counterfactual(
        db,
        transaction_id=req.transaction_id,
        hypothetical_amount=req.hypothetical_amount,
        hypothetical_payment_method=req.hypothetical_payment_method,
        simulate_known_device=req.simulate_known_device,
        simulate_3ds_success=req.simulate_3ds_success
    )


# ============================================================================
# 9. DUAL-MODE AI COPILOT
# ============================================================================

@router.post("/copilot/chat")
def copilot_chat(req: CopilotChatRequest, db: Session = Depends(get_db)):
    """Interactive reasoning copilot for fraud analysts and customer support agents."""
    return handle_copilot_chat(
        db,
        message=req.message,
        mode=req.mode,
        context_id=req.context_id
    )


@router.post("/copilot/execute-action")
def copilot_action(req: CopilotActionRequest, db: Session = Depends(get_db)):
    """Executes live operational action triggered via AI copilot."""
    return execute_copilot_action(
        db,
        action_type=req.action_type,
        target_id=req.target_id,
        notes=req.notes
    )


# ============================================================================
# 10. INVESTIGATION & FINCEN SAR COMPLIANCE
# ============================================================================

@router.get("/investigations/cases")
def investigation_cases(status: Optional[str] = None, db: Session = Depends(get_db)):
    """Lists active investigation cases with SAR filing flags and evidence counts."""
    return list_investigation_cases(db, status=status)


@router.post("/investigations/generate-sar")
def investigation_generate_sar(req: GenerateSARRequest, db: Session = Depends(get_db)):
    """Generates a FinCEN Suspicious Activity Report (SAR) compliance filing document."""
    return generate_fincen_sar_report(
        db,
        investigation_id=req.investigation_id,
        suspect_name=req.suspect_name,
        suspect_account=req.suspect_account,
        violation_types=req.violation_types,
        suspicious_amount=req.suspicious_amount,
        core_narrative=req.core_narrative
    )


@router.get("/investigations/{investigation_id}/audit-trail")
def investigation_audit_trail(investigation_id: int, db: Session = Depends(get_db)):
    """Returns immutable timeline audit trail for an investigation case."""
    return get_case_audit_trail(db, investigation_id=investigation_id)
