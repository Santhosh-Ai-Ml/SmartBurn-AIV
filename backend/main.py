from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import os
import pandas as pd
from fastapi import HTTPException

from backend.predict import predict_component

BASE_DIR = os.path.dirname(
    os.path.dirname(os.path.abspath(__file__))
)

DATA_PATH = os.path.join(
    BASE_DIR,
    "data",
    "burnin_screening_dataset.csv"
)

# ==========================================
# FASTAPI APP
# ==========================================

app = FastAPI(
    title="SmartBurn-AI API",
    description="Burn-in component anomaly detection system",
    version="1.0"
)


# ==========================================
# CORS
# ==========================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1.5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================
# INPUT MODEL
# ==========================================

class ComponentInput(BaseModel):

    component_id: str
    time: float
    temperature: float
    voltage: float
    current: float
    stress: float


# ==========================================
# HOME
# ==========================================

@app.get("/")
def home():

    return {
        "message": "SmartBurn-AI Backend is Running"
    }


# ==========================================
# SINGLE COMPONENT PREDICTION
# ==========================================

@app.post("/predict")
def predict(data: ComponentInput):

    # -----------------------------
    # ML prediction
    # -----------------------------

    result = predict_component(
        time=data.time,
        temperature=data.temperature,
        voltage=data.voltage,
        current=data.current,
        stress=data.stress
    )

    # -----------------------------
    # Check historical data
    # -----------------------------

    df = pd.read_csv(DATA_PATH)

    component_history = df[
        df["Component_ID"].astype(str) ==
        str(data.component_id)
    ]

    historical_data = []

    if not component_history.empty:

        component_history = component_history.sort_values(
            "Time_hr"
        )

        for _, row in component_history.iterrows():

            historical_data.append({
                "time": float(row["Time_hr"]),
                "temperature": float(row["Temperature_C"]),
                "voltage": float(row["Voltage_V"]),
                "current": float(row["Current_mA"]),
                "stress": float(row["Stress_Value"])
            })

    # -----------------------------
    # If no historical data
    # -----------------------------

    has_historical_data = len(historical_data) > 0

    # -----------------------------
    # Final API response
    # -----------------------------

    return {
        "component_id": data.component_id,

        "status": result["status"],

        "anomaly_probability":
            result["anomaly_probability"],

        "risk_level":
            result["risk_level"],

        "reasons":
            result["reasons"],

        "has_historical_data":
            has_historical_data,

        "historical_data":
            historical_data
    }