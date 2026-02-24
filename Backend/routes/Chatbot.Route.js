/*
 * UB E-Health - Chatbot Routes
 * Copyright (c) 2025-2026 Shaishav
 * Licensed under MIT License
 */

const express = require("express");
const router = express.Router();
const {
  generateChatbotResponse,
  getFAQResponse,
  detectIntent,
  getQuickActions
} = require("../services/healthChatbot");
const {
  getChatHistory,
  saveChatMessage,
  clearChatHistory,
  getChatStats
} = require("../models/ChatMessage.model");
const { authenticate: patientAuth } = require("../middlewares/patientAuth");

/**
 * @route   POST /chatbot/message
 * @desc    Send message to chatbot and get response
 * @access  Private (Patient)
 */
router.post("/message", patientAuth, async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.body.patientID;

    console.log("Chatbot message request - userId:", userId);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User authentication required"
      });
    }

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message is required"
      });
    }

    const startTime = Date.now();

    // Save user message
    await saveChatMessage({
      userId,
      userModel: 'Patient',
      role: 'user',
      content: message
    });

    // Detect intent
    const intent = detectIntent(message);

    // Check for FAQ match first
    const faqResponse = getFAQResponse(message);
    
    let botResponse;
    let quickActions = [];

    if (faqResponse) {
      // Use FAQ response
      botResponse = faqResponse;
      quickActions = getQuickActions(intent);
    } else {
      // Get recent chat history for context
      const history = await getChatHistory(userId, 10);
      const formattedHistory = history.reverse().map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // Generate AI response
      const aiResult = await generateChatbotResponse(message, formattedHistory);
      botResponse = aiResult.response;
      quickActions = getQuickActions(intent);
    }

    const responseTime = Date.now() - startTime;

    // Save assistant response
    await saveChatMessage({
      userId,
      userModel: 'Patient',
      role: 'assistant',
      content: botResponse,
      intent,
      quickActions,
      metadata: {
        responseTime,
        model: 'gemini-2.5-flash'
      }
    });

    res.status(200).json({
      success: true,
      response: botResponse,
      intent,
      quickActions,
      responseTime
    });

  } catch (error) {
    console.error("Chatbot message error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process message",
      error: error.message
    });
  }
});

/**
 * @route   GET /chatbot/history
 * @desc    Get chat history for user
 * @access  Private (Patient)
 */
router.get("/history", patientAuth, async (req, res) => {
  try {
    const userId = req.body.patientID;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User authentication required"
      });
    }
    
    const limit = parseInt(req.query.limit) || 50;

    const history = await getChatHistory(userId, limit);

    res.status(200).json({
      success: true,
      history: history.reverse(), // Oldest first
      count: history.length
    });

  } catch (error) {
    console.error("Get chat history error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch chat history",
      error: error.message
    });
  }
});

/**
 * @route   DELETE /chatbot/history
 * @desc    Clear chat history for user
 * @access  Private (Patient)
 */
router.delete("/history", patientAuth, async (req, res) => {
  try {
    const userId = req.body.patientID;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User authentication required"
      });
    }

    await clearChatHistory(userId);

    res.status(200).json({
      success: true,
      message: "Chat history cleared successfully"
    });

  } catch (error) {
    console.error("Clear chat history error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to clear chat history",
      error: error.message
    });
  }
});

/**
 * @route   GET /chatbot/stats
 * @desc    Get chat statistics for user
 * @access  Private (Patient)
 */
router.get("/stats", patientAuth, async (req, res) => {
  try {
    const userId = req.body.patientID;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User authentication required"
      });
    }

    const stats = await getChatStats(userId);

    res.status(200).json({
      success: true,
      stats
    });

  } catch (error) {
    console.error("Get chat stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch chat statistics",
      error: error.message
    });
  }
});

/**
 * @route   GET /chatbot/faqs
 * @desc    Get list of FAQs
 * @access  Public
 */
router.get("/faqs", (req, res) => {
  const faqs = [
    {
      question: "How do I book an appointment?",
      category: "Appointments"
    },
    {
      question: "How do I book a lab test?",
      category: "Lab Tests"
    },
    {
      question: "How can I view my reports?",
      category: "Reports"
    },
    {
      question: "What payment methods do you accept?",
      category: "Payments"
    },
    {
      question: "How do I cancel an appointment?",
      category: "Appointments"
    },
    {
      question: "Is home service available for lab tests?",
      category: "Lab Tests"
    },
    {
      question: "What should I do in an emergency?",
      category: "Emergency"
    },
    {
      question: "How do I contact support?",
      category: "Support"
    }
  ];

  res.status(200).json({
    success: true,
    faqs
  });
});

module.exports = router;
