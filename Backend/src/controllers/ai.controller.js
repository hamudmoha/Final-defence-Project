const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require("dotenv");
const MLService = require("../services/ml.service.js");
dotenv.config();

// Ensure the AI doesn't crash the server if key is missing during startup.
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

exports.handleAIChat = async (req, res) => {
  const { prompt, role = "manager", fileData, fileType } = req.body;
  
  if (!prompt && !fileData) {
    return res.status(400).json({ success: false, message: "A prompt string or file is required." });
  }

  const lowerInput = prompt?.toLowerCase() || "";
  let mlResults = null;

  // Trigger ML Audit for SysAdmin if requested
  if (role === "sysadmin" && (lowerInput.includes("audit") || lowerInput.includes("anomaly") || lowerInput.includes("check system") || lowerInput.includes("ml"))) {
    mlResults = await MLService.runAnomalyDetection(500);
  }

  // Handle Text File Upload (Simple read & append to prompt)
  let enhancedPrompt = prompt;
  if (fileData && fileType?.startsWith('text/')) {
    const textContent = Buffer.from(fileData, 'base64').toString('utf-8');
    enhancedPrompt = `${prompt}\n\n[FILE CONTENT ATTACHED]:\n${textContent}`;
  }

  if (!genAI || !process.env.GEMINI_API_KEY) {
    // Graceful Fallback: The user doesn't have an API key yet, so we return a smart mock response
    console.warn("No GEMINI_API_KEY found in .env. Returning simulated AI response.");
    
    let botContent = "I'm currently running in 'Simulation Mode' because my LLM API Key hasn't been set up yet!";
    
    if (fileData) {
      const typeLabel = fileType?.startsWith('image/') ? 'image' : 'document';
      botContent = `I see you've uploaded a ${typeLabel}. In 'Simulation Mode', I can detect that it's a ${fileType} file, but I need a GEMINI_API_KEY to perform a deep analysis of the content. How else can I help?`;
    } else if (role === "camper") {
      if (lowerInput.includes('book') || lowerInput.includes('reserve')) {
        botContent = "To book a campsite, head over to the Campsite Directory, choose a site, and select your dates. How many people are in your group?";
      } else if (lowerInput.includes('cancel')) {
        botContent = "You can cancel free of charge up to 48 hours before check-in. Need help doing that?";
      } else {
        botContent = "Simulations for camper queries are limited here. Get ready to explore!";
      }
    } else if (role === "sysadmin") {
      if (mlResults && mlResults.success) {
        botContent = `ML Audit Complete: ${mlResults.summary} I found ${mlResults.anomaly_count} anomalies. Recent unusual patterns include logs from ${mlResults.anomalies.length > 0 ? mlResults.anomalies[0].level : 'N/A'} level. Would you like a detailed report?`;
      } else if (lowerInput.includes('security') || lowerInput.includes('vulnerability')) {
        botContent = "System scan complete. 0 critical vulnerabilities found. 2 IP addresses were automatically blacklisted today due to suspicious login patterns.";
      } else {
        botContent = "System Administrator simulation mode active. I can help with security audits, system health, and database monitoring.";
      }
    } else {
      if (lowerInput.includes('summary') || lowerInput.includes('bookings')) {
        botContent = "Here's a quick summary: You have 12 check-ins today and 5 check-outs. Your current camp occupancy rate is 78%, which is a 2% increase from yesterday.";
      } else {
        botContent = "Camp Manager simulation mode active. I can help with bookings, revenue reports, and guest notifications.";
      }
    }

    // Add a slight delay to simulate network/AI thinking time
    await new Promise(resolve => setTimeout(resolve, 1200));

    return res.json({ success: true, answer: botContent });
  }

  try {
    let contextualPrompt = "";
    
    if (role === "camper") {
      contextualPrompt = `You are a friendly, helpful AI assistant built into the EthioCampGround Camper Dashboard. 
      Reply actively and warmly. If the user provided an image, describe what you see in relation to camping or their question. 
      User Message: "${enhancedPrompt}"`;
    } else if (role === "sysadmin") {
      const mlContext = mlResults ? `\n\n[ML ENGINE AUDIT DATA]: ${JSON.stringify(mlResults)}` : "";
      contextualPrompt = `You are an expert System Administrator AI assistant for the EthioCampGround Platform. 
      Your tone should be technical and precise. ${mlContext}
      If a file or image is provided (logs, screenshots, or config files), perform a deep technical analysis and suggest fixes for any issues found.
      User Message: "${enhancedPrompt}"`;
    } else {
      contextualPrompt = `You are a professional AI Camp Management Consultant for the EthioCampGround Manager Dashboard. 
      Your tone should be proactive and business-oriented. If an image is provided, analyze it for business insights or guest experience improvements.
      User Message: "${enhancedPrompt}"`;
    }

    const modelNames = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash", "gemini-pro"];
    let responseText = null;
    
    for (const modelName of modelNames) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        
        let result;
        if (fileData && fileType?.startsWith('image/')) {
          // Multimodal request (Image + Text)
          const imagePart = {
            inlineData: {
              data: fileData, // base64 string
              mimeType: fileType
            }
          };
          result = await model.generateContent([contextualPrompt, imagePart]);
        } else {
          // Text-only request
          result = await model.generateContent(contextualPrompt);
        }
        
        responseText = result.response.text();
        break;
      } catch (apiError) {
        console.warn(`[AI System] ${modelName} fallback due to error:`, apiError.message);
      }
    }
    
    if (!responseText) {
      return res.status(503).json({ success: false, message: "AI service unavailable." });
    }
    
    return res.json({ success: true, answer: responseText });
  } catch (error) {
    console.error("AI Generation Error:", error.message);
    return res.status(500).json({ success: false, message: "The AI service encountered an error." });
  }
};
