/*
 * UB E-Health - Gemini AI Service
 * Copyright (c) 2025-2026 Shaishav
 * Licensed under MIT License
 */

const { GoogleGenerativeAI } = require("@google/generative-ai");
const { isOllamaAvailable, generateWithOllama } = require("./ollamaService");

// Initialize Gemini AI
let genAI = null;
let model = null;

function initializeGemini() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.warn("⚠️ GEMINI_API_KEY not found in environment variables");
    return false;
  }

  try {
    genAI = new GoogleGenerativeAI(apiKey);
    // Use gemini-2.5-flash (latest stable version)
    model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    console.log("✅ Gemini AI initialized successfully");
    return true;
  } catch (error) {
    console.error("❌ Failed to initialize Gemini AI:", error.message);
    return false;
  }
}

/**
 * Generates AI interpretation of lab report using Gemini
 * @param {Object} labReport - The lab report object
 * @returns {Promise<Object>} AI-generated interpretation
 */
async function generateAIInterpretation(labReport) {
  // Initialize if not already done
  if (!model) {
    const initialized = initializeGemini();
    if (!initialized) {
      throw new Error("Gemini AI is not configured. Please add GEMINI_API_KEY to .env file");
    }
  }

  const { results, testType, testName, status } = labReport;

  if (!results || !results.parameters || results.parameters.length === 0) {
    throw new Error("No results available to interpret");
  }

  // Build the prompt for Gemini
  const prompt = buildInterpretationPrompt(labReport);

  try {
    let text;

    // Try Gemini first, fall back to Ollama if unavailable
    if (model) {
      try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        text = response.text();
        console.log("✅ Lab report interpreted via Gemini");
      } catch (geminiError) {
        console.warn("⚠️ Gemini failed, trying Ollama:", geminiError.message);
        const ollamaUp = await isOllamaAvailable();
        if (!ollamaUp) throw geminiError;
        text = await generateWithOllama(prompt);
        console.log("✅ Lab report interpreted via Ollama (offline)");
      }
    } else {
      // No Gemini configured — try Ollama directly
      const ollamaUp = await isOllamaAvailable();
      if (!ollamaUp) {
        throw new Error("No AI service available. Configure GEMINI_API_KEY or start Ollama.");
      }
      text = await generateWithOllama(prompt);
      console.log("✅ Lab report interpreted via Ollama (offline)");
    }

    // Parse the AI response
    const interpretation = parseAIResponse(text, labReport);
    return interpretation;
  } catch (error) {
    console.error("Error generating AI interpretation:", error);
    
    if (error.message.includes("quota")) {
      throw new Error("AI service quota exceeded. Please try again later.");
    } else if (error.message.includes("API key")) {
      throw new Error("AI service authentication failed. Please check configuration.");
    } else {
      throw new Error("Failed to generate AI interpretation. Please try again.");
    }
  }
}

/**
 * Builds a detailed prompt for Gemini AI
 */
function buildInterpretationPrompt(labReport) {
  const { results, testType, testName } = labReport;
  
  // Format parameters for the prompt
  const parametersText = results.parameters.map(p => 
    `- ${p.name}: ${p.value} ${p.unit} (Normal: ${p.normalRange}, Status: ${p.status})`
  ).join('\n');

  const prompt = `You are a medical report interpreter helping patients understand their lab results. 
Your role is to explain complex medical terminology in simple, empathetic language.

TEST INFORMATION:
Test Name: ${testName}
Test Type: ${testType}

RESULTS:
${parametersText}

${results.summary ? `Technician's Summary: ${results.summary}` : ''}
${results.remarks ? `Technician's Remarks: ${results.remarks}` : ''}

Please provide a patient-friendly interpretation with the following structure:

1. EXECUTIVE SUMMARY (2-3 sentences):
   - Overall health status based on these results
   - Highlight any critical findings requiring immediate attention
   - Provide reassuring context for normal results

2. PARAMETERS EXPLAINED (for each parameter):
   - What this parameter measures in simple terms
   - What the patient's value means for their health
   - Why it might be high/low if abnormal
   - Use analogies and everyday language

3. RECOMMENDATIONS (prioritized):
   - URGENT: If any critical values need immediate medical attention
   - IMPORTANT: Lifestyle changes, dietary modifications, or follow-up actions
   - GENERAL: Overall wellness advice
   - Be specific and actionable

4. QUESTIONS FOR DOCTOR (3-5 questions):
   - Specific questions the patient should ask their doctor
   - Based on the actual results
   - Help prepare for medical consultation

IMPORTANT GUIDELINES:
- Use simple, non-technical language
- Be empathetic and reassuring where appropriate
- Be honest about concerning findings
- Avoid medical jargon; if you must use it, explain it
- Focus on actionable advice
- Remember this is educational, not diagnostic

Format your response as JSON with this structure:
{
  "executiveSummary": "string",
  "parametersExplained": [
    {
      "parameter": "parameter name",
      "whatItMeans": "simple explanation",
      "interpretation": "what this result means for the patient"
    }
  ],
  "recommendations": [
    {
      "priority": "URGENT|IMPORTANT|GENERAL",
      "title": "recommendation title",
      "description": "detailed recommendation"
    }
  ],
  "questionsForDoctor": ["question 1", "question 2", ...]
}`;

  return prompt;
}

/**
 * Parses AI response and structures it
 */
function parseAIResponse(aiText, labReport) {
  try {
    // Try to extract JSON from the response
    const jsonMatch = aiText.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      
      // Enhance with icons and additional formatting
      const interpretation = {
        executiveSummary: parsed.executiveSummary,
        parametersExplained: enhanceParameters(parsed.parametersExplained, labReport.results.parameters),
        recommendations: enhanceRecommendations(parsed.recommendations),
        questionsForDoctor: parsed.questionsForDoctor || [],
        technicalSummary: labReport.results.summary,
        technicalRemarks: labReport.results.remarks,
        disclaimer: "This summary is generated by AI for educational purposes only. Please consult your physician before making any medical decisions."
      };
      
      return interpretation;
    } else {
      // Fallback: parse text format
      return parseTextResponse(aiText, labReport);
    }
  } catch (error) {
    console.error("Error parsing AI response:", error);
    // Return a basic interpretation if parsing fails
    return createFallbackInterpretation(labReport);
  }
}

/**
 * Enhances parameters with icons and status info
 */
function enhanceParameters(aiParameters, originalParameters) {
  return aiParameters.map((aiParam, index) => {
    const original = originalParameters.find(p => 
      p.name.toLowerCase() === aiParam.parameter.toLowerCase()
    ) || originalParameters[index];

    let icon = "📊";
    switch (original?.status) {
      case "Normal": icon = "✓"; break;
      case "High": icon = "↑"; break;
      case "Low": icon = "↓"; break;
      case "Critical": icon = "⚠️"; break;
    }

    return {
      parameter: aiParam.parameter,
      value: original ? `${original.value} ${original.unit}` : "",
      normalRange: original?.normalRange || "",
      status: original?.status || "Unknown",
      icon: icon,
      whatItMeans: aiParam.whatItMeans,
      interpretation: aiParam.interpretation
    };
  });
}

/**
 * Enhances recommendations with icons
 */
function enhanceRecommendations(recommendations) {
  return recommendations.map(rec => {
    let icon = "💡";
    switch (rec.priority) {
      case "URGENT": icon = "⚠️"; break;
      case "IMPORTANT": icon = "📋"; break;
      case "GENERAL": icon = "💪"; break;
    }

    return {
      priority: rec.priority,
      icon: icon,
      title: rec.title,
      description: rec.description
    };
  });
}

/**
 * Parses text-based AI response (fallback)
 */
function parseTextResponse(text, labReport) {
  // Simple text parsing logic
  const sections = {
    executiveSummary: "",
    parametersExplained: [],
    recommendations: [],
    questionsForDoctor: []
  };

  // Extract sections using markers
  const summaryMatch = text.match(/EXECUTIVE SUMMARY[:\s]+(.*?)(?=PARAMETERS|$)/is);
  if (summaryMatch) {
    sections.executiveSummary = summaryMatch[1].trim();
  }

  // Add basic parameter explanations
  labReport.results.parameters.forEach(param => {
    sections.parametersExplained.push({
      parameter: param.name,
      value: `${param.value} ${param.unit}`,
      normalRange: param.normalRange,
      status: param.status,
      icon: param.status === "Normal" ? "✓" : param.status === "High" ? "↑" : "↓",
      whatItMeans: `${param.name} is a health parameter measured in your ${labReport.testType} test.`,
      interpretation: `Your result is ${param.status.toLowerCase()}.`
    });
  });

  return {
    ...sections,
    technicalSummary: labReport.results.summary,
    technicalRemarks: labReport.results.remarks,
    disclaimer: "This summary is generated by AI for educational purposes only. Please consult your physician before making any medical decisions."
  };
}

/**
 * Creates fallback interpretation if AI fails
 */
function createFallbackInterpretation(labReport) {
  const { results, testType } = labReport;
  
  const normalCount = results.parameters.filter(p => p.status === "Normal").length;
  const abnormalCount = results.parameters.length - normalCount;

  return {
    executiveSummary: `Your ${testType} test has been completed. ${normalCount} parameter(s) are within normal range${abnormalCount > 0 ? ` and ${abnormalCount} parameter(s) may need attention` : ''}. Please review the results with your healthcare provider.`,
    parametersExplained: results.parameters.map(param => ({
      parameter: param.name,
      value: `${param.value} ${param.unit}`,
      normalRange: param.normalRange,
      status: param.status,
      icon: param.status === "Normal" ? "✓" : param.status === "High" ? "↑" : param.status === "Low" ? "↓" : "⚠️",
      whatItMeans: `${param.name} is measured in your ${testType} test.`,
      interpretation: `Your result is ${param.status.toLowerCase()}.`
    })),
    recommendations: [
      {
        priority: "IMPORTANT",
        icon: "📋",
        title: "Consult Your Healthcare Provider",
        description: "Please discuss these results with your doctor to understand what they mean for your health and what steps to take next."
      }
    ],
    questionsForDoctor: [
      "What do these results mean for my overall health?",
      "Do I need any follow-up tests?",
      "Are there any lifestyle changes I should make?"
    ],
    technicalSummary: results.summary,
    technicalRemarks: results.remarks,
    disclaimer: "This summary is generated by AI for educational purposes only. Please consult your physician before making any medical decisions."
  };
}

module.exports = {
  generateAIInterpretation,
  initializeGemini
};
