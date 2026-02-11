import React, { useEffect, useState } from "react";
import { Table, Button, Modal, Form, Input, Select, message } from "antd";
import axios from "axios";
import Sidebar from "../../GlobalFiles/Sidebar";
import "./CSS/Manage.css";

const { Option } = Select;

const ManageDoctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [form] = Form.useForm();

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("http://127.0.0.1:3001/admin/doctors", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const mappedDoctors = Array.isArray(response.data)
        ? response.data.map((doctor, index) => ({
            ...doctor,
            key: doctor._id || doctor.doctorId || `doctor-${index}`, // Unique key for React
            displayId: index + 1, // Clean sequential ID for display
            actualId: doctor.doctorId, // Use doctorId for operations (not _id)
            phonenum: doctor.phoneNum || doctor.phonenum || doctor.phonenumber,
            bloodgroup: doctor.bloodGroup || doctor.bloodgroup,
            dob: doctor.DOB || doctor.dob,
          }))
        : [];

      setDoctors(mappedDoctors);
    } catch (error) {
      message.error("Failed to fetch doctors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const handleEdit = (doctor) => {
    setEditingDoctor(doctor);
    
    // Format the date properly for the date input
    const formattedDoctor = {
      ...doctor,
      dob: doctor.dob ? new Date(doctor.dob).toISOString().split('T')[0] : ''
    };
    
    form.setFieldsValue(formattedDoctor);
    setIsModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem("token");
      console.log("Deleting doctor with ID:", id);
      
      await axios.delete(`http://127.0.0.1:3001/admin/doctors/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      message.success("Doctor deleted");
      fetchDoctors();
    } catch (error) {
      console.error("Delete error:", error);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);
      message.error(`Failed to delete doctor: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();

      const updateData = {
        name: values.name,
        phonenum: values.phonenum || values.phoneNum,
        email: values.email,
        age: parseInt(values.age),
        gender: values.gender,
        bloodgroup: values.bloodgroup || values.bloodGroup,
        dob: values.dob || values.DOB,
        address: values.address,
        education: values.education,
        department: values.department,
        fees: parseInt(values.fees),
      };

      const token = localStorage.getItem("token");
      const doctorId = editingDoctor.actualId || editingDoctor.doctorId;

      console.log("Updating doctor with doctorId:", doctorId);
      console.log("Update data:", updateData);

      await axios.put(
        `http://127.0.0.1:3001/admin/doctors/${doctorId}`,
        updateData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      message.success("Doctor updated");
      setIsModalVisible(false);
      form.resetFields();
      fetchDoctors();
    } catch (error) {
      console.error("Update error:", error);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);
      message.error(`Failed to update doctor: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const columns = [
    { 
      title: "ID", 
      dataIndex: "displayId", 
      key: "displayId",
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
      title: "Department", 
      dataIndex: "department", 
      key: "department",
      width: 150,
    },
    { 
      title: "Fee", 
      dataIndex: "fees", 
      key: "fees",
      width: 100,
      render: (fee) => `₹${fee}`,
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

          <Button danger onClick={() => handleDelete(record.actualId || record.doctorId)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      {/* ===== ENHANCED INLINE CSS ===== */}
      <style>{`
        .admin-page {
          display: flex;
          align-items: flex-start !important;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          min-height: 100vh;
          position: relative;
        }

        .admin-page::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="manage-pattern" width="60" height="60" patternUnits="userSpaceOnUse"><circle cx="30" cy="30" r="2" fill="rgba(102,126,234,0.05)"/><circle cx="10" cy="10" r="1" fill="rgba(52,211,153,0.05)"/><circle cx="50" cy="10" r="1" fill="rgba(52,211,153,0.05)"/></pattern></defs><rect width="100" height="100" fill="url(%23manage-pattern)"/></svg>');
          pointer-events: none;
        }

        .admin-content {
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
          content: '👨‍⚕️';
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

      {/* PAGE STRUCTURE */}
      <div className="admin-page">
        <Sidebar />

        <div className="admin-content">
          <div className="manage-container">

            <h2>👨‍⚕️ Manage Doctors</h2>

            <div className="table-wrapper">
              <Table
                columns={columns}
                dataSource={doctors}
                loading={loading}
                rowKey={(record) => record.key || record.id || record._id}
              />
            </div>

            {/* EDIT MODAL */}
            <Modal
              title="Update Doctor Information"
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

                <Form.Item name="email" label="Email" rules={[{ required: true, type: "email" }]}>
                  <Input />
                </Form.Item>

                <Form.Item name="phonenum" label="Phone" rules={[{ required: true }]}>
                  <Input />
                </Form.Item>

                <Form.Item name="department" label="Department" rules={[{ required: true }]}>
                  <Input />
                </Form.Item>

                <Form.Item name="fees" label="Fees" rules={[{ required: true }]}>
                  <Input type="number" />
                </Form.Item>

                <Form.Item name="education" label="Education" rules={[{ required: true }]}>
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

export default ManageDoctors;
