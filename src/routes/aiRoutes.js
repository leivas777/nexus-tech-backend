const express = require("express");
const { handleChat } = require("../controllers/aiChatController");

const router = express.Router();

// POST /api/ai/chat
router.post("/chat", handleChat);

module.exports = router;