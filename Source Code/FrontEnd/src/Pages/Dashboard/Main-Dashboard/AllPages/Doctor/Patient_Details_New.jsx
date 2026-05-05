import { Table } from "antd";
import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Navigate } from "react-router-dom";
import { GetPatientsByDoctor } from "../../../../../Redux/Datas/action";
import Sidebar from "../../GlobalFiles/Sidebar";

function PatientDetails() {
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
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div style={{ 
        marginLeft: '80px', 
        padding: '30px', 
        background: '#f5f7fa',
        minHeight: '100vh',
        width: '100%'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '700', margin: 0 }}>
            👥 My Patients
          </h1>
        </div>
        <div style={{
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          overflow: 'hidden',
          margin: '20px 0'
        }}>
          <div style={{ padding: '24px' }}>
            {Datas.length > 0 ? (
              <Table
                columns={columns}
                dataSource={Datas}
                rowKey={(record) => record._id || record.id || record.email}
                pagination={{ pageSize: 8 }}
                scroll={{ x: 850 }}
              />
            ) : (
              <div style={{ 
                textAlign: 'center', 
                padding: '60px',
                color: '#666'
              }}>
                <div style={{ fontSize: '4rem', marginBottom: '20px', opacity: 0.4 }}>
                  👥
                </div>
                <p>No patients assigned to you yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PatientDetails;
