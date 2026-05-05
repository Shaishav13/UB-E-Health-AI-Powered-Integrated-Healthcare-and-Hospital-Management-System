import { useEffect, useState, useMemo } from "react";
import { Table, Button, Modal, Form, Input, Select, message, Card, Row, Col, Tag, Badge } from "antd";
import { SearchOutlined, UserOutlined, FilterOutlined, CloseCircleOutlined } from "@ant-design/icons";
import axios from "axios";
import Sidebar from "../../GlobalFiles/Sidebar";
import "./CSS/Manage.css";
import Footer from "../../../../../Components/Footer";

const { Option } = Select;

const ManageDoctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [form] = Form.useForm();
  
  // Filter states
  const [searchText, setSearchText] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState(null);

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

  // Calculate stats
  const stats = useMemo(() => {
    const total = doctors.length;
    const departments = [...new Set(doctors.map(d => d.department))].length;
    
    // Calculate average fee
    const avgFee = doctors.length > 0 
      ? Math.round(doctors.reduce((sum, d) => sum + (d.fees || 0), 0) / doctors.length)
      : 0;
    
    // Calculate new doctors this week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const newThisWeek = doctors.filter(d => {
      const createdDate = new Date(d.createdAt || d.created_at);
      return createdDate >= oneWeekAgo;
    }).length;

    return { total, departments, avgFee, newThisWeek };
  }, [doctors]);

  // Get unique departments for filter
  const uniqueDepartments = useMemo(() => {
    return [...new Set(doctors.map(d => d.department).filter(Boolean))].sort();
  }, [doctors]);

  // Filter doctors
  const filteredDoctors = useMemo(() => {
    return doctors.filter(doctor => {
      const matchesSearch = searchText === "" || 
        doctor.name?.toLowerCase().includes(searchText.toLowerCase()) ||
        doctor.email?.toLowerCase().includes(searchText.toLowerCase()) ||
        doctor.phonenum?.includes(searchText) ||
        doctor.department?.toLowerCase().includes(searchText.toLowerCase());
      
      const matchesDepartment = !departmentFilter || doctor.department === departmentFilter;

      return matchesSearch && matchesDepartment;
    });
  }, [doctors, searchText, departmentFilter]);

  const clearFilters = () => {
    setSearchText("");
    setDepartmentFilter(null);
  };

  const hasActiveFilters = searchText || departmentFilter;

  // Generate avatar initials
  const getInitials = (name) => {
    if (!name) return "??";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Get department color
  const getDepartmentColor = (department) => {
    const colors = {
      'Cardiology': '#ef4444',
      'Neurology': '#8b5cf6',
      'Orthopedics': '#3b82f6',
      'Pediatrics': '#ec4899',
      'Dermatology': '#f59e0b',
      'ENT': '#10b981',
      'Ophthalmology': '#06b6d4',
      'Psychiatry': '#6366f1',
      'General': '#64748b'
    };
    return colors[department] || '#6b7280';
  };

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
      title: "Doctor",
      key: "doctor",
      width: 280,
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '45px',
              height: '45px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: '700',
              fontSize: '16px',
              flexShrink: 0,
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
            }}
          >
            {getInitials(record.name)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: '600', color: '#1f2937', fontSize: '15px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {record.name}
            </div>
            <div style={{ fontSize: '13px', color: '#6b7280', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {record.email}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Contact",
      dataIndex: "phonenum",
      key: "phonenum",
      width: 140,
      render: (phone) => (
        <span style={{ fontWeight: '500', color: '#374151' }}>
          {phone || 'N/A'}
        </span>
      ),
    },
    {
      title: "Department",
      dataIndex: "department",
      key: "department",
      width: 160,
      render: (department) => (
        <Badge
          count={department || 'N/A'}
          style={{
            backgroundColor: getDepartmentColor(department),
            fontWeight: '700',
            fontSize: '12px',
            padding: '0 12px',
            height: '26px',
            lineHeight: '26px',
            borderRadius: '13px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
          }}
        />
      ),
    },
    {
      title: "Fee",
      dataIndex: "fees",
      key: "fees",
      width: 120,
      sorter: (a, b) => (a.fees || 0) - (b.fees || 0),
      render: (fee) => (
        <span style={{ fontWeight: '700', color: '#0b6b61', fontSize: '15px' }}>
          ₹{fee || 0}
        </span>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <div style={{ display: "flex", gap: "8px", justifyContent: 'center' }}>
          <Button
            type="primary"
            size="small"
            onClick={() => handleEdit(record)}
            style={{
              borderRadius: '8px',
              fontWeight: '600',
              background: 'linear-gradient(135deg, #0b6b61 0%, #13a189 100%)',
              border: 'none'
            }}
          >
            Edit
          </Button>
          <Button
            danger
            size="small"
            onClick={() => handleDelete(record.actualId || record.doctorId)}
            style={{
              borderRadius: '8px',
              fontWeight: '600'
            }}
          >
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
          padding: 2rem 1.5rem;
          animation: fadeIn 0.5s ease;
          max-width: 1400px;
          margin: 0 auto;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .page-header {
          text-align: center;
          margin-bottom: 1.5rem;
        }

        .page-title {
          font-size: 2.25rem;
          font-weight: 800;
          background: linear-gradient(135deg, #0b6b61 0%, #13a189 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 0 0 0.5rem 0;
          letter-spacing: -0.02em;
        }

        .stats-row {
          margin-bottom: 1.5rem;
        }

        .stat-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-radius: 18px;
          padding: 1.75rem 1.5rem;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.3);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
          text-align: center;
          height: 100%;
          min-height: 140px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }

        .stat-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(135deg, #0b6b61 0%, #13a189 100%);
        }

        .stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
        }

        .stat-icon {
          font-size: 2rem;
          margin-bottom: 0.5rem;
          display: block;
        }

        .stat-value {
          font-size: 1.75rem;
          font-weight: 800;
          color: #0b6b61;
          margin: 0.25rem 0;
          line-height: 1;
        }

        .stat-label {
          font-size: 0.85rem;
          color: #6b7280;
          font-weight: 600;
          margin: 0;
        }

        .filters-section {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          padding: 1.5rem;
          border-radius: 18px;
          margin-bottom: 1.5rem;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.3);
        }

        .filters-row {
          display: flex;
          gap: 0.75rem;
          align-items: center;
          flex-wrap: wrap;
        }

        .search-input {
          flex: 1;
          min-width: 200px;
        }

        .filter-select {
          min-width: 150px;
        }

        .active-filters {
          display: flex;
          gap: 0.5rem;
          align-items: center;
          margin-top: 1rem;
          flex-wrap: wrap;
        }

        .table-wrapper {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          padding: 1.75rem;
          border-radius: 18px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.3);
          overflow-x: auto;
        }

        .table-wrapper::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(135deg, #0b6b61 0%, #13a189 100%);
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
          background: linear-gradient(135deg, #0b6b61 0%, #13a189 100%) !important;
          color: white !important;
          font-weight: 700 !important;
          border: none !important;
          padding: 1rem 5.4rem !important;
          font-size: 0.875rem !important;
          white-space: nowrap !important;
          text-transform: uppercase !important;
          letter-spacing: 0.5px !important;
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
          transition: all 0.3s ease !important;
        }

        .ant-table-tbody > tr:hover {
          background: rgba(11, 107, 97, 0.05) !important;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06) !important;
        }

        .ant-table-tbody > tr > td {
          border-bottom: 1px solid rgba(11, 107, 97, 0.1) !important;
          padding: 1rem 0.875rem !important;
          vertical-align: middle !important;
          background: white !important;
        }

        .ant-table-tbody > tr:nth-child(even) > td {
          background: rgba(248, 250, 252, 0.5) !important;
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
          background: linear-gradient(135deg, #0b6b61 0%, #13a189 100%) !important;
          border: none !important;
          color: white !important;
        }

        .ant-btn-primary:hover {
          background: linear-gradient(135deg, #095a52 0%, #0f8a75 100%) !important;
          transform: translateY(-2px) !important;
          box-shadow: 0 8px 20px rgba(11, 107, 97, 0.4) !important;
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
          border: 2px solid rgba(11, 107, 97, 0.2) !important;
          border-radius: 8px !important;
          transition: all 0.3s ease !important;
        }

        .ant-pagination-item:hover {
          border-color: #0b6b61 !important;
          transform: translateY(-2px) !important;
        }

        .ant-pagination-item-active {
          background: linear-gradient(135deg, #0b6b61 0%, #13a189 100%) !important;
          border-color: #0b6b61 !important;
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
          background: linear-gradient(135deg, #0b6b61 0%, #13a189 100%) !important;
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
          background: rgba(11, 107, 97, 0.1);
          border-radius: 10px;
        }

        .ant-modal-body::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #0b6b61 0%, #13a189 100%);
          border-radius: 10px;
        }

        .ant-modal-body::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, #095a52 0%, #0f8a75 100%);
        }

        .ant-modal-footer {
          border-top: 1px solid rgba(11, 107, 97, 0.1) !important;
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
          border: 2px solid rgba(11, 107, 97, 0.2) !important;
          color: #0b6b61 !important;
          background: white !important;
        }

        .ant-modal-footer .ant-btn-default:hover {
          border-color: #0b6b61 !important;
          color: #0b6b61 !important;
          transform: translateY(-2px) !important;
          box-shadow: 0 4px 12px rgba(11, 107, 97, 0.2) !important;
        }

        .ant-modal-footer .ant-btn-primary {
          background: linear-gradient(135deg, #0b6b61 0%, #13a189 100%) !important;
          border: none !important;
          color: white !important;
        }

        .ant-modal-footer .ant-btn-primary:hover {
          background: linear-gradient(135deg, #095a52 0%, #0f8a75 100%) !important;
          transform: translateY(-2px) !important;
          box-shadow: 0 8px 20px rgba(11, 107, 97, 0.4) !important;
        }

        /* Enhanced Form Styling */
        .ant-form-item-label > label {
          font-weight: 600 !important;
          color: #374151 !important;
        }

        .ant-input, .ant-select-selector {
          border-radius: 12px !important;
          border: 2px solid rgba(11, 107, 97, 0.2) !important;
          padding: 0.75rem 1rem !important;
          transition: all 0.3s ease !important;
        }

        .ant-input:focus, .ant-select-focused .ant-select-selector {
          border-color: #0b6b61 !important;
          box-shadow: 0 0 0 3px rgba(11, 107, 97, 0.1) !important;
        }

        .ant-select-dropdown {
          border-radius: 12px !important;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15) !important;
        }

        .ant-pagination {
          margin-top: 1.5rem !important;
          display: flex !important;
          justify-content: center !important;
          align-items: center !important;
        }

        .ant-pagination-item {
          border-radius: 8px !important;
          border: 2px solid rgba(11, 107, 97, 0.2) !important;
          transition: all 0.3s ease !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        }

        .ant-pagination-item:hover {
          border-color: #0b6b61 !important;
          transform: translateY(-2px) !important;
        }

        .ant-pagination-item-active {
          background: linear-gradient(135deg, #0b6b61 0%, #13a189 100%) !important;
          border-color: #0b6b61 !important;
        }

        .ant-pagination-item-active a {
          color: white !important;
        }

        .ant-pagination-options {
          display: flex !important;
          align-items: center !important;
        }

        .ant-pagination-options-size-changer {
          display: flex !important;
          align-items: center !important;
        }

        .ant-pagination-options-size-changer .ant-select {
          display: flex !important;
          align-items: center !important;
        }

        .ant-pagination-options-size-changer .ant-select-selector {
          display: flex !important;
          align-items: center !important;
          height: 32px !important;
          padding: 0 11px !important;
        }

        .ant-pagination-options-size-changer .ant-select-selection-item {
          line-height: 30px !important;
          display: flex !important;
          align-items: center !important;
        }

        .ant-select-arrow {
          display: flex !important;
          align-items: center !important;
        }

        /* Responsive Design */
        @media (max-width: 1200px) {
          .manage-container {
            padding: 1.25rem;
          }

          .page-title {
            font-size: 1.75rem;
          }

          .stat-value {
            font-size: 1.5rem;
          }

          .stat-icon {
            font-size: 1.75rem;
          }
        }

        @media (max-width: 992px) {
          .manage-container {
            padding: 1rem;
          }

          .page-title {
            font-size: 1.5rem;
          }

          .stat-card {
            padding: 1rem;
          }

          .stat-value {
            font-size: 1.35rem;
          }

          .stat-label {
            font-size: 0.8rem;
          }

          .filters-section {
            padding: 1rem;
          }

          .table-wrapper {
            padding: 1rem;
          }

          .ant-table-thead > tr > th {
            padding: 0.75rem 0.5rem !important;
            font-size: 0.8rem !important;
          }

          .ant-table-tbody > tr > td {
            padding: 0.75rem 0.5rem !important;
            font-size: 0.875rem !important;
          }
        }

        @media (max-width: 768px) {
          .admin-page {
            flex-direction: column;
          }

          .manage-container {
            padding: 0.875rem;
          }

          .page-title {
            font-size: 1.35rem;
          }

          .stats-row {
            margin-bottom: 1rem;
          }

          .stat-card {
            padding: 0.875rem;
          }

          .stat-icon {
            font-size: 1.5rem;
          }

          .stat-value {
            font-size: 1.25rem;
          }

          .stat-label {
            font-size: 0.75rem;
          }

          .filters-section {
            padding: 0.875rem;
          }

          .filters-row {
            gap: 0.5rem;
          }

          .search-input {
            min-width: 100%;
            width: 100%;
          }

          .filter-select {
            min-width: 100%;
            width: 100%;
          }

          .table-wrapper {
            padding: 0.75rem;
            border-radius: 12px;
          }

          .ant-table-thead > tr > th {
            padding: 0.625rem 0.375rem !important;
            font-size: 0.75rem !important;
          }

          .ant-table-tbody > tr > td {
            padding: 0.625rem 0.375rem !important;
            font-size: 0.8rem !important;
          }

          .ant-btn {
            font-size: 0.8rem !important;
            padding: 0.375rem 0.75rem !important;
          }

          .ant-modal {
            max-width: calc(100vw - 32px) !important;
            margin: 16px auto !important;
          }

          .ant-modal-body {
            padding: 1rem !important;
          }
        }

        @media (max-width: 576px) {
          .manage-container {
            padding: 0.75rem;
          }

          .page-title {
            font-size: 1.25rem;
          }

          .stat-card {
            padding: 0.75rem;
          }

          .stat-icon {
            font-size: 1.35rem;
            margin-bottom: 0.25rem;
          }

          .stat-value {
            font-size: 1.15rem;
          }

          .stat-label {
            font-size: 0.7rem;
          }

          .filters-section {
            padding: 0.75rem;
          }

          .table-wrapper {
            padding: 0.5rem;
          }

          .ant-table-thead > tr > th {
            padding: 0.5rem 0.25rem !important;
            font-size: 0.7rem !important;
          }

          .ant-table-tbody > tr > td {
            padding: 0.5rem 0.25rem !important;
            font-size: 0.75rem !important;
          }

          .ant-pagination {
            font-size: 0.8rem !important;
          }

          .ant-pagination-item {
            min-width: 28px !important;
            height: 28px !important;
            line-height: 26px !important;
          }
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

            {/* Page Header */}
            <div className="page-header">
              <h1 className="page-title">👨‍⚕️ Manage Doctors</h1>
            </div>

            {/* Stats Cards */}
            <Row gutter={[16, 16]} className="stats-row">
              <Col xs={24} sm={12} lg={6}>
                <Card className="stat-card" bordered={false}>
                  <div className="stat-icon">👨‍⚕️</div>
                  <h2 className="stat-value">{stats.total}</h2>
                  <p className="stat-label">Total Doctors</p>
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card className="stat-card" bordered={false}>
                  <div className="stat-icon">🏥</div>
                  <h2 className="stat-value">{stats.departments}</h2>
                  <p className="stat-label">Departments</p>
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card className="stat-card" bordered={false}>
                  <div className="stat-icon">💰</div>
                  <h2 className="stat-value">₹{stats.avgFee}</h2>
                  <p className="stat-label">Average Fee</p>
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card className="stat-card" bordered={false}>
                  <div className="stat-icon">📈</div>
                  <h2 className="stat-value">+{stats.newThisWeek}</h2>
                  <p className="stat-label">New This Week</p>
                </Card>
              </Col>
            </Row>

            {/* Filters Section */}
            <div className="filters-section">
              <div className="filters-row">
                <Input
                  className="search-input"
                  placeholder="Search by name, email, phone, or department..."
                  prefix={<SearchOutlined style={{ color: '#0b6b61' }} />}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  allowClear
                  size="large"
                />
                
                <Select
                  className="filter-select"
                  placeholder="Department"
                  value={departmentFilter}
                  onChange={setDepartmentFilter}
                  allowClear
                  size="large"
                  suffixIcon={<FilterOutlined />}
                >
                  {uniqueDepartments.map(dept => (
                    <Option key={dept} value={dept}>{dept}</Option>
                  ))}
                </Select>

                {hasActiveFilters && (
                  <Button
                    icon={<CloseCircleOutlined />}
                    onClick={clearFilters}
                    size="large"
                  >
                    Clear Filters
                  </Button>
                )}
              </div>

              {hasActiveFilters && (
                <div className="active-filters">
                  <span style={{ fontWeight: '600', color: '#6b7280' }}>Active Filters:</span>
                  {searchText && (
                    <Tag closable onClose={() => setSearchText("")} color="blue">
                      Search: {searchText}
                    </Tag>
                  )}
                  {departmentFilter && (
                    <Tag closable onClose={() => setDepartmentFilter(null)} color="blue">
                      Department: {departmentFilter}
                    </Tag>
                  )}
                </div>
              )}
            </div>

            {/* Table */}
            <div className="table-wrapper">
              <Table
                columns={columns}
                dataSource={filteredDoctors}
                loading={loading}
                rowKey={(record) => record.key || record.id || record._id}
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showTotal: (total) => `Total ${total} doctors`,
                  pageSizeOptions: ['10', '20', '50', '100']
                }}
                scroll={{ x: 1000 }}
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
    <Footer />
      </>
  );
};

export default ManageDoctors;
