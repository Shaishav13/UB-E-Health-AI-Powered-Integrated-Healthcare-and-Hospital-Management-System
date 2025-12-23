import { Table, Descriptions } from "antd";
import React, { useEffect } from "react";
import {
  FaUserPlus,
  FaUserMd,
  FaAmbulance
} from "react-icons/fa";
import { BsFillBookmarkCheckFill } from "react-icons/bs";
import { MdPayment } from "react-icons/md";
import { RiAdminLine } from "react-icons/ri";
import patient from "../../../../img/patient.png";
import Sidebar from "./Sidebar";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  GetAllData,
  GetPatients,
  GetDoctorDetails,
  GetMedicineDetails,
  GetAppointments,
  GetAdminDetails,
  GetAllReports
} from "../../../../Redux/Datas/action";

const FrontPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const {
    data: { user }
  } = useSelector((state) => state.auth);

  const { patients } = useSelector((store) => store.data.patients);
  const { doctors } = useSelector((store) => store.data.doctors);
  const { medicines } = useSelector((store) => store.data.medicines);
  const reportCount = useSelector(
    (store) => store.data.reports
  )?.reports?.length;

  const {
    dashboard: { data }
  } = useSelector((store) => store.data);

  const patientColumns = [
    { title: "Name", dataIndex: "name", key: "name" },
    { title: "Age", dataIndex: "age", key: "age" },
    { title: "Disease", dataIndex: "disease", key: "disease" },
    { title: "Blood Group", dataIndex: "bloodgroup", key: "bloodgroup" },
    { title: "Gender", dataIndex: "gender", key: "gender" },
    { title: "Email", dataIndex: "email", key: "email" }
  ];

  const doctorColumns = [
    { title: "Name", dataIndex: "name", key: "name" },
    { title: "Age", dataIndex: "age", key: "age" },
    { title: "Gender", dataIndex: "gender", key: "gender" },
    { title: "Phone Number", dataIndex: "phonenum", key: "phonenum" },
    { title: "Department", dataIndex: "department", key: "department" },
    { title: "Email", dataIndex: "email", key: "email" }
  ];

  const patientMedication = [
    { title: "Name", dataIndex: "name", key: "name" },
    { title: "Dosage", dataIndex: "dosage", key: "dosage" },
    { title: "Frequency", dataIndex: "frequency", key: "frequency" },
    { title: "Duration", dataIndex: "duration", key: "duration" },
    { title: "Report Date & Time", dataIndex: "datetime", key: "dateTime" }
  ];

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    dispatch(GetPatients());
    dispatch(GetDoctorDetails());
    dispatch(GetAllData());

    if (user?.userType === undefined) {
      navigate("/");
    }

    if (user?.userType !== "admin") {
      dispatch(GetAllReports(user?.userType, user?._id));
      dispatch(GetMedicineDetails(user?._id));
      dispatch(GetAppointments(user?.userType, user?._id));
    } else {
      dispatch(GetAdminDetails());
    }
  }, []);

  const details = patients?.find((p) => p._id === user?._id);

  return (
    <>
      {/* ---------------- INLINE CSS ---------------- */}
      <style>{`
        .dashboardContainer {
          display: flex;
          width: 100%;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          min-height: 100vh;
          position: relative;
        }

        .dashboardContainer::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="dashboard-pattern" width="60" height="60" patternUnits="userSpaceOnUse"><circle cx="30" cy="30" r="2" fill="rgba(102,126,234,0.05)"/><circle cx="10" cy="10" r="1" fill="rgba(52,211,153,0.05)"/><circle cx="50" cy="10" r="1" fill="rgba(52,211,153,0.05)"/></pattern></defs><rect width="100" height="100" fill="url(%23dashboard-pattern)"/></svg>');
          pointer-events: none;
        }

        .mainContent {
          flex: 1;
          padding: 2.5rem 3rem;
          position: relative;
          z-index: 1;
        }

        .dashboard-header {
          text-align: center;
          margin-bottom: 3rem;
        }

        .heading {
          font-size: 2.8rem;
          font-weight: 800;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 0.5rem;
          letter-spacing: -0.02em;
        }

        .dashboard-subtitle {
          color: #64748b;
          font-size: 1.2rem;
          font-weight: 500;
        }

        /* ------- Cards -------- */
        .gridCards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 2rem;
          margin-bottom: 3rem;
          max-width: 1400px;
          margin-left: auto;
          margin-right: auto;
        }

        .card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-radius: 24px;
          padding: 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 
            0 20px 40px rgba(0, 0, 0, 0.1),
            0 1px 0 rgba(255, 255, 255, 0.2) inset;
          border: 1px solid rgba(255, 255, 255, 0.2);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          position: relative;
          overflow: hidden;
        }

        .card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .card:hover {
          transform: translateY(-8px);
          box-shadow: 
            0 32px 64px rgba(0, 0, 0, 0.15),
            0 1px 0 rgba(255, 255, 255, 0.3) inset;
        }

        .card-content {
          flex: 1;
        }

        .card h2 {
          margin: 0;
          font-size: 2.5rem;
          font-weight: 800;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 0.5rem;
        }

        .card p {
          margin: 0;
          color: #64748b;
          font-weight: 600;
          font-size: 1.1rem;
          letter-spacing: 0.01em;
        }

        .icon {
          font-size: 3.5rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          margin-left: 1rem;
        }

        .card:hover .icon {
          transform: scale(1.1) rotate(5deg);
        }

        /* ------- Profile Section -------- */
        .subHeading {
          font-size: 2rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 2rem;
          margin-top: 3rem;
          font-weight: 700;
          letter-spacing: -0.01em;
          text-align: center;
        }

        .profileCard {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          display: flex;
          gap: 2.5rem;
          padding: 2.5rem;
          border-radius: 24px;
          box-shadow: 
            0 20px 40px rgba(0, 0, 0, 0.1),
            0 1px 0 rgba(255, 255, 255, 0.2) inset;
          border: 1px solid rgba(255, 255, 255, 0.2);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          max-width: 1000px;
          margin: 0 auto;
          position: relative;
          overflow: hidden;
        }

        .profileCard::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(135deg, #34d399 0%, #10b981 100%);
        }

        .profileCard:hover {
          transform: translateY(-8px);
          box-shadow: 
            0 32px 64px rgba(0, 0, 0, 0.15),
            0 1px 0 rgba(255, 255, 255, 0.3) inset;
        }

        .profileImg {
          flex-shrink: 0;
        }

        .profileImg img {
          width: 140px;
          height: 140px;
          border-radius: 50%;
          object-fit: cover;
          border: 4px solid rgba(52, 211, 153, 0.2);
          transition: all 0.3s ease;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
        }

        .profileImg:hover img {
          transform: scale(1.05);
          border-color: rgba(52, 211, 153, 0.5);
          box-shadow: 0 12px 24px rgba(52, 211, 153, 0.2);
        }

        .descriptionBox {
          flex: 1;
        }

        /* ------- Table Section -------- */
        .tableSection {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          padding: 2.5rem;
          margin-top: 3rem;
          border-radius: 24px;
          box-shadow: 
            0 20px 40px rgba(0, 0, 0, 0.1),
            0 1px 0 rgba(255, 255, 255, 0.2) inset;
          border: 1px solid rgba(255, 255, 255, 0.2);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          max-width: 1400px;
          margin-left: auto;
          margin-right: auto;
          position: relative;
          overflow: hidden;
        }

        .tableSection::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        }

        .tableSection:hover {
          transform: translateY(-8px);
          box-shadow: 
            0 32px 64px rgba(0, 0, 0, 0.15),
            0 1px 0 rgba(255, 255, 255, 0.3) inset;
        }

        .tableSection h2 {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          font-size: 1.8rem;
          margin-bottom: 2rem;
          font-weight: 700;
          letter-spacing: -0.01em;
          text-align: center;
        }

        .tableBox {
          background: rgba(248, 250, 252, 0.8);
          padding: 0;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }

        /* Enhanced Ant Design Table Overrides */
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

        /* Empty state styling */
        .ant-empty {
          padding: 3rem 1rem !important;
        }

        .ant-empty-description {
          color: #64748b !important;
          font-size: 1rem !important;
          font-weight: 500 !important;
        }

        /* Table loading state */
        .ant-spin-container {
          border-radius: 16px !important;
        }

        .ant-table-placeholder {
          background: rgba(248, 250, 252, 0.8) !important;
          border-radius: 16px !important;
        }

        .ant-descriptions-item-label {
          font-weight: 600 !important;
          color: #374151 !important;
        }

        .ant-descriptions-item-content {
          color: #1f2937 !important;
          font-weight: 500 !important;
        }

        /* Welcome message for patients */
        .welcome-message {
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(52, 211, 153, 0.1) 100%);
          padding: 2rem;
          border-radius: 20px;
          text-align: center;
          margin-bottom: 2rem;
          border: 1px solid rgba(102, 126, 234, 0.2);
        }

        .welcome-message h3 {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 0.5rem;
        }

        .welcome-message p {
          color: #64748b;
          font-size: 1rem;
          margin: 0;
        }
      `}</style>

      {/* ---------------- PAGE STRUCTURE ---------------- */}
      <div className="dashboardContainer">
        <Sidebar />

        <div className="mainContent">
          <div className="dashboard-header">
            <h1 className="heading">🏥 Dashboard Overview</h1>
            <p className="dashboard-subtitle">
              Welcome back! Here's what's happening with your healthcare today.
            </p>
          </div>

          {/* Admin & Doctor Dashboard Cards */}
          {user?.userType !== "patient" && (
            <div className="gridCards">
              <div className="card">
                <div className="card-content">
                  <h2>{data?.patient}</h2>
                  <p>Total Patients</p>
                </div>
                <FaUserPlus className="icon" />
              </div>

              <div className="card">
                <div className="card-content">
                  <h2>{data?.appointment}</h2>
                  <p>Appointments</p>
                </div>
                <BsFillBookmarkCheckFill className="icon" />
              </div>

              {user?.userType === "admin" && (
                <>
                  <div className="card">
                    <div className="card-content">
                      <h2>{data?.doctor}</h2>
                      <p>Active Doctors</p>
                    </div>
                    <FaUserMd className="icon" />
                  </div>

                  <div className="card">
                    <div className="card-content">
                      <h2>{data?.admin}</h2>
                      <p>System Admins</p>
                    </div>
                    <RiAdminLine className="icon" />
                  </div>

                  <div className="card">
                    <div className="card-content">
                      <h2>{data?.ambulance}</h2>
                      <p>Ambulances</p>
                    </div>
                    <FaAmbulance className="icon" />
                  </div>

                  <div className="card">
                    <div className="card-content">
                      <h2>{data?.report}</h2>
                      <p>Medical Reports</p>
                    </div>
                    <MdPayment className="icon" />
                  </div>
                </>
              )}
            </div>
          )}

          {/* Patient Profile */}
          {user?.userType === "patient" && (
            <>
              <div className="welcome-message">
                <h3>👋 Welcome back, {details?.name || 'Patient'}!</h3>
                <p>Your health journey continues here. Check your appointments, medications, and reports.</p>
              </div>

              <h2 className="subHeading">📋 My Health Profile</h2>

              <div className="profileCard">
                <div className="profileImg">
                  <img src={patient} alt="patient" />
                </div>

                <Descriptions
                  layout="vertical"
                  bordered
                  className="descriptionBox"
                  column={2}
                >
                  <Descriptions.Item label="👤 Full Name">
                    {details?.name}
                  </Descriptions.Item>
                  <Descriptions.Item label="📞 Phone Number">
                    {details?.phonenum}
                  </Descriptions.Item>
                  <Descriptions.Item label="🏠 Address">
                    {details?.address}
                  </Descriptions.Item>
                  <Descriptions.Item label="🩸 Blood Group">
                    {details?.bloodgroup}
                  </Descriptions.Item>
                  <Descriptions.Item label="📊 Total Reports">
                    {reportCount || 0}
                  </Descriptions.Item>
                  <Descriptions.Item label="💊 Active Medications">
                    {medicines?.length || 0}
                  </Descriptions.Item>
                </Descriptions>
              </div>

              <h2 className="subHeading">💊 Current Medications</h2>
              <div className="tableBox">
                <Table 
                  columns={patientMedication} 
                  dataSource={medicines} 
                  rowKey={(record) => record._id || record.id || Math.random()}
                  pagination={{ pageSize: 5 }}
                />
              </div>
            </>
          )}

          {/* Doctor Details */}
          {user?.userType === "admin" && (
            <div className="tableSection">
              <h2>Doctor Details</h2>
              <Table 
                columns={doctorColumns} 
                dataSource={doctors} 
                rowKey={(record) => record._id || record.doctorId || record.id || Math.random()}
              />
            </div>
          )}

          {/* Patient Details */}
          {user?.userType !== "patient" && (
            <div className="tableSection">
              <h2>Patient Details</h2>
              <Table 
                columns={patientColumns} 
                dataSource={patients} 
                rowKey={(record) => record._id || record.id || Math.random()}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default FrontPage;
