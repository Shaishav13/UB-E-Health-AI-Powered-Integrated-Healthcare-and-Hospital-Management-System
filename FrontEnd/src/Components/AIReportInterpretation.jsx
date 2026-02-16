/*
 * UB E-Health - AI Report Interpretation Component
 * Copyright (c) 2025-2026 Shaishav
 * Licensed under MIT License
 */

import React, { useState } from 'react';
import axios from 'axios';
import './AIReportInterpretation.css';

const AIReportInterpretation = ({ reportId, onClose }) => {
  const [interpretation, setInterpretation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [consented, setConsented] = useState(false);

  const generateInterpretation = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        `http://localhost:3001/lab-reports/${reportId}/interpret`
      );

      setInterpretation(response.data.interpretation);
      setConsented(true);
    } catch (err) {
      setError(
        err.response?.data?.message || 
        'Failed to generate interpretation. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = () => {
    // This will be implemented to generate PDF with interpretation
    alert('PDF download feature coming soon!');
  };

  if (!consented) {
    return (
      <div className="ai-interpretation-modal">
        <div className="ai-interpretation-content consent-screen">
          <button className="close-btn" onClick={onClose}>×</button>
          
          <div className="consent-header">
            <span className="ai-icon">✨</span>
            <h2>AI Report Explanation</h2>
          </div>

          <div className="consent-body">
            <p className="consent-intro">
              Our AI assistant can help you understand your lab results by:
            </p>
            
            <ul className="consent-features">
              <li>📝 Translating medical terms into simple language</li>
              <li>📊 Highlighting what's normal and what needs attention</li>
              <li>💡 Providing lifestyle recommendations</li>
              <li>❓ Suggesting questions to ask your doctor</li>
            </ul>

            <div className="consent-disclaimer">
              <strong>Important:</strong> This AI summary is for educational purposes only 
              and does not replace professional medical advice. Always consult your physician 
              before making any medical decisions.
            </div>

            <div className="consent-actions">
              <button 
                className="btn-secondary" 
                onClick={onClose}
              >
                Cancel
              </button>
              <button 
                className="btn-primary" 
                onClick={generateInterpretation}
                disabled={loading}
              >
                {loading ? 'Generating...' : '✨ Explain My Report'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ai-interpretation-modal">
        <div className="ai-interpretation-content">
          <button className="close-btn" onClick={onClose}>×</button>
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            <h3>Unable to Generate Interpretation</h3>
            <p>{error}</p>
            <button className="btn-primary" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    );
  }

  if (!interpretation) {
    return null;
  }

  return (
    <div className="ai-interpretation-modal">
      <div className="ai-interpretation-content interpretation-view">
        <button className="close-btn" onClick={onClose}>×</button>
        
        <div className="interpretation-header">
          <span className="ai-badge">✨ AI Explained</span>
          <h2>Your Lab Report Explained</h2>
          <button className="btn-download" onClick={downloadPDF}>
            📄 Download PDF
          </button>
        </div>

        {/* Section 1: Executive Summary */}
        <section className="interpretation-section executive-summary">
          <h3>📋 Executive Summary</h3>
          <p className="summary-text">{interpretation.executiveSummary}</p>
        </section>

        {/* Section 2: Results Explained */}
        <section className="interpretation-section results-explained">
          <h3>🔬 Your Results Explained</h3>
          <div className="parameters-list">
            {interpretation.parametersExplained.map((param, index) => (
              <div key={index} className={`parameter-card status-${param.status.toLowerCase()}`}>
                <div className="parameter-header">
                  <span className="parameter-icon">{param.icon}</span>
                  <h4>{param.parameter}</h4>
                  <span className={`status-badge ${param.status.toLowerCase()}`}>
                    {param.status}
                  </span>
                </div>
                
                <div className="parameter-values">
                  <div className="value-item">
                    <span className="label">Your Value:</span>
                    <span className="value">{param.value}</span>
                  </div>
                  <div className="value-item">
                    <span className="label">Normal Range:</span>
                    <span className="value">{param.normalRange}</span>
                  </div>
                </div>

                <div className="parameter-explanation">
                  <p className="what-it-means">
                    <strong>What it means:</strong> {param.whatItMeans}
                  </p>
                  <p className="interpretation">
                    <strong>Your result:</strong> {param.interpretation}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 3: Recommendations */}
        <section className="interpretation-section recommendations">
          <h3>💡 Suggested Next Steps & Precautions</h3>
          <div className="recommendations-list">
            {interpretation.recommendations.map((rec, index) => (
              <div key={index} className={`recommendation-card priority-${rec.priority.toLowerCase()}`}>
                <div className="recommendation-header">
                  <span className="rec-icon">{rec.icon}</span>
                  <div>
                    <span className="priority-badge">{rec.priority}</span>
                    <h4>{rec.title}</h4>
                  </div>
                </div>
                <p>{rec.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Section 4: Questions for Doctor */}
        <section className="interpretation-section doctor-questions">
          <h3>❓ Questions for Your Doctor</h3>
          <p className="section-intro">
            Here are some important questions to discuss during your next appointment:
          </p>
          <ol className="questions-list">
            {interpretation.questionsForDoctor.map((question, index) => (
              <li key={index}>{question}</li>
            ))}
          </ol>
        </section>

        {/* Technical Summary (if available) */}
        {interpretation.technicalSummary && (
          <section className="interpretation-section technical-summary">
            <h3>🔬 Technician's Summary</h3>
            <p>{interpretation.technicalSummary}</p>
            {interpretation.technicalRemarks && (
              <p className="remarks"><strong>Remarks:</strong> {interpretation.technicalRemarks}</p>
            )}
          </section>
        )}

        {/* Disclaimer */}
        <div className="interpretation-disclaimer">
          <strong>⚠️ Medical Disclaimer:</strong> {interpretation.disclaimer}
        </div>

        <div className="interpretation-actions">
          <button className="btn-secondary" onClick={onClose}>Close</button>
          <button className="btn-primary" onClick={downloadPDF}>
            📄 Download as PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIReportInterpretation;
