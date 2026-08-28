import os
import joblib
import numpy as np


# ==========================================
# MODEL PATH
# ==========================================

BASE_DIR = os.path.dirname(
    os.path.dirname(os.path.abspath(__file__))
)

MODEL_PATH = os.path.join(
    BASE_DIR,
    "models",
    "best_model.pkl"
)


# ==========================================
# LOAD BEST MODEL
# ==========================================

model = joblib.load(MODEL_PATH)


# ==========================================
# PREDICT SINGLE COMPONENT
# ==========================================

def predict_component(
    time,
    temperature,
    voltage,
    current,
    stress
):
    """
    Predict whether a single component is
    NORMAL or ANOMALY.
    """

    # ======================================
    # PREPARE FEATURES
    # IMPORTANT: same order as training
    # ======================================

    features = np.array([[
        time,
        temperature,
        voltage,
        current,
        stress
    ]], dtype=float)

    # ======================================
    # MODEL PREDICTION
    # ======================================

    prediction = int(
        model.predict(features)[0]
    )

    probability = model.predict_proba(
        features
    )[0][1]

    anomaly_percentage = round(
        float(probability) * 100,
        2
    )

    # ======================================
    # STATUS
    # ======================================

    if prediction == 1:
        status = "ANOMALY"
    else:
        status = "NORMAL"

    # ======================================
    # RISK LEVEL
    # ======================================

    if anomaly_percentage >= 75:
        risk = "HIGH"

    elif anomaly_percentage >= 40:
        risk = "MEDIUM"

    else:
        risk = "LOW"

    # ======================================
    # EXPLANATION
    # ======================================

    reasons = []

    if prediction == 1:

        reasons.append(
            f"ML model detected an abnormal sensor pattern "
            f"with {anomaly_percentage}% anomaly probability"
        )

        if temperature > 150:
            reasons.append(
                f"High temperature detected ({temperature} °C)"
            )

        if voltage > 4.0:
            reasons.append(
                f"Abnormal voltage detected ({voltage} V)"
            )

        if current > 70:
            reasons.append(
                f"High current detected ({current} mA)"
            )

        if stress > 120:
            reasons.append(
                f"High stress detected ({stress})"
            )

        if time > 500:
            reasons.append(
                f"Extended burn-in time ({time} hr)"
            )

        if len(reasons) == 1:
            reasons.append(
                "The combination of sensor values differs "
                "from patterns learned during training"
            )

    else:

        reasons.append(
            "Sensor values are within the learned normal pattern"
        )

        reasons.append(
            "No significant abnormal condition detected"
        )

    # ======================================
    # FINAL RESPONSE
    # ======================================

    return {
        "status": status,
        "anomaly_probability": anomaly_percentage,
        "risk_level": risk,
        "reasons": reasons
    }