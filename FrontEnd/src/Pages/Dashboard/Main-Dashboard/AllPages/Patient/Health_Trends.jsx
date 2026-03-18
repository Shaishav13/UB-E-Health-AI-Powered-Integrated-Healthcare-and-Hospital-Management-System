import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import Sidebar from "../../GlobalFiles/Sidebar";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import Footer from "../../../../../Components/Footer";
import { calculateHealthScore, getHealthScoreGradient, getHealthScoreStatus, getHealthScoreColor } from "../../../../../utils/healthScore";
import { FaHeart } from "react-icons/fa";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const notify = (text) => toast(text);

const Health_Trends = () => {
  const { data } = useSelector((store) => store.auth);
  const [loading, setLoading] = useState(true);
  const [healthData, setHealthData] = useState(null);
  const [stats, setStats] = useState(null);
  const [selectedMetric, setSelectedMetric] = useState('all');
  const [healthScore, setHealthScore] = useState(100);

  useEffect(() => {
    if (data?.user?._id) {
      fetchHealthTrends();
    }
  }, [data]);

  const fetchHealthTrends = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `http://127.0.0.1:3001/analytics/health-trends/${data.user._id}`
      );
      console.log("Health trends response:", response.data);
      setHealthData(response.data.data);
      setStats(response.data.stats);
      
      // Calculate health score
      const score = calculateHealthScore(response.data.stats);
      setHealthScore(score);
      
      setLoading(false);
    } catch (error) {
      console.error("Error fetching health trends:", error);
      notify("❌ Failed to load health trends");
      // Default to perfect score if no data
      setHealthScore(100);
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!healthData || !healthData.rawData || healthData.rawData.length === 0) {
      notify("⚠️ No data to export");
      return;
    }

    const headers = ['Date', 'Temperature', 'Weight', 'Blood Pressure', 'Glucose', 'Disease'];
    const csvContent = [
      headers.join(','),
      ...healthData.rawData.map(row => 
        [row.date, row.temperature, row.weight, row.bloodPressure, row.glucose, row.disease].join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `health_data_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    notify("✅ Health data exported successfully");
  };

  const getChartData = (metric) => {
    if (!healthData) return null;

    const commonOptions = {
      labels: healthData.labels,
      datasets: []
    };

    switch(metric) {
      case 'temperature':
        return {
          ...commonOptions,
          datasets: [{
            label: 'Temperature (°F)',
            data: healthData.temperature,
            borderColor: 'rgb(239, 68, 68)',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            fill: true,
            tension: 0.4
          }]
        };
      case 'weight':
        return {
          ...commonOptions,
          datasets: [{
            label: 'Weight (kg)',
            data: healthData.weight,
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            fill: true,
            tension: 0.4
          }]
        };
      case 'bp':
        return {
          ...commonOptions,
          datasets: [
            {
              label: 'Systolic (mmHg)',
              data: healthData.systolic,
              borderColor: 'rgb(245, 158, 11)',
              backgroundColor: 'rgba(245, 158, 11, 0.1)',
              fill: true,
              tension: 0.4
            },
            {
              label: 'Diastolic (mmHg)',
              data: healthData.diastolic,
              borderColor: 'rgb(168, 85, 247)',
              backgroundColor: 'rgba(168, 85, 247, 0.1)',
              fill: true,
              tension: 0.4
            }
          ]
        };
      case 'glucose':
        return {
          ...commonOptions,
          datasets: [{
            label: 'Glucose (mg/dL)',
            data: healthData.glucose,
            borderColor: 'rgb(34, 197, 94)',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            fill: true,
            tension: 0.4
          }]
        };
      default:
        return null;
    }
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: {
            size: 12,
            weight: '600'
          },
          padding: 15
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: {
          size: 14,
          weight: 'bold'
        },
        bodyFont: {
          size: 13
        },
        cornerRadius: 8
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          font: {
            size: 11
          }
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 11
          },
          maxRotation: 45,
          minRotation: 45
        }
      }
    }
  };

  const getTrendIcon = (trend) => {
    if (!trend) return '➡️';
    if (trend === 'increasing') return '📈';
    if (trend === 'decreasing') return '📉';
    return '➡️';
  };

  const getTrendColor = (trend) => {
    if (!trend) return '#64748b';
    if (trend === 'increasing') return '#ef4444';
    if (trend === 'decreasing') return '#22c55e';
    return '#64748b';
  };

  if (!data?.isAuthenticated) return <Navigate to="/" />;
  if (data?.user.userType !== "patient") return <Navigate to="/dashboard" />;

  return (
    <>
      <ToastContainer />

      <style>{`
        .trends-container {
          display: flex;
          min-height: 100vh;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          width: 100%;
          position: relative;
        }

        .trends-container::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="trends-pattern" width="60" height="60" patternUnits="userSpaceOnUse"><circle cx="30" cy="30" r="2" fill="rgba(102,126,234,0.05)"/><circle cx="10" cy="10" r="1" fill="rgba(52,211,153,0.05)"/><circle cx="50" cy="10" r="1" fill="rgba(52,211,153,0.05)"/></pattern></defs><rect width="100" height="100" fill="url(%23trends-pattern)"/></svg>');
          pointer-events: none;
        }

        .trends-content {
          flex: 1;
          padding: 2.5rem 3rem;
          overflow-y: auto;
          position: relative;
          z-index: 1;
        }

        .trends-header {
          margin-bottom: 2.5rem;
        }

        .health-score-card {
          display: flex;
          align-items: center;
          gap: 1rem;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          padding: 1.25rem 1.75rem;
          border-radius: 20px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .health-score-icon-trends {
          font-size: 2.5rem;
          color: #ef4444;
          animation: heartbeat 1.5s ease-in-out infinite;
        }

        @keyframes heartbeat {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }

        .health-score-text-trends {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .health-score-label-trends {
          font-size: 0.85rem;
          color: #64748b;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .health-score-value-trends {
          font-size: 2rem;
          font-weight: 800;
          line-height: 1;
        }

        .health-score-status-trends {
          font-size: 0.9rem;
          color: #374151;
          font-weight: 600;
        }

        .trends-title {
          font-size: 2.5rem;
          font-weight: 800;
          margin-bottom: 0.5rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: -0.02em;
        }

        .trends-subtitle {
          font-size: 1.1rem;
          color: #64748b;
          font-weight: 500;
        }

        .actions-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .metric-filters {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .filter-btn {
          padding: 0.75rem 1.5rem;
          border: 2px solid rgba(102, 126, 234, 0.2);
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
          border-radius: 12px;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          color: #374151;
        }

        .filter-btn:hover {
          border-color: #667eea;
          color: #667eea;
          transform: translateY(-2px);
        }

        .filter-btn.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-color: transparent;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }

        .export-btn {
          padding: 0.75rem 1.5rem;
          background: linear-gradient(135deg, #34d399 0%, #10b981 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .export-btn:hover {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(52, 211, 153, 0.4);
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .stat-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          padding: 1.5rem;
          border-radius: 16px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          position: relative;
          overflow: hidden;
        }

        .stat-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
        }

        .stat-card.temp::before { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); }
        .stat-card.weight::before { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); }
        .stat-card.bp::before { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); }
        .stat-card.glucose::before { background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); }

        .stat-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .stat-title {
          font-size: 0.9rem;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .stat-trend {
          font-size: 1.2rem;
        }

        .stat-value {
          font-size: 2rem;
          font-weight: 800;
          color: #374151;
          margin-bottom: 0.5rem;
        }

        .stat-details {
          display: flex;
          justify-content: space-between;
          font-size: 0.85rem;
          color: #64748b;
        }

        .chart-container {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          padding: 2rem;
          border-radius: 20px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          margin-bottom: 2rem;
          position: relative;
          overflow: hidden;
        }

        .chart-container::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .chart-title {
          font-size: 1.3rem;
          font-weight: 700;
          color: #374151;
          margin-bottom: 1.5rem;
        }

        .chart-wrapper {
          height: 400px;
          position: relative;
        }

        .loading {
          text-align: center;
          padding: 4rem;
          font-size: 1.2rem;
          color: #64748b;
          font-weight: 500;
        }

        .empty-state {
          text-align: center;
          padding: 4rem 2rem;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-radius: 20px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          position: relative;
          overflow: hidden;
        }

        .empty-state::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .empty-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
          opacity: 0.7;
        }

        .empty-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #374151;
          margin-bottom: 0.5rem;
        }

        .empty-text {
          font-size: 1rem;
          color: #64748b;
          font-weight: 500;
        }

        @media (max-width: 768px) {
          .trends-content {
            padding: 1.5rem 1rem;
          }

          .trends-title {
            font-size: 2rem;
          }

          .actions-bar {
            flex-direction: column;
            align-items: stretch;
          }

          .metric-filters {
            justify-content: center;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .chart-wrapper {
            height: 300px;
          }
        }
      `}</style>

      <div className="trends-container">
        <Sidebar />

        <div className="trends-content">
          <div className="trends-header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h1 className="trends-title">📊 Health Trends</h1>
                <p className="trends-subtitle">
                  Track your vital signs over time
                </p>
              </div>
              <div className="health-score-card">
                <FaHeart className="health-score-icon-trends" />
                <div className="health-score-text-trends">
                  <span className="health-score-label-trends">Overall Health Score</span>
                  <span 
                    className="health-score-value-trends" 
                    style={{ 
                      color: getHealthScoreColor(healthScore),
                      fontWeight: '800'
                    }}
                  >
                    {healthScore}
                  </span>
                  <span className="health-score-status-trends">{getHealthScoreStatus(healthScore)}</span>
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="loading">Loading health data...</div>
          ) : !healthData || healthData.labels.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📊</div>
              <div className="empty-title">No Health Data Yet</div>
              <div className="empty-text">
                Your health trends will appear here once you have medical reports with vital signs
              </div>
            </div>
          ) : (
            <>
              <div className="actions-bar">
                <div className="metric-filters">
                  <button 
                    className={`filter-btn ${selectedMetric === 'all' ? 'active' : ''}`}
                    onClick={() => setSelectedMetric('all')}
                  >
                    All Metrics
                  </button>
                  <button 
                    className={`filter-btn ${selectedMetric === 'temperature' ? 'active' : ''}`}
                    onClick={() => setSelectedMetric('temperature')}
                  >
                    🌡️ Temperature
                  </button>
                  <button 
                    className={`filter-btn ${selectedMetric === 'weight' ? 'active' : ''}`}
                    onClick={() => setSelectedMetric('weight')}
                  >
                    ⚖️ Weight
                  </button>
                  <button 
                    className={`filter-btn ${selectedMetric === 'bp' ? 'active' : ''}`}
                    onClick={() => setSelectedMetric('bp')}
                  >
                    💓 Blood Pressure
                  </button>
                  <button 
                    className={`filter-btn ${selectedMetric === 'glucose' ? 'active' : ''}`}
                    onClick={() => setSelectedMetric('glucose')}
                  >
                    🩸 Glucose
                  </button>
                </div>
                <button className="export-btn" onClick={exportToCSV}>
                  📥 Export CSV
                </button>
              </div>

              {stats && (
                <div className="stats-grid">
                  {stats.temperature.latest && (
                    <div className="stat-card temp">
                      <div className="stat-header">
                        <span className="stat-title">🌡️ Temperature</span>
                        <span className="stat-trend" style={{ color: getTrendColor(stats.temperature.trend) }}>
                          {getTrendIcon(stats.temperature.trend)}
                        </span>
                      </div>
                      <div className="stat-value">{stats.temperature.latest}°F</div>
                      <div className="stat-details">
                        <span>Min: {stats.temperature.min}°F</span>
                        <span>Avg: {stats.temperature.avg}°F</span>
                        <span>Max: {stats.temperature.max}°F</span>
                      </div>
                    </div>
                  )}

                  {stats.weight.latest && (
                    <div className="stat-card weight">
                      <div className="stat-header">
                        <span className="stat-title">⚖️ Weight</span>
                        <span className="stat-trend" style={{ color: getTrendColor(stats.weight.trend) }}>
                          {getTrendIcon(stats.weight.trend)}
                        </span>
                      </div>
                      <div className="stat-value">{stats.weight.latest} kg</div>
                      <div className="stat-details">
                        <span>Min: {stats.weight.min} kg</span>
                        <span>Avg: {stats.weight.avg} kg</span>
                        <span>Max: {stats.weight.max} kg</span>
                      </div>
                    </div>
                  )}

                  {stats.systolic.latest && (
                    <div className="stat-card bp">
                      <div className="stat-header">
                        <span className="stat-title">💓 Blood Pressure</span>
                        <span className="stat-trend" style={{ color: getTrendColor(stats.systolic.trend) }}>
                          {getTrendIcon(stats.systolic.trend)}
                        </span>
                      </div>
                      <div className="stat-value">{stats.systolic.latest}/{stats.diastolic.latest}</div>
                      <div className="stat-details">
                        <span>Sys Avg: {stats.systolic.avg}</span>
                        <span>Dia Avg: {stats.diastolic.avg}</span>
                      </div>
                    </div>
                  )}

                  {stats.glucose.latest && (
                    <div className="stat-card glucose">
                      <div className="stat-header">
                        <span className="stat-title">🩸 Glucose</span>
                        <span className="stat-trend" style={{ color: getTrendColor(stats.glucose.trend) }}>
                          {getTrendIcon(stats.glucose.trend)}
                        </span>
                      </div>
                      <div className="stat-value">{stats.glucose.latest} mg/dL</div>
                      <div className="stat-details">
                        <span>Min: {stats.glucose.min}</span>
                        <span>Avg: {stats.glucose.avg}</span>
                        <span>Max: {stats.glucose.max}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {(selectedMetric === 'all' || selectedMetric === 'temperature') && getChartData('temperature') && (
                <div className="chart-container">
                  <h3 className="chart-title">🌡️ Temperature Trend</h3>
                  <div className="chart-wrapper">
                    <Line data={getChartData('temperature')} options={chartOptions} />
                  </div>
                </div>
              )}

              {(selectedMetric === 'all' || selectedMetric === 'weight') && getChartData('weight') && (
                <div className="chart-container">
                  <h3 className="chart-title">⚖️ Weight Trend</h3>
                  <div className="chart-wrapper">
                    <Line data={getChartData('weight')} options={chartOptions} />
                  </div>
                </div>
              )}

              {(selectedMetric === 'all' || selectedMetric === 'bp') && getChartData('bp') && (
                <div className="chart-container">
                  <h3 className="chart-title">💓 Blood Pressure Trend</h3>
                  <div className="chart-wrapper">
                    <Line data={getChartData('bp')} options={chartOptions} />
                  </div>
                </div>
              )}

              {(selectedMetric === 'all' || selectedMetric === 'glucose') && getChartData('glucose') && (
                <div className="chart-container">
                  <h3 className="chart-title">🩸 Glucose Trend</h3>
                  <div className="chart-wrapper">
                    <Line data={getChartData('glucose')} options={chartOptions} />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Health_Trends;

