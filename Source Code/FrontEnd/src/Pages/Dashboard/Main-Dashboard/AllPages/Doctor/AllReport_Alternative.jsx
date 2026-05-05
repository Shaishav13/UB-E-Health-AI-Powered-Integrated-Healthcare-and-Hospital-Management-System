import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Sidebar from "../../GlobalFiles/Sidebar";
import {
  GetAllData,
  GetPatients,
  GetDoctorDetails,
  GetAllReports,
} from "../../../../../Redux/Datas/action";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";

const AllReport = () => {
  const dispatch = useDispatch();
  const [expandedRows, setExpandedRows] = useState([]);

  const {
    data: { user },
  } = useSelector((state) => state.auth);

  const { reports } = useSelector((store) => store.data.reports);

  useEffect(() => {
    dispatch(GetPatients());
    dispatch(GetDoctorDetails());
    dispatch(GetAllData());
    if (user) dispatch(GetAllReports(user?.userType, user._id));
  }, []);

  const toggleRow = (reportId) => {
    setExpandedRows((prev) =>
      prev.includes(reportId)
        ? prev.filter((id) => id !== reportId)
        : [...prev, reportId]
    );
  };

  const isExpanded = (reportId) => expandedRows.includes(reportId);

  let Name = user?.userType === "patient" ? "Doctor Name" : "Patient Name";

  return (
    <>
      {/* ---------------- INLINE CSS ---------------- */}
      <style>{`
        .reports-page {
          display: flex;
          min-height: 100vh;
          background: #f5f7f8;
          width: 100%;
        }

        .reports-content {
          flex: 1;
          padding: 2.5rem 3rem;
        }

        .reports-heading {
          font-size: 2rem;
          font-weight: 700;
          color: #0b6b61;
          margin-bottom: 1.8rem;
          text-shadow: 0px 1px 2px rgba(0,0,0,0.08);
        }

        .reports-card {
          background: #ffffff;
          padding: 1.5rem;
          border-radius: 18px;
          box-shadow: 0 4px 14px rgba(0,0,0,0.07);
          transition: 0.25s ease;
        }

        .reports-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 26px rgba(0,0,0,0.12);
        }

        /* Custom Table Styles */
        .custom-table {
          width: 100%;
          border-collapse: collapse;
          border-radius: 12px;
          overflow: hidden;
        }

        .custom-table thead {
          background: linear-gradient(135deg, #0b6b61, #138f7b);
        }

        .custom-table th {
          color: white;
          font-weight: 600;
          padding: 14px;
          text-align: left;
        }

        .custom-table tbody tr {
          border-bottom: 1px solid #e9ecef;
          transition: background 0.2s;
        }

        .custom-table tbody tr:hover {
          background: #f8f9fa;
        }

        .custom-table td {
          padding: 14px;
        }

        .expand-btn {
          background: transparent;
          border: none;
          cursor: pointer;
          font-size: 1.2rem;
          color: #0b6b61;
          padding: 5px 10px;
          transition: transform 0.2s;
        }

        .expand-btn:hover {
          transform: scale(1.2);
        }

        /* Expanded row details */
        .expanded-details {
          background: linear-gradient(135deg, #f8f9fa, #e9ecef);
          padding: 1.5rem;
          margin: 0.5rem 0;
          border-radius: 12px;
          border-left: 4px solid #0b6b61;
          animation: slideDown 0.3s ease;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .detail-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .detail-item {
          background: white;
          padding: 1rem;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }

        .detail-label {
          font-size: 0.85rem;
          color: #666;
          font-weight: 600;
          margin-bottom: 0.3rem;
          text-transform: uppercase;
        }

        .detail-value {
          font-size: 1.1rem;
          color: #0b6b61;
          font-weight: 700;
        }

        .info-section {
          background: white;
          padding: 1rem;
          border-radius: 8px;
          margin-top: 1rem;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }

        .info-section h4 {
          color: #0b6b61;
          margin-bottom: 0.5rem;
          font-size: 1rem;
          font-weight: 700;
        }

        .info-section p {
          color: #444;
          line-height: 1.6;
          margin: 0;
        }

        .no-reports {
          text-align: center;
          padding: 3rem;
          color: #666;
          font-size: 1.1rem;
        }

        .pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 1rem;
          margin-top: 1.5rem;
        }

        .pagination button {
          padding: 8px 16px;
          background: #0b6b61;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: 0.2s;
        }

        .pagination button:hover:not(:disabled) {
          background: #0a5a52;
          transform: translateY(-2px);
        }

        .pagination button:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .pagination span {
          color: #0b6b61;
          font-weight: 600;
        }
      `}</style>

      <div className="reports-page">
        <Sidebar />

        <div className="reports-content">
          <h1 className="reports-heading">Medical Reports</h1>

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
                    {reports.map((report) => (
                      <React.Fragment key={report.id}>
                        <tr>
                          <td>
                            <button
                              className="expand-btn"
                              onClick={() => toggleRow(report.id)}
                            >
                              {isExpanded(report.id) ? (
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
                        {isExpanded(report.id) && (
                          <tr>
                            <td colSpan="5">
                              <div className="expanded-details">
                                <div className="detail-grid">
                                  <div className="detail-item">
                                    <div className="detail-label">
                                      Temperature
                                    </div>
                                    <div className="detail-value">
                                      {report.temperature || "N/A"} °F
                                    </div>
                                  </div>
                                  <div className="detail-item">
                                    <div className="detail-label">Weight</div>
                                    <div className="detail-value">
                                      {report.weight || "N/A"} kg
                                    </div>
                                  </div>
                                  <div className="detail-item">
                                    <div className="detail-label">
                                      Blood Pressure
                                    </div>
                                    <div className="detail-value">
                                      {report.bp || "N/A"} mmHg
                                    </div>
                                  </div>
                                  <div className="detail-item">
                                    <div className="detail-label">
                                      Glucose Level
                                    </div>
                                    <div className="detail-value">
                                      {report.glucose || "N/A"} mg/dL
                                    </div>
                                  </div>
                                </div>
                                {report.info && (
                                  <div className="info-section">
                                    <h4>Additional Information</h4>
                                    <p>{report.info}</p>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
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
