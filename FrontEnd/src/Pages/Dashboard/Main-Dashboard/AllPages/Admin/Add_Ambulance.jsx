import React from "react";
import Sidebar from "../../GlobalFiles/Sidebar";
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

const Add_Ambulance = () => {
  const { data } = useSelector((store) => store.auth);

  if (!data?.isAuthenticated) return <Navigate to="/" />;
  if (data?.user.userType !== "admin") return <Navigate to="/dashboard" />;

  return (
    <>
      {/* ---------- INLINE MODERN CSS ---------- */}
      <style>
        {`
          .ambu-page {
            display: flex;
            min-height: 100vh;
            background: #f5f7f8;
          }

          .ambu-content {
            flex: 1;
            padding: 2.5rem 3rem;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
          }

          .coming-soon-card {
            background: white;
            padding: 3rem 2.5rem;
            border-radius: 22px;
            max-width: 600px;
            width: 100%;
            box-shadow: 0 8px 24px rgba(0,0,0,0.12);
            text-align: center;
          }

          .coming-soon-icon {
            font-size: 5rem;
            margin-bottom: 1.5rem;
            animation: pulse 2s ease-in-out infinite;
          }

          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
          }

          .coming-soon-title {
            font-size: 2.2rem;
            font-weight: 700;
            color: #0b6b61;
            margin-bottom: 1rem;
          }

          .coming-soon-subtitle {
            font-size: 1.3rem;
            font-weight: 600;
            color: #555;
            margin-bottom: 1.5rem;
          }

          .coming-soon-message {
            font-size: 1.1rem;
            color: #666;
            line-height: 1.8;
            margin-bottom: 2rem;
          }

          .feature-badge {
            display: inline-block;
            background: linear-gradient(135deg, #0b6b61, #139b86);
            color: white;
            padding: 0.6rem 1.5rem;
            border-radius: 25px;
            font-weight: 600;
            font-size: 0.95rem;
            margin-top: 1rem;
          }

          .info-box {
            background: #e7f6f4;
            border-left: 4px solid #0b6b61;
            padding: 1.2rem;
            border-radius: 8px;
            margin-top: 2rem;
            text-align: left;
          }

          .info-box h4 {
            color: #0b6b61;
            margin-bottom: 0.5rem;
            font-size: 1.1rem;
          }

          .info-box p {
            color: #555;
            margin: 0;
            font-size: 0.95rem;
          }
        `}
      </style>

      {/* ---------- STRUCTURE ---------- */}
      <div className="ambu-page">
        <Sidebar />

        <div className="ambu-content">
          <div className="coming-soon-card">
            <div className="coming-soon-icon">🚑</div>
            
            <h1 className="coming-soon-title">Add Ambulance</h1>
            
            <h2 className="coming-soon-subtitle">Feature Coming Soon!</h2>
            
            <p className="coming-soon-message">
              The ambulance management feature is currently under development 
              and will be available in the next update. We're working hard to 
              bring you an enhanced ambulance booking and tracking system.
            </p>

            <div className="feature-badge">
              ⏳ Temporarily Disabled
            </div>

            <div className="info-box">
              <h4>📋 What to Expect:</h4>
              <p>
                • Real-time ambulance tracking<br/>
                • Driver management system<br/>
                • Emergency response optimization<br/>
                • Automated dispatch system
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Add_Ambulance;
