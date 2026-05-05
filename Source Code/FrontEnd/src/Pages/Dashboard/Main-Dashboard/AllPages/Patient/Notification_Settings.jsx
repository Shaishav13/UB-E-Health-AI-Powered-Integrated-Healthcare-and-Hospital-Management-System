import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import Sidebar from "../../GlobalFiles/Sidebar";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";

const notify = (text) => toast(text);

const Notification_Settings = () => {
  const { data } = useSelector((store) => store.auth);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState({
    appointmentReminders: true,
    medicationReminders: true,
    labTestReminders: true,
    followUpReminders: true,
    generalNotifications: true
  });

  useEffect(() => {
    if (data?.user?._id) {
      fetchPreferences();
    }
  }, [data]);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `http://127.0.0.1:3001/notifications/preferences/${data.user._id}`
      );
      console.log("Preferences response:", response.data);
      setPreferences(response.data.preferences);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching preferences:", error);
      notify("❌ Failed to load notification preferences");
      setLoading(false);
    }
  };

  const handleToggle = (key) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await axios.put(
        `http://127.0.0.1:3001/notifications/preferences/${data.user._id}`,
        preferences
      );
      console.log("Save response:", response.data);
      notify("✅ Notification preferences saved successfully");
      setSaving(false);
    } catch (error) {
      console.error("Error saving preferences:", error);
      notify("❌ Failed to save preferences");
      setSaving(false);
    }
  };

  if (!data?.isAuthenticated) return <Navigate to="/" />;
  if (data?.user.userType !== "patient") return <Navigate to="/dashboard" />;

  return (
    <>
      <ToastContainer />

      <style>{`
        .settings-container {
          display: flex;
          min-height: 100vh;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          width: 100%;
          position: relative;
        }

        .settings-container::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="settings-pattern" width="60" height="60" patternUnits="userSpaceOnUse"><circle cx="30" cy="30" r="2" fill="rgba(102,126,234,0.05)"/><circle cx="10" cy="10" r="1" fill="rgba(52,211,153,0.05)"/><circle cx="50" cy="10" r="1" fill="rgba(52,211,153,0.05)"/></pattern></defs><rect width="100" height="100" fill="url(%23settings-pattern)"/></svg>');
          pointer-events: none;
        }

        .settings-content {
          flex: 1;
          padding: 2.5rem 3rem;
          overflow-y: auto;
          position: relative;
          z-index: 1;
        }

        .settings-header {
          text-align: center;
          margin-bottom: 2.5rem;
          padding-bottom: 1.5rem;
        }

        .settings-title {
          font-size: 2.5rem;
          font-weight: 800;
          margin-bottom: 0.5rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: -0.02em;
        }

        .settings-subtitle {
          font-size: 1.1rem;
          color: #64748b;
          font-weight: 500;
        }

        .settings-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          padding: 2.5rem;
          border-radius: 24px;
          box-shadow: 
            0 20px 40px rgba(0, 0, 0, 0.1),
            0 1px 0 rgba(255, 255, 255, 0.2) inset;
          border: 1px solid rgba(255, 255, 255, 0.2);
          max-width: 800px;
          margin: 0 auto;
          position: relative;
          overflow: hidden;
        }

        .settings-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .info-banner {
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(52, 211, 153, 0.1) 100%);
          padding: 1.5rem;
          border-radius: 16px;
          margin-bottom: 2rem;
          border-left: 4px solid #667eea;
        }

        .info-banner p {
          margin: 0;
          color: #374151;
          font-weight: 500;
          line-height: 1.6;
        }

        .settings-section {
          margin-bottom: 2rem;
        }

        .section-title {
          font-size: 1.3rem;
          font-weight: 700;
          color: #374151;
          margin-bottom: 1.5rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .preference-item {
          background: rgba(248, 250, 252, 0.8);
          padding: 1.5rem;
          border-radius: 16px;
          margin-bottom: 1rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: all 0.3s ease;
          border: 2px solid transparent;
        }

        .preference-item:hover {
          background: rgba(102, 126, 234, 0.05);
          border-color: rgba(102, 126, 234, 0.2);
          transform: translateY(-2px);
        }

        .preference-info {
          flex: 1;
        }

        .preference-label {
          font-size: 1.1rem;
          font-weight: 600;
          color: #374151;
          margin-bottom: 0.3rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .preference-description {
          font-size: 0.9rem;
          color: #64748b;
          font-weight: 500;
        }

        .toggle-switch {
          position: relative;
          width: 60px;
          height: 30px;
          background: #cbd5e1;
          border-radius: 30px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .toggle-switch.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .toggle-slider {
          position: absolute;
          top: 3px;
          left: 3px;
          width: 24px;
          height: 24px;
          background: white;
          border-radius: 50%;
          transition: all 0.3s ease;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .toggle-switch.active .toggle-slider {
          transform: translateX(30px);
        }

        .save-button {
          width: 100%;
          padding: 1rem 2rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-top: 2rem;
        }

        .save-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
        }

        .save-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .loading {
          text-align: center;
          padding: 4rem;
          font-size: 1.2rem;
          color: #64748b;
          font-weight: 500;
        }

        @media (max-width: 768px) {
          .settings-content {
            padding: 1.5rem 1rem;
          }

          .settings-title {
            font-size: 2rem;
          }

          .preference-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }
        }
      `}</style>

      <div className="settings-container">
        <Sidebar />

        <div className="settings-content">
          <div className="settings-header">
            <h1 className="settings-title">🔔 Notification Settings</h1>
            <p className="settings-subtitle">
              Manage your email notification preferences
            </p>
          </div>

          {loading ? (
            <div className="loading">Loading preferences...</div>
          ) : (
            <div className="settings-card">
              <div className="info-banner">
                <p>
                  📧 Control which email notifications you receive from UB E-Health. 
                  You can enable or disable specific types of reminders to avoid feeling spammed.
                </p>
              </div>

              <div className="settings-section">
                <h2 className="section-title">📅 Appointment Notifications</h2>
                
                <div className="preference-item">
                  <div className="preference-info">
                    <div className="preference-label">
                      📅 Appointment Reminders
                    </div>
                    <div className="preference-description">
                      Receive email reminders 24 hours before your scheduled appointments
                    </div>
                  </div>
                  <div 
                    className={`toggle-switch ${preferences.appointmentReminders ? 'active' : ''}`}
                    onClick={() => handleToggle('appointmentReminders')}
                  >
                    <div className="toggle-slider"></div>
                  </div>
                </div>
              </div>

              <div className="settings-section">
                <h2 className="section-title">💊 Medication Notifications</h2>
                
                <div className="preference-item">
                  <div className="preference-info">
                    <div className="preference-label">
                      💊 Medication Reminders
                    </div>
                    <div className="preference-description">
                      Daily reminders to take your prescribed medications
                    </div>
                  </div>
                  <div 
                    className={`toggle-switch ${preferences.medicationReminders ? 'active' : ''}`}
                    onClick={() => handleToggle('medicationReminders')}
                  >
                    <div className="toggle-slider"></div>
                  </div>
                </div>
              </div>

              <div className="settings-section">
                <h2 className="section-title">🔬 Lab Test Notifications</h2>
                
                <div className="preference-item">
                  <div className="preference-info">
                    <div className="preference-label">
                      🔬 Lab Test Reminders
                    </div>
                    <div className="preference-description">
                      Weekly reminders about pending lab tests recommended by your doctor
                    </div>
                  </div>
                  <div 
                    className={`toggle-switch ${preferences.labTestReminders ? 'active' : ''}`}
                    onClick={() => handleToggle('labTestReminders')}
                  >
                    <div className="toggle-slider"></div>
                  </div>
                </div>
              </div>

              <div className="settings-section">
                <h2 className="section-title">📢 General Notifications</h2>
                
                <div className="preference-item">
                  <div className="preference-info">
                    <div className="preference-label">
                      🔔 Follow-up Reminders
                    </div>
                    <div className="preference-description">
                      Reminders for scheduled follow-up appointments
                    </div>
                  </div>
                  <div 
                    className={`toggle-switch ${preferences.followUpReminders ? 'active' : ''}`}
                    onClick={() => handleToggle('followUpReminders')}
                  >
                    <div className="toggle-slider"></div>
                  </div>
                </div>

                <div className="preference-item">
                  <div className="preference-info">
                    <div className="preference-label">
                      📧 General Notifications
                    </div>
                    <div className="preference-description">
                      Important updates, announcements, and health tips
                    </div>
                  </div>
                  <div 
                    className={`toggle-switch ${preferences.generalNotifications ? 'active' : ''}`}
                    onClick={() => handleToggle('generalNotifications')}
                  >
                    <div className="toggle-slider"></div>
                  </div>
                </div>
              </div>

              <button 
                className="save-button" 
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? '💾 Saving...' : '💾 Save Preferences'}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Notification_Settings;
