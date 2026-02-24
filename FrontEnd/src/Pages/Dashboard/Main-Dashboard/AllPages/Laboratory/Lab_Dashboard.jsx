import { useState, useEffect } from "react";
import Sidebar from "../../GlobalFiles/Sidebar";
import { Navigate, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";

const notify = (text) => toast(text);

const LabDashboard = () => {
  const { data } = useSelector((store) => store.auth);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState({
    pending: 0,
    sampleCollection: 0,
    processing: 0,
    completedToday: 0,
  });
  const [recentTests, setRecentTests] = useState([]);
  const [homeServiceRequests, setHomeServiceRequests] = useState([]);

  // Fetch all data on mount
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = data?.token;

      // Fetch all lab reports
      const allReportsResponse = await axios.get(
        "http://127.0.0.1:3001/lab-reports/all",
        {
          headers: {
            Authorization: token,
          },
        }
      );

      const allReports = allReportsResponse.data.labReports || [];

      // Calculate statistics
      const stats = {
        pending: allReports.filter((r) => r.status === "Pending").length,
        sampleCollection: allReports.filter(
          (r) => r.status === "Sample Collection"
        ).length,
        processing: allReports.filter((r) => r.status === "Processing").length,
        completedToday: allReports.filter((r) => {
          if (r.status === "Completed" && r.updatedAt) {
            const today = new Date().toDateString();
            const reportDate = new Date(r.updatedAt).toDateString();
            return today === reportDate;
          }
          return false;
        }).length,
      };

      setStatistics(stats);

      // Get recent test requests (last 5)
      const recent = allReports
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);
      setRecentTests(recent);

      // Fetch home service requests
      const homeServiceResponse = await axios.get(
        "http://127.0.0.1:3001/lab-reports/home-service",
        {
          headers: {
            Authorization: token,
          },
        }
      );

      const homeServices = homeServiceResponse.data.labReports || [];
      setHomeServiceRequests(homeServices.slice(0, 5));
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      notify("Failed to fetch dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = (status) => {
    // Navigate to Lab Test Requests page with filter
    navigate("/labtestrequests", { state: { filterStatus: status } });
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

  if (!data?.isAuthenticated) return <Navigate to="/" />;
  if (data?.user.userType !== "laboratory") return <Navigate to="/dashboard" />;

  return (
    <>
      <ToastContainer />

      {/* ---------- INLINE MODERN CSS ---------- */}
      <style>
        {`
          .lab-dashboard-page {
            display: flex;
            min-height: 100vh;
            background: linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%);
          }

          .lab-dashboard-content {
            flex: 1;
            padding: 2.5rem 3rem;
            overflow-y: auto;
          }

          .dashboard-header {
            margin-bottom: 2rem;
          }

          .dashboard-title {
            font-size: 2.5rem;
            font-weight: 800;
            color: #0b6b61;
            margin-bottom: 0.5rem;
          }

          .dashboard-subtitle {
            font-size: 1.1rem;
            color: #64748b;
            font-weight: 500;
          }

          .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1.5rem;
            margin-bottom: 2.5rem;
          }

          .stat-card {
            background: white;
            padding: 1.75rem;
            border-radius: 16px;
            box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
            cursor: pointer;
            transition: all 0.3s ease;
            border: 2px solid transparent;
          }

          .stat-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
            border-color: #0b6b61;
          }

          .stat-card-pending {
            border-left: 4px solid #fbbf24;
          }

          .stat-card-collection {
            border-left: 4px solid #3b82f6;
          }

          .stat-card-processing {
            border-left: 4px solid #8b5cf6;
          }

          .stat-card-completed {
            border-left: 4px solid #10b981;
          }

          .stat-icon {
            font-size: 2.5rem;
            margin-bottom: 0.75rem;
          }

          .stat-value {
            font-size: 2.5rem;
            font-weight: 800;
            color: #1e293b;
            margin-bottom: 0.5rem;
          }

          .stat-label {
            font-size: 1rem;
            color: #64748b;
            font-weight: 600;
          }

          .section-card {
            background: white;
            border-radius: 16px;
            box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
            padding: 2rem;
            margin-bottom: 2rem;
          }

          .section-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1.5rem;
            padding-bottom: 1rem;
            border-bottom: 2px solid #e2e8f0;
          }

          .section-title {
            font-size: 1.5rem;
            font-weight: 700;
            color: #0b6b61;
          }

          .view-all-btn {
            padding: 0.5rem 1.25rem;
            background: linear-gradient(135deg, #0b6b61, #139b86);
            color: white;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            font-size: 0.9rem;
          }

          .view-all-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(11, 107, 97, 0.3);
          }

          .test-list {
            display: flex;
            flex-direction: column;
            gap: 1rem;
          }

          .test-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1.25rem;
            background: #f8fafc;
            border-radius: 12px;
            border: 2px solid #e2e8f0;
            transition: all 0.2s ease;
          }

          .test-item:hover {
            background: #f0f4ff;
            border-color: #0b6b61;
          }

          .test-info {
            flex: 1;
          }

          .test-patient {
            font-weight: 700;
            color: #1e293b;
            font-size: 1.05rem;
            margin-bottom: 0.25rem;
          }

          .test-details {
            color: #64748b;
            font-size: 0.9rem;
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

          .home-service-item {
            display: flex;
            flex-direction: column;
            padding: 1.25rem;
            background: #f0fdf4;
            border-radius: 12px;
            border: 2px solid #86efac;
            margin-bottom: 1rem;
            transition: all 0.2s ease;
          }

          .home-service-item:hover {
            background: #dcfce7;
            border-color: #22c55e;
          }

          .home-service-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 0.75rem;
          }

          .home-service-patient {
            font-weight: 700;
            color: #1e293b;
            font-size: 1.05rem;
          }

          .home-service-badge {
            padding: 0.375rem 0.75rem;
            background: linear-gradient(135deg, #34d399, #10b981);
            color: white;
            border-radius: 6px;
            font-size: 0.8rem;
            font-weight: 600;
          }

          .home-service-test {
            color: #64748b;
            font-size: 0.95rem;
            margin-bottom: 0.5rem;
          }

          .home-service-address {
            color: #475569;
            font-size: 0.9rem;
            margin-bottom: 0.5rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }

          .home-service-schedule {
            color: #0b6b61;
            font-weight: 600;
            font-size: 0.9rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
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

          .empty-state {
            text-align: center;
            padding: 3rem 2rem;
            color: #64748b;
          }

          .empty-icon {
            font-size: 4rem;
            margin-bottom: 1rem;
          }

          .empty-text {
            font-size: 1.1rem;
            font-weight: 600;
          }

          /* Responsive Design */
          @media (max-width: 768px) {
            .lab-dashboard-content {
              padding: 1.5rem 1rem;
            }

            .dashboard-title {
              font-size: 2rem;
            }

            .stats-grid {
              grid-template-columns: 1fr;
              gap: 1rem;
            }

            .section-card {
              padding: 1.5rem;
            }

            .section-header {
              flex-direction: column;
              align-items: flex-start;
              gap: 1rem;
            }

            .view-all-btn {
              width: 100%;
            }

            .test-item {
              flex-direction: column;
              align-items: flex-start;
              gap: 0.75rem;
            }

            .status-badge {
              align-self: flex-start;
            }
          }
        `}
      </style>

      {/* ---------- PAGE LAYOUT ---------- */}
      <div className="lab-dashboard-page">
        <Sidebar />

        <div className="lab-dashboard-content">
          <div className="dashboard-header">
            <h1 className="dashboard-title">🧪 Laboratory Dashboard</h1>
            <p className="dashboard-subtitle">
              Welcome back, {data?.user?.name || "Lab Personnel"}
            </p>
          </div>

          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p className="loading-text">Loading dashboard data...</p>
            </div>
          ) : (
            <>
              {/* Statistics Cards */}
              <div className="stats-grid">
                <div
                  className="stat-card stat-card-pending"
                  onClick={() => handleCardClick("Pending")}
                >
                  <div className="stat-icon">⏳</div>
                  <div className="stat-value">{statistics.pending}</div>
                  <div className="stat-label">Pending Tests</div>
                </div>

                <div
                  className="stat-card stat-card-collection"
                  onClick={() => handleCardClick("Sample Collection")}
                >
                  <div className="stat-icon">🩸</div>
                  <div className="stat-value">{statistics.sampleCollection}</div>
                  <div className="stat-label">Sample Collection</div>
                </div>

                <div
                  className="stat-card stat-card-processing"
                  onClick={() => handleCardClick("Processing")}
                >
                  <div className="stat-icon">🔬</div>
                  <div className="stat-value">{statistics.processing}</div>
                  <div className="stat-label">Processing</div>
                </div>

                <div
                  className="stat-card stat-card-completed"
                  onClick={() => handleCardClick("Completed")}
                >
                  <div className="stat-icon">✅</div>
                  <div className="stat-value">{statistics.completedToday}</div>
                  <div className="stat-label">Completed Today</div>
                </div>
              </div>

              {/* Recent Test Requests */}
              <div className="section-card">
                <div className="section-header">
                  <h2 className="section-title">Recent Test Requests</h2>
                  <button
                    className="view-all-btn"
                    onClick={() => navigate("/labtestrequests")}
                  >
                    View All →
                  </button>
                </div>

                {recentTests.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">📋</div>
                    <p className="empty-text">No recent test requests</p>
                  </div>
                ) : (
                  <div className="test-list">
                    {recentTests.map((test) => (
                      <div key={test._id} className="test-item">
                        <div className="test-info">
                          <div className="test-patient">
                            {test.patientId?.name || "Unknown Patient"}
                          </div>
                          <div className="test-details">
                            {test.testName} • {formatDate(test.preferredDate)} at{" "}
                            {formatTime(test.preferredTime)}
                          </div>
                        </div>
                        <span className={`status-badge ${getStatusBadgeClass(test.status)}`}>
                          {test.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Home Service Requests */}
              <div className="section-card">
                <div className="section-header">
                  <h2 className="section-title">
                    🏠 Home Service Requests ({homeServiceRequests.length})
                  </h2>
                  <button
                    className="view-all-btn"
                    onClick={() => navigate("/home-service-requests")}
                  >
                    View All →
                  </button>
                </div>

                {homeServiceRequests.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">🏠</div>
                    <p className="empty-text">No home service requests</p>
                  </div>
                ) : (
                  <div>
                    {homeServiceRequests.map((request) => (
                      <div key={request._id} className="home-service-item">
                        <div className="home-service-header">
                          <div className="home-service-patient">
                            {request.patientId?.name || "Unknown Patient"}
                          </div>
                          <span className="home-service-badge">🏠 Home Service</span>
                        </div>
                        <div className="home-service-test">
                          Test: {request.testName}
                        </div>
                        <div className="home-service-address">
                          📍 {request.address || "Address not provided"}
                        </div>
                        <div className="home-service-schedule">
                          📅 {formatDate(request.preferredDate)} at{" "}
                          {formatTime(request.preferredTime)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default LabDashboard;
