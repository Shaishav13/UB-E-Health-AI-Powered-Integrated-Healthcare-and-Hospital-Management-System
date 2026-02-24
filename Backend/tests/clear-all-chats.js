/*
 * Clear all chat messages from database
 */

require("dotenv").config();
const mongoose = require("mongoose");
const { ChatMessage } = require("../models/ChatMessage.model");

async function clearAllChats() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const result = await ChatMessage.deleteMany({});
    console.log(`✅ Deleted ${result.deletedCount} chat messages`);

    await mongoose.connection.close();
    console.log("Database connection closed");
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

clearAllChats();
