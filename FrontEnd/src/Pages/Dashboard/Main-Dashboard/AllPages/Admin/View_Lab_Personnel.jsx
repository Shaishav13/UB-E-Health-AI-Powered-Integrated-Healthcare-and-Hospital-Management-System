import { useState, useEffect } from "react";
import Sidebar from "../../GlobalFiles/Sidebar";
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import Footer from "../../../../../Components/Footer";

const notify = (text) => toast(text);

const ViewLabPersonnel = () => {
  const { data } = useSelector((store) => store.auth);
  const [labPersonnel, setLabPersonnel] = useState([]);
  const [filteredPersonnel, setFilteredPersonnel] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [specializationFilter, setSpecializationFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedPersonnel, setSelectedPersonnel] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const itemsPerPage = 10;

  // Fetch lab personnel on mount
  useEffect(() => {
    fetchLabPersonnel();
  }, []);

  // Filter personnel when search or filter changes
  useEffect(() => {
    filterPersonnel();
  }, [searchTerm, specializationFilter, labPersonnel]);

  const fetchLabPersonnel = async () => {
    try {
      setLoading(true);
      const token = data?.token;
      const response = await axios.get(
        "http://127.0.0.1:3001/lab-personnel/all",
        {
          headers: {
            Authorization: token,
          },
        }
      );
      setLabPersonnel(response.data);
      setFilteredPersonnel(response.data);
    } catch (error) {
      console.error("Error fetching lab personnel:", error);
      notify("Failed to fetch lab personnel");
    } finally {
      setLoading(false);
    }
  };

  const filterPersonnel = () => {
    let filtered = [...labPersonnel];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (person) =>
          person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          person.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          person.labId.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply specialization filter
    if (specializationFilter) {
      filtered = filtered.filter(
        (person) => person.specialization === specializationFilter
      );
    }

    setFilteredPersonnel(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleEdit = (person) => {
    setSelectedPersonnel(person);
    setEditFormData({
      name: person.name,
      email: person.email,
      phoneNum: person.phoneNum,
      age: person.age,
      gender: person.gender,
      bloodGroup: person.bloodGroup,
      DOB: person.DOB ? person.DOB.split("T")[0] : "",
      address: person.address,
      specialization: person.specialization,
      qualification: person.qualification,
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = data?.token;
      await axios.put(
        `http://127.0.0.1:3001/lab-personnel/update/${selectedPersonnel.labId}`,
        editFormData,
        {
          headers: {
            Authorization: token,
          },
        }
      );
      notify("Lab personnel updated successfully ✔");
      setShowEditModal(false);
      fetchLabPersonnel();
    } catch (error) {
      console.error("Error updating lab personnel:", error);
      notify(error.response?.data?.error || "Failed to update lab personnel");
    }
  };

  const handleDelete = (person) => {
    setSelectedPersonnel(person);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    try {
      const token = data?.token;
      await axios.delete(
        `http://127.0.0.1:3001/lab-personnel/delete/${selectedPersonnel.labId}`,
        {
          headers: {
            Authorization: token,
          },
        }
      );
      notify("Lab personnel deleted successfully ✔");
      setShowDeleteDialog(false);
      fetchLabPersonnel();
    } catch (error) {
      console.error("Error deleting lab personnel:", error);
      notify(error.response?.data?.error || "Failed to delete lab personnel");
    }
  };

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredPersonnel.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredPersonnel.length / itemsPerPage);

  // Get unique specializations for filter
  const specializations = [...new Set(labPersonnel.map((p) => p.specialization))];

  if (!data?.isAuthenticated) return <Navigate to="/" />;
  if (data?.user.userType !== "admin") return <Navigate to="/dashboard" />;

  return (
    <>
      <ToastContainer />

      {/* ---------- INLINE MODERN CSS ---------- */}
      <style>
        {`
          .view-lab-page {
            display: flex;
            min-height: 100vh;
            background: #f5f7f8;
          }

          .view-lab-content {
            flex: 1;
            padding: 2.5rem 3rem;
          }

          .view-lab-title {
            font-size: 2rem;
            font-weight: 700;
            color: #0b6b61;
            margin-bottom: 1.5rem;
          }

          .filters-section {
            background: white;
            padding: 1.5rem;
            border-radius: 16px;
            margin-bottom: 1.5rem;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
            display: flex;
            gap: 1rem;
            flex-wrap: wrap;
            align-items: center;
          }

          .search-input,
          .filter-select {
            padding: 0.75rem 1rem;
            border: 2px solid #d0dada;
            border-radius: 10px;
            font-size: 1rem;
            transition: 0.25s ease;
            background: white;
          }

          .search-input {
            flex: 1;
            min-width: 250px;
          }

          .filter-select {
            min-width: 200px;
          }

          .search-input:focus,
          .filter-select:focus {
            outline: none;
            border-color: #0b6b61;
            box-shadow: 0 0 0 3px rgba(11,107,97,0.15);
          }

          .table-card {
            background: white;
            border-radius: 16px;
            box-shadow: 0 4px 14px rgba(0,0,0,0.12);
            overflow: hidden;
          }

          .personnel-table {
            width: 100%;
            border-collapse: collapse;
          }

          .personnel-table thead {
            background: linear-gradient(135deg, #0b6b61, #139b86);
            color: white;
          }

          .personnel-table th {
            padding: 1rem;
            text-align: left;
            font-weight: 600;
            font-size: 0.95rem;
          }

          .personnel-table td {
            padding: 1rem;
            border-bottom: 1px solid #e8e8e8;
          }

          .personnel-table tbody tr {
            transition: 0.2s ease;
          }

          .personnel-table tbody tr:hover {
            background: #f8fffe;
          }

          .action-btn {
            padding: 0.5rem 1rem;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: 0.2s ease;
            margin-right: 0.5rem;
            font-size: 0.875rem;
          }

          .edit-btn {
            background: #17a2b8;
            color: white;
          }

          .edit-btn:hover {
            background: #138496;
            transform: translateY(-2px);
          }

          .delete-btn {
            background: #dc3545;
            color: white;
          }

          .delete-btn:hover {
            background: #c82333;
            transform: translateY(-2px);
          }

          .pagination {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 0.5rem;
            padding: 1.5rem;
          }

          .page-btn {
            padding: 0.5rem 1rem;
            border: 2px solid #0b6b61;
            background: white;
            color: #0b6b61;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            transition: 0.2s ease;
          }

          .page-btn:hover:not(:disabled) {
            background: #0b6b61;
            color: white;
          }

          .page-btn:disabled {
            opacity: 0.4;
            cursor: not-allowed;
          }

          .page-btn.active {
            background: #0b6b61;
            color: white;
          }

          .page-info {
            color: #555;
            font-weight: 600;
          }

          .loading-state,
          .empty-state {
            text-align: center;
            padding: 3rem;
            color: #666;
          }

          .loading-spinner {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #0b6b61;
            border-radius: 50%;
            width: 50px;
            height: 50px;
            animation: spin 1s linear infinite;
            margin: 0 auto 1rem;
          }

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          .empty-icon {
            font-size: 4rem;
            margin-bottom: 1rem;
          }

          /* Modal Styles */
          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.6);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            padding: 1rem;
          }

          .modal-content {
            background: white;
            border-radius: 16px;
            padding: 2rem;
            max-width: 600px;
            width: 100%;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
          }

          .modal-header {
            font-size: 1.5rem;
            font-weight: 700;
            color: #0b6b61;
            margin-bottom: 1.5rem;
          }

          .form-group {
            margin-bottom: 1rem;
          }

          .form-group label {
            display: block;
            font-weight: 600;
            color: #0b6b61;
            margin-bottom: 0.4rem;
          }

          .form-group input,
          .form-group select {
            width: 100%;
            padding: 0.75rem 1rem;
            border: 2px solid #d0dada;
            border-radius: 10px;
            font-size: 1rem;
            transition: 0.25s ease;
          }

          .form-group input:focus,
          .form-group select:focus {
            outline: none;
            border-color: #0b6b61;
            box-shadow: 0 0 0 3px rgba(11,107,97,0.15);
          }

          .modal-actions {
            display: flex;
            gap: 1rem;
            margin-top: 1.5rem;
          }

          .modal-btn {
            flex: 1;
            padding: 0.75rem;
            border: none;
            border-radius: 10px;
            font-weight: 600;
            cursor: pointer;
            transition: 0.2s ease;
          }

          .modal-btn-primary {
            background: linear-gradient(135deg, #0b6b61, #139b86);
            color: white;
          }

          .modal-btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
          }

          .modal-btn-secondary {
            background: #6c757d;
            color: white;
          }

          .modal-btn-secondary:hover {
            background: #5a6268;
          }

          /* Delete Dialog */
          .delete-dialog {
            max-width: 400px;
          }

          .delete-message {
            color: #555;
            margin-bottom: 1.5rem;
            line-height: 1.6;
          }

          .delete-warning {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 1rem;
            border-radius: 8px;
            margin-bottom: 1.5rem;
            color: #856404;
          }

          /* Responsive Design */
          @media (max-width: 768px) {
            .view-lab-content {
              padding: 1.5rem 1rem;
            }

            .view-lab-title {
              font-size: 1.5rem;
            }

            .filters-section {
              flex-direction: column;
            }

            .search-input,
            .filter-select {
              width: 100%;
              min-width: unset;
            }

            .table-card {
              overflow-x: auto;
            }

            .personnel-table {
              min-width: 800px;
            }

            .modal-content {
              padding: 1.5rem;
            }

            .modal-actions {
              flex-direction: column;
            }
          }
        `}
      </style>

      {/* ---------- PAGE LAYOUT ---------- */}
      <div className="view-lab-page">
        <Sidebar />

        <div className="view-lab-content">
          <h1 className="view-lab-title">🧪 Lab Personnel Management</h1>

          {/* Filters Section */}
          <div className="filters-section">
            <input
              type="text"
              className="search-input"
              placeholder="🔍 Search by name, email, or Lab ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              className="filter-select"
              value={specializationFilter}
              onChange={(e) => setSpecializationFilter(e.target.value)}
            >
              <option value="">All Specializations</option>
              {specializations.map((spec) => (
                <option key={spec} value={spec}>
                  {spec}
                </option>
              ))}
            </select>
          </div>

          {/* Table Card */}
          <div className="table-card">
            {loading ? (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>Loading lab personnel...</p>
              </div>
            ) : filteredPersonnel.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📋</div>
                <h3>No Lab Personnel Found</h3>
                <p>
                  {searchTerm || specializationFilter
                    ? "Try adjusting your search or filters"
                    : "No lab personnel have been added yet"}
                </p>
              </div>
            ) : (
              <>
                <table className="personnel-table">
                  <thead>
                    <tr>
                      <th>Lab ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Specialization</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.map((person) => (
                      <tr key={person.labId}>
                        <td>{person.labId}</td>
                        <td>{person.name}</td>
                        <td>{person.email}</td>
                        <td>{person.phoneNum}</td>
                        <td>{person.specialization}</td>
                        <td>
                          <button
                            className="action-btn edit-btn"
                            onClick={() => handleEdit(person)}
                          >
                            ✏️ Edit
                          </button>
                          <button
                            className="action-btn delete-btn"
                            onClick={() => handleDelete(person)}
                          >
                            🗑️ Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="pagination">
                    <button
                      className="page-btn"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      ← Previous
                    </button>
                    <span className="page-info">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      className="page-btn"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-header">Edit Lab Personnel</h2>
            <form onSubmit={handleEditSubmit}>
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, name: e.target.value })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={editFormData.email}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, email: e.target.value })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  value={editFormData.phoneNum}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, phoneNum: e.target.value })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>Age</label>
                <input
                  type="number"
                  value={editFormData.age}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, age: e.target.value })
                  }
                  min="18"
                  max="70"
                  required
                />
              </div>

              <div className="form-group">
                <label>Gender</label>
                <select
                  value={editFormData.gender}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, gender: e.target.value })
                  }
                  required
                >
                  <option value="">Choose Gender</option>
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label>Blood Group</label>
                <select
                  value={editFormData.bloodGroup}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, bloodGroup: e.target.value })
                  }
                  required
                >
                  <option value="">Select Blood Group</option>
                  <option>A+</option>
                  <option>A-</option>
                  <option>B+</option>
                  <option>B-</option>
                  <option>AB+</option>
                  <option>AB-</option>
                  <option>O+</option>
                  <option>O-</option>
                </select>
              </div>

              <div className="form-group">
                <label>Date of Birth</label>
                <input
                  type="date"
                  value={editFormData.DOB}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, DOB: e.target.value })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>Address</label>
                <input
                  type="text"
                  value={editFormData.address}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, address: e.target.value })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>Specialization</label>
                <select
                  value={editFormData.specialization}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      specialization: e.target.value,
                    })
                  }
                  required
                >
                  <option value="">Select Specialization</option>
                  <option>Hematology</option>
                  <option>Biochemistry</option>
                  <option>Microbiology</option>
                  <option>Pathology</option>
                  <option>Clinical Chemistry</option>
                  <option>Immunology</option>
                  <option>Molecular Biology</option>
                  <option>Cytology</option>
                  <option>Histopathology</option>
                </select>
              </div>

              <div className="form-group">
                <label>Qualification</label>
                <input
                  type="text"
                  value={editFormData.qualification}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      qualification: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="modal-actions">
                <button type="submit" className="modal-btn modal-btn-primary">
                  Save Changes
                </button>
                <button
                  type="button"
                  className="modal-btn modal-btn-secondary"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="modal-overlay" onClick={() => setShowDeleteDialog(false)}>
          <div
            className="modal-content delete-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="modal-header">Confirm Delete</h2>
            <div className="delete-message">
              Are you sure you want to delete{" "}
              <strong>{selectedPersonnel?.name}</strong> (
              {selectedPersonnel?.labId})?
            </div>
            <div className="delete-warning">
              ⚠️ This action cannot be undone. All data associated with this lab
              personnel will be permanently deleted.
            </div>
            <div className="modal-actions">
              <button
                className="modal-btn delete-btn"
                onClick={confirmDelete}
              >
                Delete
              </button>
              <button
                className="modal-btn modal-btn-secondary"
                onClick={() => setShowDeleteDialog(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    <Footer />
      </>
  );
};

export default ViewLabPersonnel;
