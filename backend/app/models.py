# backend/app/models.py
import joblib
import numpy as np
from pathlib import Path
from config import MODELS_DIR

# Load models with full disease names as keys (align with frontend)
models = {
    "Diabetes": joblib.load(MODELS_DIR / "Diabetes_pipeline.joblib"),
    "Heart Disease": joblib.load(MODELS_DIR / "Heart_pipeline.joblib"),
    "Hypertension": joblib.load(MODELS_DIR / "Hypertension_pipeline.joblib"),
    "Kidney Disease": joblib.load(MODELS_DIR / "Kidney_pipeline.joblib"),
    "Liver Disease": joblib.load(MODELS_DIR / "Liver_pipeline.joblib"),
    # "Parkinson's Disease": joblib.load(MODELS_DIR / "Parkinsons_pipeline.joblib")  # Commented: Add if retrained
}

# Expected feature counts (matches frontend; Parkinson's=33 per UCI w/o target)
expected_features = {
    "Diabetes": 8,
    "Heart Disease": 10,
    "Hypertension": 10,
    "Kidney Disease": 16,
    "Liver Disease": 10,
    # "Parkinson's Disease": 33  # Commented: Add if needed
}

# Tuned thresholds (from ROC/Youden's: Diabetes~0.45 Pima RF; Hypertension~0.35 synth; Liver~0.55 ILPD; others as-is)
thresholds = {
    "Diabetes": 0.70,      # Matches notebook: Reduces over-prediction on imbalanced Pima
    "Heart Disease": 0.55, # Unchanged: Already matches
    "Hypertension": 0.50,  # Raised from 0.35: Matches notebook, avoids over-sensitivity on synthetic data
    "Kidney Disease": 0.55,# Unchanged: Already matches
    "Liver Disease": 0.70, # Lowered from 0.55: Matches notebook, but still needs retraining for features
    # "Parkinson's Disease": 0.50 # Unchanged: Already matches
}

# Adjusted margins (wider for borderline on tuned models)
margins = {  # Fixed: Was 'mmargins' → 'margins' to match usage below
    "Diabetes": 0.03,      # Matches notebook
    "Heart Disease": 0.04, # Matches
    "Hypertension": 0.03,  # Tightened from 0.05: Matches notebook
    "Kidney Disease": 0.04,# Matches
    "Liver Disease": 0.03, # Tightened from 0.05: Matches notebook
    # "Parkinson's Disease": 0.03 # Matches
}

def predict_disease(disease, input_data):
    if disease not in models:
        raise ValueError(f"Model for {disease} not found")
    
    # Validate input length
    if len(input_data) != expected_features.get(disease, 0):
        raise ValueError(f"Expected {expected_features[disease]} features for {disease}, got {len(input_data)}")
    
    input_array = np.array([input_data], dtype=float)
    model = models[disease]
    
    # Get probability of positive class (Has Disease)
    if hasattr(model, 'predict_proba'):
        prob = model.predict_proba(input_array)[0][1]
    else:
        prediction = int(model.predict(input_array)[0])
        prob = 1.0 if prediction == 1 else 0.0
    
    # Convert NumPy float32 to Python float
    prob = float(prob)
    
    # Apply threshold and margin logic
    thr = thresholds.get(disease, 0.5)
    margin = margins.get(disease, 0.03)
    lower = thr - margin
    upper = thr + margin
    
    if prob > upper:
        result = 1
        message = "Has Disease"
        confidence = prob * 100  # Confidence in Has Disease
    elif prob < lower:
        result = 0
        message = "No Disease"
        confidence = (1 - prob) * 100  # Confidence in No Disease
    else:
        result = -1
        message = "Borderline / Uncertain"
        confidence = prob * 100  # Probability of Has Disease for uncertainty
    
    return {
        "result": result,
        "confidence": confidence,
        "message": message,
        "raw_prob": prob  # Add for debugging (remove in prod)
    }

def predict_all_diseases(multi_data):
    results = {}
    for disease, features in multi_data.items():
        if disease not in models:
            continue
        try:
            result = predict_disease(disease, features)
            results[disease] = result
        except ValueError as e:
            results[disease] = {"error": str(e)}
    # Sort by confidence descending
    sorted_results = dict(sorted(results.items(), key=lambda x: x[1].get('confidence', 0) if 'error' not in x[1] else -1, reverse=True))
    return sorted_results