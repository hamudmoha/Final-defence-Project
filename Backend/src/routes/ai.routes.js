const express = require("express");
const { handleAIChat } = require("../controllers/ai.controller.js");

const router = express.Router();

// A decoupled endpoint that strictly processes LLM requests and does not touch standard DB collections.
router.post("/chat", handleAIChat);

module.exports = router;
