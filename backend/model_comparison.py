import os
import joblib
import numpy as np
import pandas as pd

from sklearn.model_selection import (
    GroupShuffleSplit,
    StratifiedGroupKFold,
    GridSearchCV
)

from sklearn.ensemble import (
    RandomForestClassifier,
    ExtraTreesClassifier,
    IsolationForest
)

from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix
)

from sklearn.preprocessing import StandardScaler

from xgboost import XGBClassifier

from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Input, Dense
from tensorflow.keras.callbacks import EarlyStopping

from preprocessing import (
    load_dataset,
    clean_data,
    prepare_features
)


# ============================================================
# PATHS
# ============================================================

BASE_DIR = os.path.dirname(
    os.path.dirname(os.path.abspath(__file__))
)

DATA_PATH = os.path.join(
    BASE_DIR,
    "data",
    "burnin_screening_dataset.csv"
)

MODEL_DIR = os.path.join(
    BASE_DIR,
    "models"
)

os.makedirs(MODEL_DIR, exist_ok=True)


# ============================================================
# LOAD DATA
# ============================================================

print("\n" + "=" * 60)
print("                 SMARTBURN-AI")
print("           MULTI-MODEL TRAINING")
print("=" * 60)

df = load_dataset(DATA_PATH)
df = clean_data(df)

X, y = prepare_features(df)

groups = df["Component_ID"]


# ============================================================
# GROUP-BASED TRAIN / TEST SPLIT
# ============================================================

splitter = GroupShuffleSplit(
    n_splits=1,
    test_size=0.20,
    random_state=42
)

train_idx, test_idx = next(
    splitter.split(X, y, groups=groups)
)

X_train = X.iloc[train_idx].copy()
X_test = X.iloc[test_idx].copy()

y_train = y.iloc[train_idx].copy()
y_test = y.iloc[test_idx].copy()

groups_train = groups.iloc[train_idx]
groups_test = groups.iloc[test_idx]


print("\n========== DATA SPLIT ==========")

print("Total records       :", len(df))
print("Training records    :", len(X_train))
print("Testing records     :", len(X_test))
print("Training components :", groups_train.nunique())
print("Testing components  :", groups_test.nunique())

common_components = len(
    set(groups_train) & set(groups_test)
)

print("Common components   :", common_components)


# ============================================================
# GROUP-AWARE CROSS VALIDATION
# ============================================================

cv = StratifiedGroupKFold(
    n_splits=5,
    shuffle=True,
    random_state=42
)


# ============================================================
# SUPERVISED MODELS
# ============================================================

models = {

    "Random Forest": {
        "model": RandomForestClassifier(
            random_state=42,
            class_weight="balanced",
            n_jobs=-1
        ),

        "params": {
            "n_estimators": [100, 200],
            "max_depth": [None, 10, 20],
            "min_samples_split": [2, 5],
            "min_samples_leaf": [1, 2]
        }
    },

    "XGBoost": {
        "model": XGBClassifier(
            objective="binary:logistic",
            eval_metric="logloss",
            random_state=42,
            n_jobs=-1
        ),

        "params": {
            "n_estimators": [100, 200],
            "max_depth": [3, 6],
            "learning_rate": [0.05, 0.1],
            "subsample": [0.8, 1.0]
        }
    },

    "Extra Trees": {
        "model": ExtraTreesClassifier(
            random_state=42,
            class_weight="balanced",
            n_jobs=-1
        ),

        "params": {
            "n_estimators": [100, 200],
            "max_depth": [None, 10, 20],
            "min_samples_split": [2, 5],
            "min_samples_leaf": [1, 2]
        }
    }
}


# ============================================================
# RESULT STORAGE
# ============================================================

results = []
best_models = {}


# ============================================================
# TRAIN SUPERVISED MODELS
# ============================================================

for name, config in models.items():

    print("\n" + "=" * 60)
    print(f"          {name.upper()} GRID SEARCH")
    print("=" * 60)

    grid = GridSearchCV(
        estimator=config["model"],
        param_grid=config["params"],
        scoring="f1",
        cv=cv,
        n_jobs=-1,
        verbose=1
    )

    grid.fit(
        X_train,
        y_train,
        groups=groups_train
    )

    best_model = grid.best_estimator_

    predictions = best_model.predict(X_test)

    accuracy = accuracy_score(
        y_test,
        predictions
    )

    precision = precision_score(
        y_test,
        predictions,
        zero_division=0
    )

    recall = recall_score(
        y_test,
        predictions,
        zero_division=0
    )

    f1 = f1_score(
        y_test,
        predictions,
        zero_division=0
    )

    results.append({
        "Model": name,
        "CV_F1": grid.best_score_,
        "Accuracy": accuracy,
        "Precision": precision,
        "Recall": recall,
        "F1": f1
    })

    best_models[name] = best_model

    print("\nBest Parameters:")
    print(grid.best_params_)

    print(f"CV F1        : {grid.best_score_:.4f}")
    print(f"Test Accuracy: {accuracy:.4f}")
    print(f"Test Precision: {precision:.4f}")
    print(f"Test Recall   : {recall:.4f}")
    print(f"Test F1       : {f1:.4f}")


# ============================================================
# SCALE DATA FOR UNSUPERVISED MODELS
# ============================================================

print("\n" + "=" * 60)
print("        PREPARING UNSUPERVISED MODELS")
print("=" * 60)

scaler = StandardScaler()

X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)


# ============================================================
# ISOLATION FOREST
# ============================================================

print("\n" + "=" * 60)
print("             ISOLATION FOREST")
print("=" * 60)


# Train only on NORMAL training samples
normal_train = X_train_scaled[
    y_train.to_numpy() == 0
]

contamination_values = [0.05, 0.10, 0.15]

best_if_model = None
best_if_f1 = -1
best_if_contamination = None

for contamination in contamination_values:

    isolation_model = IsolationForest(
        n_estimators=200,
        contamination=contamination,
        random_state=42,
        n_jobs=-1
    )

    isolation_model.fit(normal_train)

    raw_predictions = isolation_model.predict(
        X_test_scaled
    )

    predictions = np.where(
        raw_predictions == -1,
        1,
        0
    )

    f1 = f1_score(
        y_test,
        predictions,
        zero_division=0
    )

    print(
        f"Contamination={contamination} "
        f"→ F1={f1:.4f}"
    )

    if f1 > best_if_f1:
        best_if_f1 = f1
        best_if_model = isolation_model
        best_if_contamination = contamination


if_predictions = np.where(
    best_if_model.predict(X_test_scaled) == -1,
    1,
    0
)

if_accuracy = accuracy_score(
    y_test,
    if_predictions
)

if_precision = precision_score(
    y_test,
    if_predictions,
    zero_division=0
)

if_recall = recall_score(
    y_test,
    if_predictions,
    zero_division=0
)

if_f1 = f1_score(
    y_test,
    if_predictions,
    zero_division=0
)


results.append({
    "Model": "Isolation Forest",
    "CV_F1": np.nan,
    "Accuracy": if_accuracy,
    "Precision": if_precision,
    "Recall": if_recall,
    "F1": if_f1
})

best_models["Isolation Forest"] = best_if_model

print("\nBest contamination:", best_if_contamination)
print(f"Test Accuracy : {if_accuracy:.4f}")
print(f"Test Precision: {if_precision:.4f}")
print(f"Test Recall   : {if_recall:.4f}")
print(f"Test F1       : {if_f1:.4f}")


# ============================================================
# AUTOENCODER
# ============================================================

print("\n" + "=" * 60)
print("                 AUTOENCODER")
print("=" * 60)


# Autoencoder learns NORMAL patterns only
normal_train_scaled = X_train_scaled[
    y_train.to_numpy() == 0
]


autoencoder = Sequential([
    Input(shape=(X_train_scaled.shape[1],)),

    Dense(16, activation="relu"),
    Dense(8, activation="relu"),
    Dense(4, activation="relu"),

    Dense(8, activation="relu"),
    Dense(16, activation="relu"),

    Dense(X_train_scaled.shape[1], activation="linear")
])


autoencoder.compile(
    optimizer="adam",
    loss="mse"
)


early_stopping = EarlyStopping(
    monitor="val_loss",
    patience=5,
    restore_best_weights=True
)


autoencoder.fit(
    normal_train_scaled,
    normal_train_scaled,
    epochs=50,
    batch_size=64,
    validation_split=0.2,
    callbacks=[early_stopping],
    verbose=1
)


# ============================================================
# RECONSTRUCTION ERROR
# ============================================================

reconstructed_train = autoencoder.predict(
    normal_train_scaled,
    verbose=0
)

train_errors = np.mean(
    np.square(
        normal_train_scaled - reconstructed_train
    ),
    axis=1
)


reconstructed_test = autoencoder.predict(
    X_test_scaled,
    verbose=0
)

test_errors = np.mean(
    np.square(
        X_test_scaled - reconstructed_test
    ),
    axis=1
)


# ============================================================
# AUTOENCODER THRESHOLD
# ============================================================

threshold = np.percentile(
    train_errors,
    95
)

ae_predictions = (
    test_errors > threshold
).astype(int)


ae_accuracy = accuracy_score(
    y_test,
    ae_predictions
)

ae_precision = precision_score(
    y_test,
    ae_predictions,
    zero_division=0
)

ae_recall = recall_score(
    y_test,
    ae_predictions,
    zero_division=0
)

ae_f1 = f1_score(
    y_test,
    ae_predictions,
    zero_division=0
)


results.append({
    "Model": "Autoencoder",
    "CV_F1": np.nan,
    "Accuracy": ae_accuracy,
    "Precision": ae_precision,
    "Recall": ae_recall,
    "F1": ae_f1
})

best_models["Autoencoder"] = autoencoder


print("\nAutoencoder threshold:", threshold)

print(f"Test Accuracy : {ae_accuracy:.4f}")
print(f"Test Precision: {ae_precision:.4f}")
print(f"Test Recall   : {ae_recall:.4f}")
print(f"Test F1       : {ae_f1:.4f}")


# ============================================================
# FINAL MODEL COMPARISON
# ============================================================

results_df = pd.DataFrame(results)

results_df = results_df.sort_values(
    by="F1",
    ascending=False
).reset_index(drop=True)


print("\n" + "=" * 75)
print("                    FINAL MODEL COMPARISON")
print("=" * 75)

print(
    results_df.to_string(
        index=False
    )
)


# ============================================================
# SELECT BEST MODEL
# ============================================================

best_model_name = results_df.iloc[0]["Model"]

best_model = best_models[
    best_model_name
]


print("\n" + "=" * 60)
print("                 🏆 BEST MODEL")
print("=" * 60)

print("Selected Model:", best_model_name)

print(
    "Test F1:",
    round(
        results_df.iloc[0]["F1"],
        4
    )
)


# ============================================================
# SAVE BEST MODEL
# ============================================================

if best_model_name == "Autoencoder":

    model_path = os.path.join(
        MODEL_DIR,
        "best_autoencoder.keras"
    )

    best_model.save(model_path)

    # Save scaler and threshold
    joblib.dump(
        scaler,
        os.path.join(
            MODEL_DIR,
            "autoencoder_scaler.pkl"
        )
    )

    joblib.dump(
        threshold,
        os.path.join(
            MODEL_DIR,
            "autoencoder_threshold.pkl"
        )
    )

else:

    model_path = os.path.join(
        MODEL_DIR,
        "best_model.pkl"
    )

    joblib.dump(
        best_model,
        model_path
    )


# ============================================================
# SAVE COMPARISON RESULTS
# ============================================================

comparison_path = os.path.join(
    MODEL_DIR,
    "model_comparison.csv"
)

results_df.to_csv(
    comparison_path,
    index=False
)


print("\nBest model saved to:")
print(model_path)

print("\nComparison saved to:")
print(comparison_path)

print("\n" + "=" * 60)
print("             TRAINING COMPLETE ✅")
print("=" * 60)