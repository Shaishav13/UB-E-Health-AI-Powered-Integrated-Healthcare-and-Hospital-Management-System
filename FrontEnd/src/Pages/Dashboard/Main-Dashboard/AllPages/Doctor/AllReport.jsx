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
import { FaChevronDown, FaChevronUp, FaEdit, FaSave, FaTimes, FaDownload } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { generateReport } from "../../../../../Components/ReportGenerator";
import AIReportInterpretation from "../../../../../Components/AIReportInterpretation";
import DoctorReportAI from "../../../../../Components/DoctorReportAI";
import axios from "axios";

const notify = (text) => toast(text);

const AllReport = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [expandedRows, setExpandedRows] = useState([]);
  const [editingReport, setEditingReport] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [reportType, setReportType] = useState('doctor'); // 'doctor' or 'lab'
  const [labReports, setLabReports] = useState([]);
  const [loadingLabReports, setLoadingLabReports] = useState(false);
  const [showAIInterpretation, setShowAIInterpretation] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState(null);
  const [showDoctorReportAI, setShowDoctorReportAI] = useState(false);
  const [selectedDoctorReportId, setSelectedDoctorReportId] = useState(null);

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

  // Fetch lab reports when toggle changes
  useEffect(() => {
    if (reportType === 'lab' && user && user._id) {
      fetchLabReports();
    }
  }, [reportType, user]);

  const fetchLabReports = async () => {
    try {
      setLoadingLabReports(true);
      const response = await axios.get(
        `http://127.0.0.1:3001/lab-reports/patient/${user._id}`
      );
      
      // Sort lab reports by date (newest first)
      const sortedLabReports = (response.data.labReports || []).sort((a, b) => {
        const dateA = new Date(a.preferredDate || a.createdAt);
        const dateB = new Date(b.preferredDate || b.createdAt);
        return dateB - dateA; // Descending order (newest first)
      });
      
      setLabReports(sortedLabReports);
      setLoadingLabReports(false);
    } catch (error) {
      console.error("Error fetching lab reports:", error);
      setLabReports([]);
      setLoadingLabReports(false);
    }
  };

  // Auto-expand all reports when they load
  useEffect(() => {
    if (reportType === 'doctor' && reports && reports.length > 0) {
      const allReportIds = reports.map(report => report._id || report.id);
      setExpandedRows(allReportIds);
    } else if (reportType === 'lab' && labReports && labReports.length > 0) {
      const allLabReportIds = labReports.map(report => report._id);
      setExpandedRows(allLabReportIds);
    }
  }, [reports, labReports, reportType]);

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
      medications: report.medications || '',
      labTests: report.labTests || '',
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

  const handleDownloadReport = (report) => {
    try {
      console.log('=== DOWNLOAD REPORT DEBUG ===');
      console.log('Full report object:', report);
      console.log('Report keys:', Object.keys(report));
      console.log('Patient ID field:', report.patientid);
      console.log('Patient ID type:', typeof report.patientid);
      console.log('Is patientid an object?', typeof report.patientid === 'object');
      console.log('Patient ID keys:', report.patientid ? Object.keys(report.patientid) : 'null/undefined');
      console.log('Doctor ID field:', report.doctorid);
      console.log('Doctor ID type:', typeof report.doctorid);
      console.log('=== END DOWNLOAD DEBUG ===');
      
      generateReport(report, user);
      notify("Report downloaded successfully!");
    } catch (error) {
      console.error("Error generating report:", error);
      notify("Failed to generate report");
    }
  };

  const handleExplainReport = (reportId) => {
    setSelectedReportId(reportId);
    setShowAIInterpretation(true);
  };

  const handleExplainDoctorReport = (reportId) => {
    setSelectedDoctorReportId(reportId);
    setShowDoctorReportAI(true);
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
    background: transparent;
    padding: 0;
    border: none;
    box-shadow: none;
    transition: none;
    position: relative;
    overflow: visible;
    width: 100%;
    margin: 0 auto;
  }

  /* Card Grid Layout */
  .reports-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 2rem;
    width: 100%;
  }

  .report-card {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    padding: 2rem;
    border-radius: 20px;
    box-shadow: 
      0 10px 30px rgba(0, 0, 0, 0.1),
      0 1px 0 rgba(255, 255, 255, 0.2) inset;
    border: 1px solid rgba(255, 255, 255, 0.2);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
  }

  .report-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }

  .report-card:hover {
    transform: translateY(-8px);
    box-shadow: 
      0 20px 40px rgba(0, 0, 0, 0.15),
      0 1px 0 rgba(255, 255, 255, 0.3) inset;
  }

  .report-card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 2px solid rgba(102, 126, 234, 0.1);
  }

  .report-card-title {
    flex: 1;
  }

  .report-name {
    font-size: 1.3rem;
    font-weight: 700;
    color: #374151;
    margin-bottom: 0.5rem;
  }

  .report-meta {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
    font-size: 0.9rem;
    color: #64748b;
  }

  .report-meta-item {
    display: flex;
    align-items: center;
    gap: 0.3rem;
  }

  .expand-toggle {
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
    width: 36px;
    height: 36px;
  }

  .expand-toggle:hover {
    background: rgba(102, 126, 234, 0.2);
    transform: scale(1.1);
  }

  /* Enhanced Custom Table Styles */
  .custom-table {
    width: 100%;
    border-collapse: collapse;
    border-radius: 16px;
    overflow: hidden;
    background: rgba(248, 250, 252, 0.8);
    table-layout: auto;
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
    white-space: nowrap;
  }

  .custom-table th:first-child {
    width: 80px;
    text-align: center;
  }

  .custom-table th:nth-child(2) {
    width: auto;
    min-width: 150px;
  }

  .custom-table th:nth-child(3) {
    width: auto;
    min-width: 120px;
  }

  .custom-table th:nth-child(4) {
    width: auto;
    min-width: 100px;
  }

  .custom-table th:nth-child(5) {
    width: auto;
    min-width: 150px;
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

  .custom-table td:first-child {
    text-align: center;
  }

  .custom-table td:nth-child(2),
  .custom-table td:nth-child(3),
  .custom-table td:nth-child(4),
  .custom-table td:nth-child(5) {
    text-align: center;
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

    .reports-grid {
      grid-template-columns: 1fr;
      gap: 1.5rem;
    }

    .report-card {
      padding: 1.5rem;
    }

    .reports-heading {
      font-size: 2rem;
    }

    .detail-grid {
      grid-template-columns: 1fr;
      gap: 1rem;
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

  .edit-btn, .save-btn, .cancel-btn, .download-btn {
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

  .download-btn {
    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
    color: white;
  }

  .download-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(245, 158, 11, 0.4);
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

  .btn-ai-explain {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  }

  .btn-ai-explain:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(102, 126, 234, 0.5);
  }

  .btn-ai-explain:active {
    transform: translateY(0);
  }
`}</style>


      <div className="reports-page">
        <Sidebar />

        <div className="reports-content">
          <h1 className="reports-heading">📋 Medical Reports</h1>

          {/* Toggle Buttons */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '1rem',
            marginBottom: '2rem'
          }}>
            <button
              onClick={() => setReportType('doctor')}
              style={{
                padding: '0.875rem 2rem',
                border: reportType === 'doctor' ? 'none' : '2px solid rgba(102, 126, 234, 0.2)',
                background: reportType === 'doctor' 
                  ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                  : 'white',
                color: reportType === 'doctor' ? 'white' : '#374151',
                borderRadius: '12px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: reportType === 'doctor' 
                  ? '0 8px 20px rgba(102, 126, 234, 0.4)'
                  : '0 2px 8px rgba(0, 0, 0, 0.05)'
              }}
            >
              🩺 Doctor Reports
            </button>
            <button
              onClick={() => setReportType('lab')}
              style={{
                padding: '0.875rem 2rem',
                border: reportType === 'lab' ? 'none' : '2px solid rgba(102, 126, 234, 0.2)',
                background: reportType === 'lab' 
                  ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                  : 'white',
                color: reportType === 'lab' ? 'white' : '#374151',
                borderRadius: '12px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: reportType === 'lab' 
                  ? '0 8px 20px rgba(102, 126, 234, 0.4)'
                  : '0 2px 8px rgba(0, 0, 0, 0.05)'
              }}
            >
              🧪 Lab Reports
            </button>
          </div>

          {user?.userType !== "admin" && (
            <div className="reports-card">
              {/* Doctor Reports Section */}
              {reportType === 'doctor' && (
                <>
                  {reports && reports.length > 0 ? (
                <div className="reports-grid">
                  {reports.map((report) => {
                    const reportId = report._id || report.id;
                    return (
                      <div key={reportId} className="report-card">
                        <div className="report-card-header">
                          <div className="report-card-title">
                            <div className="report-name">{report.name}</div>
                            <div className="report-meta">
                              <span className="report-meta-item">📅 {report.date}</span>
                              <span className="report-meta-item">🕐 {report.time}</span>
                              <span className="report-meta-item">🩺 {report.disease}</span>
                            </div>
                          </div>
                          <button
                            className="expand-toggle"
                            onClick={() => toggleRow(report)}
                          >
                            {isExpanded(report) ? <FaChevronUp /> : <FaChevronDown />}
                          </button>
                        </div>

                        {isExpanded(report) && (
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
                                  
                                  {/* Prescribed Medications Section */}
                                  {(report.medications || editingReport === reportId) && (
                                    <div className="info-section" style={{ borderLeft: '4px solid #f59e0b' }}>
                                      <h4>💊 Prescribed Medications</h4>
                                      {editingReport === reportId ? (
                                        <textarea
                                          className="edit-textarea"
                                          value={editFormData.medications || ''}
                                          onChange={(e) => handleInputChange('medications', e.target.value)}
                                          placeholder="Prescribed medications with dosage and instructions..."
                                        />
                                      ) : (
                                        <p style={{ whiteSpace: 'pre-line' }}>{report.medications}</p>
                                      )}
                                    </div>
                                  )}
                                  
                                  {/* Suggested Lab Tests Section */}
                                  {(report.labTests || editingReport === reportId) && (
                                    <div className="info-section" style={{ borderLeft: '4px solid #3b82f6' }}>
                                      <h4>🔬 Suggested Laboratory Tests</h4>
                                      {editingReport === reportId ? (
                                        <textarea
                                          className="edit-textarea"
                                          value={editFormData.labTests || ''}
                                          onChange={(e) => handleInputChange('labTests', e.target.value)}
                                          placeholder="Recommended laboratory tests..."
                                        />
                                      ) : (
                                        <p style={{ whiteSpace: 'pre-line' }}>{report.labTests}</p>
                                      )}
                                    </div>
                                  )}
                                  
                                  {/* Edit Actions - Show for both doctors and patients */}
                                  <div className="edit-actions">
                                    {/* Download button for everyone */}
                                    <button
                                      className="download-btn"
                                      onClick={() => handleDownloadReport(report)}
                                    >
                                      <FaDownload /> Download Report
                                    </button>
                                    
                                    {/* AI Explain button for patients */}
                                    {user?.userType === "patient" && (
                                      <button
                                        className="btn-ai-explain"
                                        onClick={() => handleExplainDoctorReport(report._id || report.id)}
                                      >
                                        ✨ Explain My Report with AI
                                      </button>
                                    )}
                                    
                                    {/* Edit buttons only for doctors */}
                                    {user?.userType === "doctor" && (
                                      <>
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
                                      </>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="no-reports">
                        <p>No doctor reports available</p>
                      </div>
                    )}
                </>
              )}

              {/* Lab Reports Section */}
              {reportType === 'lab' && (
                <>
                  {loadingLabReports ? (
                    <div className="no-reports">
                      <p>Loading lab reports...</p>
                    </div>
                  ) : labReports && labReports.length > 0 ? (
                    <div className="reports-grid">
                      {labReports.map((labReport) => {
                        const reportId = labReport._id;
                        const statusColors = {
                          'Pending': '#f59e0b',
                          'Sample Collected': '#3b82f6',
                          'Processing': '#8b5cf6',
                          'Completed': '#10b981',
                          'Cancelled': '#ef4444'
                        };
                        return (
                          <div key={reportId} className="report-card">
                            <div className="report-card-header">
                              <div className="report-card-title">
                                <div className="report-name">🧪 {labReport.testName}</div>
                                <div className="report-meta">
                                  <span className="report-meta-item">
                                    📅 {new Date(labReport.preferredDate).toLocaleDateString()}
                                  </span>
                                  <span className="report-meta-item">
                                    🕐 {labReport.preferredTime}
                                  </span>
                                  <span className="report-meta-item" style={{
                                    background: statusColors[labReport.status] || '#64748b',
                                    color: 'white',
                                    padding: '0.25rem 0.75rem',
                                    borderRadius: '8px',
                                    fontSize: '0.85rem',
                                    fontWeight: '600'
                                  }}>
                                    {labReport.status}
                                  </span>
                                  {labReport.homeService && (
                                    <span className="report-meta-item" style={{
                                      background: '#34d399',
                                      color: 'white',
                                      padding: '0.25rem 0.75rem',
                                      borderRadius: '8px',
                                      fontSize: '0.85rem',
                                      fontWeight: '600'
                                    }}>
                                      🏠 Home Service
                                    </span>
                                  )}
                                </div>
                              </div>
                              <button
                                className="expand-toggle"
                                onClick={() => toggleRow(labReport)}
                              >
                                {isExpanded(labReport) ? <FaChevronUp /> : <FaChevronDown />}
                              </button>
                            </div>

                            {isExpanded(labReport) && (
                              <div className="expanded-details">
                                <div className="detail-grid">
                                  <div className="detail-item">
                                    <div className="detail-label">Test Type</div>
                                    <div className="detail-value">{labReport.testType}</div>
                                  </div>
                                  <div className="detail-item">
                                    <div className="detail-label">Cost</div>
                                    <div className="detail-value">₹{labReport.cost}</div>
                                  </div>
                                  <div className="detail-item">
                                    <div className="detail-label">Payment Status</div>
                                    <div className="detail-value">{labReport.paymentStatus}</div>
                                  </div>
                                  {labReport.sampleCollectedDate && (
                                    <div className="detail-item">
                                      <div className="detail-label">Sample Collected</div>
                                      <div className="detail-value">
                                        {new Date(labReport.sampleCollectedDate).toLocaleDateString()}
                                      </div>
                                    </div>
                                  )}
                                  {labReport.reportDate && (
                                    <div className="detail-item">
                                      <div className="detail-label">Report Date</div>
                                      <div className="detail-value">
                                        {new Date(labReport.reportDate).toLocaleDateString()}
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {labReport.homeService && labReport.address && (
                                  <div className="info-section" style={{ borderLeft: '4px solid #34d399' }}>
                                    <h4>🏠 Home Service Address</h4>
                                    <p>{labReport.address}</p>
                                  </div>
                                )}

                                {labReport.results && labReport.results.parameters && labReport.results.parameters.length > 0 && (
                                  <div className="info-section" style={{ borderLeft: '4px solid #10b981' }}>
                                    <h4>📊 Test Results</h4>
                                    <div style={{ overflowX: 'auto' }}>
                                      <table style={{
                                        width: '100%',
                                        borderCollapse: 'collapse',
                                        marginTop: '1rem'
                                      }}>
                                        <thead>
                                          <tr style={{ background: '#f8fafc' }}>
                                            <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>Parameter</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '2px solid #e2e8f0' }}>Value</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '2px solid #e2e8f0' }}>Unit</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '2px solid #e2e8f0' }}>Normal Range</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '2px solid #e2e8f0' }}>Status</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {labReport.results.parameters.map((param, index) => (
                                            <tr key={index} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                              <td style={{ padding: '0.75rem', fontWeight: '600' }}>{param.name}</td>
                                              <td style={{ padding: '0.75rem', textAlign: 'center', fontWeight: '700' }}>{param.value}</td>
                                              <td style={{ padding: '0.75rem', textAlign: 'center' }}>{param.unit}</td>
                                              <td style={{ padding: '0.75rem', textAlign: 'center', color: '#64748b' }}>{param.normalRange}</td>
                                              <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                                <span style={{
                                                  padding: '0.25rem 0.75rem',
                                                  borderRadius: '6px',
                                                  fontSize: '0.85rem',
                                                  fontWeight: '600',
                                                  background: param.status === 'Normal' ? '#d1fae5' : 
                                                             param.status === 'High' ? '#fee2e2' :
                                                             param.status === 'Low' ? '#fef3c7' : '#fecaca',
                                                  color: param.status === 'Normal' ? '#065f46' :
                                                         param.status === 'High' ? '#991b1b' :
                                                         param.status === 'Low' ? '#92400e' : '#7f1d1d'
                                                }}>
                                                  {param.status}
                                                </span>
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                    {labReport.results.summary && (
                                      <div style={{ marginTop: '1rem', padding: '1rem', background: '#f0fdf4', borderRadius: '8px' }}>
                                        <strong>Summary:</strong> {labReport.results.summary}
                                      </div>
                                    )}
                                    {labReport.results.remarks && (
                                      <div style={{ marginTop: '0.5rem', padding: '1rem', background: '#fef3c7', borderRadius: '8px' }}>
                                        <strong>Remarks:</strong> {labReport.results.remarks}
                                      </div>
                                    )}
                                    {labReport.results.technician && (
                                      <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#64748b' }}>
                                        <strong>Technician:</strong> {labReport.results.technician}
                                      </div>
                                    )}
                                  </div>
                                )}

                                {labReport.status === 'Completed' && (
                                  <div className="edit-actions">
                                    <button
                                      className="download-btn"
                                      onClick={() => notify("Lab report download feature coming soon!")}
                                    >
                                      <FaDownload /> Download Lab Report
                                    </button>
                                    {labReport.results && labReport.results.parameters && labReport.results.parameters.length > 0 && (
                                      <button
                                        className="btn-ai-explain"
                                        onClick={() => handleExplainReport(labReport._id)}
                                      >
                                        ✨ Explain Report with AI
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="no-reports">
                      <p>No lab reports available</p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* AI Report Interpretation Modal for Lab Reports */}
      {showAIInterpretation && (
        <AIReportInterpretation
          reportId={selectedReportId}
          onClose={() => {
            setShowAIInterpretation(false);
            setSelectedReportId(null);
          }}
        />
      )}

      {/* AI Report Interpretation Modal for Doctor Reports */}
      {showDoctorReportAI && (
        <DoctorReportAI
          reportId={selectedDoctorReportId}
          onClose={() => {
            setShowDoctorReportAI(false);
            setSelectedDoctorReportId(null);
          }}
        />
      )}
    </>
  );
};

export default AllReport;
