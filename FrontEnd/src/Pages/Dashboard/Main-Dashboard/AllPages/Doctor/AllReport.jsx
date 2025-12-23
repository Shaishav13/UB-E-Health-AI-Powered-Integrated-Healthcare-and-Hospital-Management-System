import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../GlobalFiles/Sidebar";
import {
  GetAllData,
  GetPatients,
  GetDoctorDetails,
  GetAllReports,
  UpdateReport,
} from "../../../../../Redux/Datas/action";
import { FaChevronDown, FaChevronUp, FaEdit, FaSave, FaTimes } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const notify = (text) => toast(text);

const AllReport = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [expandedRows, setExpandedRows] = useState([]);
  const [editingReport, setEditingReport] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  const {
    data: { user },
  } = useSelector((state) => state.auth);

  const { reports } = useSelector((store) => store.data.reports);

  useEffect(() => {
    dispatch(GetPatients());
    dispatch(GetDoctorDetails());
    dispatch(GetAllData());
    if (user && user._id && user.userType) {
      console.log('Fetching reports for user:', user.userType, user._id);
      dispatch(GetAllReports(user.userType, user._id));
    } else {
      console.warn('User data incomplete:', user);
    }
  }, [user]);

  const toggleRow = (report) => {
    const reportId = report._id || report.id;
    setExpandedRows((prev) =>
      prev.includes(reportId)
        ? prev.filter((id) => id !== reportId)
        : [...prev, reportId]
    );
  };

  const isExpanded = (report) => {
    const reportId = report._id || report.id;
    return expandedRows.includes(reportId);
  };

  const handleEditReport = (report) => {
    const reportId = report._id || report.id;
    setEditingReport(reportId);
    setEditFormData({
      disease: report.disease,
      temperature: report.temperature,
      weight: report.weight,
      bp: report.bp,
      glucose: report.glucose,
      info: report.info,
    });
  };

  const handleCancelEdit = () => {
    setEditingReport(null);
    setEditFormData({});
  };

  const handleSaveEdit = async (report) => {
    try {
      // Use the report's _id field instead of id
      const reportId = report._id || report.id;
      
      if (!reportId) {
        notify("Error: Report ID not found. Cannot update report.");
        console.error("Report object:", report);
        return;
      }
      
      console.log("Updating report with ID:", reportId);
      const response = await dispatch(UpdateReport(reportId, editFormData));
      
      if (response.message === "successful") {
        notify("Report updated successfully!");
        setEditingReport(null);
        setEditFormData({});
        
        // Refresh the reports
        if (user && user._id && user.userType) {
          dispatch(GetAllReports(user.userType, user._id));
        }
      } else {
        notify(response.details || "Error updating report. Please try again.");
      }
    } catch (error) {
      notify("Error updating report. Please try again.");
      console.error("Error updating report:", error);
    }
  };

  const handleInputChange = (field, value) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  let Name = user?.userType === "patient" ? "Doctor Name" : "Patient Name";

  return (
    <>
      <ToastContainer />
      {/* ---------------- ENHANCED INLINE CSS ---------------- */}
     <style>{`
  .reports-page {
    display: flex;
    min-height: 100vh;
    background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
    width: 100%;
    position: relative;
  }

  .reports-page::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="reports-pattern" width="60" height="60" patternUnits="userSpaceOnUse"><circle cx="30" cy="30" r="2" fill="rgba(102,126,234,0.05)"/><circle cx="10" cy="10" r="1" fill="rgba(52,211,153,0.05)"/><circle cx="50" cy="10" r="1" fill="rgba(52,211,153,0.05)"/></pattern></defs><rect width="100" height="100" fill="url(%23reports-pattern)"/></svg>');
    pointer-events: none;
  }

  .reports-content {
    flex: 1;
    padding: 2.5rem 3rem;
    position: relative;
    z-index: 1;
  }

  .reports-heading {
    font-size: 2.5rem;
    font-weight: 800;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 2rem;
    text-align: center;
    letter-spacing: -0.02em;
  }

  .reports-card {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    padding: 2.5rem;
    border-radius: 24px;
    box-shadow: 
      0 20px 40px rgba(0, 0, 0, 0.1),
      0 1px 0 rgba(255, 255, 255, 0.2) inset;
    border: 1px solid rgba(255, 255, 255, 0.2);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
    max-width: 1400px;
    margin: 0 auto;
  }

  .reports-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }

  .reports-card:hover {
    transform: translateY(-8px);
    box-shadow: 
      0 32px 64px rgba(0, 0, 0, 0.15),
      0 1px 0 rgba(255, 255, 255, 0.3) inset;
  }

  /* Enhanced Custom Table Styles */
  .custom-table {
    width: 100%;
    border-collapse: collapse;
    border-radius: 16px;
    overflow: hidden;
    background: rgba(248, 250, 252, 0.8);
  }

  .custom-table thead {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }

  .custom-table th {
    color: white;
    font-weight: 700;
    padding: 1.2rem 1rem;
    text-align: center;
    font-size: 0.95rem;
    position: relative;
  }

  .custom-table th::before {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: rgba(255, 255, 255, 0.3);
  }

  .custom-table tbody tr {
    border-bottom: 1px solid rgba(102, 126, 234, 0.1);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .custom-table tbody tr:hover {
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(52, 211, 153, 0.08) 100%);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
  }

  .custom-table tbody tr:nth-child(even) {
    background: rgba(248, 250, 252, 0.5);
  }

  .custom-table tbody tr:nth-child(odd) {
    background: rgba(255, 255, 255, 0.8);
  }

  .custom-table td {
    padding: 1rem;
    text-align: center;
    font-weight: 500;
    color: #374151;
  }

  .expand-btn {
    background: rgba(102, 126, 234, 0.1);
    border: none;
    cursor: pointer;
    font-size: 1.2rem;
    color: #667eea;
    padding: 0.5rem;
    border-radius: 8px;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto;
  }

  .expand-btn:hover {
    background: rgba(102, 126, 234, 0.2);
    transform: scale(1.1);
  }

  .no-reports {
    text-align: center;
    padding: 4rem 2rem;
    background: rgba(248, 250, 252, 0.8);
    border-radius: 16px;
  }

  .no-reports p {
    color: #64748b;
    font-size: 1.2rem;
    font-weight: 500;
    margin: 0;
  }

  .no-reports::before {
    content: '📋';
    display: block;
    font-size: 4rem;
    margin-bottom: 1rem;
    opacity: 0.5;
  }

  /* Enhanced Expanded row details */
  .expanded-details {
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(52, 211, 153, 0.05) 100%);
    padding: 2rem;
    margin: 1rem 0;
    border-radius: 16px;
    border-left: 4px solid #667eea;
    animation: slideDown 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
  }

  .expanded-details::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, #667eea, #34d399);
  }

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .detail-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 1.5rem;
    margin-bottom: 1.5rem;
  }

  .detail-item {
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(10px);
    padding: 1.5rem;
    border-radius: 16px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
  }

  .detail-item::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(135deg, #34d399 0%, #10b981 100%);
  }

  .detail-item:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
  }

  .detail-label {
    font-size: 0.85rem;
    color: #64748b;
    font-weight: 600;
    margin-bottom: 0.5rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .detail-value {
    font-size: 1.3rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    font-weight: 700;
  }

  .info-section {
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(10px);
    padding: 1.5rem;
    border-radius: 16px;
    margin-top: 1.5rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    position: relative;
    overflow: hidden;
  }

  .info-section::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  }

  .info-section h4 {
    color: #374151;
    margin-bottom: 1rem;
    font-size: 1.1rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .info-section h4::before {
    content: '📝';
    font-size: 1rem;
  }

  .info-section p {
    color: #4b5563;
    line-height: 1.7;
    margin: 0;
    font-weight: 500;
  }

  /* Responsive design */
  @media (max-width: 768px) {
    .reports-content {
      padding: 1.5rem 1rem;
    }

    .reports-card {
      padding: 1.5rem;
    }

    .reports-heading {
      font-size: 2rem;
    }

    .detail-grid {
      grid-template-columns: 1fr;
      gap: 1rem;
    }

    .custom-table th,
    .custom-table td {
      padding: 0.75rem 0.5rem;
      font-size: 0.9rem;
    }
  }

  /* Edit functionality styles */
  .edit-actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
    margin-top: 1.5rem;
    padding-top: 1.5rem;
    border-top: 2px solid rgba(102, 126, 234, 0.1);
  }

  .edit-btn, .save-btn, .cancel-btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
  }

  .edit-btn {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
  }

  .edit-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
  }

  .save-btn {
    background: linear-gradient(135deg, #34d399 0%, #10b981 100%);
    color: white;
  }

  .save-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(52, 211, 153, 0.4);
  }

  .cancel-btn {
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    color: white;
  }

  .cancel-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(239, 68, 68, 0.4);
  }

  .edit-input {
    width: 100%;
    padding: 0.75rem;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    font-size: 1.1rem;
    font-weight: 600;
    background: rgba(255, 255, 255, 0.9);
    transition: all 0.3s ease;
  }

  .edit-input:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
    background: white;
  }

  .edit-textarea {
    width: 100%;
    padding: 0.75rem;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 500;
    background: rgba(255, 255, 255, 0.9);
    transition: all 0.3s ease;
    resize: vertical;
    min-height: 80px;
    font-family: inherit;
  }

  .edit-textarea:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
    background: white;
  }
`}</style>


      <div className="reports-page">
        <Sidebar />

        <div className="reports-content">
          <h1 className="reports-heading">📋 Medical Reports</h1>

          {user?.userType !== "admin" && (
            <div className="reports-card">
              {reports && reports.length > 0 ? (
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th style={{ width: "80px" }}>Action</th>
                      <th>{Name}</th>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Disease</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((report) => {
                      const reportId = report._id || report.id;
                      return (
                        <React.Fragment key={reportId}>
                          <tr>
                            <td>
                              <button
                                className="expand-btn"
                                onClick={() => toggleRow(report)}
                              >
                                {isExpanded(report) ? (
                                  <FaChevronUp />
                                ) : (
                                  <FaChevronDown />
                                )}
                              </button>
                            </td>
                            <td>{report.name}</td>
                            <td>{report.date}</td>
                            <td>{report.time}</td>
                            <td>{report.disease}</td>
                          </tr>
                          {isExpanded(report) && (
                            <tr>
                              <td colSpan="5">
                                <div className="expanded-details">
                                  <div className="detail-grid">
                                    <div className="detail-item">
                                      <div className="detail-label">
                                        Temperature
                                      </div>
                                      <div className="detail-value">
                                        {editingReport === reportId ? (
                                          <input
                                            type="number"
                                            step="0.1"
                                            className="edit-input"
                                            value={editFormData.temperature || ''}
                                            onChange={(e) => handleInputChange('temperature', e.target.value)}
                                            placeholder="Temperature in °F"
                                          />
                                        ) : (
                                          `${report.temperature || "N/A"} °F`
                                        )}
                                      </div>
                                    </div>
                                    <div className="detail-item">
                                      <div className="detail-label">Weight</div>
                                      <div className="detail-value">
                                        {editingReport === reportId ? (
                                          <input
                                            type="number"
                                            step="0.1"
                                            className="edit-input"
                                            value={editFormData.weight || ''}
                                            onChange={(e) => handleInputChange('weight', e.target.value)}
                                            placeholder="Weight in kg"
                                          />
                                        ) : (
                                          `${report.weight || "N/A"} kg`
                                        )}
                                      </div>
                                    </div>
                                    <div className="detail-item">
                                      <div className="detail-label">
                                        Blood Pressure
                                      </div>
                                      <div className="detail-value">
                                        {editingReport === reportId ? (
                                          <input
                                            type="text"
                                            className="edit-input"
                                            value={editFormData.bp || ''}
                                            onChange={(e) => handleInputChange('bp', e.target.value)}
                                            placeholder="e.g., 120/80"
                                          />
                                        ) : (
                                          `${report.bp || "N/A"} mmHg`
                                        )}
                                      </div>
                                    </div>
                                    <div className="detail-item">
                                      <div className="detail-label">
                                        Glucose Level
                                      </div>
                                      <div className="detail-value">
                                        {editingReport === reportId ? (
                                          <input
                                            type="number"
                                            className="edit-input"
                                            value={editFormData.glucose || ''}
                                            onChange={(e) => handleInputChange('glucose', e.target.value)}
                                            placeholder="Glucose in mg/dL"
                                          />
                                        ) : (
                                          `${report.glucose || "N/A"} mg/dL`
                                        )}
                                      </div>
                                    </div>
                                    <div className="detail-item">
                                      <div className="detail-label">
                                        Disease/Diagnosis
                                      </div>
                                      <div className="detail-value">
                                        {editingReport === reportId ? (
                                          <input
                                            type="text"
                                            className="edit-input"
                                            value={editFormData.disease || ''}
                                            onChange={(e) => handleInputChange('disease', e.target.value)}
                                            placeholder="Disease or diagnosis"
                                          />
                                        ) : (
                                          report.disease || "N/A"
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  {(report.info || editingReport === reportId) && (
                                    <div className="info-section">
                                      <h4>Additional Information</h4>
                                      {editingReport === reportId ? (
                                        <textarea
                                          className="edit-textarea"
                                          value={editFormData.info || ''}
                                          onChange={(e) => handleInputChange('info', e.target.value)}
                                          placeholder="Additional notes, observations, or recommendations..."
                                        />
                                      ) : (
                                        <p>{report.info}</p>
                                      )}
                                    </div>
                                  )}
                                  
                                  {/* Edit Actions - Only show for doctors */}
                                  {user?.userType === "doctor" && (
                                    <div className="edit-actions">
                                      {editingReport === reportId ? (
                                        <>
                                          <button
                                            className="save-btn"
                                            onClick={() => handleSaveEdit(report)}
                                          >
                                            <FaSave /> Save Changes
                                          </button>
                                          <button
                                            className="cancel-btn"
                                            onClick={handleCancelEdit}
                                          >
                                            <FaTimes /> Cancel
                                          </button>
                                        </>
                                      ) : (
                                        <button
                                          className="edit-btn"
                                          onClick={() => handleEditReport(report)}
                                        >
                                          <FaEdit /> Edit Report
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="no-reports">
                  <p>No reports available</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AllReport;
