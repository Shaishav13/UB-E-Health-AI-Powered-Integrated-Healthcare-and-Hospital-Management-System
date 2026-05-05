/*
 * UB E-Health - Ollama Local AI Service
 * Provides offline AI capabilities via Ollama
 * Copyright (c) 2025-2026 Shaishav
 * Licensed under MIT License
 */

const http = require("http");

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.2";

/**
 * Check if Ollama is running and available
 */
async function isOllamaAvailable() {
  return new Promise((resolve) => {
    const url = new URL(OLLAMA_BASE_URL);
    const req = http.get(
      { hostname: url.hostname, port: url.port || 11434, path: "/api/tags", timeout: 3000 },
      (res) => resolve(res.statusCode === 200)
    );
    req.on("error", () => resolve(false));
    req.on("timeout", () => { req.destroy(); resolve(false); });
  });
}

/**
 * Send a prompt to Ollama and get a response
 * @param {string} prompt - The full prompt to send
 * @param {Object} options - Optional generation parameters
 * @returns {Promise<string>} The generated text
 */
async function generateWithOllama(prompt, options = {}) {
  const body = JSON.stringify({
    model: options.model || OLLAMA_MODEL,
    prompt: prompt,
    stream: false,
    options: {
      temperature: options.temperature || 0.7,
      num_predict: options.maxTokens || 1024,
    },
  });

  return new Promise((resolve, reject) => {
    const url = new URL(OLLAMA_BASE_URL);
    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port || 11434,
        path: "/api/generate",
        method: "POST",
        headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) },
        timeout: 120000, // 2 min timeout for local models
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            const parsed = JSON.parse(data);
            if (parsed.response) {
              resolve(parsed.response);
            } else {
              reject(new Error("Empty response from Ollama"));
            }
          } catch (e) {
            reject(new Error("Failed to parse Ollama response"));
          }
        });
      }
    );
    req.on("error", reject);
    req.on("timeout", () => { req.destroy(); reject(new Error("Ollama request timed out")); });
    req.write(body);
    req.end();
  });
}

/**
 * Chat with Ollama using message history (OpenAI-compatible format)
 * @param {Array} messages - Array of {role, content} objects
 * @param {Object} options - Optional generation parameters
 * @returns {Promise<string>} The assistant's response
 */
async function chatWithOllama(messages, options = {}) {
  const body = JSON.stringify({
    model: options.model || OLLAMA_MODEL,
    messages: messages,
    stream: false,
    options: {
      temperature: options.temperature || 0.7,
      num_predict: options.maxTokens || 500,
    },
  });

  return new Promise((resolve, reject) => {
    const url = new URL(OLLAMA_BASE_URL);
    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port || 11434,
        path: "/api/chat",
        method: "POST",
        headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) },
        timeout: 120000,
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            const parsed = JSON.parse(data);
            if (parsed.message?.content) {
              resolve(parsed.message.content);
            } else {
              reject(new Error("Empty response from Ollama"));
            }
          } catch (e) {
            reject(new Error("Failed to parse Ollama response"));
          }
        });
      }
    );
    req.on("error", reject);
    req.on("timeout", () => { req.destroy(); reject(new Error("Ollama request timed out")); });
    req.write(body);
    req.end();
  });
}

/**
 * List available models in Ollama
 */
async function listOllamaModels() {
  return new Promise((resolve, reject) => {
    const url = new URL(OLLAMA_BASE_URL);
    const req = http.get(
      { hostname: url.hostname, port: url.port || 11434, path: "/api/tags", timeout: 5000 },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            const parsed = JSON.parse(data);
            resolve(parsed.models || []);
          } catch (e) {
            reject(new Error("Failed to parse models list"));
          }
        });
      }
    );
    req.on("error", reject);
  });
}

module.exports = {
  isOllamaAvailable,
  generateWithOllama,
  chatWithOllama,
  listOllamaModels,
  OLLAMA_MODEL,
};
