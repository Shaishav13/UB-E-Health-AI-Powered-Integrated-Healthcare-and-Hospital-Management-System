import { useState, useEffect } from "react";
import Sidebar from "../../GlobalFiles/Sidebar";
import { Navigate, useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";

const notify = (text) => toast(text);

const LabTestRequests = () => {
  const { data } = useSelector((store) => store.auth);
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [allTests, setAllTests] = useState([]);
  const [filteredTests, setFilteredTests] = useState([]);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState(location.state?.filterStatus || "All");
  const [dateFilter, setDateFilter] = useState("All");
  const [homeServiceFilter, setHomeServiceFilter] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Modal states
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);
  const [newStatus, setNewStatus] = useState("");

  useEffect(() => {
    fetchAllTests();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [allTests, statusFilter, dateFilter, homeServiceFilter, searchQuery, dateRange]);

  const fetchAllTests = async () => {
    try {
      setLoading(true);
      const token = data?.token;
      const response = await axios.get(
        "http://127.0.0.1:3001/lab-reports/all",
        {
          headers: {
            Authorization: token,
          },
        }
      );
      setAllTests(response.data.labReports || []);
    } catch (error) {
      console.error("Error fetching lab tests:", error);
      notify("Failed to fetch lab test requests");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...allTests];

    // Status filter
    if (statusFilter !== "All") {
      filtered = filtered.filter((test) => test.status === statusFilter);
    }

    // Home service filter
    if (homeServiceFilter) {
      filtered = filtered.filter((test) => test.homeService === true);
    }

    // Date filter
    if (dateFilter === "Today") {
      const today = new Date().toDateString();
      filtered = filtered.filter(
        (test) => new Date(test.preferredDate).toDateString() === today
      );
    } else if (dateFilter === "This Week") {
      const today = new Date();
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(
        (test) => new Date(test.preferredDate) >= weekAgo
      );
    } else if (dateFilter === "Custom" && dateRange.start && dateRange.end) {
      filtered = filtered.filter((test) => {
        const testDate = new Date(test.preferredDate);
        return (
          testDate >= new Date(dateRange.start) &&
          testDate <= new Date(dateRange.end)
        );
      });
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (test) =>
          test.patientId?.name?.toLowerCase().includes(query) ||
          test.testName?.toLowerCase().includes(query) ||
          test.testType?.toLowerCase().includes(query)
      );
    }

    setFilteredTests(filtered);
    setCurrentPage(1);
  };

  const handleUpdateStatus = async () => {
    if (!selectedTest || !newStatus) {
      notify("Please select a status");
      return;
    }

    try {
      const token = data?.token;
      await axios.put(
        `http://127.0.0.1:3001/lab-reports/update-status/${selectedTest._id}`,
        {
          status: newStatus,
          labTechnician: {
            name: data?.user?.name,
            id: data?.user?.labId,
          },
        },
        {
          headers: {
            Authorization: token,
          },
        }
      );
      notify("Status updated successfully");
      setShowStatusModal(false);
      setSelectedTest(null);
      setNewStatus("");
      fetchAllTests();
    } catch (error) {
      console.error("Error updating status:", error);
      notify("Failed to update status");
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "Pending":
        return "status-badge-pending";
      case "Sample Collection":
        return "status-badge-collection";
      case "Processing":
        return "status-badge-processing";
      case "Completed":
        return "status-badge-completed";
      default:
        return "status-badge-default";
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

  const formatTime = (timeString) => {
    if (!timeString) return "N/A";
    return timeString;
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTests = filteredTests.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredTests.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (!data?.isAuthenticated) return <Navigate to="/" />;
  if (data?.user.userType !== "laboratory") return <Navigate to="/dashboard" />;

  return (
    <>
      <ToastContainer />

      {/* ---------- INLINE MODERN CSS ---------- */}
      <style>
        {`
          .lab-requests-page {
            display: flex;
            min-height: 100vh;
            background: linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%);
          }

          .lab-requests-content {
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

          .filters-section {
            background: white;
            padding: 1.75rem;
            border-radius: 16px;
            box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
            margin-bottom: 2rem;
          }

          .filters-row {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin-bottom: 1rem;
          }

          .filter-group {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
          }

          .filter-label {
            font-size: 0.9rem;
            font-weight: 600;
            color: #475569;
          }

          .filter-select,
          .filter-input {
            padding: 0.75rem;
            border: 2px solid #e2e8f0;
            border-radius: 8px;
            font-size: 0.95rem;
            transition: all 0.2s ease;
            background: white;
          }

          .filter-select:focus,
          .filter-input:focus {
            outline: none;
            border-color: #0b6b61;
            box-shadow: 0 0 0 3px rgba(11, 107, 97, 0.1);
          }

          .checkbox-group {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.75rem;
          }

          .checkbox-input {
            width: 18px;
            height: 18px;
            cursor: pointer;
          }

          .search-bar {
            width: 100%;
            padding: 0.875rem 1rem;
            border: 2px solid #e2e8f0;
            border-radius: 10px;
            font-size: 1rem;
            transition: all 0.2s ease;
          }

          .search-bar:focus {
            outline: none;
            border-color: #0b6b61;
            box-shadow: 0 0 0 3px rgba(11, 107, 97, 0.1);
          }

          .results-info {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1.5rem;
            padding: 1rem;
            background: white;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
          }

          .results-count {
            font-size: 1rem;
            color: #64748b;
            font-weight: 600;
          }

          .clear-filters-btn {
            padding: 0.5rem 1rem;
            background: #f1f5f9;
            color: #475569;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
          }

          .clear-filters-btn:hover {
            background: #e2e8f0;
          }

          .table-container {
            background: white;
            border-radius: 16px;
            box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
            overflow: hidden;
          }

          .requests-table {
            width: 100%;
            border-collapse: collapse;
          }

          .requests-table thead {
            background: linear-gradient(135deg, #0b6b61, #139b86);
            color: white;
          }

          .requests-table th {
            padding: 1.25rem 1rem;
            text-align: left;
            font-weight: 700;
            font-size: 0.95rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .requests-table td {
            padding: 1.25rem 1rem;
            border-bottom: 1px solid #e2e8f0;
            color: #1e293b;
            font-size: 0.95rem;
          }

          .requests-table tbody tr {
            transition: all 0.2s ease;
          }

          .requests-table tbody tr:hover {
            background: #f8fafc;
          }

          .patient-cell {
            font-weight: 600;
            color: #0b6b61;
          }

          .test-cell {
            font-weight: 500;
          }

          .date-cell {
            color: #64748b;
          }

          .status-badge {
            padding: 0.5rem 1rem;
            border-radius: 8px;
            font-weight: 600;
            font-size: 0.85rem;
            white-space: nowrap;
            display: inline-block;
          }

          .status-badge-pending {
            background: #fef3c7;
            color: #92400e;
          }

          .status-badge-collection {
            background: #dbeafe;
            color: #1e40af;
          }

          .status-badge-processing {
            background: #ede9fe;
            color: #5b21b6;
          }

          .status-badge-completed {
            background: #d1fae5;
            color: #065f46;
          }

          .status-badge-default {
            background: #e2e8f0;
            color: #475569;
          }

          .home-service-badge {
            display: inline-flex;
            align-items: center;
            gap: 0.25rem;
            padding: 0.25rem 0.5rem;
            background: #d1fae5;
            color: #065f46;
            border-radius: 6px;
            font-size: 0.8rem;
            font-weight: 600;
            margin-left: 0.5rem;
          }

          .actions-cell {
            display: flex;
            gap: 0.5rem;
            flex-wrap: wrap;
          }

          .action-btn {
            padding: 0.5rem 0.875rem;
            border: none;
            border-radius: 6px;
            font-weight: 600;
            font-size: 0.85rem;
            cursor: pointer;
            transition: all 0.2s ease;
            white-space: nowrap;
          }

          .btn-view {
            background: #e0e7ff;
            color: #3730a3;
          }

          .btn-view:hover {
            background: #c7d2fe;
            transform: translateY(-2px);
          }

          .btn-update {
            background: #fef3c7;
            color: #92400e;
          }

          .btn-update:hover {
            background: #fde68a;
            transform: translateY(-2px);
          }

          .btn-results {
            background: #d1fae5;
            color: #065f46;
          }

          .btn-results:hover {
            background: #a7f3d0;
            transform: translateY(-2px);
          }

          .pagination {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 0.5rem;
            margin-top: 2rem;
            padding: 1.5rem;
          }

          .page-btn {
            padding: 0.5rem 1rem;
            border: 2px solid #e2e8f0;
            background: white;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.2s ease;
            color: #475569;
          }

          .page-btn:hover:not(:disabled) {
            border-color: #0b6b61;
            color: #0b6b61;
          }

          .page-btn.active {
            background: linear-gradient(135deg, #0b6b61, #139b86);
            color: white;
            border-color: transparent;
          }

          .page-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          .loading-state,
          .empty-state {
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

          .loading-text,
          .empty-text {
            color: #64748b;
            font-size: 1.1rem;
            font-weight: 600;
          }

          .empty-icon {
            font-size: 4rem;
            margin-bottom: 1rem;
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
            max-width: 600px;
            width: 100%;
            max-height: 90vh;
            overflow-y: auto;
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

          .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 0.875rem;
            margin-bottom: 0.5rem;
            background: #f8fafc;
            border-radius: 8px;
          }

          .detail-label {
            font-weight: 600;
            color: #475569;
          }

          .detail-value {
            color: #1e293b;
            font-weight: 500;
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

          .btn-cancel {
            background: #f1f5f9;
            color: #475569;
          }

          .btn-cancel:hover {
            background: #e2e8f0;
          }

          .btn-submit {
            background: linear-gradient(135deg, #0b6b61, #139b86);
            color: white;
          }

          .btn-submit:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(11, 107, 97, 0.3);
          }

          /* Responsive Design */
          @media (max-width: 768px) {
            .lab-requests-content {
              padding: 1.5rem 1rem;
            }

            .page-title {
              font-size: 2rem;
            }

            .filters-row {
              grid-template-columns: 1fr;
            }

            .table-container {
              overflow-x: auto;
            }

            .requests-table {
              min-width: 800px;
            }

            .results-info {
              flex-direction: column;
              gap: 1rem;
              align-items: flex-start;
            }

            .clear-filters-btn {
              width: 100%;
            }

            .actions-cell {
              flex-direction: column;
            }

            .action-btn {
              width: 100%;
            }

            .modal-content {
              padding: 1.5rem;
            }

            .modal-footer {
              flex-direction: column;
            }

            .modal-btn {
              width: 100%;
            }
          }
        `}
      </style>

      {/* ---------- PAGE LAYOUT ---------- */}
      <div className="lab-requests-page">
        <Sidebar />

        <div className="lab-requests-content">
          <div className="page-header">
            <h1 className="page-title">🧪 Lab Test Requests</h1>
            <p className="page-subtitle">
              Manage and process all laboratory test requests
            </p>
          </div>

          {/* Filters Section */}
          <div className="filters-section">
            <div className="filters-row">
              <div className="filter-group">
                <label className="filter-label">Status</label>
                <select
                  className="filter-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="All">All Status</option>
                  <option value="Pending">Pending</option>
                  <option value="Sample Collection">Sample Collection</option>
                  <option value="Processing">Processing</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div className="filter-group">
                <label className="filter-label">Date Range</label>
                <select
                  className="filter-select"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                >
                  <option value="All">All Dates</option>
                  <option value="Today">Today</option>
                  <option value="This Week">This Week</option>
                  <option value="Custom">Custom Range</option>
                </select>
              </div>

              {dateFilter === "Custom" && (
                <>
                  <div className="filter-group">
                    <label className="filter-label">Start Date</label>
                    <input
                      type="date"
                      className="filter-input"
                      value={dateRange.start}
                      onChange={(e) =>
                        setDateRange({ ...dateRange, start: e.target.value })
                      }
                    />
                  </div>

                  <div className="filter-group">
                    <label className="filter-label">End Date</label>
                    <input
                      type="date"
                      className="filter-input"
                      value={dateRange.end}
                      onChange={(e) =>
                        setDateRange({ ...dateRange, end: e.target.value })
                      }
                    />
                  </div>
                </>
              )}

              <div className="filter-group">
                <label className="filter-label">Home Service</label>
                <div className="checkbox-group">
                  <input
                    type="checkbox"
                    className="checkbox-input"
                    checked={homeServiceFilter}
                    onChange={(e) => setHomeServiceFilter(e.target.checked)}
                  />
                  <span>Show only home service requests</span>
                </div>
              </div>
            </div>

            <div className="filter-group">
              <label className="filter-label">Search</label>
              <input
                type="text"
                className="search-bar"
                placeholder="Search by patient name or test type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Results Info */}
          <div className="results-info">
            <span className="results-count">
              Showing {currentTests.length} of {filteredTests.length} results
            </span>
            <button
              className="clear-filters-btn"
              onClick={() => {
                setStatusFilter("All");
                setDateFilter("All");
                setHomeServiceFilter(false);
                setSearchQuery("");
                setDateRange({ start: "", end: "" });
              }}
            >
              Clear All Filters
            </button>
          </div>

          {/* Table */}
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p className="loading-text">Loading test requests...</p>
            </div>
          ) : currentTests.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <p className="empty-text">No test requests found</p>
            </div>
          ) : (
            <>
              <div className="table-container">
                <table className="requests-table">
                  <thead>
                    <tr>
                      <th>Patient</th>
                      <th>Test</th>
                      <th>Date & Time</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentTests.map((test) => (
                      <tr key={test._id}>
                        <td className="patient-cell">
                          {test.patientId?.name || "Unknown Patient"}
                          {test.homeService && (
                            <span className="home-service-badge">🏠 Home</span>
                          )}
                        </td>
                        <td className="test-cell">
                          <div>{test.testName}</div>
                          <div style={{ fontSize: "0.85rem", color: "#64748b" }}>
                            {test.testType}
                          </div>
                        </td>
                        <td className="date-cell">
                          <div>{formatDate(test.preferredDate)}</div>
                          <div style={{ fontSize: "0.85rem" }}>
                            {formatTime(test.preferredTime)}
                          </div>
                        </td>
                        <td>
                          <span
                            className={`status-badge ${getStatusBadgeClass(
                              test.status
                            )}`}
                          >
                            {test.status}
                          </span>
                        </td>
                        <td>
                          <div className="actions-cell">
                            <button
                              className="action-btn btn-view"
                              onClick={() => {
                                setSelectedTest(test);
                                setShowDetailsModal(true);
                              }}
                            >
                              View Details
                            </button>
                            <button
                              className="action-btn btn-update"
                              onClick={() => {
                                setSelectedTest(test);
                                setNewStatus(test.status);
                                setShowStatusModal(true);
                              }}
                            >
                              Update Status
                            </button>
                            <button
                              className="action-btn btn-results"
                              onClick={() =>
                                navigate(`/entertestresults/${test._id}`)
                              }
                            >
                              Enter Results
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    className="page-btn"
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </button>

                  {[...Array(totalPages)].map((_, index) => (
                    <button
                      key={index + 1}
                      className={`page-btn ${
                        currentPage === index + 1 ? "active" : ""
                      }`}
                      onClick={() => paginate(index + 1)}
                    >
                      {index + 1}
                    </button>
                  ))}

                  <button
                    className="page-btn"
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* View Details Modal */}
      {showDetailsModal && selectedTest && (
        <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Test Request Details</h2>
              <button
                className="modal-close"
                onClick={() => setShowDetailsModal(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="detail-row">
                <span className="detail-label">Patient Name:</span>
                <span className="detail-value">
                  {selectedTest.patientId?.name || "N/A"}
                </span>
              </div>

              <div className="detail-row">
                <span className="detail-label">Patient Email:</span>
                <span className="detail-value">
                  {selectedTest.patientId?.email || "N/A"}
                </span>
              </div>

              <div className="detail-row">
                <span className="detail-label">Patient Phone:</span>
                <span className="detail-value">
                  {selectedTest.patientId?.phoneNum || "N/A"}
                </span>
              </div>

              <div className="detail-row">
                <span className="detail-label">Test Name:</span>
                <span className="detail-value">{selectedTest.testName}</span>
              </div>

              <div className="detail-row">
                <span className="detail-label">Test Type:</span>
                <span className="detail-value">{selectedTest.testType}</span>
              </div>

              <div className="detail-row">
                <span className="detail-label">Preferred Date:</span>
                <span className="detail-value">
                  {formatDate(selectedTest.preferredDate)}
                </span>
              </div>

              <div className="detail-row">
                <span className="detail-label">Preferred Time:</span>
                <span className="detail-value">
                  {formatTime(selectedTest.preferredTime)}
                </span>
              </div>

              <div className="detail-row">
                <span className="detail-label">Cost:</span>
                <span className="detail-value">₹{selectedTest.cost}</span>
              </div>

              <div className="detail-row">
                <span className="detail-label">Status:</span>
                <span className="detail-value">
                  <span
                    className={`status-badge ${getStatusBadgeClass(
                      selectedTest.status
                    )}`}
                  >
                    {selectedTest.status}
                  </span>
                </span>
              </div>

              <div className="detail-row">
                <span className="detail-label">Home Service:</span>
                <span className="detail-value">
                  {selectedTest.homeService ? "Yes" : "No"}
                </span>
              </div>

              {selectedTest.homeService && selectedTest.address && (
                <div className="detail-row">
                  <span className="detail-label">Address:</span>
                  <span className="detail-value">{selectedTest.address}</span>
                </div>
              )}

              {selectedTest.sampleCollectedDate && (
                <div className="detail-row">
                  <span className="detail-label">Sample Collected:</span>
                  <span className="detail-value">
                    {formatDate(selectedTest.sampleCollectedDate)}
                  </span>
                </div>
              )}

              <div className="detail-row">
                <span className="detail-label">Booking Date:</span>
                <span className="detail-value">
                  {formatDate(selectedTest.createdAt)}
                </span>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="modal-btn btn-cancel"
                onClick={() => setShowDetailsModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Status Modal */}
      {showStatusModal && selectedTest && (
        <div className="modal-overlay" onClick={() => setShowStatusModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Update Test Status</h2>
              <button
                className="modal-close"
                onClick={() => setShowStatusModal(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="detail-row">
                <span className="detail-label">Patient:</span>
                <span className="detail-value">
                  {selectedTest.patientId?.name || "N/A"}
                </span>
              </div>

              <div className="detail-row">
                <span className="detail-label">Test:</span>
                <span className="detail-value">{selectedTest.testName}</span>
              </div>

              <div className="detail-row">
                <span className="detail-label">Current Status:</span>
                <span className="detail-value">
                  <span
                    className={`status-badge ${getStatusBadgeClass(
                      selectedTest.status
                    )}`}
                  >
                    {selectedTest.status}
                  </span>
                </span>
              </div>

              <div className="filter-group" style={{ marginTop: "1.5rem" }}>
                <label className="filter-label">New Status:</label>
                <select
                  className="filter-select"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                >
                  <option value="Pending">Pending</option>
                  <option value="Sample Collection">Sample Collection</option>
                  <option value="Processing">Processing</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="modal-btn btn-cancel"
                onClick={() => setShowStatusModal(false)}
              >
                Cancel
              </button>
              <button
                className="modal-btn btn-submit"
                onClick={handleUpdateStatus}
              >
                Update Status
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LabTestRequests;
