import { useEffect, useState, useMemo } from "react";
import { Table, Button, Modal, Form, Input, Select, message, Card, Row, Col, Tag, Badge } from "antd";
import { SearchOutlined, ManOutlined, WomanOutlined, FilterOutlined, CloseCircleOutlined } from "@ant-design/icons";
import axios from "axios";
import Sidebar from "../../GlobalFiles/Sidebar";
import "./CSS/Manage.css";
import Footer from "../../../../../Components/Footer";

const { Option } = Select;

const ManagePatients = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [form] = Form.useForm();
  
  // Filter states
  const [searchText, setSearchText] = useState("");
  const [genderFilter, setGenderFilter] = useState(null);
  const [bloodGroupFilter, setBloodGroupFilter] = useState(null);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("http://127.0.0.1:3001/admin/patients", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const mappedPatients = Array.isArray(response.data)
        ? response.data.map((patient, index) => ({
            ...patient,
            key: patient._id || patient.id || `patient-${index}`,
            displayId: index + 1,
            actualId: patient._id || patient.id,
          }))
        : [];

      setPatients(mappedPatients);
    } catch (error) {
      message.error("Failed to fetch patients");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  // Calculate stats
  const stats = useMemo(() => {
    const total = patients.length;
    const male = patients.filter(p => p.gender === 'M').length;
    const female = patients.filter(p => p.gender === 'F').length;
    
    // Calculate new patients this week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const newThisWeek = patients.filter(p => {
      const createdDate = new Date(p.createdAt || p.created_at);
      return createdDate >= oneWeekAgo;
    }).length;

    return { total, male, female, newThisWeek };
  }, [patients]);

  // Filter patients
  const filteredPatients = useMemo(() => {
    return patients.filter(patient => {
      const matchesSearch = searchText === "" || 
        patient.name?.toLowerCase().includes(searchText.toLowerCase()) ||
        patient.email?.toLowerCase().includes(searchText.toLowerCase()) ||
        patient.phonenum?.includes(searchText);
      
      const matchesGender = !genderFilter || patient.gender === genderFilter;
      const matchesBloodGroup = !bloodGroupFilter || patient.bloodgroup === bloodGroupFilter;

      return matchesSearch && matchesGender && matchesBloodGroup;
    });
  }, [patients, searchText, genderFilter, bloodGroupFilter]);

  const handleEdit = (patient) => {
    setEditingPatient(patient);
    const formattedPatient = {
      ...patient,
      dob: patient.dob ? new Date(patient.dob).toISOString().split('T')[0] : ''
    };
    form.setFieldsValue(formattedPatient);
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
      message.error(`Failed to delete patient: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      const token = localStorage.getItem("token");
      const patientId = editingPatient.actualId || editingPatient._id || editingPatient.id;

      await axios.put(
        `http://127.0.0.1:3001/admin/patients/${patientId}`,
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
      message.error(`Failed to update patient: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const clearFilters = () => {
    setSearchText("");
    setGenderFilter(null);
    setBloodGroupFilter(null);
  };

  const hasActiveFilters = searchText || genderFilter || bloodGroupFilter;

  // Generate avatar initials
  const getInitials = (name) => {
    if (!name) return "??";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Get avatar color based on gender
  const getAvatarColor = (gender) => {
    if (gender === 'M') return '#3b82f6'; // Blue for male
    if (gender === 'F') return '#ec4899'; // Pink for female
    return '#6b7280'; // Gray for unknown
  };

  // Get blood group badge color
  const getBloodGroupColor = (bloodGroup) => {
    const colors = {
      'A+': '#ef4444', 'A-': '#f87171',
      'B+': '#3b82f6', 'B-': '#60a5fa',
      'O+': '#10b981', 'O-': '#34d399',
      'AB+': '#8b5cf6', 'AB-': '#a78bfa'
    };
    return colors[bloodGroup] || '#6b7280';
  };

  const columns = [
    {
      title: "Patient",
      key: "patient",
      width: 250,
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '45px',
              height: '45px',
              borderRadius: '50%',
              background: getAvatarColor(record.gender),
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
      title: "Age",
      dataIndex: "age",
      key: "age",
      width: 80,
      sorter: (a, b) => (a.age || 0) - (b.age || 0),
      render: (age) => (
        <span style={{ fontWeight: '600', color: '#0b6b61' }}>
          {age || 'N/A'}
        </span>
      ),
    },
    {
      title: "Gender",
      dataIndex: "gender",
      key: "gender",
      width: 100,
      render: (gender) => {
        if (gender === 'M') {
          return (
            <Tag icon={<ManOutlined />} color="blue" style={{ fontWeight: '600' }}>
              Male
            </Tag>
          );
        } else if (gender === 'F') {
          return (
            <Tag icon={<WomanOutlined />} color="pink" style={{ fontWeight: '600' }}>
              Female
            </Tag>
          );
        }
        return <Tag color="default">Unknown</Tag>;
      },
    },
    {
      title: "Blood Group",
      dataIndex: "bloodgroup",
      key: "bloodgroup",
      width: 120,
      render: (bloodGroup) => (
        <Badge
          count={bloodGroup || 'N/A'}
          style={{
            backgroundColor: getBloodGroupColor(bloodGroup),
            fontWeight: '700',
            fontSize: '13px',
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
            onClick={() => handleDelete(record.actualId || record._id || record.id)}
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
      <style>{`
        .admin-page {
          display: flex;
          align-items: flex-start !important;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          min-height: 100vh;
          position: relative;
          width: 100%;
        }

        .admin-page::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="pattern" width="60" height="60" patternUnits="userSpaceOnUse"><circle cx="30" cy="30" r="2" fill="rgba(11,107,97,0.05)"/></pattern></defs><rect width="100" height="100" fill="url(%23pattern)"/></svg>');
          pointer-events: none;
          z-index: 0;
        }

        .admin-content {
          margin: 0 !important;
          padding: 0 !important;
          flex: 1;
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 100%;
          overflow-x: hidden;
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
          min-width: 130px;
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

        .ant-table {
          background: transparent !important;
        }

        .ant-table-thead > tr > th {
          background: linear-gradient(135deg, #0b6b61 0%, #13a189 100%) !important;
          color: white !important;
          font-weight: 700 !important;
          border: none !important;
          padding: 1rem 4.2rem !important;
          font-size: 0.875rem !important;
          white-space: nowrap !important;
          text-transform: uppercase !important;
          letter-spacing: 0.5px !important;
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

        .ant-input, .ant-select-selector {
          border-radius: 10px !important;
          border: 2px solid rgba(11, 107, 97, 0.2) !important;
          transition: all 0.3s ease !important;
        }

        .ant-input:focus, .ant-select-focused .ant-select-selector {
          border-color: #0b6b61 !important;
          box-shadow: 0 0 0 3px rgba(11, 107, 97, 0.1) !important;
        }

        .ant-btn-primary {
          background: linear-gradient(135deg, #0b6b61 0%, #13a189 100%) !important;
          border: none !important;
          border-radius: 10px !important;
          font-weight: 600 !important;
          transition: all 0.3s ease !important;
        }

        .ant-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(11, 107, 97, 0.3) !important;
        }

        .ant-btn-dangerous {
          border-radius: 10px !important;
        }

        .ant-modal-content {
          border-radius: 16px !important;
          overflow: hidden !important;
        }

        .ant-modal-header {
          background: linear-gradient(135deg, #0b6b61 0%, #13a189 100%) !important;
          border: none !important;
          padding: 1.25rem 1.5rem !important;
        }

        .ant-modal-title {
          color: white !important;
          font-size: 1.25rem !important;
          font-weight: 700 !important;
        }

        .ant-modal-close {
          color: white !important;
        }

        .ant-modal-close:hover {
          background: rgba(255, 255, 255, 0.2) !important;
        }

        .ant-modal-body {
          padding: 1.5rem !important;
          max-height: 70vh;
          overflow-y: auto;
        }

        .ant-form-item-label > label {
          font-weight: 600 !important;
          color: #374151 !important;
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

          .page-header {
            margin-bottom: 1rem;
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
            min-width: calc(50% - 0.25rem);
            flex: 1;
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

          .filter-select {
            min-width: 100%;
            width: 100%;
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
      `}</style>

      <div className="admin-page">
        <Sidebar />

        <div className="admin-content">
          <div className="manage-container">
            
            {/* Page Header */}
            <div className="page-header">
              <h1 className="page-title">👥 Manage Patients</h1>
            </div>

            {/* Stats Cards */}
            <Row gutter={[16, 16]} className="stats-row">
              <Col xs={24} sm={12} lg={6}>
                <Card className="stat-card" bordered={false}>
                  <div className="stat-icon">👥</div>
                  <h2 className="stat-value">{stats.total}</h2>
                  <p className="stat-label">Total Patients</p>
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card className="stat-card" bordered={false}>
                  <div className="stat-icon">👨</div>
                  <h2 className="stat-value">{stats.male}</h2>
                  <p className="stat-label">Male Patients</p>
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card className="stat-card" bordered={false}>
                  <div className="stat-icon">👩</div>
                  <h2 className="stat-value">{stats.female}</h2>
                  <p className="stat-label">Female Patients</p>
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
                  placeholder="Search by name, email, or phone..."
                  prefix={<SearchOutlined style={{ color: '#0b6b61' }} />}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  allowClear
                  size="large"
                />
                
                <Select
                  className="filter-select"
                  placeholder="Gender"
                  value={genderFilter}
                  onChange={setGenderFilter}
                  allowClear
                  size="large"
                  suffixIcon={<FilterOutlined />}
                >
                  <Option value="M">Male</Option>
                  <Option value="F">Female</Option>
                </Select>

                <Select
                  className="filter-select"
                  placeholder="Blood Group"
                  value={bloodGroupFilter}
                  onChange={setBloodGroupFilter}
                  allowClear
                  size="large"
                  suffixIcon={<FilterOutlined />}
                >
                  <Option value="A+">A+</Option>
                  <Option value="A-">A-</Option>
                  <Option value="B+">B+</Option>
                  <Option value="B-">B-</Option>
                  <Option value="O+">O+</Option>
                  <Option value="O-">O-</Option>
                  <Option value="AB+">AB+</Option>
                  <Option value="AB-">AB-</Option>
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
                  {genderFilter && (
                    <Tag closable onClose={() => setGenderFilter(null)} color="blue">
                      Gender: {genderFilter === 'M' ? 'Male' : 'Female'}
                    </Tag>
                  )}
                  {bloodGroupFilter && (
                    <Tag closable onClose={() => setBloodGroupFilter(null)} color="blue">
                      Blood: {bloodGroupFilter}
                    </Tag>
                  )}
                </div>
              )}
            </div>

            {/* Table */}
            <div className="table-wrapper">
              <Table
                columns={columns}
                dataSource={filteredPatients}
                loading={loading}
                rowKey={(record) => record.key || record.id || record._id}
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showTotal: (total) => `Total ${total} patients`,
                  pageSizeOptions: ['10', '20', '50', '100']
                }}
                scroll={{ x: 1000 }}
              />
            </div>

            {/* Edit Modal */}
            <Modal
              title="Update Patient Information"
              open={isModalVisible}
              onOk={handleModalOk}
              onCancel={handleModalCancel}
              okText="Save Changes"
              cancelText="Cancel"
              width={600}
              centered
              destroyOnClose
            >
              <Form form={form} layout="vertical">
                <Form.Item name="name" label="Full Name" rules={[{ required: true, message: 'Please enter name' }]}>
                  <Input size="large" />
                </Form.Item>

                <Form.Item name="email" label="Email" rules={[{ required: true, type: "email", message: 'Please enter valid email' }]}>
                  <Input size="large" />
                </Form.Item>

                <Form.Item name="phonenum" label="Phone Number" rules={[{ required: true, message: 'Please enter phone' }]}>
                  <Input size="large" />
                </Form.Item>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item name="age" label="Age" rules={[{ required: true, message: 'Please enter age' }]}>
                      <Input type="number" size="large" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="gender" label="Gender" rules={[{ required: true, message: 'Please select gender' }]}>
                      <Select size="large">
                        <Option value="M">Male</Option>
                        <Option value="F">Female</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item name="bloodgroup" label="Blood Group" rules={[{ required: true, message: 'Please enter blood group' }]}>
                      <Select size="large">
                        <Option value="A+">A+</Option>
                        <Option value="A-">A-</Option>
                        <Option value="B+">B+</Option>
                        <Option value="B-">B-</Option>
                        <Option value="O+">O+</Option>
                        <Option value="O-">O-</Option>
                        <Option value="AB+">AB+</Option>
                        <Option value="AB-">AB-</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="dob" label="Date of Birth" rules={[{ required: true, message: 'Please select DOB' }]}>
                      <Input type="date" size="large" />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item name="address" label="Address" rules={[{ required: true, message: 'Please enter address' }]}>
                  <Input.TextArea rows={3} size="large" />
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

export default ManagePatients;
