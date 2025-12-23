import { Table } from "antd";
import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Navigate } from "react-router-dom";
import { GetPatientsByDoctor } from "../../../../../Redux/Datas/action";
import Sidebar from "../../GlobalFiles/Sidebar";
import Topbar from "../../GlobalFiles/Topbar";

const Patient_Details = () => {
  const dispatch = useDispatch();
  const { data } = useSelector((store) => store.auth);
  const { patients } = useSelector((store) => store.data.patients);

  useEffect(() => {
    dispatch(GetPatientsByDoctor());
  }, [dispatch]);

  const columns = [
    { title: "ID", dataIndex: "id", key: "id" },
    { title: "Name", dataIndex: "name", key: "name" },
    { title: "Email", dataIndex: "email", key: "email" },
    { title: "Phone", dataIndex: "phonenum", key: "phonenum" },
    { title: "Age", dataIndex: "age", key: "age" },
    { title: "Gender", dataIndex: "gender", key: "gender" },
    { title: "Blood Group", dataIndex: "bloodgroup", key: "bloodgroup" },
    { title: "DOB", dataIndex: "dob", key: "dob" },
    { title: "Address", dataIndex: "address", key: "address" },
  ];

  const Datas = patients || [];

  if (!data?.isAuthenticated) return <Navigate to="/" />;
  if (data?.user.userType !== "doctor") return <Navigate to="/dashboard" />;

  return (
    <>
      {/* ENHANCED MODERN UI CSS */}
      <style>
        {`
          .patient-page {
            display: flex;
            min-height: 100vh;
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            position: relative;
          }

          .patient-page::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="patient-pattern" width="60" height="60" patternUnits="userSpaceOnUse"><circle cx="30" cy="30" r="2" fill="rgba(102,126,234,0.05)"/><circle cx="10" cy="10" r="1" fill="rgba(52,211,153,0.05)"/><circle cx="50" cy="10" r="1" fill="rgba(52,211,153,0.05)"/></pattern></defs><rect width="100" height="100" fill="url(%23patient-pattern)"/></svg>');
            pointer-events: none;
          }

          .patient-content {
            flex: 1;
            padding: 2.5rem 3rem;
            position: relative;
            z-index: 1;
          }

          .patient-header {
            text-align: center;
            margin-bottom: 2.5rem;
          }

          .patient-header h1 {
            font-size: 2.5rem;
            font-weight: 800;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 0.5rem;
            letter-spacing: -0.02em;
          }

          .patient-subtitle {
            color: #64748b;
            font-size: 1.1rem;
            font-weight: 500;
          }

          /* ENHANCED CARD */
          .patient-card {
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

          .patient-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }

          .patient-card:hover {
            transform: translateY(-8px);
            box-shadow: 
              0 32px 64px rgba(0, 0, 0, 0.15),
              0 1px 0 rgba(255, 255, 255, 0.3) inset;
          }

          /* ENHANCED TABLE CONTAINER */
          .patient-table-container {
            margin-top: 0;
            border-radius: 16px;
            overflow: hidden;
            background: rgba(248, 250, 252, 0.8);
          }

          /* ENHANCED TABLE STYLING */
          .ant-table {
            background: transparent !important;
            border-radius: 16px !important;
            overflow: hidden !important;
          }

          .ant-table-container {
            border-radius: 16px !important;
            overflow: hidden !important;
          }

          .ant-table-thead > tr > th {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
            color: white !important;
            font-weight: 700 !important;
            border: none !important;
            font-size: 0.95rem !important;
            padding: 1.2rem 1rem !important;
            text-align: center !important;
            position: relative !important;
          }

          .ant-table-thead > tr > th::before {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 2px;
            background: rgba(255, 255, 255, 0.3);
          }

          .ant-table-tbody > tr {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
          }

          .ant-table-tbody > tr:hover {
            background: linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(52, 211, 153, 0.08) 100%) !important;
            transform: translateY(-2px) !important;
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15) !important;
          }

          .ant-table-tbody > tr > td {
            border-bottom: 1px solid rgba(102, 126, 234, 0.1) !important;
            font-weight: 500 !important;
            padding: 1rem !important;
            text-align: center !important;
            color: #374151 !important;
            position: relative !important;
          }

          .ant-table-tbody > tr:nth-child(even) > td {
            background: rgba(248, 250, 252, 0.5) !important;
          }

          .ant-table-tbody > tr:nth-child(odd) > td {
            background: rgba(255, 255, 255, 0.8) !important;
          }

          .ant-table-tbody > tr:last-child > td {
            border-bottom: none !important;
          }

          /* Table pagination styling */
          .ant-pagination {
            margin-top: 1.5rem !important;
            text-align: center !important;
          }

          .ant-pagination-item {
            border: 2px solid rgba(102, 126, 234, 0.2) !important;
            border-radius: 8px !important;
            transition: all 0.3s ease !important;
          }

          .ant-pagination-item:hover {
            border-color: #667eea !important;
            transform: translateY(-2px) !important;
          }

          .ant-pagination-item-active {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
            border-color: #667eea !important;
          }

          .ant-pagination-item-active a {
            color: white !important;
          }

          /* ENHANCED EMPTY STATE */
          .patient-empty {
            padding: 4rem 2rem;
            text-align: center;
            background: rgba(248, 250, 252, 0.8);
            border-radius: 16px;
          }

          .patient-empty-icon {
            font-size: 4rem;
            margin-bottom: 1rem;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }

          .patient-empty p {
            color: #64748b;
            font-size: 1.1rem;
            font-weight: 500;
            margin: 0;
          }

          /* Responsive design */
          @media (max-width: 768px) {
            .patient-content {
              padding: 1.5rem 1rem;
            }

            .patient-card {
              padding: 1.5rem;
            }

            .patient-header h1 {
              font-size: 2rem;
            }
          }
        `}
      </style>

      {/* MAIN STRUCTURE */}
      <div className="patient-page">
        <Sidebar />

        <div className="patient-content">
          <Topbar />

          <div className="patient-header">
            <h1>👥 My Patients</h1>
            <p className="patient-subtitle">View and manage your assigned patients</p>
          </div>

          <div className="patient-card">
            <div className="patient-table-container">
              {Datas.length > 0 ? (
                <Table
                  columns={columns}
                  dataSource={Datas}
                  pagination={{ pageSize: 8 }}
                  scroll={{ x: 850 }}
                />
              ) : (
                <div className="patient-empty">
                  <div className="patient-empty-icon">👥</div>
                  <p>No patients assigned to you yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Patient_Details;
