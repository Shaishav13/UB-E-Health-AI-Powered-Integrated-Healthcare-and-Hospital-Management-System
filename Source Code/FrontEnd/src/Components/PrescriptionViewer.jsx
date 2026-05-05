import { useState } from 'react';
import { FaQrcode, FaPills, FaClock, FaExclamationTriangle, FaRedo, FaTimes } from 'react-icons/fa';
import './PrescriptionViewer.css';

const PrescriptionViewer = ({ prescription, onRefillRequest, onClose, interactions }) => {
  const [showQR, setShowQR] = useState(false);
  const [refillRequesting, setRefillRequesting] = useState(false);

  const handleRefillRequest = async (medIndex) => {
    setRefillRequesting(true);
    await onRefillRequest(prescription.id, medIndex);
    setRefillRequesting(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'completed': return '#6b7280';
      case 'cancelled': return '#ef4444';
      case 'expired': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  return (
    <div className="prescription-modal-overlay" onClick={onClose}>
      <div className="prescription-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="prescription-close-btn" onClick={onClose}>
          <FaTimes />
        </button>

        {/* Header */}
        <div className="prescription-header">
          <div>
            <h2>💊 Prescription Details</h2>
            <p className="prescription-number">#{prescription.prescriptionNumber || prescription.id}</p>
          </div>
          <span 
            className="prescription-status-badge"
            style={{ background: getStatusColor(prescription.status) }}
          >
            {prescription.status || 'active'}
          </span>
        </div>

        {/* Doctor & Date Info */}
        <div className="prescription-info-grid">
          <div className="prescription-info-item">
            <span className="info-label">Doctor</span>
            <span className="info-value">{prescription.doctor?.name || 'N/A'}</span>
          </div>
          <div className="prescription-info-item">
            <span className="info-label">Issue Date</span>
            <span className="info-value">{prescription.date || 'N/A'}</span>
          </div>
          <div className="prescription-info-item">
            <span className="info-label">Diagnosis</span>
            <span className="info-value">{prescription.disease || prescription.diagnosis || 'N/A'}</span>
          </div>
        </div>

        {/* Drug Interactions Warning */}
        {interactions && interactions.length > 0 && (
          <div className="interactions-warning">
            <div className="warning-header">
              <FaExclamationTriangle /> Drug Interaction Warnings
            </div>
            {interactions.map((interaction, idx) => (
              <div key={idx} className="interaction-item">
                <div className="interaction-meds">
                  {interaction.medication1} ⚠️ {interaction.medication2}
                </div>
                <div className="interaction-warning">{interaction.warning}</div>
                <div className="interaction-recommendation">{interaction.recommendation}</div>
              </div>
            ))}
          </div>
        )}

        {/* Medications List */}
        <div className="prescription-medications">
          <h3><FaPills /> Medications</h3>
          {prescription.medications && prescription.medications.length > 0 ? (
            prescription.medications.map((med, index) => (
              <div key={index} className="medication-card">
                <div className="medication-header">
                  <h4>{med.name}</h4>
                  {med.refillsRemaining > 0 && (
                    <span className="refill-badge">{med.refillsRemaining} refills left</span>
                  )}
                </div>
                <div className="medication-details">
                  <div className="med-detail">
                    <span className="med-label">Dosage:</span>
                    <span className="med-value">{med.dosage}</span>
                  </div>
                  <div className="med-detail">
                    <span className="med-label">Frequency:</span>
                    <span className="med-value">{med.frequency}</span>
                  </div>
                  <div className="med-detail">
                    <span className="med-label">Duration:</span>
                    <span className="med-value">{med.duration}</span>
                  </div>
                  {med.instructions && (
                    <div className="med-detail full-width">
                      <span className="med-label">Instructions:</span>
                      <span className="med-value">{med.instructions}</span>
                    </div>
                  )}
                </div>
                {med.refillsRemaining > 0 && !med.refillRequested && (
                  <button
                    className="refill-request-btn"
                    onClick={() => handleRefillRequest(index)}
                    disabled={refillRequesting}
                  >
                    <FaRedo /> Request Refill
                  </button>
                )}
                {med.refillRequested && (
                  <div className="refill-requested">
                    <FaClock /> Refill requested - waiting for approval
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="medication-card">
              <div className="medication-header">
                <h4>{prescription.name}</h4>
              </div>
              <div className="medication-details">
                <div className="med-detail">
                  <span className="med-label">Dosage:</span>
                  <span className="med-value">{prescription.dosage}</span>
                </div>
                <div className="med-detail">
                  <span className="med-label">Frequency:</span>
                  <span className="med-value">{prescription.frequency}</span>
                </div>
                <div className="med-detail">
                  <span className="med-label">Duration:</span>
                  <span className="med-value">{prescription.duration}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* QR Code Section */}
        {prescription.qrCode && (
          <div className="qr-section">
            <button 
              className="qr-toggle-btn"
              onClick={() => setShowQR(!showQR)}
            >
              <FaQrcode /> {showQR ? 'Hide' : 'Show'} QR Code
            </button>
            {showQR && (
              <div className="qr-display">
                <img src={prescription.qrCode} alt="Prescription QR Code" />
                <p className="qr-info">Show this QR code at the pharmacy</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PrescriptionViewer;
