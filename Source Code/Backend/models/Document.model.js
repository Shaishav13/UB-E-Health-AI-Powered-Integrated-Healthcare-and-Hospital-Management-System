const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema({
  patientId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Patient', 
    required: true 
  },
  uploadedBy: {
    userType: {
      type: String,
      enum: ['patient', 'doctor'],
      required: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'uploadedBy.userModel'
    },
    userModel: {
      type: String,
      required: true,
      enum: ['Patient', 'Doctor']
    },
    userName: {
      type: String,
      required: true
    }
  },
  title: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String, 
    default: '' 
  },
  documentType: { 
    type: String, 
    enum: ['X-Ray', 'Scan', 'Lab Report', 'Prescription', 'Medical Certificate', 'Consultation Notes', 'Other'],
    required: true 
  },
  fileName: { 
    type: String, 
    required: true 
  },
  filePath: { 
    type: String, 
    required: true 
  },
  fileSize: { 
    type: Number, 
    required: true 
  },
  mimeType: { 
    type: String, 
    required: true 
  },
  uploadDate: { 
    type: Date, 
    default: Date.now 
  },
  sharedWith: [{
    doctorId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Doctor' 
    },
    sharedDate: { 
      type: Date, 
      default: Date.now 
    }
  }],
  tags: [{ 
    type: String 
  }],
  isVisible: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

const Document = mongoose.model("Document", documentSchema);

// Create document
const createDocument = async (documentData) => {
  const newDocument = new Document(documentData);
  return await newDocument.save();
};

// Get all documents for a patient
const getPatientDocuments = async (patientId) => {
  return await Document.find({ patientId })
    .populate('sharedWith.doctorId', 'name email')
    .sort({ uploadDate: -1 });
};

// Get documents shared with a doctor
const getDoctorSharedDocuments = async (doctorId) => {
  return await Document.find({ 'sharedWith.doctorId': doctorId })
    .populate('patientId', 'name email age gender')
    .sort({ uploadDate: -1 });
};

// Get documents uploaded by a doctor
const getDoctorUploadedDocuments = async (doctorId) => {
  return await Document.find({ 
    'uploadedBy.userId': doctorId,
    'uploadedBy.userType': 'doctor'
  })
    .populate('patientId', 'name email age gender')
    .sort({ uploadDate: -1 });
};

// Get document by ID
const getDocumentById = async (documentId) => {
  return await Document.findById(documentId)
    .populate('patientId', 'name email')
    .populate('sharedWith.doctorId', 'name email');
};

// Update document
const updateDocument = async (documentId, updateData) => {
  return await Document.findByIdAndUpdate(
    documentId, 
    updateData, 
    { new: true }
  );
};

// Delete document
const deleteDocument = async (documentId) => {
  return await Document.findByIdAndDelete(documentId);
};

// Share document with doctor
const shareDocumentWithDoctor = async (documentId, doctorId) => {
  return await Document.findByIdAndUpdate(
    documentId,
    { 
      $addToSet: { 
        sharedWith: { 
          doctorId, 
          sharedDate: new Date() 
        } 
      } 
    },
    { new: true }
  );
};

// Unshare document from doctor
const unshareDocumentFromDoctor = async (documentId, doctorId) => {
  return await Document.findByIdAndUpdate(
    documentId,
    { 
      $pull: { 
        sharedWith: { doctorId } 
      } 
    },
    { new: true }
  );
};

// Get documents by type
const getDocumentsByType = async (patientId, documentType) => {
  return await Document.find({ patientId, documentType })
    .sort({ uploadDate: -1 });
};

// Search documents
const searchDocuments = async (patientId, searchQuery) => {
  return await Document.find({
    patientId,
    $or: [
      { title: { $regex: searchQuery, $options: 'i' } },
      { description: { $regex: searchQuery, $options: 'i' } },
      { tags: { $in: [new RegExp(searchQuery, 'i')] } }
    ]
  }).sort({ uploadDate: -1 });
};

module.exports = {
  Document,
  createDocument,
  getPatientDocuments,
  getDoctorSharedDocuments,
  getDoctorUploadedDocuments,
  getDocumentById,
  updateDocument,
  deleteDocument,
  shareDocumentWithDoctor,
  unshareDocumentFromDoctor,
  getDocumentsByType,
  searchDocuments
};
