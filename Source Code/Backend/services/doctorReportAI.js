/*
 * UB E-Health - Doctor Report AI Interpreter
 * Simplifies doctor-generated reports for patients
 * Copyright (c) 2025-2026 Shaishav
 * Licensed under MIT License
 */

const { GoogleGenerativeAI } = require("@google/generative-ai");
const { isOllamaAvailable, generateWithOllama } = require("./ollamaService");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

let genAI = null;
let model = null;

/**
 * Initialize Gemini AI
 */
async function initializeGeminiAI() {
  const apiKey = GEMINI_API_KEY;
  
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    console.warn("⚠️ GEMINI_API_KEY not found - will use rule-based interpretation");
    return false;
  }

  try {
    genAI = new GoogleGenerativeAI(apiKey);
    model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    console.log("✅ Gemini AI initialized for doctor reports");
    return true;
  } catch (error) {
    console.error("❌ Failed to initialize Gemini AI:", error.message);
    return false;
  }
}

/**
 * Generate AI interpretation for doctor report
 */
async function interpretDoctorReport(report) {
  // Try Gemini AI first
  if (GEMINI_API_KEY && GEMINI_API_KEY !== 'your_gemini_api_key_here') {
    try {
      const aiInterpretation = await generateWithGemini(report);
      return { ...aiInterpretation, aiPowered: true };
    } catch (error) {
      console.warn("Gemini AI failed, trying Ollama:", error.message);
    }
  }

  // Try Ollama as offline fallback
  const ollamaUp = await isOllamaAvailable();
  if (ollamaUp) {
    try {
      const aiInterpretation = await generateWithOllamaLocal(report);
      return { ...aiInterpretation, aiPowered: true };
    } catch (error) {
      console.warn("Ollama failed, using rule-based:", error.message);
    }
  }

  // Final fallback: rule-based interpretation
  const ruleBasedInterpretation = generateRuleBasedInterpretation(report);
  return { ...ruleBasedInterpretation, aiPowered: false };
}

/**
 * Generate interpretation using Ollama (local/offline)
 */
async function generateWithOllamaLocal(report) {
  const prompt = buildDoctorReportPrompt(report);
  const text = await generateWithOllama(prompt, { maxTokens: 1024 });
  console.log("✅ Doctor report interpreted via Ollama (offline)");

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }
  throw new Error("Failed to parse Ollama response as JSON");
}

/**
 * Build the shared prompt for doctor report interpretation
 */
function buildDoctorReportPrompt(report) {
  return `You are a compassionate medical interpreter helping patients understand their doctor's report. Your goal is to simplify medical terminology and provide actionable guidance.

DOCTOR'S REPORT:
- Patient Name: ${report.patientid?.name || 'Patient'}
- Date: ${new Date(report.date).toLocaleDateString()}
- Diagnosis: ${report.disease || 'Not specified'}
- Temperature: ${report.temperature || 'Not recorded'}°F
- Weight: ${report.weight || 'Not recorded'} kg
- Blood Pressure: ${report.bp || 'Not recorded'} mmHg
- Glucose Level: ${report.glucose || 'Not recorded'} mg/dL
- Doctor's Notes: ${report.info || 'None'}
- Prescribed Medications: ${report.medications || 'None'}
- Suggested Lab Tests: ${report.labTests || 'None'}

INSTRUCTIONS:
1. Provide a clear, patient-friendly summary
2. Explain the diagnosis in simple terms
3. Interpret vital signs (temperature, BP, glucose)
4. Explain why medications were prescribed
5. Provide lifestyle precautions and recommendations
6. Suggest questions to ask the doctor

OUTPUT FORMAT (JSON):
{
  "summary": "2-3 sentence overview in simple language",
  "diagnosisExplained": {
    "condition": "Name of the condition",
    "whatItMeans": "Simple explanation of what this condition is",
    "whyItMatters": "Why this needs attention"
  },
  "vitalSigns": {
    "temperature": {"value": "X°F", "status": "Normal/High/Low", "meaning": "What this means"},
    "bloodPressure": {"value": "X/Y", "status": "Normal/High/Low", "meaning": "What this means"},
    "glucose": {"value": "X mg/dL", "status": "Normal/High/Low", "meaning": "What this means"},
    "weight": {"value": "X kg", "status": "Normal/High/Low", "meaning": "What this means"}
  },
  "medications": [
    {"name": "Medication name", "purpose": "Why you're taking this", "howToTake": "Instructions in simple terms"}
  ],
  "precautions": [
    {"category": "Diet/Exercise/Lifestyle/Medication", "icon": "🍎/💪/🏃/💊", "title": "Short title", "description": "Detailed advice", "priority": "HIGH/MEDIUM/LOW"}
  ],
  "questionsForDoctor": ["Question 1?", "Question 2?", "Question 3?"],
  "disclaimer": "This is an AI-generated interpretation for educational purposes only. Always follow your doctor's advice and consult them for any concerns."
}

IMPORTANT: Respond ONLY with valid JSON. No extra text before or after the JSON.`;
}

/**
 * Generate interpretation using Gemini AI
 */
async function generateWithGemini(report) {
  if (!model) {
    await initializeGeminiAI();
  }

  const prompt = buildDoctorReportPrompt(report);
  const result = await model.generateContent(prompt);
  const text = result.response.text();

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }
  throw new Error("Failed to parse AI response");
}


/**
 * Generate rule-based interpretation (fallback)
 */
function generateRuleBasedInterpretation(report) {
  // Analyze vital signs
  const vitalSigns = analyzeVitalSigns(report);
  
  // Generate diagnosis explanation
  const diagnosisExplained = explainDiagnosis(report.disease);
  
  // Parse medications
  const medications = parseMedications(report.medications);
  
  // Generate precautions
  const precautions = generatePrecautions(report, vitalSigns);
  
  // Generate summary
  const summary = generateSummary(report, vitalSigns);
  
  // Generate questions
  const questionsForDoctor = generateQuestions(report);

  return {
    summary,
    diagnosisExplained,
    vitalSigns,
    medications,
    precautions,
    questionsForDoctor,
    disclaimer: "This is an automated interpretation for educational purposes only. Always follow your doctor's advice and consult them for any concerns."
  };
}

/**
 * Analyze vital signs
 */
function analyzeVitalSigns(report) {
  const vitals = {};

  // Temperature
  const temp = parseFloat(report.temperature) || 98.6;
  const tempValue = report.temperature || 'Not recorded';
  vitals.temperature = {
    value: tempValue === 'Not recorded' ? tempValue : `${temp}°F`,
    status: tempValue === 'Not recorded' ? 'Not recorded' : (temp < 97 ? 'Low' : temp > 99.5 ? 'High' : 'Normal'),
    meaning: tempValue === 'Not recorded' ? 'Temperature was not recorded during this visit.' :
             (temp < 97 ? 'Your body temperature is below normal, which might indicate hypothermia or other conditions.' :
             temp > 99.5 ? 'You have a fever, which usually means your body is fighting an infection.' :
             'Your body temperature is in the healthy range.')
  };

  // Blood Pressure
  const bp = report.bp || 'Not recorded';
  if (bp === 'Not recorded' || !bp.includes('/')) {
    vitals.bloodPressure = {
      value: bp,
      status: 'Not recorded',
      meaning: 'Blood pressure was not recorded during this visit.'
    };
  } else {
    const [systolic, diastolic] = bp.split('/').map(v => parseInt(v));
    vitals.bloodPressure = {
      value: bp,
      status: systolic >= 140 || diastolic >= 90 ? 'High' :
              systolic < 90 || diastolic < 60 ? 'Low' : 'Normal',
      meaning: systolic >= 140 || diastolic >= 90 ? 'Your blood pressure is elevated, which can strain your heart and blood vessels over time.' :
               systolic < 90 || diastolic < 60 ? 'Your blood pressure is lower than normal, which might cause dizziness or fatigue.' :
               'Your blood pressure is in the healthy range.'
    };
  }

  // Glucose
  const glucose = parseFloat(report.glucose) || 0;
  const glucoseValue = report.glucose || 'Not recorded';
  vitals.glucose = {
    value: glucoseValue === 'Not recorded' ? glucoseValue : `${glucose} mg/dL`,
    status: glucoseValue === 'Not recorded' ? 'Not recorded' : (glucose > 100 ? 'High' : glucose < 70 ? 'Low' : 'Normal'),
    meaning: glucoseValue === 'Not recorded' ? 'Blood sugar was not recorded during this visit.' :
             (glucose > 100 ? 'Your blood sugar is elevated, which might indicate prediabetes or diabetes if consistently high.' :
             glucose < 70 ? 'Your blood sugar is low, which can cause weakness, shakiness, or confusion.' :
             'Your blood sugar level is in the healthy range.')
  };

  // Weight
  const weightValue = report.weight || 'Not recorded';
  vitals.weight = {
    value: weightValue === 'Not recorded' ? weightValue : `${weightValue} kg`,
    status: weightValue === 'Not recorded' ? 'Not recorded' : 'Normal',
    meaning: weightValue === 'Not recorded' ? 'Weight was not recorded during this visit.' : 'Your weight has been recorded for monitoring purposes.'
  };

  return vitals;
}

/**
 * Explain diagnosis in simple terms
 */
function explainDiagnosis(disease) {
  if (!disease || disease === 'Not specified') {
    return {
      condition: 'General Health Assessment',
      whatItMeans: 'Your doctor has conducted a general health assessment.',
      whyItMatters: 'Regular health check-ups help monitor your overall well-being and catch potential issues early.'
    };
  }

  const commonConditions = {
    'Fever': {
      condition: 'Fever',
      whatItMeans: 'Your body temperature is higher than normal, usually above 100.4°F (38°C).',
      whyItMatters: 'Fever is your body\'s way of fighting infections. While uncomfortable, it\'s actually a sign your immune system is working.'
    },
    'Hypertension': {
      condition: 'High Blood Pressure (Hypertension)',
      whatItMeans: 'The force of blood against your artery walls is consistently too high.',
      whyItMatters: 'Over time, high blood pressure can damage your heart, blood vessels, and other organs if not managed properly.'
    },
    'Diabetes': {
      condition: 'Diabetes',
      whatItMeans: 'Your body has trouble regulating blood sugar levels.',
      whyItMatters: 'Uncontrolled blood sugar can damage nerves, blood vessels, eyes, kidneys, and other organs over time.'
    },
    'Common Cold': {
      condition: 'Common Cold',
      whatItMeans: 'A viral infection affecting your nose and throat.',
      whyItMatters: 'While uncomfortable, colds usually resolve on their own within 7-10 days with rest and fluids.'
    }
  };

  return commonConditions[disease] || {
    condition: disease,
    whatItMeans: 'This is the medical condition your doctor has diagnosed.',
    whyItMatters: 'Your doctor will provide specific guidance on managing this condition.'
  };
}

/**
 * Parse medications
 */
function parseMedications(medicationsText) {
  if (!medicationsText || medicationsText === 'None') {
    return [];
  }

  // Simple parsing - split by newlines or commas
  const medLines = medicationsText.split(/\n|,/).filter(line => line.trim());
  
  return medLines.map(med => ({
    name: med.trim(),
    purpose: 'As prescribed by your doctor',
    howToTake: 'Follow the dosage instructions provided by your doctor or pharmacist'
  }));
}

/**
 * Generate precautions
 */
function generatePrecautions(report, vitalSigns) {
  const precautions = [];

  // Temperature-based precautions
  if (vitalSigns.temperature.status === 'High') {
    precautions.push({
      category: 'Lifestyle',
      icon: '🌡️',
      title: 'Manage Your Fever',
      description: 'Rest, stay hydrated, and take fever-reducing medication as prescribed. Monitor your temperature regularly.',
      priority: 'HIGH'
    });
  }

  // BP-based precautions
  if (vitalSigns.bloodPressure.status === 'High') {
    precautions.push({
      category: 'Diet',
      icon: '🍎',
      title: 'Reduce Salt Intake',
      description: 'Limit sodium to less than 2,300mg per day. Avoid processed foods, canned soups, and salty snacks.',
      priority: 'HIGH'
    });
    precautions.push({
      category: 'Exercise',
      icon: '💪',
      title: 'Regular Physical Activity',
      description: 'Aim for 30 minutes of moderate exercise most days. Walking, swimming, or cycling can help lower blood pressure.',
      priority: 'MEDIUM'
    });
  }

  // Glucose-based precautions
  if (vitalSigns.glucose.status === 'High') {
    precautions.push({
      category: 'Diet',
      icon: '🍽️',
      title: 'Monitor Carbohydrate Intake',
      description: 'Choose complex carbs over simple sugars. Include more vegetables, whole grains, and lean proteins in your diet.',
      priority: 'HIGH'
    });
  }

  // General precautions
  precautions.push({
    category: 'Medication',
    icon: '💊',
    title: 'Take Medications as Prescribed',
    description: 'Follow your doctor\'s instructions exactly. Don\'t skip doses or stop taking medication without consulting your doctor.',
    priority: 'HIGH'
  });

  precautions.push({
    category: 'Lifestyle',
    icon: '😴',
    title: 'Get Adequate Rest',
    description: 'Aim for 7-9 hours of quality sleep each night. Good sleep helps your body heal and maintain healthy vital signs.',
    priority: 'MEDIUM'
  });

  return precautions;
}

/**
 * Generate summary
 */
function generateSummary(report, vitalSigns) {
  const concerns = [];
  
  if (vitalSigns.temperature.status !== 'Normal') concerns.push('temperature');
  if (vitalSigns.bloodPressure.status !== 'Normal') concerns.push('blood pressure');
  if (vitalSigns.glucose.status !== 'Normal') concerns.push('glucose');

  if (concerns.length === 0) {
    return `Your doctor has diagnosed you with ${report.disease}. Your vital signs are generally within normal ranges. Follow your doctor's treatment plan and take prescribed medications as directed.`;
  } else {
    return `Your doctor has diagnosed you with ${report.disease}. Your ${concerns.join(', ')} ${concerns.length > 1 ? 'need' : 'needs'} attention. Follow your treatment plan carefully and monitor these values regularly.`;
  }
}

/**
 * Generate questions for doctor
 */
function generateQuestions(report) {
  return [
    `What caused my ${report.disease}, and how can I prevent it from getting worse?`,
    'How long will it take for me to feel better with this treatment?',
    'Are there any side effects I should watch out for with my medications?',
    'What warning signs should prompt me to contact you immediately?',
    'Do I need any follow-up tests or appointments?'
  ];
}

module.exports = {
  interpretDoctorReport,
  initializeGeminiAI
};
