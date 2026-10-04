"""Prototype non-placement risk model (scikit-learn logistic regression).
Trained on the demo cohort itself; works with no API keys."""
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import make_pipeline

FEATS = ["attendance", "assessment", "certified", "experience", "duration", "age", "followup_resp"]

def _frame(ts):
    return pd.DataFrame([{f: float(getattr(t, f)) for f in FEATS} for t in ts])

def factors(t):
    out = []
    if t.assessment < 55: out.append("Low assessment score")
    if t.attendance < 70: out.append("Low attendance")
    if t.followup_resp < 50: out.append("Missing follow-up responses")
    if not t.certified: out.append("Not certified")
    if not t.experience: out.append("No previous experience")
    return out or ["No major risk factors"]

def risk_scores(ts):
    if len(ts) < 10: return {}
    y = [1 if t.status == "Unemployed" else 0 for t in ts]
    if len(set(y)) < 2: return {}
    model = make_pipeline(StandardScaler(), LogisticRegression(max_iter=500))
    model.fit(_frame(ts), y)
    probs = model.predict_proba(_frame(ts))[:, 1]
    res = {}
    for t, p in zip(ts, probs):
        s = round(float(p) * 100)
        res[t.id] = {"score": s, "level": "High" if s >= 60 else "Medium" if s >= 35 else "Low", "factors": factors(t),
                     "note": "Prototype prediction - not a final decision."}
    return res
