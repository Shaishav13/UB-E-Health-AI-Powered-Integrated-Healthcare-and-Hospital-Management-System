import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './DoctorReportAI.css';

const DoctorReportAI = ({ reportId, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [interpretation, setInterpretation] = useState(null);
  const [showConsent, setShowConsent] = useState(true);
  const [aiPowered, setAiPowered] = useState(false);

  const fetchInterpretation = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.post(
        `http://127.0.0.1:3001/reports/${reportId}/interpret-doctor-report`
      );

      setInterpretation(response.data.interpretation);
      setAiPowered(response.data.interpretation.aiPowered);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching interpretation:', err);
      setError('Failed to generate interpretation. Please try again.');
      setLoading(false);
    }
  };

  const handleConsent = () => {
    setShowConsent(false);
    fetchInterpretation();
  };

  if (showConsent) {
    return (
      <div className="doctor-ai-modal-overlay" onClick={onClose}>
        <div className="doctor-ai-modal-content" onClick={(e) => e.stopPropagation()}>
          <button className="doctor-ai-close-btn" onClick={onClose}>×</button>
          
          <div className="doctor-ai-consent-screen">
            <div className="doctor-ai-consent-icon">🩺</div>
            <h2>AI Report Simplification</h2>
            <p className="doctor-ai-consent-subtitle">
              Understand your doctor's report in simple language
            </p>

            <div className="doctor-ai-consent-info">
              <h3>What You'll Get:</h3>
              <ul>
                <li>✓ Simple explanation of your diagnosis</li>
                <li>✓ Understanding of your vital signs</li>
                <li>✓ Medication purposes explained</li>
                <li>✓ Lifestyle precautions and recommendations</li>
                <li>✓ Questions to ask your doctor</li>
              </ul>
            </div>

            <div className="doctor-ai-disclaimer">
              <strong>⚠️ Important Medical Disclaimer:</strong>
              <p>
                This AI interpretation is for educational purposes only and does not replace 
                professional medical advice. Always follow your doctor's instructions and 
                consult them for any health concerns or questions about your treatment.
              </p>
            </div>

            <div className="doctor-ai-consent-actions">
              <button className="doctor-ai-btn-proceed" onClick={handleConsent}>
                I Understand, Proceed
              </button>
              <button className="doctor-ai-btn-cancel" onClick={onClose}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="doctor-ai-modal-overlay" onClick={onClose}>
      <div className="doctor-ai-modal-content doctor-ai-interpretation-view" onClick={(e) => e.stopPropagation()}>
        <button className="doctor-ai-close-btn" onClick={onClose}>×</button>

        {loading && (
          <div className="doctor-ai-loading">
            <div className="doctor-ai-spinner"></div>
            <p>Generating your personalized interpretation...</p>
          </div>
        )}

        {error && (
          <div className="doctor-ai-error">
            <p>{error}</p>
            <button onClick={fetchInterpretation}>Try Again</button>
          </div>
        )}

        {interpretation && !loading && (
          <div className="doctor-ai-interpretation">
            <div className="doctor-ai-header">
              <h2>📋 Your Report Simplified</h2>
              <span className={`doctor-ai-badge ${aiPowered ? 'ai-powered' : 'rule-based'}`}>
                {aiPowered ? '🤖 AI-Powered' : '📋 Rule-Based'}
              </span>
            </div>

            {/* Summary */}
            <div className="doctor-ai-section doctor-ai-summary">
              <h3>📝 Summary</h3>
              <p>{interpretation.summary}</p>
            </div>

            {/* Diagnosis Explained */}
            {interpretation.diagnosisExplained && (
              <div className="doctor-ai-section doctor-ai-diagnosis">
                <h3>🔍 Your Diagnosis Explained</h3>
                <div className="doctor-ai-diagnosis-card">
                  <h4>{interpretation.diagnosisExplained.condition}</h4>
                  <div className="doctor-ai-diagnosis-detail">
                    <strong>What it means:</strong>
                    <p>{interpretation.diagnosisExplained.whatItMeans}</p>
                  </div>
                  <div className="doctor-ai-diagnosis-detail">
                    <strong>Why it matters:</strong>
                    <p>{interpretation.diagnosisExplained.whyItMatters}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Vital Signs */}
            {interpretation.vitalSigns && (
              <div className="doctor-ai-section doctor-ai-vitals">
                <h3>💓 Your Vital Signs</h3>
                <div className="doctor-ai-vitals-grid">
                  {Object.entries(interpretation.vitalSigns).map(([key, vital]) => (
                    <div key={key} className={`doctor-ai-vital-card status-${vital.status.toLowerCase()}`}>
                      <div className="doctor-ai-vital-header">
                        <span className="doctor-ai-vital-name">
                          {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                        </span>
                        <span className={`doctor-ai-vital-status status-${vital.status.toLowerCase()}`}>
                          {vital.status === 'Normal' ? '✓' : vital.status === 'High' ? '↑' : '↓'}
                        </span>
                      </div>
                      <div className="doctor-ai-vital-value">{vital.value}</div>
                      <div className="doctor-ai-vital-meaning">{vital.meaning}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Medications */}
            {interpretation.medications && interpretation.medications.length > 0 && (
              <div className="doctor-ai-section doctor-ai-medications">
                <h3>💊 Your Medications Explained</h3>
                {interpretation.medications.map((med, index) => (
                  <div key={index} className="doctor-ai-medication-card">
                    <h4>{med.name}</h4>
                    <p><strong>Purpose:</strong> {med.purpose}</p>
                    <p><strong>How to take:</strong> {med.howToTake}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Precautions */}
            {interpretation.precautions && interpretation.precautions.length > 0 && (
              <div className="doctor-ai-section doctor-ai-precautions">
                <h3>⚠️ Important Precautions</h3>
                {interpretation.precautions.map((precaution, index) => (
                  <div key={index} className={`doctor-ai-precaution-card priority-${precaution.priority.toLowerCase()}`}>
                    <div className="doctor-ai-precaution-header">
                      <span className="doctor-ai-precaution-icon">{precaution.icon}</span>
                      <span className="doctor-ai-precaution-title">{precaution.title}</span>
                      <span className={`doctor-ai-priority-badge priority-${precaution.priority.toLowerCase()}`}>
                        {precaution.priority}
                      </span>
                    </div>
                    <p>{precaution.description}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Questions for Doctor */}
            {interpretation.questionsForDoctor && interpretation.questionsForDoctor.length > 0 && (
              <div className="doctor-ai-section doctor-ai-questions">
                <h3>❓ Questions to Ask Your Doctor</h3>
                <ul>
                  {interpretation.questionsForDoctor.map((question, index) => (
                    <li key={index}>{question}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Disclaimer */}
            <div className="doctor-ai-footer-disclaimer">
              <p>{interpretation.disclaimer}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorReportAI;
