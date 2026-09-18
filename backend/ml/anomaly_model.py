"""
FraudLens AI — Anomaly Detection Model
Isolation Forest for detecting outlier transactions.
"""

import os
import numpy as np
import joblib
from sklearn.ensemble import IsolationForest

MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")
os.makedirs(MODEL_DIR, exist_ok=True)

MODEL_PATH = os.path.join(MODEL_DIR, "anomaly_model.pkl")

ANOMALY_FEATURES = [
    "amount_deviation", "velocity_score", "location_deviation",
    "device_change", "beneficiary_change", "time_anomaly",
    "merchant_frequency", "transactions_last_hour", "transactions_last_day",
    "amount_to_avg_ratio",
]


def _create_default_model():
    """Create a pre-trained Isolation Forest on normal transaction patterns."""
    np.random.seed(42)
    n_samples = 3000

    # Generate normal transaction feature distributions
    X_normal = np.column_stack([
        np.random.exponential(1.0, n_samples),                # amount_deviation
        np.random.uniform(0, 0.3, n_samples),                 # velocity_score
        np.random.choice([0.0, 0.0, 0.0, 0.3], n_samples),  # location_deviation
        np.random.choice([0.0, 0.0, 0.0, 0.2], n_samples),  # device_change
        np.random.choice([0.0, 0.0, 0.0, 0.2], n_samples),  # beneficiary_change
        np.random.uniform(0, 0.3, n_samples),                 # time_anomaly
        np.random.uniform(0, 0.5, n_samples),                 # merchant_frequency
        np.random.randint(0, 3, n_samples),                   # txns_last_hour
        np.random.randint(0, 10, n_samples),                  # txns_last_day
        np.random.uniform(0.5, 2.0, n_samples),              # amount_to_avg_ratio
    ])

    model = IsolationForest(
        n_estimators=200,
        contamination=0.1,
        max_samples='auto',
        random_state=42
    )
    model.fit(X_normal)
    joblib.dump(model, MODEL_PATH)
    return model


def load_model():
    """Load or create the anomaly detection model."""
    if os.path.exists(MODEL_PATH):
        return joblib.load(MODEL_PATH)
    return _create_default_model()


def detect_anomaly(features: dict) -> float:
    """
    Detect anomaly in a transaction.
    Returns anomaly_score (0-1, higher = more anomalous).
    """
    model = load_model()

    feature_vector = []
    for name in ANOMALY_FEATURES:
        val = features.get(name, 0)
        feature_vector.append(float(val))

    X = np.array([feature_vector])

    # Isolation Forest: decision_function returns negative for anomalies
    raw_score = model.decision_function(X)[0]

    # Normalize to 0-1 range (lower raw_score = more anomalous)
    # Typical range is about -0.5 to 0.5
    anomaly_score = max(0, min(1, 0.5 - raw_score))

    return round(anomaly_score, 4)
