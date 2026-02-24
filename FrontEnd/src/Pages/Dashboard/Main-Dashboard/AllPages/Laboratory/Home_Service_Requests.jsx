import { useState, useEffect } from "react";
import Sidebar from "../../GlobalFiles/Sidebar";
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";

const notify = (text) => toast(text);

const HomeServiceRequests = () => {
  const { data } = useSelector((store) => store.auth);
  const [loading, setLoading] = useState(true);
  const [allRequests, setAllRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  
  // Filter states
  const [dateFilter, setDateFilter] = useState("All");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [searchQuery, setSearchQuery] = useState("");
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Modal states
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  useEffect(() => {
    fetchHomeServiceRequests();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [allRequests, dateFilter, searchQuery, dateRange]);

  const fetchHomeServiceRequests = async () => {
    try {
      setLoading(true);
      const token = data?.token;
      const response = await axios.get(
        "http://127.0.0.1:3001/lab-reports/home-service",
        {
          headers: {
            Authorization: token,
          },
        }
      );
      setAllRequests(response.data.labReports || []);
    } catch (error) {
      console.error("Error fetching home service requests:", error);
      notify("Failed to fetch home service requests");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...allRequests];

    // Date filter
    if (dateFilter === "Today") {
      const today = new Date().toDateString();
      filtered = filtered.filter(
        (request) => new Date(request.preferredDate).toDateString() === today
      );
    } else if (dateFilter === "This Week") {
      const today = new Date();
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(
        (request) => new Date(request.preferredDate) >= weekAgo
      );
    } else if (dateFilter === "Custom" && dateRange.start && dateRange.end) {
      filtered = filtered.filter((request) => {
        const requestDate = new Date(request.preferredDate);
        return (
          requestDate >= new Date(dateRange.start) &&
          requestDate <= new Date(dateRange.end)
        );
      });
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (request) =>
          request.patientId?.name?.toLowerCase().includes(query) ||
          request.testName?.toLowerCase().includes(query) ||
          request.address?.toLowerCase().includes(query)
      );
    }

    setFilteredRequests(filtered);
    setCurrentPage(1);
  };

  const handleMarkAsCollected = async () => {
    if (!selectedRequest) return;

    try {
      const token = data?.token;
      await axios.put(
        `http://127.0.0.1:3001/lab-reports/update-status/${selectedRequest._id}`,
        {
          status: "Sample Collection",
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
      notify("✅ Sample marked as collected successfully!");
      setShowConfirmModal(false);
      setSelectedRequest(null);
      fetchHomeServiceRequests();
    } catch (error) {
      console.error("Error marking as collected:", error);
      notify("Failed to mark sample as collected");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return "N/A";
    return timeString;
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

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentRequests = filteredRequests.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (!data?.isAuthenticated) return <Navigate to="/" />;
  if (data?.user.userType !== "laboratory") return <Navigate to="/dashboard" />;

  return (
    <>
      <ToastContainer />

      {/* ---------- INLINE MODERN CSS ---------- */}
      <style>
        {`
          .home-service-page {
            display: flex;
            min-height: 100vh;
            background: linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%);
          }

          .home-service-content {
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
            display: flex;
            align-items: center;
            gap: 0.75rem;
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

          .requests-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
            gap: 1.5rem;
            margin-bottom: 2rem;
          }

          .request-card {
            background: white;
            border-radius: 16px;
            padding: 1.75rem;
            box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
            border: 2px solid #e2e8f0;
            transition: all 0.3s ease;
          }

          .request-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
            border-color: #0b6b61;
          }

          .request-header {
            display: flex;
            justify-content: space-between;
            align-items: start;
            margin-bottom: 1.25rem;
            padding-bottom: 1rem;
            border-bottom: 2px solid #e2e8f0;
          }

          .patient-info {
            flex: 1;
          }

          .patient-name {
            font-size: 1.25rem;
            font-weight: 700;
            color: #0b6b61;
            margin-bottom: 0.25rem;
          }

          .patient-contact {
            font-size: 0.9rem;
            color: #64748b;
            margin-bottom: 0.25rem;
          }

          .status-badge {
            padding: 0.5rem 1rem;
            border-radius: 8px;
            font-weight: 600;
            font-size: 0.85rem;
            white-space: nowrap;
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

          .request-details {
            margin-bottom: 1.25rem;
          }

          .detail-item {
            display: flex;
            align-items: start;
            gap: 0.75rem;
            margin-bottom: 0.875rem;
            padding: 0.75rem;
            background: #f8fafc;
            border-radius: 8px;
          }

          .detail-icon {
            font-size: 1.25rem;
            flex-shrink: 0;
          }

          .detail-content {
            flex: 1;
          }

          .detail-label {
            font-size: 0.8rem;
            color: #64748b;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 0.25rem;
          }

          .detail-value {
            font-size: 1rem;
            color: #1e293b;
            font-weight: 600;
          }

          .address-value {
            font-size: 1.05rem;
            color: #0b6b61;
            font-weight: 700;
            line-height: 1.5;
          }

          .request-actions {
            display: flex;
            gap: 0.75rem;
          }

          .action-btn {
            flex: 1;
            padding: 0.875rem 1.25rem;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 0.95rem;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
          }

          .btn-collect {
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
          }

          .btn-collect:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
          }

          .btn-collect:disabled {
            background: #e2e8f0;
            color: #94a3b8;
            cursor: not-allowed;
            transform: none;
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
            max-width: 500px;
            width: 100%;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          }

          .modal-header {
            margin-bottom: 1.5rem;
            text-align: center;
          }

          .modal-icon {
            font-size: 4rem;
            margin-bottom: 1rem;
          }

          .modal-title {
            font-size: 1.5rem;
            font-weight: 700;
            color: #0b6b61;
            margin-bottom: 0.5rem;
          }

          .modal-message {
            font-size: 1rem;
            color: #64748b;
            line-height: 1.6;
          }

          .modal-details {
            background: #f8fafc;
            padding: 1.25rem;
            border-radius: 12px;
            margin-bottom: 1.5rem;
          }

          .modal-detail-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 0.75rem;
          }

          .modal-detail-row:last-child {
            margin-bottom: 0;
          }

          .modal-detail-label {
            font-weight: 600;
            color: #475569;
          }

          .modal-detail-value {
            color: #1e293b;
            font-weight: 600;
          }

          .modal-footer {
            display: flex;
            gap: 1rem;
          }

          .modal-btn {
            flex: 1;
            padding: 0.875rem 1.5rem;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            font-size: 1rem;
          }

          .btn-cancel {
            background: #f1f5f9;
            color: #475569;
          }

          .btn-cancel:hover {
            background: #e2e8f0;
          }

          .btn-confirm {
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
          }

          .btn-confirm:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
          }

          /* Responsive Design */
          @media (max-width: 768px) {
            .home-service-content {
              padding: 1.5rem 1rem;
            }

            .page-title {
              font-size: 2rem;
            }

            .filters-row {
              grid-template-columns: 1fr;
            }

            .requests-grid {
              grid-template-columns: 1fr;
            }

            .results-info {
              flex-direction: column;
              gap: 1rem;
              align-items: flex-start;
            }

            .clear-filters-btn {
              width: 100%;
            }

            .request-header {
              flex-direction: column;
              gap: 1rem;
            }

            .status-badge {
              align-self: flex-start;
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
      <div className="home-service-page">
        <Sidebar />

        <div className="home-service-content">
          <div className="page-header">
            <h1 className="page-title">
              <span>🏠</span>
              Home Service Requests
            </h1>
            <p className="page-subtitle">
              Manage sample collection for home service requests
            </p>
          </div>

          {/* Filters Section */}
          <div className="filters-section">
            <div className="filters-row">
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
            </div>

            <div className="filter-group">
              <label className="filter-label">Search</label>
              <input
                type="text"
                className="search-bar"
                placeholder="Search by patient name, test type, or address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Results Info */}
          <div className="results-info">
            <span className="results-count">
              Showing {currentRequests.length} of {filteredRequests.length} requests
            </span>
            <button
              className="clear-filters-btn"
              onClick={() => {
                setDateFilter("All");
                setSearchQuery("");
                setDateRange({ start: "", end: "" });
              }}
            >
              Clear All Filters
            </button>
          </div>

          {/* Requests Grid */}
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p className="loading-text">Loading home service requests...</p>
            </div>
          ) : currentRequests.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🏠</div>
              <p className="empty-text">No home service requests found</p>
            </div>
          ) : (
            <>
              <div className="requests-grid">
                {currentRequests.map((request) => (
                  <div key={request._id} className="request-card">
                    <div className="request-header">
                      <div className="patient-info">
                        <div className="patient-name">
                          {request.patientId?.name || "Unknown Patient"}
                        </div>
                        <div className="patient-contact">
                          📧 {request.patientId?.email || "N/A"}
                        </div>
                        <div className="patient-contact">
                          📱 {request.patientId?.phoneNum || "N/A"}
                        </div>
                      </div>
                      <span
                        className={`status-badge ${getStatusBadgeClass(
                          request.status
                        )}`}
                      >
                        {request.status}
                      </span>
                    </div>

                    <div className="request-details">
                      <div className="detail-item">
                        <div className="detail-icon">🧪</div>
                        <div className="detail-content">
                          <div className="detail-label">Test Name</div>
                          <div className="detail-value">{request.testName}</div>
                        </div>
                      </div>

                      <div className="detail-item">
                        <div className="detail-icon">📍</div>
                        <div className="detail-content">
                          <div className="detail-label">Patient Address</div>
                          <div className="address-value">
                            {request.address || "Address not provided"}
                          </div>
                        </div>
                      </div>

                      <div className="detail-item">
                        <div className="detail-icon">📅</div>
                        <div className="detail-content">
                          <div className="detail-label">Preferred Date</div>
                          <div className="detail-value">
                            {formatDate(request.preferredDate)}
                          </div>
                        </div>
                      </div>

                      <div className="detail-item">
                        <div className="detail-icon">🕐</div>
                        <div className="detail-content">
                          <div className="detail-label">Preferred Time</div>
                          <div className="detail-value">
                            {formatTime(request.preferredTime)}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="request-actions">
                      <button
                        className="action-btn btn-collect"
                        onClick={() => {
                          setSelectedRequest(request);
                          setShowConfirmModal(true);
                        }}
                        disabled={request.status !== "Pending"}
                      >
                        <span>✓</span>
                        {request.status === "Pending"
                          ? "Mark as Collected"
                          : "Already Collected"}
                      </button>
                    </div>
                  </div>
                ))}
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

      {/* Confirmation Modal */}
      {showConfirmModal && selectedRequest && (
        <div
          className="modal-overlay"
          onClick={() => setShowConfirmModal(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-icon">✅</div>
              <h2 className="modal-title">Confirm Sample Collection</h2>
              <p className="modal-message">
                Are you sure you want to mark this sample as collected?
              </p>
            </div>

            <div className="modal-details">
              <div className="modal-detail-row">
                <span className="modal-detail-label">Patient:</span>
                <span className="modal-detail-value">
                  {selectedRequest.patientId?.name || "Unknown"}
                </span>
              </div>
              <div className="modal-detail-row">
                <span className="modal-detail-label">Test:</span>
                <span className="modal-detail-value">
                  {selectedRequest.testName}
                </span>
              </div>
              <div className="modal-detail-row">
                <span className="modal-detail-label">Address:</span>
                <span className="modal-detail-value">
                  {selectedRequest.address || "N/A"}
                </span>
              </div>
              <div className="modal-detail-row">
                <span className="modal-detail-label">Date:</span>
                <span className="modal-detail-value">
                  {formatDate(selectedRequest.preferredDate)}
                </span>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="modal-btn btn-cancel"
                onClick={() => setShowConfirmModal(false)}
              >
                Cancel
              </button>
              <button
                className="modal-btn btn-confirm"
                onClick={handleMarkAsCollected}
              >
                Confirm Collection
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default HomeServiceRequests;
