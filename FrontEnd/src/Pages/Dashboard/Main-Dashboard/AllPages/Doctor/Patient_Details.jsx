import { Table } from "antd";
import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Navigate } from "react-router-dom";
import { GetPatientsByDoctor } from "../../../../../Redux/Datas/action";
import Sidebar from "../../GlobalFiles/Sidebar";
import "./CSS/Patient_Details.css";

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
    <div className="patient-details-container">
      <Sidebar />
      <div className="patient-details-header">
        <h1>👥 My Patients</h1>
      </div>
      <div className="patient-details-card">
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
  );
};

export default Patient_Details;
