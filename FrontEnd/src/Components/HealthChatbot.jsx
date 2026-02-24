import React, { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import { toast } from "react-toastify";

const HealthChatbot = () => {
  const { data } = useSelector((store) => store.auth);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      loadChatHistory();
    }
  }, [isOpen]);

  const loadChatHistory = async () => {
    if (!data?.isAuthenticated) return;

    try {
      const token = data.token;
      const response = await axios.get("http://127.0.0.1:3001/chatbot/history", {
        headers: { Authorization: token }
      });

      if (response.data.success) {
        setMessages(response.data.history);
      }
    } catch (error) {
      console.error("Error loading chat history:", error);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !data?.isAuthenticated) return;

    const userMessage = {
      role: "user",
      content: inputMessage,
      createdAt: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsTyping(true);

    try {
      const token = data.token;
      const response = await axios.post(
        "http://127.0.0.1:3001/chatbot/message",
        { message: inputMessage },
        { headers: { Authorization: token } }
      );

      if (response.data.success) {
        const botMessage = {
          role: "assistant",
          content: response.data.response,
          intent: response.data.intent,
          quickActions: response.data.quickActions,
          createdAt: new Date().toISOString()
        };

        setMessages(prev => [...prev, botMessage]);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleQuickAction = (action) => {
    // Handle quick actions
    const actions = {
      navigate_book_appointment: () => window.location.href = "/patient/book-appointment",
      navigate_book_lab_test: () => window.location.href = "/patient/book-lab-test",
      navigate_reports: () => window.location.href = "/patient/my-reports",
      navigate_documents: () => window.location.href = "/patient/my-documents",
      navigate_appointments: () => window.location.href = "/patient/my-appointments",
      navigate_payment_history: () => window.location.href = "/patient/payment-history",
      call_emergency: () => window.open("tel:108"),
      show_faqs: () => setInputMessage("Show me FAQs")
    };

    if (actions[action]) {
      actions[action]();
    }
  };

  const clearChat = async () => {
    if (!window.confirm("Are you sure you want to clear chat history?")) return;

    try {
      const token = data.token;
      await axios.delete("http://127.0.0.1:3001/chatbot/history", {
        headers: { Authorization: token }
      });

      setMessages([]);
      toast.success("Chat history cleared");
    } catch (error) {
      console.error("Error clearing chat:", error);
      toast.error("Failed to clear chat history");
    }
  };

  if (!data?.isAuthenticated || data?.user?.userType !== "patient") {
    return null;
  }

  return (
    <>
      <style>{`
        .chatbot-container {
          position: fixed;
          bottom: 20px;
          right: 20px;
          z-index: 9999;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        }

        .chatbot-button {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          position: relative;
        }

        .chatbot-button:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 25px rgba(102, 126, 234, 0.5);
        }

        .chatbot-button-icon {
          font-size: 28px;
        }

        .chatbot-badge {
          position: absolute;
          top: -5px;
          right: -5px;
          background: #ef4444;
          color: white;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: bold;
        }

        .chatbot-window {
          position: fixed;
          bottom: 90px;
          right: 20px;
          width: 380px;
          height: 600px;
          background: white;
          border-radius: 20px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          animation: slideUp 0.3s ease;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .chatbot-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .chatbot-header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .chatbot-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
        }

        .chatbot-header-text h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
        }

        .chatbot-header-text p {
          margin: 0;
          font-size: 12px;
          opacity: 0.9;
        }

        .chatbot-header-actions {
          display: flex;
          gap: 8px;
        }

        .chatbot-header-btn {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .chatbot-header-btn:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .chatbot-messages {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
          background: #f8fafc;
        }

        .chatbot-message {
          margin-bottom: 16px;
          display: flex;
          gap: 10px;
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .chatbot-message.user {
          flex-direction: row-reverse;
        }

        .chatbot-message-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          font-size: 16px;
        }

        .chatbot-message.user .chatbot-message-avatar {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .chatbot-message.assistant .chatbot-message-avatar {
          background: #e2e8f0;
        }

        .chatbot-message-content {
          max-width: 70%;
        }

        .chatbot-message-bubble {
          padding: 12px 16px;
          border-radius: 16px;
          line-height: 1.5;
          font-size: 14px;
          white-space: pre-wrap;
          word-wrap: break-word;
        }

        .chatbot-message.user .chatbot-message-bubble {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-bottom-right-radius: 4px;
        }

        .chatbot-message.assistant .chatbot-message-bubble {
          background: white;
          color: #1e293b;
          border-bottom-left-radius: 4px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .chatbot-quick-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 8px;
        }

        .chatbot-quick-action-btn {
          padding: 8px 12px;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          color: #667eea;
          font-weight: 500;
        }

        .chatbot-quick-action-btn:hover {
          background: #667eea;
          color: white;
          border-color: #667eea;
        }

        .chatbot-typing {
          display: flex;
          gap: 4px;
          padding: 12px 16px;
          background: white;
          border-radius: 16px;
          width: fit-content;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .chatbot-typing-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #94a3b8;
          animation: typing 1.4s infinite;
        }

        .chatbot-typing-dot:nth-child(2) {
          animation-delay: 0.2s;
        }

        .chatbot-typing-dot:nth-child(3) {
          animation-delay: 0.4s;
        }

        @keyframes typing {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-10px); }
        }

        .chatbot-input-container {
          padding: 16px;
          background: white;
          border-top: 1px solid #e2e8f0;
        }

        .chatbot-input-wrapper {
          display: flex;
          gap: 8px;
          align-items: flex-end;
        }

        .chatbot-input {
          flex: 1;
          padding: 12px 16px;
          border: 2px solid #e2e8f0;
          border-radius: 24px;
          font-size: 14px;
          resize: none;
          max-height: 100px;
          font-family: inherit;
          transition: border-color 0.2s ease;
        }

        .chatbot-input:focus {
          outline: none;
          border-color: #667eea;
        }

        .chatbot-send-btn {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }

        .chatbot-send-btn:hover:not(:disabled) {
          transform: scale(1.1);
        }

        .chatbot-send-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .chatbot-empty-state {
          text-align: center;
          padding: 40px 20px;
          color: #64748b;
        }

        .chatbot-empty-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        .chatbot-empty-title {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 8px;
          color: #1e293b;
        }

        .chatbot-empty-text {
          font-size: 14px;
          line-height: 1.6;
        }

        @media (max-width: 480px) {
          .chatbot-window {
            width: calc(100vw - 40px);
            height: calc(100vh - 120px);
            right: 20px;
            bottom: 90px;
          }
        }
      `}</style>

      <div className="chatbot-container">
        {!isOpen && (
          <button className="chatbot-button" onClick={() => setIsOpen(true)}>
            <span className="chatbot-button-icon">💬</span>
          </button>
        )}

        {isOpen && (
          <div className="chatbot-window">
            <div className="chatbot-header">
              <div className="chatbot-header-left">
                <div className="chatbot-avatar">🤖</div>
                <div className="chatbot-header-text">
                  <h3>Health Assistant</h3>
                  <p>Always here to help</p>
                </div>
              </div>
              <div className="chatbot-header-actions">
                <button className="chatbot-header-btn" onClick={clearChat} title="Clear chat">
                  🗑️
                </button>
                <button className="chatbot-header-btn" onClick={() => setIsOpen(false)}>
                  ✕
                </button>
              </div>
            </div>

            <div className="chatbot-messages">
              {messages.length === 0 ? (
                <div className="chatbot-empty-state">
                  <div className="chatbot-empty-icon">👋</div>
                  <div className="chatbot-empty-title">Hello! I'm your Health Assistant</div>
                  <div className="chatbot-empty-text">
                    I can help you with appointments, lab tests, reports, and answer your health questions. How can I assist you today?
                  </div>
                </div>
              ) : (
                messages.map((msg, index) => (
                  <div key={index} className={`chatbot-message ${msg.role}`}>
                    <div className="chatbot-message-avatar">
                      {msg.role === "user" ? "👤" : "🤖"}
                    </div>
                    <div className="chatbot-message-content">
                      <div className="chatbot-message-bubble">{msg.content}</div>
                      {msg.quickActions && msg.quickActions.length > 0 && (
                        <div className="chatbot-quick-actions">
                          {msg.quickActions.map((action, i) => (
                            <button
                              key={i}
                              className="chatbot-quick-action-btn"
                              onClick={() => handleQuickAction(action.action)}
                            >
                              {action.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}

              {isTyping && (
                <div className="chatbot-message assistant">
                  <div className="chatbot-message-avatar">🤖</div>
                  <div className="chatbot-typing">
                    <div className="chatbot-typing-dot"></div>
                    <div className="chatbot-typing-dot"></div>
                    <div className="chatbot-typing-dot"></div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <div className="chatbot-input-container">
              <div className="chatbot-input-wrapper">
                <textarea
                  className="chatbot-input"
                  placeholder="Type your message..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  rows={1}
                  disabled={isTyping}
                />
                <button
                  className="chatbot-send-btn"
                  onClick={sendMessage}
                  disabled={!inputMessage.trim() || isTyping}
                >
                  ➤
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default HealthChatbot;
