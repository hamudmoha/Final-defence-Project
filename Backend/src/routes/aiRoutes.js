const express = require("express");
const { handleAIChat } = require("../controllers/aiController");

const router = express.Router();

// Decoupled endpoint for AI Copilot chat
router.post("/chat", handleAIChat);

module.exports = router;
