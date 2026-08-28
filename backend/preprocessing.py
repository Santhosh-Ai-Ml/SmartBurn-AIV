import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler


# Features used by the ML models
FEATURES = [
    "Time_hr",
    "Temperature_C",
    "Voltage_V",
    "Current_mA",
    "Stress_Value"
]

TARGET = "Is_Anomaly"


def load_dataset(data_path):
    """Load the burn-in dataset."""
    df = pd.read_csv(data_path)

    print("\nDataset loaded successfully")
    print("Shape:", df.shape)
    print("Columns:", list(df.columns))

    return df


def clean_data(df):
    """Clean and prepare the dataset."""

    df = df.copy()

    # Remove duplicate records
    df = df.drop_duplicates()

    # Make sure numerical columns are numeric
    for column in FEATURES:
        df[column] = pd.to_numeric(df[column], errors="coerce")

    # Remove rows with missing required values
    df = df.dropna(subset=FEATURES + [TARGET])

    return df


def prepare_features(df):
    """Prepare X and y for machine learning."""

    X = df[FEATURES].copy()
    y = df[TARGET].astype(int)

    return X, y


def scale_features(X_train, X_test):
    """Scale features using training data only."""

    scaler = StandardScaler()

    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    return X_train_scaled, X_test_scaled, scaler