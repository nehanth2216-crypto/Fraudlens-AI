"""
FraudLens AI — Risk Engine
Combines ML, anomaly, behavioral, and rule scores into a final risk assessment.
"""

from app.config import settings


def calculate_risk(ml_score: float, anomaly_score: float,
                   behavior_score: float, rule_score: float) -> dict:
    """
    Calculate final risk score from all four scoring engines.
    All input scores should be 0-1 (or 0-100, automatically normalized).
    Returns risk assessment with level and decision.
    """
    # Normalize inputs to 0-100 scale
    ml = _normalize(ml_score) * 100
    anomaly = _normalize(anomaly_score) * 100
    behavior = _normalize(behavior_score) * 100
    rules = _normalize(rule_score) * 100

    # Weighted combination
    w_ml = settings.RISK_WEIGHT_ML
    w_anomaly = settings.RISK_WEIGHT_ANOMALY
    w_behavior = settings.RISK_WEIGHT_BEHAVIOR
    w_rules = settings.RISK_WEIGHT_RULES

    # Ensure weights sum to 1
    total_weight = w_ml + w_anomaly + w_behavior + w_rules
    if total_weight > 0:
        final_score = (
            ml * (w_ml / total_weight) +
            anomaly * (w_anomaly / total_weight) +
            behavior * (w_behavior / total_weight) +
            rules * (w_rules / total_weight)
        )
    else:
        final_score = (ml + anomaly + behavior + rules) / 4

    # Boost: if any single score is very high, pull up the final
    max_component = max(ml, anomaly, behavior, rules)
    if max_component > 90:
        final_score = max(final_score, max_component * 0.85)

    final_score = round(min(max(final_score, 0), 100), 1)

    # Determine risk level
    risk_level = _get_risk_level(final_score)

    # Determine decision
    decision = _get_decision(risk_level)

    return {
        "ml_score": round(ml, 2),
        "anomaly_score": round(anomaly, 2),
        "behavior_score": round(behavior, 2),
        "rule_score": round(rules, 2),
        "final_score": final_score,
        "risk_level": risk_level,
        "decision": decision,
    }


def _normalize(score: float) -> float:
    """Normalize score to 0-1 range."""
    if score > 1:
        return min(score / 100, 1.0)
    return max(min(score, 1.0), 0.0)


def _get_risk_level(score: float) -> str:
    """Classify risk level based on configurable thresholds."""
    if score <= settings.RISK_THRESHOLD_LOW:
        return "LOW"
    elif score <= settings.RISK_THRESHOLD_MEDIUM:
        return "MEDIUM"
    elif score <= settings.RISK_THRESHOLD_HIGH:
        return "HIGH"
    else:
        return "CRITICAL"


def _get_decision(risk_level: str) -> str:
    """Map risk level to recommended action."""
    decisions = {
        "LOW": "APPROVE",
        "MEDIUM": "VERIFY",
        "HIGH": "REVIEW",
        "CRITICAL": "HOLD",
    }
    return decisions.get(risk_level, "REVIEW")
