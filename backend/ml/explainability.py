"""
FraudLens AI — Explainability Engine
Generates human-readable explanations for fraud risk assessments.
"""

from typing import List


def generate_explanations(features: dict, ml_score: float,
                          anomaly_score: float, behavior_score: float,
                          rule_reasons: List[str], risk_level: str) -> List[str]:
    """
    Generate comprehensive human-readable explanations for why a
    transaction was flagged. Uses actual calculated features — never
    invents reasons.
    """
    explanations = []

    # Rule-based reasons are already human-readable
    explanations.extend(rule_reasons)

    # Add feature-based explanations not covered by rules
    amount = features.get("amount", 0)
    prev_avg = features.get("previous_avg_amount", 0)

    # Amount-based explanation
    if features.get("amount_deviation", 0) > 2 and not any("amount" in r.lower() for r in rule_reasons):
        if prev_avg > 0:
            explanations.append(
                f"Transaction amount (₹{amount:,.0f}) significantly exceeds "
                f"historical average (₹{prev_avg:,.0f})"
            )

    # ML model confidence
    if ml_score > 0.7:
        explanations.append(
            f"Machine learning model indicates {ml_score*100:.0f}% potential fraud probability (suspicious pattern detected)"
        )

    # Anomaly detection
    if anomaly_score > 0.6:
        explanations.append(
            f"Anomaly detection model flagged this transaction as statistically unusual "
            f"(anomaly score: {anomaly_score*100:.0f}/100)"
        )

    # Behavioral deviations
    if behavior_score > 0.6:
        explanations.append(
            f"Transaction deviates significantly from customer's established behavioral pattern "
            f"(behavior risk: {behavior_score*100:.0f}/100)"
        )

    # Time-based
    hour = features.get("hour_of_day", 12)
    if features.get("time_anomaly", 0) > 0.5 and not any("hour" in r.lower() and "unusual" in r.lower() for r in rule_reasons):
        explanations.append(
            f"Transaction initiated at {hour}:00, outside typical transaction hours"
        )

    # Velocity
    txns_hour = features.get("transactions_last_hour", 0)
    if txns_hour >= 3 and not any("velocity" in r.lower() for r in rule_reasons):
        explanations.append(
            f"{txns_hour} transactions detected in the last hour"
        )

    # Account age
    account_age = features.get("account_age_days", 365)
    if account_age < 30 and amount > 25000:
        if not any("new account" in r.lower() for r in rule_reasons):
            explanations.append(
                f"Account is relatively new ({account_age} days) with a large transaction"
            )

    # Deduplicate while preserving order
    seen = set()
    unique_explanations = []
    for exp in explanations:
        if exp not in seen:
            seen.add(exp)
            unique_explanations.append(exp)

    # If no specific explanations but risk is elevated
    if not unique_explanations and risk_level in ("HIGH", "CRITICAL"):
        unique_explanations.append(
            "Multiple moderate risk signals combined to produce an elevated overall risk score"
        )

    return unique_explanations


def get_feature_contributions(features: dict) -> dict:
    """
    Return a simplified feature importance breakdown for the UI.
    """
    contributions = {}

    feature_labels = {
        "amount_deviation": "Amount Deviation",
        "velocity_score": "Transaction Velocity",
        "location_deviation": "Location Risk",
        "device_change": "Device Risk",
        "beneficiary_change": "Beneficiary Risk",
        "time_anomaly": "Time Anomaly",
        "merchant_frequency": "Merchant Risk",
        "amount_to_avg_ratio": "Amount Ratio",
    }

    for key, label in feature_labels.items():
        value = features.get(key, 0)
        if isinstance(value, (int, float)):
            contributions[label] = round(float(value), 4)

    return contributions
