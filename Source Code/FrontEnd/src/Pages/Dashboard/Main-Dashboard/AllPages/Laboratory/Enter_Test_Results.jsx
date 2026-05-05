import { useState, useEffect } from "react";
import Sidebar from "../../GlobalFiles/Sidebar";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import Footer from "../../../../../Components/Footer";

const notify = (text) => toast(text);

const EnterTestResults = () => {
  const { data } = useSelector((store) => store.auth);
  const navigate = useNavigate();
  const { id: testId } = useParams();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [testDetails, setTestDetails] = useState(null);
  
  // Form state
  const [parameters, setParameters] = useState([
    {
      name: "",
      value: "",
      unit: "",
      normalRange: "",
      status: "Normal"
    }
  ]);
  const [summary, setSummary] = useState("");
  const [remarks, setRemarks] = useState("");
  const [technician, setTechnician] = useState("");
  
  // Modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    fetchTestDetails();
    // Auto-fill technician name from logged-in user
    if (data?.user?.name) {
      setTechnician(data.user.name);
    }
  }, [testId, data]);

  const fetchTestDetails = async () => {
    try {
      setLoading(true);
      const token = data?.token;
      const response = await axios.get(
        `http://127.0.0.1:3001/lab-reports/${testId}`,
        {
          headers: {
            Authorization: token,
          },
        }
      );
      setTestDetails(response.data.labReport);
    } catch (error) {
      console.error("Error fetching test details:", error);
      notify("Failed to fetch test details");
    } finally {
      setLoading(false);
    }
  };

  const handleAddParameter = () => {
    setParameters([
      ...parameters,
      {
        name: "",
        value: "",
        unit: "",
        normalRange: "",
        status: "Normal"
      }
    ]);
  };

  const handleRemoveParameter = (index) => {
    if (parameters.length === 1) {
      notify("At least one parameter is required");
      return;
    }
    const newParameters = parameters.filter((_, i) => i !== index);
    setParameters(newParameters);
  };

  const handleParameterChange = (index, field, value) => {
    const newParameters = [...parameters];
    newParameters[index][field] = value;
    setParameters(newParameters);
  };

  const validateForm = () => {
    // Check if at least one parameter is filled
    const hasValidParameter = parameters.some(
      (param) => param.name.trim() && param.value.trim()
    );

    if (!hasValidParameter) {
      notify("Please add at least one parameter with name and value");
      return false;
    }

    // Check each parameter has required fields
    for (let i = 0; i < parameters.length; i++) {
      const param = parameters[i];
      if (param.name.trim() || param.value.trim()) {
        if (!param.name.trim()) {
          notify(`Parameter ${i + 1}: Name is required`);
          return false;
        }
        if (!param.value.trim()) {
          notify(`Parameter ${i + 1}: Value is required`);
          return false;
        }
      }
    }

    if (!technician.trim()) {
      notify("Technician name is required");
      return false;
    }

    return true;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }
    setShowConfirmModal(true);
  };

  const handleConfirmSubmit = async () => {
    try {
      setSubmitting(true);
      setShowConfirmModal(false);

      // Filter out empty parameters
      const validParameters = parameters.filter(
        (param) => param.name.trim() && param.value.trim()
      );

      const resultsData = {
        results: {
          parameters: validParameters,
          summary: summary.trim(),
          remarks: remarks.trim(),
          technician: technician.trim()
        }
      };

      const token = data?.token;
      await axios.put(
        `http://127.0.0.1:3001/lab-reports/add-results/${testId}`,
        resultsData,
        {
          headers: {
            Authorization: token,
          },
        }
      );

      notify("Test results submitted successfully");
      
      // Navigate back after a short delay
      setTimeout(() => {
        navigate("/labtestrequests");
      }, 1500);
    } catch (error) {
      console.error("Error submitting results:", error);
      notify("Failed to submit results. Please try again.");
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (!data?.isAuthenticated) return <Navigate to="/" />;
  if (data?.user.userType !== "laboratory") return <Navigate to="/dashboard" />;

  return (
    <>
      <ToastContainer />

      {/* ---------- INLINE MODERN CSS ---------- */}
      <style>
        {`
          .enter-results-page {
            display: flex;
            min-height: 100vh;
            background: linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%);
          }

          .enter-results-content {
            flex: 1;
            padding: 2.5rem 3rem;
            overflow-y: auto;
          }

          .page-header {
            margin-bottom: 2rem;
          }

          .page-title {
            font-size: 2.5rem;
            font-weight: 800;
            color: #0b6b61;
            margin-bottom: 0.5rem;
          }

          .page-subtitle {
            font-size: 1.1rem;
            color: #64748b;
            font-weight: 500;
          }

          .test-info-card {
            background: white;
            padding: 1.75rem;
            border-radius: 16px;
            box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
            margin-bottom: 2rem;
            border-left: 4px solid #0b6b61;
          }

          .test-info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1rem;
          }

          .test-info-item {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
          }

          .test-info-label {
            font-size: 0.85rem;
            color: #64748b;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .test-info-value {
            font-size: 1.05rem;
            color: #1e293b;
            font-weight: 600;
          }

          .form-card {
            background: white;
            padding: 2rem;
            border-radius: 16px;
            box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
            margin-bottom: 2rem;
          }

          .form-section-title {
            font-size: 1.5rem;
            font-weight: 700;
            color: #0b6b61;
            margin-bottom: 1.5rem;
            padding-bottom: 0.75rem;
            border-bottom: 2px solid #e2e8f0;
          }

          .parameters-list {
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
            margin-bottom: 1.5rem;
          }

          .parameter-item {
            background: #f8fafc;
            padding: 1.5rem;
            border-radius: 12px;
            border: 2px solid #e2e8f0;
            position: relative;
          }

          .parameter-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1rem;
          }

          .parameter-number {
            font-size: 1rem;
            font-weight: 700;
            color: #0b6b61;
          }

          .remove-param-btn {
            padding: 0.5rem 1rem;
            background: #fee2e2;
            color: #991b1b;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 0.85rem;
            cursor: pointer;
            transition: all 0.2s ease;
          }

          .remove-param-btn:hover {
            background: #fecaca;
            transform: translateY(-2px);
          }

          .parameter-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
          }

          .form-group {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
          }

          .form-label {
            font-size: 0.9rem;
            font-weight: 600;
            color: #475569;
          }

          .form-label.required::after {
            content: " *";
            color: #dc2626;
          }

          .form-input,
          .form-select,
          .form-textarea {
            padding: 0.75rem;
            border: 2px solid #e2e8f0;
            border-radius: 8px;
            font-size: 0.95rem;
            transition: all 0.2s ease;
            background: white;
            font-family: inherit;
          }

          .form-input:focus,
          .form-select:focus,
          .form-textarea:focus {
            outline: none;
            border-color: #0b6b61;
            box-shadow: 0 0 0 3px rgba(11, 107, 97, 0.1);
          }

          .form-textarea {
            min-height: 100px;
            resize: vertical;
          }

          .add-param-btn {
            padding: 0.875rem 1.5rem;
            background: linear-gradient(135deg, #0b6b61, #139b86);
            color: white;
            border: none;
            border-radius: 10px;
            font-weight: 600;
            font-size: 1rem;
            cursor: pointer;
            transition: all 0.2s ease;
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
          }

          .add-param-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(11, 107, 97, 0.3);
          }

          .form-actions {
            display: flex;
            gap: 1rem;
            justify-content: flex-end;
            margin-top: 2rem;
          }

          .btn-cancel {
            padding: 0.875rem 2rem;
            background: #f1f5f9;
            color: #475569;
            border: none;
            border-radius: 10px;
            font-weight: 600;
            font-size: 1rem;
            cursor: pointer;
            transition: all 0.2s ease;
          }

          .btn-cancel:hover {
            background: #e2e8f0;
          }

          .btn-submit {
            padding: 0.875rem 2rem;
            background: linear-gradient(135deg, #0b6b61, #139b86);
            color: white;
            border: none;
            border-radius: 10px;
            font-weight: 600;
            font-size: 1rem;
            cursor: pointer;
            transition: all 0.2s ease;
          }

          .btn-submit:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(11, 107, 97, 0.3);
          }

          .btn-submit:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }

          .loading-state {
            text-align: center;
            padding: 4rem 2rem;
          }

          .loading-spinner {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #0b6b61;
            border-radius: 50%;
            width: 60px;
            height: 60px;
            animation: spin 1s linear infinite;
            margin: 0 auto 1.5rem;
          }

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          .loading-text {
            color: #64748b;
            font-size: 1.1rem;
            font-weight: 600;
          }

          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
            padding: 1rem;
          }

          .modal-content {
            background: white;
            border-radius: 16px;
            padding: 2rem;
            max-width: 500px;
            width: 100%;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          }

          .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1.5rem;
            padding-bottom: 1rem;
            border-bottom: 2px solid #e2e8f0;
          }

          .modal-title {
            font-size: 1.5rem;
            font-weight: 700;
            color: #0b6b61;
          }

          .modal-close {
            background: none;
            border: none;
            font-size: 1.5rem;
            cursor: pointer;
            color: #64748b;
            padding: 0.25rem;
            line-height: 1;
          }

          .modal-close:hover {
            color: #1e293b;
          }

          .modal-body {
            margin-bottom: 1.5rem;
          }

          .modal-text {
            color: #475569;
            font-size: 1rem;
            line-height: 1.6;
          }

          .modal-footer {
            display: flex;
            gap: 1rem;
            justify-content: flex-end;
          }

          .modal-btn {
            padding: 0.75rem 1.5rem;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
          }

          .modal-btn-cancel {
            background: #f1f5f9;
            color: #475569;
          }

          .modal-btn-cancel:hover {
            background: #e2e8f0;
          }

          .modal-btn-confirm {
            background: linear-gradient(135deg, #0b6b61, #139b86);
            color: white;
          }

          .modal-btn-confirm:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(11, 107, 97, 0.3);
          }

          /* Responsive Design */
          @media (max-width: 768px) {
            .enter-results-content {
              padding: 1.5rem 1rem;
            }

            .page-title {
              font-size: 2rem;
            }

            .test-info-grid {
              grid-template-columns: 1fr;
            }

            .parameter-grid {
              grid-template-columns: 1fr;
            }

            .form-actions {
              flex-direction: column;
            }

            .btn-cancel,
            .btn-submit {
              width: 100%;
            }

            .modal-footer {
              flex-direction: column;
            }

            .modal-btn {
              width: 100%;
            }

            .parameter-header {
              flex-direction: column;
              align-items: flex-start;
              gap: 0.75rem;
            }

            .remove-param-btn {
              width: 100%;
            }
          }
        `}
      </style>

      {/* ---------- PAGE LAYOUT ---------- */}
      <div className="enter-results-page">
        <Sidebar />

        <div className="enter-results-content">
          <div className="page-header">
            <h1 className="page-title">🧪 Enter Test Results</h1>
            <p className="page-subtitle">
              Add laboratory test results and parameters
            </p>
          </div>

          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p className="loading-text">Loading test details...</p>
            </div>
          ) : !testDetails ? (
            <div className="loading-state">
              <p className="loading-text">Test not found</p>
            </div>
          ) : (
            <>
              {/* Test Information Card */}
              <div className="test-info-card">
                <div className="test-info-grid">
                  <div className="test-info-item">
                    <span className="test-info-label">Patient Name</span>
                    <span className="test-info-value">
                      {testDetails.patientId?.name || "Unknown Patient"}
                    </span>
                  </div>
                  <div className="test-info-item">
                    <span className="test-info-label">Test Name</span>
                    <span className="test-info-value">
                      {testDetails.testName}
                    </span>
                  </div>
                  <div className="test-info-item">
                    <span className="test-info-label">Test Type</span>
                    <span className="test-info-value">
                      {testDetails.testType}
                    </span>
                  </div>
                  <div className="test-info-item">
                    <span className="test-info-label">Test ID</span>
                    <span className="test-info-value">
                      #{testDetails._id.slice(-8).toUpperCase()}
                    </span>
                  </div>
                  <div className="test-info-item">
                    <span className="test-info-label">Test Date</span>
                    <span className="test-info-value">
                      {formatDate(testDetails.preferredDate)}
                    </span>
                  </div>
                  <div className="test-info-item">
                    <span className="test-info-label">Status</span>
                    <span className="test-info-value">
                      {testDetails.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Parameters Form */}
              <div className="form-card">
                <h2 className="form-section-title">Test Parameters</h2>

                <div className="parameters-list">
                  {parameters.map((param, index) => (
                    <div key={index} className="parameter-item">
                      <div className="parameter-header">
                        <span className="parameter-number">
                          Parameter {index + 1}
                        </span>
                        {parameters.length > 1 && (
                          <button
                            className="remove-param-btn"
                            onClick={() => handleRemoveParameter(index)}
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      <div className="parameter-grid">
                        <div className="form-group">
                          <label className="form-label required">
                            Parameter Name
                          </label>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="e.g., Hemoglobin"
                            value={param.name}
                            onChange={(e) =>
                              handleParameterChange(index, "name", e.target.value)
                            }
                          />
                        </div>

                        <div className="form-group">
                          <label className="form-label required">Value</label>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="e.g., 14.5"
                            value={param.value}
                            onChange={(e) =>
                              handleParameterChange(index, "value", e.target.value)
                            }
                          />
                        </div>

                        <div className="form-group">
                          <label className="form-label">Unit</label>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="e.g., g/dL"
                            value={param.unit}
                            onChange={(e) =>
                              handleParameterChange(index, "unit", e.target.value)
                            }
                          />
                        </div>

                        <div className="form-group">
                          <label className="form-label">Normal Range</label>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="e.g., 13-17"
                            value={param.normalRange}
                            onChange={(e) =>
                              handleParameterChange(
                                index,
                                "normalRange",
                                e.target.value
                              )
                            }
                          />
                        </div>

                        <div className="form-group">
                          <label className="form-label">Status</label>
                          <select
                            className="form-select"
                            value={param.status}
                            onChange={(e) =>
                              handleParameterChange(index, "status", e.target.value)
                            }
                          >
                            <option value="Normal">Normal</option>
                            <option value="High">High</option>
                            <option value="Low">Low</option>
                            <option value="Critical">Critical</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button className="add-param-btn" onClick={handleAddParameter}>
                  <span>+</span> Add Parameter
                </button>
              </div>

              {/* Summary and Remarks */}
              <div className="form-card">
                <h2 className="form-section-title">Summary & Remarks</h2>

                <div className="form-group" style={{ marginBottom: "1.5rem" }}>
                  <label className="form-label">Summary</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Enter overall summary of test results..."
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: "1.5rem" }}>
                  <label className="form-label">Remarks</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Enter any additional remarks or recommendations..."
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label required">Technician Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter technician name"
                    value={technician}
                    onChange={(e) => setTechnician(e.target.value)}
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className="form-actions">
                <button
                  className="btn-cancel"
                  onClick={() => navigate("/labtestrequests")}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  className="btn-submit"
                  onClick={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? "Submitting..." : "Submit Results"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="modal-overlay" onClick={() => setShowConfirmModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Confirm Submission</h2>
              <button
                className="modal-close"
                onClick={() => setShowConfirmModal(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <p className="modal-text">
                Are you sure you want to submit these test results? This action
                will mark the test as completed and the results will be visible
                to the patient.
              </p>
            </div>

            <div className="modal-footer">
              <button
                className="modal-btn modal-btn-cancel"
                onClick={() => setShowConfirmModal(false)}
              >
                Cancel
              </button>
              <button
                className="modal-btn modal-btn-confirm"
                onClick={handleConfirmSubmit}
              >
                Confirm & Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EnterTestResults;
