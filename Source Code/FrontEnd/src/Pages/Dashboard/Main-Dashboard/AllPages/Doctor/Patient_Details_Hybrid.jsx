import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Navigate } from "react-router-dom";
import { GetPatientsByDoctor } from "../../../../../Redux/Datas/action";
import Sidebar from "../../GlobalFiles/Sidebar";

function PatientDetailsHybrid() {
  const dispatch = useDispatch();
  const { data } = useSelector((store) => store.auth);
  const { patients } = useSelector((store) => store.data.patients);
  
  const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'board'
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGender, setFilterGender] = useState('all');
  const [filterBloodGroup, setFilterBloodGroup] = useState('all');

  useEffect(() => {
    dispatch(GetPatientsByDoctor());
  }, [dispatch]);

  if (!data?.isAuthenticated) return <Navigate to="/" />;
  if (data?.user.userType !== "doctor") return <Navigate to="/dashboard" />;

  const Datas = patients || [];
  
  // Filter patients
  const filteredPatients = Datas.filter(patient => {
    const matchesSearch = patient.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGender = filterGender === 'all' || patient.gender === filterGender;
    const matchesBlood = filterBloodGroup === 'all' || patient.bloodgroup === filterBloodGroup;
    return matchesSearch && matchesGender && matchesBlood;
  });

  // Calculate stats
  const stats = {
    total: filteredPatients.length,
    active: filteredPatients.filter(p => p.status === 'active' || !p.status).length,
    followUp: filteredPatients.filter(p => p.status === 'follow-up').length,
    critical: filteredPatients.filter(p => p.status === 'critical').length,
  };

  // Group patients by status for board view
  const patientsByStatus = {
    active: filteredPatients.filter(p => p.status === 'active' || !p.status),
    'follow-up': filteredPatients.filter(p => p.status === 'follow-up'),
    critical: filteredPatients.filter(p => p.status === 'critical'),
    'under-treatment': filteredPatients.filter(p => p.status === 'under-treatment'),
    recovered: filteredPatients.filter(p => p.status === 'recovered'),
  };

  const PatientCard = ({ patient }) => (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      transition: 'transform 0.2s, box-shadow 0.2s',
      cursor: 'pointer',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-4px)';
      e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
        <div>
          <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: '600' }}>{patient.name}</h3>
          <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>{patient.email}</p>
        </div>
        <span style={{
          background: patient.gender === 'Male' ? '#e3f2fd' : '#fce4ec',
          color: patient.gender === 'Male' ? '#1976d2' : '#c2185b',
          padding: '4px 12px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: '600'
        }}>
          {patient.gender}
        </span>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
        <div>
          <p style={{ margin: 0, fontSize: '11px', color: '#999', textTransform: 'uppercase' }}>Age</p>
          <p style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>{patient.age} years</p>
        </div>
        <div>
          <p style={{ margin: 0, fontSize: '11px', color: '#999', textTransform: 'uppercase' }}>Blood</p>
          <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#d32f2f' }}>{patient.bloodgroup}</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
        <button style={{
          flex: 1,
          padding: '8px',
          background: '#667eea',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          fontSize: '13px',
          fontWeight: '600',
          cursor: 'pointer'
        }}>
          View Details
        </button>
        <button style={{
          flex: 1,
          padding: '8px',
          background: '#f5f5f5',
          color: '#333',
          border: 'none',
          borderRadius: '6px',
          fontSize: '13px',
          fontWeight: '600',
          cursor: 'pointer'
        }}>
          Create Report
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f7fa' }}>
      <Sidebar />
      <div style={{ marginLeft: '80px', padding: '30px', width: '100%' }}>
        
        {/* Header */}
        <div style={{ marginBottom: '30px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: '700', margin: '0 0 8px 0' }}>👥 My Patients</h1>
          <p style={{ margin: 0, color: '#666' }}>Manage and track your patient care</p>
        </div>

        {/* Stats Dashboard */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
          <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#999', textTransform: 'uppercase' }}>Total Patients</p>
            <p style={{ margin: 0, fontSize: '32px', fontWeight: '700', color: '#667eea' }}>{stats.total}</p>
          </div>
          <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#999', textTransform: 'uppercase' }}>Active</p>
            <p style={{ margin: 0, fontSize: '32px', fontWeight: '700', color: '#4caf50' }}>{stats.active}</p>
          </div>
          <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#999', textTransform: 'uppercase' }}>Follow-up</p>
            <p style={{ margin: 0, fontSize: '32px', fontWeight: '700', color: '#ff9800' }}>{stats.followUp}</p>
          </div>
          <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#999', textTransform: 'uppercase' }}>Critical</p>
            <p style={{ margin: 0, fontSize: '32px', fontWeight: '700', color: '#f44336' }}>{stats.critical}</p>
          </div>
        </div>

        {/* Search & Filters */}
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginBottom: '30px' }}>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="🔍 Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                flex: '1',
                minWidth: '200px',
                padding: '12px 16px',
                border: '2px solid #e0e0e0',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none'
              }}
            />
            
            <select
              value={filterGender}
              onChange={(e) => setFilterGender(e.target.value)}
              style={{
                padding: '12px 16px',
                border: '2px solid #e0e0e0',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="all">All Genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>

            <select
              value={filterBloodGroup}
              onChange={(e) => setFilterBloodGroup(e.target.value)}
              style={{
                padding: '12px 16px',
                border: '2px solid #e0e0e0',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="all">All Blood Groups</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
            </select>

            <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setViewMode('cards')}
                style={{
                  padding: '12px 20px',
                  background: viewMode === 'cards' ? '#667eea' : '#f5f5f5',
                  color: viewMode === 'cards' ? 'white' : '#333',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                📇 Cards
              </button>
              <button
                onClick={() => setViewMode('board')}
                style={{
                  padding: '12px 20px',
                  background: viewMode === 'board' ? '#667eea' : '#f5f5f5',
                  color: viewMode === 'board' ? 'white' : '#333',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                📋 Board
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        {filteredPatients.length === 0 ? (
          <div style={{
            background: 'white',
            padding: '60px',
            borderRadius: '12px',
            textAlign: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '16px', opacity: 0.3 }}>👥</div>
            <p style={{ fontSize: '18px', color: '#666', margin: 0 }}>No patients found</p>
          </div>
        ) : viewMode === 'cards' ? (
          // Card View
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '20px'
          }}>
            {filteredPatients.map((patient) => (
              <PatientCard key={patient._id || patient.email} patient={patient} />
            ))}
          </div>
        ) : (
          // Board View
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '20px'
          }}>
            {Object.entries(patientsByStatus).map(([status, patients]) => (
              <div key={status} style={{
                background: 'white',
                borderRadius: '12px',
                padding: '16px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                minHeight: '400px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '16px',
                  paddingBottom: '12px',
                  borderBottom: '2px solid #f0f0f0'
                }}>
                  <span style={{ fontSize: '20px' }}>
                    {status === 'active' ? '🟢' : 
                     status === 'follow-up' ? '🟡' : 
                     status === 'critical' ? '🔴' : 
                     status === 'under-treatment' ? '🟣' : '⚪'}
                  </span>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', textTransform: 'capitalize' }}>
                    {status.replace('-', ' ')}
                  </h3>
                  <span style={{
                    marginLeft: 'auto',
                    background: '#f5f5f5',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '13px',
                    fontWeight: '600'
                  }}>
                    {patients.length}
                  </span>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {patients.map((patient) => (
                    <PatientCard key={patient._id || patient.email} patient={patient} />
                  ))}
                  {patients.length === 0 && (
                    <p style={{ textAlign: 'center', color: '#999', fontSize: '14px', padding: '20px' }}>
                      No patients in this category
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default PatientDetailsHybrid;
