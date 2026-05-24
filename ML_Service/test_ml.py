import json
import subprocess
import os

# Mock logs
mock_logs = [
    {"level": "info", "message": "User logged in", "module": "auth", "createdAt": "2024-05-10T10:00:00Z"},
    {"level": "info", "message": "Page viewed", "module": "dashboard", "createdAt": "2024-05-10T10:05:00Z"},
    {"level": "info", "message": "User logged in", "module": "auth", "createdAt": "2024-05-10T10:10:00Z"},
    {"level": "error", "message": "Database timeout", "module": "db", "createdAt": "2024-05-10T10:15:00Z"}, # Anomaly
    {"level": "info", "message": "User logged in", "module": "auth", "createdAt": "2024-05-10T10:20:00Z"},
]

# Add many more regular logs to make the error stand out
for i in range(100):
    mock_logs.append({"level": "info", "message": f"Regular activity {i}", "module": "general", "createdAt": f"2024-05-10T11:{i%60:02d}:00Z"})

def run_test():
    script_path = os.path.join(os.path.dirname(__file__), "anomaly_detector.py")
    
    # Run the script and pass mock_logs via stdin
    process = subprocess.Popen(
        ["python", script_path],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )
    
    stdout, stderr = process.communicate(input=json.dumps(mock_logs))
    
    if stderr:
        print("Error:", stderr)
    else:
        print("Output:", stdout)
        try:
            result = json.loads(stdout)
            if result.get("success"):
                print("Test Passed: ML Engine returned success.")
                print(f"Summary: {result.get('summary')}")
                print(f"Anomalies detected: {result.get('anomaly_count')}")
            else:
                print("Test Failed:", result.get("message"))
        except Exception as e:
            print("Failed to parse output:", e)

if __name__ == "__main__":
    run_test()
