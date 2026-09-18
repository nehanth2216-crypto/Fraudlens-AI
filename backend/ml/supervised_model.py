"""
FraudLens AI — Supervised ML Model
XGBoost/Random Forest fraud classifier.
"""

import os
import numpy as np
import joblib
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier

MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")
os.makedirs(MODEL_DIR, exist_ok=True)

MODEL_PATH = os.path.join(MODEL_DIR, "supervised_model.pkl")

# Feature names used by the model
FEATURE_NAMES = [
    "amount_deviation", "velocity_score", "location_deviation",
    "device_change", "beneficiary_change", "time_anomaly",
    "merchant_frequency", "account_age_days", "previous_avg_amount",
    "transactions_last_hour", "transactions_last_day",
    "amount", "hour_of_day", "day_of_week", "amount_to_avg_ratio",
]


def _create_default_model():
    """Create a pre-trained model with synthetic patterns."""
    np.random.seed(42)
    n_samples = 5000
    n_fraud = 500

    # Generate normal transaction features
    X_normal = np.column_stack([
        np.random.exponential(1.0, n_samples - n_fraud),      # amount_deviation
        np.random.uniform(0, 0.3, n_samples - n_fraud),       # velocity_score
        np.random.choice([0.0, 0.0, 0.0, 0.3], n_samples - n_fraud),  # location_deviation
        np.random.choice([0.0, 0.0, 0.0, 0.2], n_samples - n_fraud),  # device_change
        np.random.choice([0.0, 0.0, 0.0, 0.2], n_samples - n_fraud),  # beneficiary_change
        np.random.uniform(0, 0.3, n_samples - n_fraud),       # time_anomaly
        np.random.uniform(0, 0.5, n_samples - n_fraud),       # merchant_frequency
        np.random.randint(30, 1800, n_samples - n_fraud),     # account_age_days
        np.random.uniform(1000, 50000, n_samples - n_fraud),  # previous_avg_amount
        np.random.randint(0, 3, n_samples - n_fraud),         # txns_last_hour
        np.random.randint(0, 10, n_samples - n_fraud),        # txns_last_day
        np.random.uniform(500, 50000, n_samples - n_fraud),   # amount
        np.random.randint(8, 22, n_samples - n_fraud),        # hour_of_day
        np.random.randint(0, 7, n_samples - n_fraud),         # day_of_week
        np.random.uniform(0.5, 2.0, n_samples - n_fraud),    # amount_to_avg_ratio
    ])

    # Generate fraudulent transaction features (higher deviations)
    X_fraud = np.column_stack([
        np.random.uniform(3, 10, n_fraud),                    # amount_deviation (high)
        np.random.uniform(0.5, 1.0, n_fraud),                 # velocity_score (high)
        np.random.choice([0.0, 0.7, 1.0], n_fraud),          # location_deviation (often new)
        np.random.choice([0.0, 0.8, 1.0], n_fraud),          # device_change (often new)
        np.random.choice([0.0, 0.8, 1.0], n_fraud),          # beneficiary_change (often new)
        np.random.uniform(0.4, 0.9, n_fraud),                 # time_anomaly (unusual hours)
        np.random.uniform(0.5, 1.0, n_fraud),                 # merchant_frequency (new merchants)
        np.random.randint(0, 90, n_fraud),                    # account_age_days (newer accounts)
        np.random.uniform(5000, 30000, n_fraud),              # previous_avg_amount
        np.random.randint(3, 10, n_fraud),                    # txns_last_hour (high velocity)
        np.random.randint(10, 30, n_fraud),                   # txns_last_day (high velocity)
        np.random.uniform(50000, 500000, n_fraud),            # amount (large)
        np.random.choice([0, 1, 2, 3, 4, 23], n_fraud),      # hour_of_day (unusual)
        np.random.randint(0, 7, n_fraud),                     # day_of_week
        np.random.uniform(3, 20, n_fraud),                    # amount_to_avg_ratio (high)
    ])

    X = np.vstack([X_normal, X_fraud])
    y = np.array([0] * (n_samples - n_fraud) + [1] * n_fraud)

    # Shuffle
    indices = np.random.permutation(n_samples)
    X = X[indices]
    y = y[indices]

    # Try XGBoost first, fall back to RandomForest
    try:
        import xgboost as xgb
        model = xgb.XGBClassifier(
            n_estimators=200,
            max_depth=6,
            learning_rate=0.1,
            use_label_encoder=False,
            eval_metric='logloss',
            random_state=42
        )
    except ImportError:
        model = GradientBoostingClassifier(
            n_estimators=200,
            max_depth=6,
            learning_rate=0.1,
            random_state=42
        )

    model.fit(X, y)
    joblib.dump(model, MODEL_PATH)
    return model


def load_model():
    """Load or create the supervised fraud detection model."""
    if os.path.exists(MODEL_PATH):
        return joblib.load(MODEL_PATH)
    return _create_default_model()


def predict_fraud(features: dict) -> dict:
    """
    Predict fraud probability from engineered features.
    Returns: {"fraud_probability": float, "fraud_prediction": bool}
    """
    model = load_model()

    # Build feature vector in correct order
    feature_vector = []
    for name in FEATURE_NAMES:
        val = features.get(name, 0)
        if isinstance(val, str):
            # Encode payment method
            val = hash(val) % 100 / 100.0
        feature_vector.append(float(val))

    X = np.array([feature_vector])

    # Get probability
    if hasattr(model, 'predict_proba'):
        probabilities = model.predict_proba(X)
        fraud_prob = float(probabilities[0][1])
    else:
        fraud_prob = float(model.predict(X)[0])

    return {
        "fraud_probability": round(fraud_prob, 4),
        "fraud_prediction": fraud_prob >= 0.5,
    }
