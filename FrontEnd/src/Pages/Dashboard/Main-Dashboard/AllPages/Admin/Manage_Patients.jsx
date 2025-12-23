import { useEffect, useState } from "react";
import { Table, Button, Modal, Form, Input, Select, message } from "antd";
import axios from "axios";
import Sidebar from "../../GlobalFiles/Sidebar";
import "./CSS/Manage.css";

const { Option } = Select;

const ManagePatients = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [form] = Form.useForm();

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        "http://127.0.0.1:3001/admin/patients",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Ensure array format and add proper keys
      const patientsWithKeys = Array.isArray(response.data) 
        ? response.data.map((patient, index) => ({
            ...patient,
            key: patient._id || patient.id || index, // Ensure unique key
            id: patient._id || patient.id || index
          }))
        : [];
      
      setPatients(patientsWithKeys);
    } catch (error) {
      console.error("Error fetching patients:", error);
      message.error("Failed to fetch patients");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const handleEdit = (patient) => {
    setEditingPatient(patient);
    form.setFieldsValue(patient);
    setIsModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://127.0.0.1:3001/admin/patients/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      message.success("Patient deleted successfully");
      fetchPatients();
    } catch (error) {
      console.error("Delete error:", error);
      message.error("Failed to delete patient");
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();

      const token = localStorage.getItem("token");
      await axios.put(
        `http://127.0.0.1:3001/admin/patients/${editingPatient.id}`,
        values,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      message.success("Patient updated successfully");
      setIsModalVisible(false);
      form.resetFields();
      fetchPatients();
    } catch (error) {
      console.error("Update error:", error);
      message.error("Failed to update patient");
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    setEditingPatient(null);
    form.resetFields();
  };

  const columns = [
    { 
      title: "ID", 
      dataIndex: "id", 
      key: "id",
      width: 80,
    },
    { 
      title: "Name", 
      dataIndex: "name", 
      key: "name",
      width: 180,
    },
    { 
      title: "Contact", 
      dataIndex: "phonenum", 
      key: "phonenum",
      width: 140,
    },
    { 
      title: "Age", 
      dataIndex: "age", 
      key: "age",
      width: 80,
    },
    { 
      title: "Gender", 
      dataIndex: "gender", 
      key: "gender",
      width: 100,
    },
    { 
      title: "Blood Group", 
      dataIndex: "bloodgroup", 
      key: "bloodgroup",
      width: 120,
    },
    {
      title: "Actions",
      key: "actions",
      width: 180,
      render: (_, record) => (
        <div style={{ display: "flex", gap: "10px" }}>
          <Button type="primary" onClick={() => handleEdit(record)}>
            Edit
          </Button>
          <Button danger onClick={() => handleDelete(record.id)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      {/* ========== ENHANCED INLINE STYLING ========== */}
      <style>{`
        .container {
          display: flex;
          align-items: flex-start !important;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          min-height: 100vh;
          position: relative;
        }

        .container::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="manage-pattern" width="60" height="60" patternUnits="userSpaceOnUse"><circle cx="30" cy="30" r="2" fill="rgba(102,126,234,0.05)"/><circle cx="10" cy="10" r="1" fill="rgba(52,211,153,0.05)"/><circle cx="50" cy="10" r="1" fill="rgba(52,211,153,0.05)"/></pattern></defs><rect width="100" height="100" fill="url(%23manage-pattern)"/></svg>');
          pointer-events: none;
        }

        .AfterSideBar {
          margin: 0 !important;
          padding: 0 !important;
          flex: 1;
          position: relative;
          z-index: 1;
        }

        .manage-container {
          padding: 2.5rem 3rem;
          animation: fadeIn 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .manage-container h2 {
          font-size: 2.5rem;
          font-weight: 800;
          margin-bottom: 2rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          text-align: center;
          letter-spacing: -0.02em;
        }

        .table-wrapper {
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

        .table-wrapper::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .table-wrapper:hover {
          transform: translateY(-8px);
          box-shadow: 
            0 32px 64px rgba(0, 0, 0, 0.15),
            0 1px 0 rgba(255, 255, 255, 0.3) inset;
        }

        /* Enhanced Table Styling */
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

        /* Enhanced Action Buttons */
        .ant-btn {
          border-radius: 12px !important;
          font-weight: 600 !important;
          padding: 0.5rem 1.2rem !important;
          height: auto !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
          position: relative !important;
          overflow: hidden !important;
        }

        .ant-btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
          border: none !important;
          color: white !important;
        }

        .ant-btn-primary:hover {
          background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%) !important;
          transform: translateY(-2px) !important;
          box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4) !important;
        }

        .ant-btn-dangerous {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%) !important;
          border: none !important;
          color: white !important;
        }

        .ant-btn-dangerous:hover {
          background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%) !important;
          transform: translateY(-2px) !important;
          box-shadow: 0 8px 20px rgba(239, 68, 68, 0.4) !important;
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

        /* Enhanced Modal Styling */
        .ant-modal-content {
          border-radius: 24px !important;
          overflow: hidden !important;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15) !important;
        }

        .ant-modal-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
          border-bottom: none !important;
          padding: 1.5rem 2rem !important;
        }

        .ant-modal-title {
          font-size: 1.4rem !important;
          font-weight: 700 !important;
          color: white !important;
          display: flex !important;
          align-items: center !important;
          gap: 0.5rem !important;
        }

        .ant-modal-title::before {
          content: '👤';
          font-size: 1.2rem;
        }

        .ant-modal-close {
          color: white !important;
          opacity: 0.8 !important;
        }

        .ant-modal-close:hover {
          color: white !important;
          opacity: 1 !important;
        }

        .ant-modal-body {
          max-height: 60vh;
          overflow-y: auto;
          padding: 2rem !important;
          background: rgba(248, 250, 252, 0.5);
        }

        .ant-modal-body::-webkit-scrollbar {
          width: 8px;
        }

        .ant-modal-body::-webkit-scrollbar-track {
          background: rgba(102, 126, 234, 0.1);
          border-radius: 10px;
        }

        .ant-modal-body::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 10px;
        }

        .ant-modal-body::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%);
        }

        .ant-modal-footer {
          border-top: 1px solid rgba(102, 126, 234, 0.1) !important;
          padding: 1.5rem 2rem !important;
          background: white !important;
        }

        .ant-modal-footer .ant-btn {
          height: 42px !important;
          padding: 0 1.5rem !important;
          font-weight: 600 !important;
          border-radius: 12px !important;
          font-size: 1rem !important;
          margin-left: 0.75rem !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }

        .ant-modal-footer .ant-btn-default {
          border: 2px solid rgba(102, 126, 234, 0.2) !important;
          color: #667eea !important;
          background: white !important;
        }

        .ant-modal-footer .ant-btn-default:hover {
          border-color: #667eea !important;
          color: #667eea !important;
          transform: translateY(-2px) !important;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2) !important;
        }

        .ant-modal-footer .ant-btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
          border: none !important;
          color: white !important;
        }

        .ant-modal-footer .ant-btn-primary:hover {
          background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%) !important;
          transform: translateY(-2px) !important;
          box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4) !important;
        }

        /* Enhanced Form Styling */
        .ant-form-item-label > label {
          font-weight: 600 !important;
          color: #374151 !important;
        }

        .ant-input, .ant-select-selector {
          border-radius: 12px !important;
          border: 2px solid rgba(102, 126, 234, 0.2) !important;
          padding: 0.75rem 1rem !important;
          transition: all 0.3s ease !important;
        }

        .ant-input:focus, .ant-select-focused .ant-select-selector {
          border-color: #667eea !important;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1) !important;
        }

        .ant-select-dropdown {
          border-radius: 12px !important;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15) !important;
        }

        @keyframes fadeIn {
          from { 
            opacity: 0; 
            transform: translateY(20px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }
      `}</style>

      {/* STRUCTURE */}
      <div className="container">
        <Sidebar />

        <div className="AfterSideBar">
          <div className="manage-container">
            <h2>👥 Manage Patients</h2>

            <div className="table-wrapper">
              <Table
                columns={columns}
                dataSource={patients}
                loading={loading}
                rowKey={(record) => record._id || record.id || `patient-${record.key}`}
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} patients`,
                }}
              />
            </div>

            {/* EDIT MODAL */}
            <Modal
              title="Edit Patient"
              open={isModalVisible}
              onOk={handleModalOk}
              onCancel={handleModalCancel}
              okText="Save"
              cancelText="Cancel"
              width={600}
              centered
              destroyOnClose
            >
              <Form form={form} layout="vertical">
                <Form.Item name="name" label="Name" rules={[{ required: true }]}>
                  <Input />
                </Form.Item>

                <Form.Item name="email" label="Email" rules={[{ required: true }]}>
                  <Input />
                </Form.Item>

                <Form.Item name="phonenum" label="Phone" rules={[{ required: true }]}>
                  <Input />
                </Form.Item>

                <Form.Item name="age" label="Age" rules={[{ required: true }]}>
                  <Input type="number" />
                </Form.Item>

                <Form.Item name="gender" label="Gender" rules={[{ required: true }]}>
                  <Select>
                    <Option value="M">Male</Option>
                    <Option value="F">Female</Option>
                  </Select>
                </Form.Item>

                <Form.Item name="bloodgroup" label="Blood Group" rules={[{ required: true }]}>
                  <Input />
                </Form.Item>

                <Form.Item name="dob" label="Date of Birth" rules={[{ required: true }]}>
                  <Input type="date" />
                </Form.Item>

                <Form.Item name="address" label="Address" rules={[{ required: true }]}>
                  <Input />
                </Form.Item>
              </Form>
            </Modal>
          </div>
        </div>
      </div>
    </>
  );
};

export default ManagePatients;
