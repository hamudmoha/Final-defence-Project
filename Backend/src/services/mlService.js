const { spawn } = require("child_process");
const path = require("path");
const SystemLog = require("../models/SystemLog");

class MLService {
    /**
     * Runs anomaly detection on recent system logs
     * @param {number} limit - Number of logs to analyze
     */
    static async runAnomalyDetection(limit = 1000) {
        try {
            // 1. Fetch recent logs from MongoDB
            const logs = await SystemLog.find()
                .sort({ timestamp: -1 })
                .limit(limit)
                .lean();

            if (!logs || logs.length === 0) {
                return { success: false, message: "No logs found to analyze." };
            }

            // 2. Prepare for Python execution
            const scriptPath = path.resolve("ML_Service/anomaly_detector.py");
            
            return new Promise((resolve, reject) => {
                const pythonProcess = spawn("python", [scriptPath]);

                let outputData = "";
                let errorData = "";

                // Pipe log data to Python's stdin
                pythonProcess.stdin.write(JSON.stringify(logs));
                pythonProcess.stdin.end();

                pythonProcess.stdout.on("data", (data) => {
                    outputData += data.toString();
                });

                pythonProcess.stderr.on("data", (data) => {
                    errorData += data.toString();
                });

                pythonProcess.on("close", (code) => {
                    if (code !== 0) {
                        console.error(`ML Script exited with code ${code}. Error: ${errorData}`);
                        return resolve({ success: false, message: "ML Engine failed to process logs." });
                    }

                    try {
                        const result = JSON.parse(outputData);
                        resolve(result);
                    } catch (parseError) {
                        console.error("Failed to parse ML output:", parseError);
                        resolve({ success: false, message: "Invalid response from ML Engine." });
                    }
                });
            });

        } catch (error) {
            console.error("ML Service Error:", error);
            return { success: false, message: "Internal ML Service error." };
        }
    }
}

module.exports = MLService;
