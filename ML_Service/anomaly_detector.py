import sys
import json
import pandas as pd
from sklearn.ensemble import IsolationForest
import numpy as np

def detect_anomalies(logs_data):
    if not logs_data:
        return {"success": False, "message": "No log data provided"}

    try:
        # Load logs into DataFrame
        df = pd.DataFrame(logs_data)
        
        if df.empty:
            return {"success": False, "message": "Log dataset is empty"}

        # Basic Feature Engineering
        # 1. Convert timestamp to datetime
        df['createdAt'] = pd.to_datetime(df['createdAt'])
        
        # 2. Extract hour of day
        df['hour'] = df['createdAt'].dt.hour
        
        # 3. Categorical encoding for 'level' and 'module' (or 'category')
        # We'll use frequency encoding for simplicity in a small script
        level_counts = df['level'].value_counts().to_dict()
        df['level_freq'] = df['level'].map(level_counts)
        
        if 'module' in df.columns:
            module_counts = df['module'].value_counts().to_dict()
            df['module_freq'] = df['module'].map(module_counts)
        else:
            df['module_freq'] = 1
            
        # 4. Numerical features for ML
        # We want to find outliers in terms of timing and frequency of levels/modules
        features = df[['hour', 'level_freq', 'module_freq']]
        
        # Initialize Isolation Forest
        # contamination='auto' lets the model decide the threshold
        model = IsolationForest(n_estimators=100, contamination=0.05, random_state=42)
        
        # Fit and predict
        # 1 = normal, -1 = anomaly
        df['anomaly_score'] = model.fit_predict(features)
        
        # Extract anomalies
        anomalies = df[df['anomaly_score'] == -1].copy()
        
        # Convert Timestamps to strings for JSON serialization
        anomalies['createdAt'] = anomalies['createdAt'].dt.strftime('%Y-%m-%dT%H:%M:%SZ')
        
        # Format results
        results = {
            "success": True,
            "total_logs": len(df),
            "anomaly_count": len(anomalies),
            "anomalies": anomalies[['level', 'message', 'createdAt', 'module_freq']].tail(5).to_dict(orient='records'),
            "summary": f"Analyzed {len(df)} logs. Detected {len(anomalies)} unusual patterns."
        }
        
        return results

    except Exception as e:
        return {"success": False, "message": str(e)}

if __name__ == "__main__":
    try:
        # Read JSON from stdin
        input_data = sys.stdin.read()
        if not input_data:
            print(json.dumps({"success": False, "message": "No input received"}))
            sys.exit(0)
            
        logs = json.loads(input_data)
        output = detect_anomalies(logs)
        print(json.dumps(output))
        
    except Exception as e:
        print(json.dumps({"success": False, "message": f"Critical error: {str(e)}"}))
