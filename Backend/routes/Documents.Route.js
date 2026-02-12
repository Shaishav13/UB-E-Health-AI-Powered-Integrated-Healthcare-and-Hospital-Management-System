const express = require("express");
const mongoose = require("mongoose");
const path = require('path');
const fs = require('fs');
const upload = require("../configs/multerConfig");
const {
  createDocument,
  getPatientDocuments,
  getDoctorSharedDocuments,
  getDocumentById,
  updateDocument,
  deleteDocument,
  shareDocumentWithDoctor,
  unshareDocumentFromDoctor,
  getDocumentsByType,
  searchDocuments
} = require("../models/Document.model");

const router = express.Router();

// Upload document
router.post("/upload", upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send({ 
        message: "No file uploaded" 
      });
    }

    const { patientId, title, description, documentType, tags, uploadedByType, uploadedById, uploadedByName } = req.body;

    if (!patientId || !title || !documentType || !uploadedByType || !uploadedById || !uploadedByName) {
      // Delete uploaded file if validation fails
      fs.unlinkSync(req.file.path);
      return res.status(400).send({ 
        message: "Missing required fields: patientId, title, documentType, uploadedByType, uploadedById, uploadedByName" 
      });
    }

    if (!mongoose.Types.ObjectId.isValid(patientId) || !mongoose.Types.ObjectId.isValid(uploadedById)) {
      fs.unlinkSync(req.file.path);
      return res.status(400).send({ 
        message: "Invalid ID format" 
      });
    }

    if (!['patient', 'doctor'].includes(uploadedByType)) {
      fs.unlinkSync(req.file.path);
      return res.status(400).send({ 
        message: "uploadedByType must be 'patient' or 'doctor'" 
      });
    }

    const documentData = {
      patientId,
      uploadedBy: {
        userType: uploadedByType,
        userId: uploadedById,
        userModel: uploadedByType === 'patient' ? 'Patient' : 'Doctor',
        userName: uploadedByName
      },
      title,
      description: description || '',
      documentType,
      fileName: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      tags: tags ? JSON.parse(tags) : []
    };

    const document = await createDocument(documentData);

    console.log(`✅ Document uploaded: ${document.title} by ${uploadedByType} ${uploadedByName} for patient ${patientId}`);

    res.status(201).send({ 
      message: "Document uploaded successfully", 
      document 
    });
  } catch (error) {
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    console.error("Error uploading document:", error);
    res.status(500).send({ 
      message: "Error uploading document", 
      error: error.message 
    });
  }
});

// Get all documents for a patient
router.get("/patient/:patientId", async (req, res) => {
  try {
    const { patientId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(patientId)) {
      return res.status(400).send({ 
        message: "Invalid patient ID format" 
      });
    }

    const documents = await getPatientDocuments(patientId);

    res.status(200).send({ 
      message: "Success", 
      documents,
      count: documents.length 
    });
  } catch (error) {
    console.error("Error fetching patient documents:", error);
    res.status(500).send({ 
      message: "Error fetching documents", 
      error: error.message 
    });
  }
});

// Get documents shared with a doctor
router.get("/doctor/:doctorId", async (req, res) => {
  try {
    const { doctorId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).send({ 
        message: "Invalid doctor ID format" 
      });
    }

    const documents = await getDoctorSharedDocuments(doctorId);

    res.status(200).send({ 
      message: "Success", 
      documents,
      count: documents.length 
    });
  } catch (error) {
    console.error("Error fetching doctor documents:", error);
    res.status(500).send({ 
      message: "Error fetching documents", 
      error: error.message 
    });
  }
});

// Get documents uploaded by a doctor
router.get("/doctor/:doctorId/uploaded", async (req, res) => {
  try {
    const { doctorId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).send({ 
        message: "Invalid doctor ID format" 
      });
    }

    const { getDoctorUploadedDocuments } = require("../models/Document.model");
    const documents = await getDoctorUploadedDocuments(doctorId);

    res.status(200).send({ 
      message: "Success", 
      documents,
      count: documents.length 
    });
  } catch (error) {
    console.error("Error fetching doctor uploaded documents:", error);
    res.status(500).send({ 
      message: "Error fetching documents", 
      error: error.message 
    });
  }
});

// Get document by ID
router.get("/:documentId", async (req, res) => {
  try {
    const { documentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(documentId)) {
      return res.status(400).send({ 
        message: "Invalid document ID format" 
      });
    }

    const document = await getDocumentById(documentId);

    if (!document) {
      return res.status(404).send({ 
        message: "Document not found" 
      });
    }

    res.status(200).send({ 
      message: "Success", 
      document 
    });
  } catch (error) {
    console.error("Error fetching document:", error);
    res.status(500).send({ 
      message: "Error fetching document", 
      error: error.message 
    });
  }
});

// Download/View document
router.get("/download/:documentId", async (req, res) => {
  try {
    const { documentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(documentId)) {
      return res.status(400).send({ 
        message: "Invalid document ID format" 
      });
    }

    const document = await getDocumentById(documentId);

    if (!document) {
      return res.status(404).send({ 
        message: "Document not found" 
      });
    }

    if (!fs.existsSync(document.filePath)) {
      return res.status(404).send({ 
        message: "File not found on server" 
      });
    }

    res.download(document.filePath, document.fileName);
  } catch (error) {
    console.error("Error downloading document:", error);
    res.status(500).send({ 
      message: "Error downloading document", 
      error: error.message 
    });
  }
});

// View document (for images and PDFs)
router.get("/view/:documentId", async (req, res) => {
  try {
    const { documentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(documentId)) {
      return res.status(400).send({ 
        message: "Invalid document ID format" 
      });
    }

    const document = await getDocumentById(documentId);

    if (!document) {
      return res.status(404).send({ 
        message: "Document not found" 
      });
    }

    if (!fs.existsSync(document.filePath)) {
      return res.status(404).send({ 
        message: "File not found on server" 
      });
    }

    res.setHeader('Content-Type', document.mimeType);
    res.sendFile(path.resolve(document.filePath));
  } catch (error) {
    console.error("Error viewing document:", error);
    res.status(500).send({ 
      message: "Error viewing document", 
      error: error.message 
    });
  }
});

// Update document metadata
router.put("/:documentId", async (req, res) => {
  try {
    const { documentId } = req.params;
    const { title, description, documentType, tags } = req.body;

    if (!mongoose.Types.ObjectId.isValid(documentId)) {
      return res.status(400).send({ 
        message: "Invalid document ID format" 
      });
    }

    const updateData = {};
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (documentType) updateData.documentType = documentType;
    if (tags) updateData.tags = tags;

    const document = await updateDocument(documentId, updateData);

    if (!document) {
      return res.status(404).send({ 
        message: "Document not found" 
      });
    }

    console.log(`✅ Document updated: ${document.title}`);

    res.status(200).send({ 
      message: "Document updated successfully", 
      document 
    });
  } catch (error) {
    console.error("Error updating document:", error);
    res.status(500).send({ 
      message: "Error updating document", 
      error: error.message 
    });
  }
});

// Delete document
router.delete("/:documentId", async (req, res) => {
  try {
    const { documentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(documentId)) {
      return res.status(400).send({ 
        message: "Invalid document ID format" 
      });
    }

    const document = await getDocumentById(documentId);

    if (!document) {
      return res.status(404).send({ 
        message: "Document not found" 
      });
    }

    // Delete file from filesystem
    if (fs.existsSync(document.filePath)) {
      fs.unlinkSync(document.filePath);
    }

    // Delete document from database
    await deleteDocument(documentId);

    console.log(`✅ Document deleted: ${document.title}`);

    res.status(200).send({ 
      message: "Document deleted successfully" 
    });
  } catch (error) {
    console.error("Error deleting document:", error);
    res.status(500).send({ 
      message: "Error deleting document", 
      error: error.message 
    });
  }
});

// Share document with doctor
router.post("/:documentId/share/:doctorId", async (req, res) => {
  try {
    const { documentId, doctorId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(documentId) || !mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).send({ 
        message: "Invalid ID format" 
      });
    }

    const document = await shareDocumentWithDoctor(documentId, doctorId);

    if (!document) {
      return res.status(404).send({ 
        message: "Document not found" 
      });
    }

    console.log(`✅ Document shared: ${document.title} with doctor ${doctorId}`);

    res.status(200).send({ 
      message: "Document shared successfully", 
      document 
    });
  } catch (error) {
    console.error("Error sharing document:", error);
    res.status(500).send({ 
      message: "Error sharing document", 
      error: error.message 
    });
  }
});

// Unshare document from doctor
router.delete("/:documentId/share/:doctorId", async (req, res) => {
  try {
    const { documentId, doctorId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(documentId) || !mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).send({ 
        message: "Invalid ID format" 
      });
    }

    const document = await unshareDocumentFromDoctor(documentId, doctorId);

    if (!document) {
      return res.status(404).send({ 
        message: "Document not found" 
      });
    }

    console.log(`✅ Document unshared: ${document.title} from doctor ${doctorId}`);

    res.status(200).send({ 
      message: "Document unshared successfully", 
      document 
    });
  } catch (error) {
    console.error("Error unsharing document:", error);
    res.status(500).send({ 
      message: "Error unsharing document", 
      error: error.message 
    });
  }
});

// Get documents by type
router.get("/patient/:patientId/type/:documentType", async (req, res) => {
  try {
    const { patientId, documentType } = req.params;

    if (!mongoose.Types.ObjectId.isValid(patientId)) {
      return res.status(400).send({ 
        message: "Invalid patient ID format" 
      });
    }

    const documents = await getDocumentsByType(patientId, documentType);

    res.status(200).send({ 
      message: "Success", 
      documents,
      count: documents.length 
    });
  } catch (error) {
    console.error("Error fetching documents by type:", error);
    res.status(500).send({ 
      message: "Error fetching documents", 
      error: error.message 
    });
  }
});

// Search documents
router.get("/patient/:patientId/search/:query", async (req, res) => {
  try {
    const { patientId, query } = req.params;

    if (!mongoose.Types.ObjectId.isValid(patientId)) {
      return res.status(400).send({ 
        message: "Invalid patient ID format" 
      });
    }

    const documents = await searchDocuments(patientId, query);

    res.status(200).send({ 
      message: "Success", 
      documents,
      count: documents.length 
    });
  } catch (error) {
    console.error("Error searching documents:", error);
    res.status(500).send({ 
      message: "Error searching documents", 
      error: error.message 
    });
  }
});

module.exports = router;
