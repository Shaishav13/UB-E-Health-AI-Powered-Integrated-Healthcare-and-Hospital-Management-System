import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import Sidebar from "../../GlobalFiles/Sidebar";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";

const notify = (text) => toast(text);

const Patient_Documents = () => {
  const { data } = useSelector((store) => store.auth);
  const [documents, setDocuments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadData, setUploadData] = useState({
    patientId: "",
    title: "",
    description: "",
    documentType: "Consultation Notes",
    file: null,
  });

  const documentTypes = [
    "X-Ray",
    "Scan",
    "Lab Report",
    "Prescription",
    "Medical Certificate",
    "Consultation Notes",
    "Other",
  ];

  useEffect(() => {
    if (data?.user?._id) {
      fetchDocuments();
      fetchPatients();
    }
  }, [data]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `http://127.0.0.1:3001/documents/doctor/${data.user._id}`
      );
      setDocuments(response.data.documents);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching documents:", error);
      notify("❌ Failed to load documents");
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      const response = await axios.get("http://127.0.0.1:3001/patients");
      setPatients(response.data);
    } catch (error) {
      console.error("Error fetching patients:", error);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        notify("❌ File size must be less than 10MB");
        return;
      }
      setUploadData({ ...uploadData, file });
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!uploadData.file || !uploadData.title || !uploadData.documentType || !uploadData.patientId) {
      notify("❌ Please fill all required fields");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("document", uploadData.file);
      formData.append("patientId", uploadData.patientId);
      formData.append("title", uploadData.title);
      formData.append("description", uploadData.description);
      formData.append("documentType", uploadData.documentType);
      formData.append("uploadedByType", "doctor");
      formData.append("uploadedById", data.user._id);
      formData.append("uploadedByName", data.user.name);

      await axios.post("http://127.0.0.1:3001/documents/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      notify("✅ Document uploaded successfully");
      setShowUploadModal(false);
      setUploadData({
        patientId: "",
        title: "",
        description: "",
        documentType: "Consultation Notes",
        file: null,
      });
      fetchDocuments();
    } catch (error) {
      console.error("Error uploading document:", error);
      notify("❌ Failed to upload document");
    }
  };

  const handleDownload = async (docId, fileName) => {
    try {
      const response = await axios.get(
        `http://127.0.0.1:3001/documents/download/${docId}`,
        { responseType: "blob" }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Error downloading document:", error);
      notify("❌ Failed to download document");
    }
  };

  const handleView = (docId) => {
    window.open(`http://127.0.0.1:3001/documents/view/${docId}`, "_blank");
  };

  const filteredDocuments = documents.filter((doc) => {
    const matchesFilter = filter === "all" || doc.documentType === filter;
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.patientId?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!data?.isAuthenticated) return <Navigate to="/" />;
  if (data?.user.userType !== "doctor") return <Navigate to="/dashboard" />;

  return (
    <>
      <ToastContainer />

      <style>{`
        .documents-container {
          display: flex;
          min-height: 100vh;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          width: 100%;
        }

        .documents-content {
          flex: 1;
          padding: 2.5rem 3rem;
          overflow-y: auto;
        }

        .documents-header {
          text-align: center;
          margin-bottom: 2.5rem;
        }

        .documents-title {
          font-size: 2.5rem;
          font-weight: 800;
          margin-bottom: 0.5rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .documents-subtitle {
          font-size: 1.1rem;
          color: #64748b;
          font-weight: 500;
        }

        .controls-container {
          max-width: 1200px;
          margin: 0 auto 2rem;
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
          align-items: center;
        }

        .search-box {
          flex: 1;
          min-width: 250px;
          padding: 0.875rem 1.25rem;
          border: 2px solid rgba(102, 126, 234, 0.2);
          border-radius: 12px;
          font-size: 0.95rem;
          transition: all 0.3s ease;
        }

        .search-box:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .upload-btn {
          padding: 0.875rem 1.5rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .upload-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
        }

        .filter-container {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
          max-width: 1200px;
          margin: 0 auto 2rem;
          justify-content: center;
        }

        .filter-btn {
          padding: 0.625rem 1.25rem;
          border: 2px solid rgba(102, 126, 234, 0.2);
          background: white;
          border-radius: 10px;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .filter-btn:hover {
          border-color: #667eea;
          color: #667eea;
        }

        .filter-btn.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-color: transparent;
        }

        .documents-grid {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
        }

        .document-card {
          background: white;
          padding: 1.5rem;
          border-radius: 16px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          transition: all 0.3s ease;
          border-top: 4px solid #667eea;
        }

        .document-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.12);
        }

        .doc-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
        }

        .doc-title {
          font-size: 1.2rem;
          font-weight: 700;
          color: #374151;
          margin-bottom: 0.25rem;
        }

        .doc-type-badge {
          padding: 0.375rem 0.75rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 8px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .patient-info {
          background: #f0fdf4;
          padding: 0.75rem;
          border-radius: 8px;
          margin-bottom: 1rem;
          border-left: 3px solid #34d399;
        }

        .patient-name {
          font-weight: 600;
          color: #374151;
          margin-bottom: 0.25rem;
        }

        .patient-details {
          font-size: 0.85rem;
          color: #64748b;
        }

        .doc-description {
          color: #64748b;
          font-size: 0.9rem;
          margin-bottom: 1rem;
          line-height: 1.5;
        }

        .doc-meta {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.75rem;
          margin-bottom: 1rem;
          padding: 1rem;
          background: #f8fafc;
          border-radius: 10px;
        }

        .meta-item {
          font-size: 0.85rem;
        }

        .meta-label {
          color: #64748b;
          font-weight: 600;
        }

        .meta-value {
          color: #374151;
          font-weight: 500;
        }

        .doc-actions {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .action-btn {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .view-btn {
          background: linear-gradient(135deg, #34d399 0%, #10b981 100%);
          color: white;
        }

        .download-btn {
          background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
          color: white;
        }

        .action-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal {
          background: white;
          padding: 2rem;
          border-radius: 16px;
          max-width: 500px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-title {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 1.5rem;
          color: #374151;
        }

        .form-group {
          margin-bottom: 1.25rem;
        }

        .form-label {
          display: block;
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: #374151;
        }

        .form-input,
        .form-select,
        .form-textarea {
          width: 100%;
          padding: 0.75rem;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-size: 0.95rem;
          transition: all 0.3s ease;
        }

        .form-input:focus,
        .form-select:focus,
        .form-textarea:focus {
          outline: none;
          border-color: #667eea;
        }

        .form-textarea {
          resize: vertical;
          min-height: 80px;
        }

        .file-input-wrapper {
          position: relative;
          overflow: hidden;
          display: inline-block;
          width: 100%;
        }

        .file-input-btn {
          padding: 0.75rem;
          background: #f8fafc;
          border: 2px dashed #cbd5e1;
          border-radius: 8px;
          cursor: pointer;
          text-align: center;
          transition: all 0.3s ease;
        }

        .file-input-btn:hover {
          border-color: #667eea;
          background: #f0f4ff;
        }

        .file-input {
          position: absolute;
          left: -9999px;
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
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .modal-btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .modal-btn-secondary {
          background: #e2e8f0;
          color: #374151;
        }

        .modal-btn:hover {
          transform: translateY(-2px);
        }

        .empty-state {
          text-align: center;
          padding: 4rem 2rem;
          background: white;
          border-radius: 16px;
          max-width: 600px;
          margin: 0 auto;
        }

        .empty-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
        }

        .empty-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #374151;
          margin-bottom: 0.5rem;
        }

        .empty-text {
          color: #64748b;
        }

        @media (max-width: 768px) {
          .documents-content {
            padding: 1.5rem 1rem;
          }

          .documents-grid {
            grid-template-columns: 1fr;
          }

          .controls-container {
            flex-direction: column;
          }

          .search-box {
            width: 100%;
          }
        }
      `}</style>

      <div className="documents-container">
        <Sidebar />

        <div className="documents-content">
          <div className="documents-header">
            <h1 className="documents-title">📁 Patient Documents</h1>
            <p className="documents-subtitle">
              View shared documents and upload for patients
            </p>
          </div>

          <div className="controls-container">
            <input
              type="text"
              className="search-box"
              placeholder="🔍 Search documents or patients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button className="upload-btn" onClick={() => setShowUploadModal(true)}>
              📤 Upload for Patient
            </button>
          </div>

          <div className="filter-container">
            <button
              className={`filter-btn ${filter === "all" ? "active" : ""}`}
              onClick={() => setFilter("all")}
            >
              All
            </button>
            {documentTypes.map((type) => (
              <button
                key={type}
                className={`filter-btn ${filter === type ? "active" : ""}`}
                onClick={() => setFilter(type)}
              >
                {type}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="empty-state">
              <div className="empty-icon">⏳</div>
              <div className="empty-title">Loading documents...</div>
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📁</div>
              <div className="empty-title">No Documents Found</div>
              <div className="empty-text">
                {searchQuery
                  ? "Try a different search term"
                  : "No documents have been shared with you yet"}
              </div>
            </div>
          ) : (
            <div className="documents-grid">
              {filteredDocuments.map((doc) => (
                <div key={doc._id} className="document-card">
                  <div className="doc-header">
                    <div>
                      <div className="doc-title">📄 {doc.title}</div>
                    </div>
                    <div className="doc-type-badge">{doc.documentType}</div>
                  </div>

                  {doc.patientId && (
                    <div className="patient-info">
                      <div className="patient-name">
                        👤 Patient: {doc.patientId.name}
                      </div>
                      <div className="patient-details">
                        {doc.patientId.age} years • {doc.patientId.gender} • {doc.patientId.email}
                      </div>
                    </div>
                  )}

                  {doc.description && (
                    <div className="doc-description">{doc.description}</div>
                  )}

                  <div className="doc-meta">
                    <div className="meta-item">
                      <div className="meta-label">Uploaded By</div>
                      <div className="meta-value">{doc.uploadedBy.userName}</div>
                    </div>
                    <div className="meta-item">
                      <div className="meta-label">Date</div>
                      <div className="meta-value">{formatDate(doc.uploadDate)}</div>
                    </div>
                    <div className="meta-item">
                      <div className="meta-label">File Size</div>
                      <div className="meta-value">{formatFileSize(doc.fileSize)}</div>
                    </div>
                    <div className="meta-item">
                      <div className="meta-label">Type</div>
                      <div className="meta-value">{doc.mimeType.split("/")[1].toUpperCase()}</div>
                    </div>
                  </div>

                  <div className="doc-actions">
                    <button
                      className="action-btn view-btn"
                      onClick={() => handleView(doc._id)}
                    >
                      👁️ View
                    </button>
                    <button
                      className="action-btn download-btn"
                      onClick={() => handleDownload(doc._id, doc.fileName)}
                    >
                      ⬇️ Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">📤 Upload Document for Patient</h2>
            <form onSubmit={handleUpload}>
              <div className="form-group">
                <label className="form-label">Select Patient *</label>
                <select
                  className="form-select"
                  value={uploadData.patientId}
                  onChange={(e) =>
                    setUploadData({ ...uploadData, patientId: e.target.value })
                  }
                  required
                >
                  <option value="">Choose a patient...</option>
                  {patients.map((patient) => (
                    <option key={patient._id} value={patient._id}>
                      {patient.name} - {patient.email}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Title *</label>
                <input
                  type="text"
                  className="form-input"
                  value={uploadData.title}
                  onChange={(e) =>
                    setUploadData({ ...uploadData, title: e.target.value })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Document Type *</label>
                <select
                  className="form-select"
                  value={uploadData.documentType}
                  onChange={(e) =>
                    setUploadData({ ...uploadData, documentType: e.target.value })
                  }
                  required
                >
                  {documentTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-textarea"
                  value={uploadData.description}
                  onChange={(e) =>
                    setUploadData({ ...uploadData, description: e.target.value })
                  }
                />
              </div>

              <div className="form-group">
                <label className="form-label">File * (Max 10MB)</label>
                <div className="file-input-wrapper">
                  <label className="file-input-btn">
                    {uploadData.file ? uploadData.file.name : "📎 Choose file..."}
                    <input
                      type="file"
                      className="file-input"
                      onChange={handleFileChange}
                      accept="image/*,.pdf,.doc,.docx"
                      required
                    />
                  </label>
                </div>
              </div>

              <div className="modal-actions">
                <button type="submit" className="modal-btn modal-btn-primary">
                  Upload
                </button>
                <button
                  type="button"
                  className="modal-btn modal-btn-secondary"
                  onClick={() => setShowUploadModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Patient_Documents;
