"""
DermaScan Classifier
LightGBM model trained on 90 selected features from ISIC 2017.
Labels: 0=Nevus, 1=Melanoma, 2=Seborrheic Keratosis
"""

import joblib
import numpy as np
import pandas as pd
from pathlib import Path
from functools import lru_cache

LABELS = {0: "Nevus", 1: "Melanoma", 2: "Seborrheic Keratosis"}
LABEL_RISK = {0: "low", 1: "high", 2: "moderate"}

# Exact 90 features selected by SelectKBest during training — order matters
FEATURE_COLUMNS = [
    'compactness', 'border_irregularity', 'convexity', 'solidity', 'edge_grad_mean',
    'color_rgb_ch0_skew', 'color_rgb_ch0_kurt', 'color_rgb_ch0_entropy',
    'color_lab_ch0_std', 'color_lab_ch0_skew', 'color_lab_ch0_kurt', 'color_lab_ch0_entropy',
    'color_rgb_ch1_std', 'color_rgb_ch1_skew', 'color_rgb_ch1_kurt', 'color_rgb_ch1_entropy',
    'color_hsv_ch1_mean', 'color_hsv_ch1_std', 'color_hsv_ch1_entropy',
    'color_lab_ch1_std', 'color_lab_ch1_entropy',
    'color_rgb_ch2_std', 'color_rgb_ch2_skew', 'color_rgb_ch2_kurt', 'color_rgb_ch2_entropy',
    'color_hsv_ch2_skew', 'color_hsv_ch2_kurt', 'color_hsv_ch2_entropy',
    'color_lab_ch2_entropy', 'color_dominant_spread',
    'glcm_contrast_mean', 'glcm_dissimilarity_mean', 'glcm_dissimilarity_std',
    'glcm_homogeneity_std', 'glcm_energy_mean', 'glcm_correlation_mean', 'glcm_correlation_std',
    'hist_energy', 'hist_entropy', 'hist_variance', 'hist_kurtosis', 'hist_skewness',
    'hist_p10', 'hist_iqr', 'hist_uniformity', 'hist_mad',
    'shape_perimeter', 'shape_sphericity', 'shape_roundness', 'shape_pd_ratio', 'shape_max_diameter',
    'rx_shape2D_MaximumDiameter', 'rx_shape2D_Perimeter', 'rx_shape2D_Sphericity',
    'rx_firstorder_10Percentile', 'rx_firstorder_Entropy', 'rx_firstorder_InterquartileRange',
    'rx_firstorder_Kurtosis', 'rx_firstorder_MeanAbsoluteDeviation',
    'rx_firstorder_RobustMeanAbsoluteDeviation', 'rx_firstorder_Skewness',
    'rx_firstorder_Uniformity', 'rx_firstorder_Variance',
    'rx_glcm_Autocorrelation', 'rx_glcm_ClusterTendency', 'rx_glcm_Correlation',
    'rx_glcm_Imc1', 'rx_glcm_Imc2', 'rx_glcm_JointAverage', 'rx_glcm_JointEnergy',
    'rx_glcm_JointEntropy', 'rx_glcm_MCC', 'rx_glcm_MaximumProbability',
    'rx_glcm_SumAverage', 'rx_glcm_SumEntropy', 'rx_glcm_SumSquares',
    'rx_glrlm_GrayLevelNonUniformityNormalized', 'rx_glrlm_HighGrayLevelRunEmphasis',
    'rx_glrlm_RunEntropy', 'rx_glrlm_RunLengthNonUniformityNormalized',
    'rx_glrlm_ShortRunEmphasis', 'rx_glrlm_ShortRunHighGrayLevelEmphasis',
    'rx_glszm_GrayLevelNonUniformityNormalized', 'rx_glszm_HighGrayLevelZoneEmphasis',
    'rx_glszm_SizeZoneNonUniformityNormalized', 'rx_glszm_SmallAreaEmphasis',
    'rx_glszm_SmallAreaHighGrayLevelEmphasis', 'rx_glszm_ZoneEntropy',
    'rx_ngtdm_Contrast',
    'age_approximate_75',  # one-hot encoded age bin from pd.get_dummies
]

@lru_cache(maxsize=1)
def _load_model():
    # Try both filenames
    for fname in ["highest_accuracy_model.pkl", "LightGBM.pkl"]:
        path = Path(__file__).parent / fname
        if path.exists():
            print(f"[Classifier] Loading {fname}...")
            model = joblib.load(path)
            print(f"[Classifier] Model loaded. Expects {model.n_features_in_} features.")
            return model
    raise FileNotFoundError("No classifier model found in backend folder.")

def _encode_age_bin(age: float) -> dict:
    """
    Recreates the age one-hot encoding from pd.get_dummies on the training data.
    The only selected bin was age_approximate_75 (age >= 75).
    """
    return {"age_approximate_75": 1.0 if age >= 75 else 0.0}

def classify(features: dict, age: float = 45.0, sex: str = "male") -> dict:
    """
    Takes feature dict from features.py + patient age.
    Returns prediction, confidence, probabilities, and risk level.
    sex is accepted but was not selected by the feature selector — ignored safely.
    """
    model = _load_model()

    age_bins = _encode_age_bin(float(age) if age else 45.0)

    row = {}
    for col in FEATURE_COLUMNS:
        if col in age_bins:
            row[col] = age_bins[col]
        else:
            val = features.get(col, np.nan)
            row[col] = float(val) if val is not None and not (isinstance(val, float) and np.isnan(val)) else 0.0

    df = pd.DataFrame([row], columns=FEATURE_COLUMNS)

    pred_label = int(model.predict(df)[0])
    proba = model.predict_proba(df)[0]
    confidence = float(proba[pred_label])

    return {
        "prediction": LABELS[pred_label],
        "prediction_label": pred_label,
        "confidence": round(confidence, 4),
        "risk_level": LABEL_RISK[pred_label],
        "probabilities": {
            "Nevus": round(float(proba[0]), 4),
            "Melanoma": round(float(proba[1]), 4),
            "Seborrheic Keratosis": round(float(proba[2]), 4),
        }
    }
