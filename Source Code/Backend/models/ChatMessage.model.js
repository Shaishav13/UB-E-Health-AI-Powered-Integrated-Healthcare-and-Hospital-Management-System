/*
 * UB E-Health - Chat Message Model
 * Copyright (c) 2025-2026 Shaishav
 * Licensed under MIT License
 */

const mongoose = require("mongoose");

const chatMessageSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'userModel'
  },
  userModel: {
    type: String,
    required: true,
    enum: ['Patient', 'Doctor']
  },
  role: {
    type: String,
    required: true,
    enum: ['user', 'assistant']
  },
  content: {
    type: String,
    required: true
  },
  intent: {
    type: String,
    enum: ['emergency', 'book_appointment', 'book_lab_test', 'symptom_check', 
           'view_reports', 'manage_appointment', 'payment_query', 'general_query']
  },
  quickActions: [{
    label: String,
    action: String
  }],
  metadata: {
    responseTime: Number,
    model: String,
    tokens: Number
  }
}, { timestamps: true });

// Index for faster queries
chatMessageSchema.index({ userId: 1, createdAt: -1 });

const ChatMessage = mongoose.model("ChatMessage", chatMessageSchema);

// Get chat history for a user
const getChatHistory = async (userId, limit = 50) => {
  return await ChatMessage.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
};

// Save chat message
const saveChatMessage = async (data) => {
  const message = new ChatMessage(data);
  return await message.save();
};

// Clear chat history for a user
const clearChatHistory = async (userId) => {
  return await ChatMessage.deleteMany({ userId });
};

// Get chat statistics
const getChatStats = async (userId) => {
  const stats = await ChatMessage.aggregate([
    { $match: { userId: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: "$intent",
        count: { $sum: 1 }
      }
    }
  ]);
  
  return stats;
};

module.exports = {
  ChatMessage,
  getChatHistory,
  saveChatMessage,
  clearChatHistory,
  getChatStats
};
