"""
FraudLens AI — Rule Engine
Configurable rule-based risk assessment system.
"""

from datetime import datetime
from typing import List, Tuple


# Default rule configurations
DEFAULT_RULES = {
    "high_amount_threshold": 3.0,       # z-score above which amount is suspicious
    "velocity_hour_threshold": 3,       # max transactions per hour
    "velocity_day_threshold": 15,       # max transactions per day
    "unusual_hours": [0, 1, 2, 3, 4, 5],  # suspicious hours
    "new_account_days": 30,             # accounts younger than this are higher risk
    "amount_ratio_threshold": 5.0,      # amount / avg_amount ratio threshold
}


def evaluate_rules(features: dict, config: dict = None) -> Tuple[float, List[str]]:
    """
    Evaluate transaction against fraud rules.
    Returns (rule_score: 0-1, triggered_rules: list of description strings).
    """
    if config is None:
        config = DEFAULT_RULES

    triggered = []
    scores = []

    # Rule 1: Amount significantly above historical average
    if features.get("amount_deviation", 0) > config.get("high_amount_threshold", 3.0):
        severity = min(features["amount_deviation"] / 10, 1.0)
        scores.append(severity)
        ratio = features.get("amount_to_avg_ratio", 0)
        triggered.append(
            f"Transaction amount is {ratio:.1f}x the historical average "
            f"(deviation score: {features['amount_deviation']:.2f})"
        )

    # Rule 2: New device detected
    if features.get("device_change", 0) >= 0.8:
        scores.append(0.7)
        triggered.append("New/unrecognized device detected for this account")

    # Rule 3: New beneficiary
    if features.get("beneficiary_change", 0) >= 0.8:
        scores.append(0.65)
        triggered.append("Transaction to a new/unrecognized beneficiary")

    # Rule 4: Unusual transaction time
    hour = features.get("hour_of_day", 12)
    if hour in config.get("unusual_hours", [0, 1, 2, 3, 4, 5]):
        scores.append(0.5)
        triggered.append(f"Transaction occurred at unusual hour ({hour}:00)")

    # Rule 5: High transaction velocity
    txns_hour = features.get("transactions_last_hour", 0)
    if txns_hour >= config.get("velocity_hour_threshold", 3):
        severity = min(txns_hour / 10, 1.0)
        scores.append(severity)
        triggered.append(
            f"High transaction velocity: {txns_hour} transactions in the last hour"
        )

    txns_day = features.get("transactions_last_day", 0)
    if txns_day >= config.get("velocity_day_threshold", 15):
        severity = min(txns_day / 30, 1.0)
        scores.append(severity)
        triggered.append(
            f"High daily transaction volume: {txns_day} transactions in the last 24 hours"
        )

    # Rule 6: Location deviation
    if features.get("location_deviation", 0) >= 0.8:
        scores.append(0.6)
        triggered.append("Transaction location differs from historical pattern")

    # Rule 7: New account with large transaction
    account_age = features.get("account_age_days", 365)
    amount = features.get("amount", 0)
    if account_age < config.get("new_account_days", 30) and amount > 25000:
        scores.append(0.55)
        triggered.append(
            f"Large transaction (₹{amount:,.0f}) from a new account "
            f"({account_age} days old)"
        )

    # Rule 8: Amount ratio extremely high
    ratio = features.get("amount_to_avg_ratio", 1)
    if ratio > config.get("amount_ratio_threshold", 5.0):
        severity = min(ratio / 20, 1.0)
        scores.append(severity)
        triggered.append(
            f"Transaction amount is {ratio:.1f}x the customer's average"
        )

    # Rule 9: Multiple risk signals combined
    high_signals = sum(1 for s in [
        features.get("device_change", 0),
        features.get("beneficiary_change", 0),
        features.get("location_deviation", 0),
        features.get("time_anomaly", 0),
    ] if s >= 0.6)

    if high_signals >= 3:
        scores.append(0.85)
        triggered.append(
            f"Multiple concurrent risk signals detected ({high_signals} factors)"
        )
    elif high_signals == 2:
        scores.append(0.5)
        triggered.append(
            f"Two concurrent risk signals detected"
        )

    # Rule 10: Unusual merchant frequency
    if features.get("merchant_frequency", 0) >= 0.8:
        scores.append(0.4)
        triggered.append("Transaction with an unusual/unfamiliar merchant")

    # Calculate overall rule score
    if scores:
        # Use weighted max approach: highest rule has most impact
        rule_score = max(scores) * 0.6 + (sum(scores) / len(scores)) * 0.4
        rule_score = min(rule_score, 1.0)
    else:
        rule_score = 0.0

    return round(rule_score, 4), triggered
