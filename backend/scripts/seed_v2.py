"""
FraudLens AI V2 — Seed V2 Data Records
Seeds records for:
- Payment Failure Diagnoses
- Payment Recoveries & Disputes
- Account Takeover Events
- Customer Complaints
- Merchant Risk Profiles
- SAR Reports
- Scam Intelligence Records
"""

import sys
import os
import io

if sys.platform == "win32":
    try:
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")
    except Exception:
        pass

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from datetime import datetime, timedelta
from app.database import SessionLocal
from app.models import (
    Transaction, Account, Customer, Merchant, Investigation, User,
    PaymentFailureDiagnosis, FailureCategory,
    PaymentRecovery, DisputeStage,
    AccountTakeoverEvent, ATOTriggerType, ATOSeverity,
    CustomerComplaint, ComplaintCategory, ComplaintUrgency,
    MerchantRiskProfile, MerchantRiskTier,
    SARReport, ScamIntelligenceRecord, ScamType
)


def seed_v2():
    db = SessionLocal()
    try:
        print("🌱 Seeding V2 Priority Records...")

        # 1. Scam Intelligence Records
        if not db.query(ScamIntelligenceRecord).first():
            scams = [
                ScamIntelligenceRecord(
                    scam_type=ScamType.AUTHORIZED_PUSH_PAYMENT,
                    campaign_name="Operation Fake Electricity Disconnection",
                    threat_level="CRITICAL",
                    target_demographic="Senior Citizens & Small Shop Owners",
                    tactics_summary="SMS claims power will be cut off at 9:30 PM due to unpaid bill; directs victim to dial spoofed helpline number and download remote APK.",
                    indicators_of_compromise=["APK: electricity_bill_update.apk", "UPI: power.discom.urgent@axisbank", "Keywords: 'Immediate power cut', 'Bill overdue'"],
                    detected_incidents_count=42,
                    total_financial_loss=1850000.0
                ),
                ScamIntelligenceRecord(
                    scam_type=ScamType.IMPERSONATION_OFFICIAL,
                    campaign_name="Digital Arrest & CBI Video Interrogation",
                    threat_level="CRITICAL",
                    target_demographic="Urban Professionals & Retirees",
                    tactics_summary="Fraudsters dressed in police uniforms video call victims via Skype claiming customs intercepted illegal drugs in parcels registered under their Aadhaar.",
                    indicators_of_compromise=["Skype ID: cbi_investigation_unit_04", "VPA: govt.compliance.safekeep@sbi", "Keywords: 'Digital arrest warrant', 'Supreme Court seizure order'"],
                    detected_incidents_count=18,
                    total_financial_loss=5400000.0
                ),
                ScamIntelligenceRecord(
                    scam_type=ScamType.INVESTMENT_PONZI,
                    campaign_name="VIP Arbitrage Daily Trading Bot",
                    threat_level="HIGH",
                    target_demographic="Retail Investors & Crypto Traders",
                    tactics_summary="Telegram group promises 8% daily guaranteed return through algorithmic arbitrage trading; victim dashboard displays artificial high balance until withdrawal request triggers extortion fee.",
                    indicators_of_compromise=["Telegram: @VIP_Arbitrage_Desk_Official", "Crypto Address: TQn9Y2khEsLJW1ChV5L8vK...", "Keywords: 'Guaranteed 8% daily ROI', 'Withdrawal tax deposit'"],
                    detected_incidents_count=29,
                    total_financial_loss=3200000.0
                )
            ]
            db.add_all(scams)
            db.commit()
            print("  Created 3 Scam Intelligence Campaign records")

        # 2. Payment Failure Diagnoses
        txns = db.query(Transaction).limit(10).all()
        if not db.query(PaymentFailureDiagnosis).first() and txns:
            failures = [
                PaymentFailureDiagnosis(
                    transaction_id=txns[0].id,
                    decline_code="51_INSUFFICIENT_FUNDS",
                    category=FailureCategory.CARDHOLDER_ACTION,
                    root_cause="The issuing bank reported that available balance is insufficient for authorization.",
                    raw_processor_message="Issuer decline code 51: Insufficient Funds",
                    retry_eligible=True,
                    recommended_retry_delay_sec=86400,
                    estimated_recovery_probability=0.45,
                    suggested_action="Prompt customer to top up funds or select alternate payment instrument.",
                    alternative_rail_suggested="UPI"
                ),
                PaymentFailureDiagnosis(
                    transaction_id=txns[1].id,
                    decline_code="91_PROCESSOR_TIMEOUT",
                    category=FailureCategory.ISSUER_NETWORK_OUTAGE,
                    root_cause="Switch gateway authorization timeout after 15 seconds.",
                    raw_processor_message="System timeout 91: Acquirer switch unresponsive",
                    retry_eligible=True,
                    recommended_retry_delay_sec=15,
                    estimated_recovery_probability=0.88,
                    suggested_action="Auto-retry via secondary standby payment processor.",
                    alternative_rail_suggested="FALLBACK_GATEWAY"
                ),
                PaymentFailureDiagnosis(
                    transaction_id=txns[2].id,
                    decline_code="3DS_AUTH_FAILED",
                    category=FailureCategory.RISK_FRAUD_INTERCEPTION,
                    root_cause="OTP challenge expired before cardholder submission.",
                    raw_processor_message="3DSv2 ACS session expired",
                    retry_eligible=True,
                    recommended_retry_delay_sec=120,
                    estimated_recovery_probability=0.68,
                    suggested_action="Offer frictionless app-to-app biometric re-authentication.",
                    alternative_rail_suggested="UPI"
                )
            ]
            db.add_all(failures)
            db.commit()
            print("  Created 3 Payment Failure Diagnosis records")

        # 3. Payment Recoveries & Disputes
        if not db.query(PaymentRecovery).first() and txns:
            disputes = [
                PaymentRecovery(
                    transaction_id=txns[3].id,
                    dispute_id="DSP-2026-8812",
                    amount=24999.0,
                    currency="INR",
                    dispute_reason="10.4 Fraud - Card-Absent / Friendly Fraud",
                    stage=DisputeStage.CHARGEBACK_FILED,
                    win_probability=0.82,
                    refund_abuse_flag=False,
                    refund_abuse_score=0.12,
                    recovered_amount=0.0,
                    deadline_date=datetime.utcnow() + timedelta(days=6)
                ),
                PaymentRecovery(
                    transaction_id=txns[4].id,
                    dispute_id="DSP-2026-8813",
                    amount=54000.0,
                    currency="INR",
                    dispute_reason="13.1 Merchandise Not Received",
                    stage=DisputeStage.EVIDENCE_SUBMITTED,
                    win_probability=0.89,
                    refund_abuse_flag=True,
                    refund_abuse_score=0.88,
                    recovered_amount=0.0,
                    deadline_date=datetime.utcnow() + timedelta(days=4)
                ),
                PaymentRecovery(
                    transaction_id=txns[5].id,
                    dispute_id="DSP-2026-8809",
                    amount=14500.0,
                    currency="INR",
                    dispute_reason="10.4 Fraud - Cardholder denies authorization",
                    stage=DisputeStage.WON_RECOVERED,
                    win_probability=0.95,
                    refund_abuse_flag=False,
                    refund_abuse_score=0.05,
                    recovered_amount=14500.0,
                    deadline_date=datetime.utcnow() - timedelta(days=2)
                )
            ]
            db.add_all(disputes)
            db.commit()
            print("  Created 3 Payment Recovery & Dispute records")

        # 4. Account Takeover Events
        accounts = db.query(Account).limit(5).all()
        if not db.query(AccountTakeoverEvent).first() and accounts:
            ato_events = [
                AccountTakeoverEvent(
                    account_id=accounts[0].id,
                    trigger_type=ATOTriggerType.IMPOSSIBLE_TRAVEL,
                    severity=ATOSeverity.CRITICAL,
                    risk_score=96.4,
                    details={
                        "origin_location": "Mumbai, India",
                        "destination_location": "Frankfurt, Germany",
                        "distance_km": 6560.2,
                        "time_delta_mins": 22.0,
                        "calculated_speed_kmh": 17891.4,
                        "current_ip": "185.220.101.5 (Tor Exit)"
                    },
                    action_taken="SESSION_TERMINATED",
                    is_mitigated=False
                ),
                AccountTakeoverEvent(
                    account_id=accounts[1].id,
                    trigger_type=ATOTriggerType.CREDENTIAL_STUFFING,
                    severity=ATOSeverity.HIGH,
                    risk_score=88.0,
                    details={
                        "failed_attempts": 18,
                        "target_email": "user.security@fraudlens.ai",
                        "botnet_pattern": "Rotating IP proxy pool across 12 subnets",
                        "current_ip": "45.154.255.8"
                    },
                    action_taken="STEP_UP_MFA_ENFORCED",
                    is_mitigated=True
                )
            ]
            db.add_all(ato_events)
            db.commit()
            print("  Created 2 Account Takeover (ATO) records")

        # 5. Customer Complaints
        custs = db.query(Customer).limit(5).all()
        if not db.query(CustomerComplaint).first() and custs:
            complaints = [
                CustomerComplaint(
                    complaint_id="CMP-2026-1049",
                    customer_id=custs[0].id,
                    transaction_id=txns[0].id if txns else None,
                    channel="REGULATOR_PORTAL",
                    subject="Formal Complaint regarding ₹75,000 unauthorized UPI debit and CFPB escalation",
                    body="I woke up to find ₹75,000 debited via UPI while I was asleep. Your support told me to wait 7 days. This is an explicit violation of Reg E. I will escalate to the Banking Ombudsman and CFPB immediately if provisional credit is not issued today.",
                    category=ComplaintCategory.UNAUTHORIZED_TRANSACTION,
                    urgency=ComplaintUrgency.REGULATORY_ESCALATION,
                    sentiment_score=-0.92,
                    regulatory_flag=True,
                    status="ESCALATED",
                    suggested_resolution="Immediately issue provisional credit of ₹75,000, secure account tokens, and request transaction log from NPCI switch."
                ),
                CustomerComplaint(
                    complaint_id="CMP-2026-1044",
                    customer_id=custs[1].id,
                    transaction_id=txns[1].id if txns else None,
                    channel="EMAIL",
                    subject="Scammed by fake customs authority demanding penalty payment",
                    body="A caller posing as Federal Customs claimed my package had illegal items and pressured me to transfer ₹45,000 for verification. I realized it was a scam 10 minutes later. Please stop the transfer!",
                    category=ComplaintCategory.SCAM_VICTIM_REPORT,
                    urgency=ComplaintUrgency.HIGH,
                    sentiment_score=-0.78,
                    regulatory_flag=False,
                    status="IN_TRIAGE",
                    suggested_resolution="Trigger immediate inter-bank recall signal and freeze beneficiary account via FIU alert network."
                )
            ]
            db.add_all(complaints)
            db.commit()
            print("  Created 2 Customer Complaint records")

        # 6. Merchant Risk Profiles
        merchants = db.query(Merchant).limit(5).all()
        if not db.query(MerchantRiskProfile).first() and merchants:
            m_profiles = [
                MerchantRiskProfile(
                    merchant_id=merchants[0].id,
                    health_score=92.4,
                    chargeback_ratio=0.0032,
                    refund_rate=0.018,
                    monthly_volume=28400000.0,
                    risk_tier=MerchantRiskTier.TIER_1_EXEMPLARY,
                    is_payout_held=False,
                    rolling_reserve_percent=0.0,
                    bust_out_risk_score=0.04
                ),
                MerchantRiskProfile(
                    merchant_id=merchants[1].id,
                    health_score=58.0,
                    chargeback_ratio=0.0128, # > 0.9% warning threshold!
                    refund_rate=0.084,
                    monthly_volume=9200000.0,
                    risk_tier=MerchantRiskTier.TIER_3_WATCHLIST,
                    is_payout_held=False,
                    rolling_reserve_percent=5.0,
                    bust_out_risk_score=0.42
                ),
                MerchantRiskProfile(
                    merchant_id=merchants[2].id,
                    health_score=31.5,
                    chargeback_ratio=0.0182, # > 1.5% excessive program breach!
                    refund_rate=0.142,
                    monthly_volume=14500000.0,
                    risk_tier=MerchantRiskTier.TIER_4_HIGH_RISK,
                    is_payout_held=True,
                    rolling_reserve_percent=15.0,
                    bust_out_risk_score=0.88
                )
            ]
            db.add_all(m_profiles)
            db.commit()
            print("  Created 3 Merchant Risk Profiles")

        # 7. SAR Reports
        invs = db.query(Investigation).limit(3).all()
        users = db.query(User).limit(2).all()
        if not db.query(SARReport).first():
            sar = SARReport(
                sar_tracking_number="SAR-FINCEN-2026-90418",
                investigation_id=invs[0].id if invs else None,
                suspect_name="Dev Verma & Arjun Patel Syndicate",
                suspect_account="Multiple Mule Clusters (AC-8812 - AC-8815)",
                suspect_type="ORGANIZED_CRIME_ENTITY",
                violation_types=["MONEY_LAUNDERING", "STRUCTURING_UNDER_THRESHOLD", "WIRE_FRAUD"],
                suspicious_amount=4850000.0,
                narrative=(
                    "FINCEN SUSPICIOUS ACTIVITY REPORT (SAR-DI)\n"
                    "Reference: SAR-FINCEN-2026-90418\n"
                    "Subject: Systematic Structuring and Mule Funneling Syndicate\n\n"
                    "Summary: Investigation team established that subject account cluster conducted 14 transfers "
                    "calibrated precisely at INR 49,500 to evade the mandatory INR 50,000 threshold. Funds funneled "
                    "to off-shore crypto cashout endpoint within 42 minutes. Full device and IP traces attached."
                ),
                filing_status="APPROVED_READY_FOR_TRANSMISSION",
                fincen_bsa_id="BSA-99182374-US",
                filed_by_id=users[0].id if users else None
            )
            db.add(sar)
            db.commit()
            print("  Created 1 FinCEN SAR Report record")

        print("✅ FraudLens AI V2 records seeded successfully!")

    except Exception as e:
        db.rollback()
        print(f"❌ V2 seeding error: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_v2()
