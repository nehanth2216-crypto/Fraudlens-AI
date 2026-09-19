"""FraudLens AI — Pydantic Schemas for API request/response validation."""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime, date
from enum import Enum


# ============================================
# Enums
# ============================================

class UserRoleEnum(str, Enum):
    ADMIN = "ADMIN"
    FRAUD_ANALYST = "FRAUD_ANALYST"
    INVESTIGATOR = "INVESTIGATOR"
    VIEWER = "VIEWER"


class RiskLevelEnum(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class RiskDecisionEnum(str, Enum):
    APPROVE = "APPROVE"
    VERIFY = "VERIFY"
    REVIEW = "REVIEW"
    HOLD = "HOLD"


class AlertStatusEnum(str, Enum):
    OPEN = "OPEN"
    INVESTIGATING = "INVESTIGATING"
    RESOLVED = "RESOLVED"
    FALSE_POSITIVE = "FALSE_POSITIVE"


class InvestigationStatusEnum(str, Enum):
    OPEN = "OPEN"
    IN_PROGRESS = "IN_PROGRESS"
    PENDING_REVIEW = "PENDING_REVIEW"
    CLOSED = "CLOSED"
    ESCALATED = "ESCALATED"


# ============================================
# Auth Schemas
# ============================================

class UserRegister(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    email: EmailStr
    password: str = Field(..., min_length=8)
    role: UserRoleEnum = UserRoleEnum.VIEWER


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    status: str
    created_at: datetime
    last_login: Optional[datetime] = None

    class Config:
        from_attributes = True


# ============================================
# Customer Schemas
# ============================================

class CustomerResponse(BaseModel):
    id: int
    customer_number: str
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[date] = None
    account_created_at: Optional[datetime] = None
    risk_level: str
    created_at: datetime

    class Config:
        from_attributes = True


class CustomerBehavior(BaseModel):
    customer_id: int
    avg_transaction_amount: float
    median_transaction_amount: float
    daily_transaction_count: float
    normal_transaction_hours: List[int]
    known_devices: int
    known_locations: int
    known_beneficiaries: int
    total_transactions: int
    risk_level: str


# ============================================
# Account Schemas
# ============================================

class AccountResponse(BaseModel):
    id: int
    customer_id: int
    account_number_masked: str
    account_type: str
    bank: str
    balance: float
    currency: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


# ============================================
# Transaction Schemas
# ============================================

class TransactionCreate(BaseModel):
    account_id: int
    beneficiary_id: Optional[int] = None
    merchant_id: Optional[int] = None
    amount: float = Field(..., gt=0)
    currency: str = "INR"
    transaction_type: str
    payment_method: str
    timestamp: Optional[datetime] = None
    location_id: Optional[int] = None
    device_id: Optional[int] = None
    ip_address_id: Optional[int] = None


class TransactionResponse(BaseModel):
    id: int
    transaction_id: str
    account_id: int
    beneficiary_id: Optional[int] = None
    merchant_id: Optional[int] = None
    amount: float
    currency: str
    transaction_type: str
    payment_method: str
    timestamp: datetime
    location_id: Optional[int] = None
    device_id: Optional[int] = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class TransactionDetail(TransactionResponse):
    account: Optional[AccountResponse] = None
    risk_score: Optional["RiskScoreResponse"] = None
    features: Optional["TransactionFeatureResponse"] = None
    prediction: Optional["FraudPredictionResponse"] = None
    location: Optional["LocationResponse"] = None
    device: Optional["DeviceResponse"] = None
    beneficiary: Optional["BeneficiaryResponse"] = None
    merchant: Optional["MerchantResponse"] = None


# ============================================
# Fraud Analysis Schemas
# ============================================

class FraudAnalyzeRequest(BaseModel):
    account_id: int
    amount: float = Field(..., gt=0)
    payment_method: str
    beneficiary_id: Optional[int] = None
    merchant_id: Optional[int] = None
    device_id: Optional[int] = None
    location_id: Optional[int] = None
    ip_address_id: Optional[int] = None
    transaction_type: str = "TRANSFER"
    timestamp: Optional[datetime] = None


class FraudAnalyzeResponse(BaseModel):
    transaction_id: str
    fraud_probability: float
    anomaly_score: float
    behavior_score: float
    rule_score: float
    risk_score: float
    risk_level: str
    decision: str
    reasons: List[str]
    features: Optional[dict] = None


# ============================================
# Risk Score Schemas
# ============================================

class RiskScoreResponse(BaseModel):
    id: int
    transaction_id: int
    ml_score: float
    anomaly_score: float
    behavior_score: float
    rule_score: float
    final_score: float
    risk_level: str
    decision: str
    reasons: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ============================================
# Feature Schemas
# ============================================

class TransactionFeatureResponse(BaseModel):
    id: int
    transaction_id: int
    amount_deviation: float
    velocity_score: float
    location_deviation: float
    device_change: float
    beneficiary_change: float
    time_anomaly: float
    merchant_frequency: float
    account_age_days: int
    previous_avg_amount: float
    transactions_last_hour: int
    transactions_last_day: int

    class Config:
        from_attributes = True


# ============================================
# Prediction Schemas
# ============================================

class FraudPredictionResponse(BaseModel):
    id: int
    transaction_id: int
    model_version: Optional[str] = None
    fraud_probability: float
    fraud_prediction: bool
    anomaly_score: float

    class Config:
        from_attributes = True


# ============================================
# Alert Schemas
# ============================================

class AlertResponse(BaseModel):
    id: int
    transaction_id: int
    alert_type: str
    severity: str
    title: str
    description: Optional[str] = None
    status: str
    assigned_to: Optional[int] = None
    assignee_name: Optional[str] = None
    resolution: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    resolved_at: Optional[datetime] = None
    transaction: Optional[TransactionResponse] = None

    class Config:
        from_attributes = True


class AlertCreate(BaseModel):
    transaction_id: int
    alert_type: str = "HIGH_RISK_TRANSACTION"
    severity: str = "HIGH"
    title: str = Field(..., min_length=3, max_length=500)
    description: Optional[str] = None


class AlertCommentCreate(BaseModel):
    comment: str = Field(..., min_length=1, max_length=2000)


class AlertCommentResponse(BaseModel):
    id: int
    alert_id: int
    user_id: Optional[int] = None
    user_name: str
    comment: str
    created_at: datetime

    class Config:
        from_attributes = True


class AlertUpdate(BaseModel):
    status: Optional[AlertStatusEnum] = None
    assigned_to: Optional[int] = None
    severity: Optional[str] = None
    notes: Optional[str] = None


class AlertStatusUpdate(BaseModel):
    status: AlertStatusEnum
    notes: Optional[str] = None


class AlertResolve(BaseModel):
    resolution: str = "Resolved"
    is_false_positive: bool = False
    notes: Optional[str] = None


class AlertAssign(BaseModel):
    user_id: int
    user_name: Optional[str] = None


class AuditLogResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    user_name: Optional[str] = None
    action: str
    entity_type: Optional[str] = None
    entity_id: Optional[int] = None
    details: Optional[str] = None
    ip_address: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True


class StreamSimulateRequest(BaseModel):
    count: int = Field(default=5, ge=1, le=50)
    inject_fraud: bool = True
    fraud_scenario: Optional[str] = None  # ATO, VELOCITY, HIGH_AMOUNT, STRUCTURING


class StreamStatusResponse(BaseModel):
    is_streaming: bool
    interval_seconds: float
    total_emitted: int
    fraud_emitted: int
    last_emitted_at: Optional[datetime] = None


class ModelMetadataResponse(BaseModel):
    model_name: str
    framework: str
    algorithm: str
    feature_names: List[str]
    anomaly_detector: str
    risk_formula: str
    roc_auc: float
    f1_score: float
    training_dataset: str
    total_training_samples: int



# ============================================
# Investigation Schemas
# ============================================

class InvestigationCreate(BaseModel):
    alert_id: int
    priority: str = "MEDIUM"
    notes: Optional[str] = None


class InvestigationResponse(BaseModel):
    id: int
    alert_id: int
    investigator_id: Optional[int] = None
    priority: str
    status: str
    notes: Optional[str] = None
    resolution: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None
    alert: Optional[AlertResponse] = None

    class Config:
        from_attributes = True


class InvestigationUpdate(BaseModel):
    status: Optional[InvestigationStatusEnum] = None
    priority: Optional[str] = None
    notes: Optional[str] = None


class InvestigationNote(BaseModel):
    note: str


class InvestigationClose(BaseModel):
    resolution: str


# ============================================
# Location / Device / Beneficiary / Merchant
# ============================================

class LocationResponse(BaseModel):
    id: int
    city: str
    state: Optional[str] = None
    country: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None

    class Config:
        from_attributes = True


class DeviceResponse(BaseModel):
    id: int
    device_fingerprint: str
    device_type: Optional[str] = None
    operating_system: Optional[str] = None
    browser: Optional[str] = None
    first_seen: Optional[datetime] = None
    last_seen: Optional[datetime] = None
    risk_score: float

    class Config:
        from_attributes = True


class BeneficiaryResponse(BaseModel):
    id: int
    account_id: int
    beneficiary_account_masked: str
    bank: Optional[str] = None
    first_added: Optional[datetime] = None
    transaction_count: int
    risk_score: float
    status: str

    class Config:
        from_attributes = True


class MerchantResponse(BaseModel):
    id: int
    merchant_id: str
    merchant_name: str
    category: Optional[str] = None
    risk_score: float
    status: str

    class Config:
        from_attributes = True


# ============================================
# Network Schemas
# ============================================

class NetworkResponse(BaseModel):
    id: int
    network_name: str
    network_type: str
    risk_score: float
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class NetworkGraphNode(BaseModel):
    id: str
    type: str
    label: str
    risk_score: Optional[float] = None
    data: Optional[dict] = None


class NetworkGraphEdge(BaseModel):
    id: str
    source: str
    target: str
    relationship: str
    weight: float


class NetworkGraph(BaseModel):
    nodes: List[NetworkGraphNode]
    edges: List[NetworkGraphEdge]


# ============================================
# Analytics Schemas
# ============================================

class DashboardOverview(BaseModel):
    total_transactions: int
    fraud_detected: int
    high_risk_transactions: int
    critical_alerts: int
    amount_processed: float
    amount_at_risk: float
    fraud_detection_rate: float
    open_investigations: int


class FraudTrend(BaseModel):
    date: str
    total: int
    fraudulent: int
    fraud_rate: float


class RiskDistribution(BaseModel):
    risk_level: str
    count: int
    percentage: float


class PaymentMethodStats(BaseModel):
    payment_method: str
    total: int
    fraudulent: int
    fraud_rate: float


class TimePatternStats(BaseModel):
    hour: int
    total: int
    fraudulent: int
    fraud_rate: float


# ============================================
# Report Schemas
# ============================================

class ReportRequest(BaseModel):
    report_type: str
    format: str = "csv"  # csv, excel, pdf
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    risk_level: Optional[str] = None


# ============================================
# Assistant Schemas
# ============================================

class AssistantMessage(BaseModel):
    message: str


class AssistantResponse(BaseModel):
    response: str
    data: Optional[dict] = None
    suggestions: Optional[List[str]] = None


# ============================================
# Notification Schemas
# ============================================

class NotificationResponse(BaseModel):
    id: int
    user_id: int
    alert_id: Optional[int] = None
    message: str
    type: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True
