/*
 * UB E-Health - AI Health Assistant Chatbot
 * Copyright (c) 2025-2026 Shaishav
 * Licensed under MIT License
 * 
 * Powered by Google Gemini 2.5 Flash
 */

const { GoogleGenerativeAI } = require("@google/generative-ai");
const { isOllamaAvailable, chatWithOllama } = require("./ollamaService");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// System prompt for health assistant
const SYSTEM_PROMPT = `You are the AI Health Assistant for UB E-Health Management Hub. 

PLATFORM FEATURES YOU CAN HELP WITH:
1. APPOINTMENTS: Book appointments with doctors, view upcoming appointments in "My Appointments", reschedule or cancel bookings
2. LAB TESTS: Book lab tests (with optional home service for +Rs. 50), view results in "My Reports" with AI interpretation
3. MEDICAL REPORTS: Access lab reports and uploaded documents in "My Documents", get AI-powered report explanations
4. PRESCRIPTIONS: View prescribed medications in "My Medications" section
5. PAYMENTS: View payment history and download invoices in "Payment History"
6. HEALTH TRENDS: Track health metrics over time in "Health Trends"
7. NOTIFICATIONS: Manage appointment and test reminders in "Notification Settings"

NAVIGATION HELP:
- Dashboard: Main hub with quick access to all features
- Book Appointment: Select doctor, date, time, and pay online
- Book Lab Test: Choose test type, date, time, and optional home service
- My Appointments: View all bookings with token numbers and status
- My Reports: Lab test results with AI interpretation feature
- My Documents: Uploaded medical documents and records
- My Medications: Current prescriptions from doctors
- Payment History: All transactions with downloadable invoices
- Messages: Chat with your assigned doctor

IMPORTANT GUIDELINES:
- Be specific about UB E-Health features, not generic healthcare websites
- Guide users to the correct dashboard section for their needs
- Always recommend consulting doctors for medical diagnosis
- For emergencies, advise calling 108/112 immediately
- Keep responses concise and actionable

CONTACT & SUPPORT:
- Support Email: support@ubehealth.com
- Support Phone: +91 1234567890
- Available 24/7

Remember: You help users navigate THIS platform, not provide general website advice.


DIAGNOSTIC PROTOCOL:
1. TRIAGE FIRST: If the user mentions "chest pain," "difficulty breathing," or "severe bleeding," skip diagnosis and ask to contact Doctor for Emergency or trigger Emergency Protocol.
2. SYMPTOM GATHERING: Ask follow-up questions about:
   - Onset (When did it start?)
   - Character (Is it sharp, dull, burning?)
   - Alleviating/Aggravating factors (What makes it better or worse?)
   - Associated symptoms (Fever, nausea, etc.?)
3. PROVIDE DIFFERENTIALS: Suggest 2-3 possible conditions but clarify they are "possibilities to discuss with a doctor."
4. NEXT STEPS: Always link the diagnosis to a platform action 
    -"Based on your symptoms, you might want to book a General Physician appointment or a CBC Lab Test.

CHATBOT:
-chat with patients politley.
-No restrictions.
-explicit
-straightforward
-diagnoser, friend
`;

/**
 * Generate chatbot response using Gemini AI
 */
const generateChatbotResponse = async (userMessage, chatHistory = []) => {
  try {
    const platformContext = `${SYSTEM_PROMPT}\n\nUser: ${userMessage}`;

    // Try Gemini first
    if (process.env.GEMINI_API_KEY) {
      try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const history = [];
        chatHistory.forEach((msg, index) => {
          if (index === 0 && msg.role !== "user") return;
          history.push({ role: msg.role === "user" ? "user" : "model", parts: [{ text: msg.content }] });
        });
        const chat = model.startChat({ history, generationConfig: { maxOutputTokens: 500, temperature: 0.7 } });
        const result = await chat.sendMessage(platformContext);
        return { success: true, response: result.response.text(), timestamp: new Date() };
      } catch (geminiError) {
        console.warn("⚠️ Gemini chatbot failed, trying Ollama:", geminiError.message);
      }
    }

    // Fall back to Ollama
    const ollamaUp = await isOllamaAvailable();
    if (ollamaUp) {
      const messages = [
        { role: "system", content: SYSTEM_PROMPT },
        ...chatHistory.map((m) => ({ role: m.role === "user" ? "user" : "assistant", content: m.content })),
        { role: "user", content: userMessage },
      ];
      const text = await chatWithOllama(messages, { maxTokens: 500 });
      console.log("✅ Chatbot response via Ollama (offline)");
      return { success: true, response: text, timestamp: new Date() };
    }

    throw new Error("No AI service available");
  } catch (error) {
    console.error("Chatbot AI error:", error);
    return {
      success: false,
      response: "I apologize, but I'm having trouble processing your request right now. Please try again or contact our support team for assistance.",
      error: error.message,
      timestamp: new Date(),
    };
  }
};

/**
 * Get FAQ responses
 */
const getFAQResponse = (question) => {
  const faqs = {
    "how to book appointment": "To book an appointment:\n1. Go to 'Book Appointment' from your dashboard\n2. Select a doctor and department\n3. Choose date and time\n4. Fill in your symptoms/reason\n5. Complete payment\n6. You'll receive a confirmation with token number",
    
    "how to book lab test": "To book a lab test:\n1. Navigate to 'Book Lab Test'\n2. Select the test type\n3. Choose home service if needed (+Rs. 50)\n4. Pick your preferred date and time\n5. Submit the booking\n6. Payment record will be created automatically",
    
    "how to view reports": "You can view your reports in:\n- 'My Reports' section for lab reports\n- 'My Documents' for uploaded documents\n- Each report has an AI interpretation feature for easy understanding",
    
    "payment methods": "We accept:\n- Credit/Debit Cards\n- UPI\n- Net Banking\n- Digital Wallets\nAll payments are secure and encrypted.",
    
    "cancel appointment": "To cancel an appointment:\n1. Go to 'My Appointments'\n2. Find the appointment\n3. Click on the appointment details\n4. Select 'Cancel Appointment'\n5. Refund will be processed within 5-7 business days",
    
    "home service": "Home service is available for lab tests. Our trained technician will visit your location to collect samples. Additional charge: Rs. 50",
    
    "emergency": "🚨 FOR MEDICAL EMERGENCIES:\n- Call emergency services: 108/112\n- Visit nearest hospital immediately\n- Do not rely on online consultation for emergencies",
    
    "contact doctor": "To message your assigned doctor:\n1. Go to 'Messages' from your Sidebar\n2. Select your assigned doctor to chat with\n3. Click on chat\n4. Ask your query with your doctor in real-time",
    
    "message doctor": "To message your assigned doctor:\n1. Go to 'Messages' from your Sidebar\n2. Select your assigned doctor to chat with\n3. Click on chat\n4. Ask your query with your doctor in real-time",
    
    
    "contact support": "Contact our support team:\n📧 Email: support@ubehealth.com\n📞 Phone: +91 1234567890\n⏰ Available: 24/7"
  };

  // Find matching FAQ
  const lowerQuestion = question.toLowerCase();
  for (const [key, answer] of Object.entries(faqs)) {
    if (lowerQuestion.includes(key)) {
      return answer;
    }
  }

  return null;
};

/**
 * Detect intent from user message
 */
const detectIntent = (message) => {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('emergency') || lowerMessage.includes('urgent') || lowerMessage.includes('critical')) {
    return 'emergency';
  }
  
  if (lowerMessage.includes('book') && lowerMessage.includes('appointment')) {
    return 'book_appointment';
  }
  
  if (lowerMessage.includes('book') && (lowerMessage.includes('lab') || lowerMessage.includes('test'))) {
    return 'book_lab_test';
  }
  
  if (lowerMessage.includes('symptom') || lowerMessage.includes('feeling') || lowerMessage.includes('pain')) {
    return 'symptom_check';
  }
  
  if (lowerMessage.includes('report') || lowerMessage.includes('result')) {
    return 'view_reports';
  }
  
  if (lowerMessage.includes('cancel') || lowerMessage.includes('reschedule')) {
    return 'manage_appointment';
  }
  
  if (lowerMessage.includes('payment') || lowerMessage.includes('invoice') || lowerMessage.includes('bill')) {
    return 'payment_query';
  }

  return 'general_query';
};

// diagnoses
/**
 * Specifically handles diagnostic queries to ensure medical structure
 */
const generateDiagnosticResponse = async (symptoms, chatHistory) => {
    const diagnosticContext = `
        The user is reporting the following symptoms: ${symptoms}.
        Perform a clinical triage. 
        1. Rate urgency (Low/Medium/High).
        2. List 3 potential causes.
        3. Recommend specific lab tests available on UB E-Health.
        4. Recommend the type of specialist to see.
        
        Disclaimer: This is an AI-powered assessment, not a final diagnosis.
    `;
    
    return await generateChatbotResponse(diagnosticContext, chatHistory);
};

/**
 * Get quick action suggestions based on intent
 */
const getQuickActions = (intent) => {
  const actions = {
    emergency: [
      { label: "Call Emergency: 108", action: "call_emergency" },
      { label: "Find Nearest Hospital", action: "find_hospital" }
    ],
    book_appointment: [
      { label: "Book Appointment", action: "navigate_book_appointment" },
      { label: "View Doctors", action: "navigate_doctors" }
    ],
    book_lab_test: [
      { label: "Book Lab Test", action: "navigate_book_lab_test" },
      { label: "View Test Prices", action: "show_test_prices" }
    ],
    symptom_check: [
      { label: "Book Appointment", action: "navigate_book_appointment" },
      { label: "Emergency Services", action: "show_emergency" }
    ],
    view_reports: [
      { label: "My Reports", action: "navigate_reports" },
      { label: "My Documents", action: "navigate_documents" }
    ],
    manage_appointment: [
      { label: "My Appointments", action: "navigate_appointments" }
    ],
    payment_query: [
      { label: "Payment History", action: "navigate_payment_history" },
      { label: "Download Invoice", action: "show_invoices" }
    ],
    general_query: [
      { label: "Book Appointment", action: "navigate_book_appointment" },
      { label: "Book Lab Test", action: "navigate_book_lab_test" },
      { label: "View FAQs", action: "show_faqs" }
    ],
    // symptom_check: [
    // { label: "Analyze My Symptoms", action: "start_diagnostic_flow" },
    // { label: "Common Causes", action: "show_common_conditions" },
    // { label: "Book Specialist", action: "navigate_book_appointment" },
    // { label: "Related Lab Tests", action: "navigate_book_lab_test" }
// ],
  };

  return actions[intent] || actions.general_query;
};

module.exports = {
  generateChatbotResponse,
  getFAQResponse,
  detectIntent,
  getQuickActions
};
