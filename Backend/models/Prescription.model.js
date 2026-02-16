const mongoose = require("mongoose");

const medicationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  dosage: { type: String, required: true },
  frequency: { type: String, required: true },
  duration: { type: String, required: true },
  instructions: { type: String, default: '' },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date },
  refillsRemaining: { type: Number, default: 0 },
  refillRequested: { type: Boolean, default: false },
  refillRequestDate: { type: Date }
});

const prescriptionSchema = new mongoose.Schema({
  patientid: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  doctorid: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  reportid: { type: mongoose.Schema.Types.ObjectId, ref: 'Report' },
  
  // Prescription Details
  prescriptionNumber: { type: String, unique: true },
  qrCode: { type: String }, // Base64 encoded QR code
  
  // Medications
  medications: [medicationSchema],
  
  // Status
  status: { 
    type: String, 
    enum: ['active', 'completed', 'cancelled', 'expired'],
    default: 'active'
  },
  
  // Dates
  issueDate: { type: Date, default: Date.now },
  expiryDate: { type: Date },
  
  // Additional Info
  diagnosis: { type: String, default: '' },
  notes: { type: String, default: '' },
  pharmacyNotes: { type: String, default: '' },
  
  // Pharmacy Integration
  dispensedBy: { type: String, default: '' },
  dispensedDate: { type: Date },
  pharmacyId: { type: String, default: '' },
  
  // Legacy fields for backward compatibility
  name: { type: String },
  dosage: { type: String },
  frequency: { type: String },
  duration: { type: String },
  completed: { type: Boolean, default: false },
  date: { type: Date, default: Date.now },
  time: { type: String, default: () => new Date().toLocaleTimeString() },
  disease: { type: String, default: '' }
}, { timestamps: true });

// Generate prescription number before saving
prescriptionSchema.pre('save', async function(next) {
  if (!this.prescriptionNumber) {
    const count = await mongoose.model('Prescription').countDocuments();
    const year = new Date().getFullYear();
    this.prescriptionNumber = `RX${year}${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

const Prescription = mongoose.model("Prescription", prescriptionSchema);

const createTable = async () => {
  // MongoDB collections are created automatically
  return Promise.resolve();
};

const createMedicine = async (medicineData) => {
  try {
    // Handle both array format and object format
    let data;
    if (Array.isArray(medicineData)) {
      // Convert array format [name, dosage, frequency, duration, reportid] to object
      data = {
        name: medicineData[0],
        dosage: medicineData[1],
        frequency: medicineData[2],
        duration: medicineData[3],
        reportid: medicineData[4],
        // We'll need to get patientid from the report
      };
      
      // Get the report to find the patient ID
      const Report = mongoose.model("Report");
      const report = await Report.findById(data.reportid);
      if (report) {
        data.patientid = report.patientid;
        data.disease = report.disease;
        data.doctorid = report.doctorid;
      }
    } else {
      data = medicineData;
    }
    
    const newPrescription = new Prescription(data);
    return await newPrescription.save();
  } catch (error) {
    console.error("Error creating medicine:", error);
    throw error;
  }
};

const getPatientMedicine = async (patientId) => {
  try {
    const medicines = await Prescription.find({ patientid: patientId })
      .populate('reportid')
      .populate('doctorid', 'name specialization')
      .sort({ createdAt: -1 });
    
    // Format the data to match the expected frontend format
    return medicines.map(med => ({
      id: med._id.toString(),
      prescriptionNumber: med.prescriptionNumber,
      name: med.name || (med.medications && med.medications.length > 0 ? med.medications[0].name : ''),
      dosage: med.dosage || (med.medications && med.medications.length > 0 ? med.medications[0].dosage : ''),
      frequency: med.frequency || (med.medications && med.medications.length > 0 ? med.medications[0].frequency : ''),
      duration: med.duration || (med.medications && med.medications.length > 0 ? med.medications[0].duration : ''),
      completed: med.completed || med.status === 'completed',
      status: med.status,
      date: med.date ? med.date.toLocaleDateString() : new Date().toLocaleDateString(),
      time: med.time,
      disease: med.disease || med.diagnosis || (med.reportid ? med.reportid.disease : ''),
      datetime: `${med.date ? med.date.toLocaleDateString() : ''} ${med.time || ''}`,
      medications: med.medications,
      qrCode: med.qrCode,
      doctor: med.doctorid
    }));
  } catch (error) {
    console.error("Error fetching patient medicines:", error);
    throw error;
  }
};

const markAsCompleted = async (medicineId) => {
  try {
    return await Prescription.findByIdAndUpdate(
      medicineId, 
      { completed: true, status: 'completed' }, 
      { new: true }
    );
  } catch (error) {
    console.error("Error marking medicine as completed:", error);
    throw error;
  }
};

const removeMedicine = async (medicineId) => {
  try {
    return await Prescription.findByIdAndDelete(medicineId);
  } catch (error) {
    console.error("Error removing medicine:", error);
    throw error;
  }
};

const clearCompleted = async (patientId) => {
  try {
    return await Prescription.deleteMany({ 
      patientid: patientId, 
      $or: [{ completed: true }, { status: 'completed' }]
    });
  } catch (error) {
    console.error("Error clearing completed medicines:", error);
    throw error;
  }
};

// New functions for enhanced prescription management
const createPrescription = async (prescriptionData) => {
  try {
    const prescription = new Prescription(prescriptionData);
    return await prescription.save();
  } catch (error) {
    console.error("Error creating prescription:", error);
    throw error;
  }
};

const getPrescriptionById = async (prescriptionId) => {
  try {
    return await Prescription.findById(prescriptionId)
      .populate('patientid', 'name age gender phone email')
      .populate('doctorid', 'name specialization phone email')
      .populate('reportid');
  } catch (error) {
    console.error("Error fetching prescription:", error);
    throw error;
  }
};

const getPrescriptionByNumber = async (prescriptionNumber) => {
  try {
    return await Prescription.findOne({ prescriptionNumber })
      .populate('patientid', 'name age gender phone email')
      .populate('doctorid', 'name specialization phone email')
      .populate('reportid');
  } catch (error) {
    console.error("Error fetching prescription by number:", error);
    throw error;
  }
};

const requestRefill = async (prescriptionId, medicationIndex) => {
  try {
    const prescription = await Prescription.findById(prescriptionId);
    if (!prescription) {
      throw new Error('Prescription not found');
    }
    
    if (medicationIndex !== undefined && prescription.medications[medicationIndex]) {
      prescription.medications[medicationIndex].refillRequested = true;
      prescription.medications[medicationIndex].refillRequestDate = new Date();
    }
    
    return await prescription.save();
  } catch (error) {
    console.error("Error requesting refill:", error);
    throw error;
  }
};

const updatePrescriptionStatus = async (prescriptionId, status) => {
  try {
    return await Prescription.findByIdAndUpdate(
      prescriptionId,
      { status },
      { new: true }
    );
  } catch (error) {
    console.error("Error updating prescription status:", error);
    throw error;
  }
};

module.exports = {
  Prescription,
  createTable,
  createMedicine,
  getPatientMedicine,
  markAsCompleted,
  removeMedicine,
  clearCompleted,
  createPrescription,
  getPrescriptionById,
  getPrescriptionByNumber,
  requestRefill,
  updatePrescriptionStatus,
};
