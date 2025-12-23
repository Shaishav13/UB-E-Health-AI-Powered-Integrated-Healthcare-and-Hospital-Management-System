const mongoose = require("mongoose");

const prescriptionSchema = new mongoose.Schema({
  patientid: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  reportid: { type: mongoose.Schema.Types.ObjectId, ref: 'Report', required: true },
  name: { type: String, required: true },
  dosage: { type: String, required: true },
  frequency: { type: String, required: true },
  duration: { type: String, required: true },
  completed: { type: Boolean, default: false },
  date: { type: Date, default: Date.now },
  time: { type: String, default: () => new Date().toLocaleTimeString() },
  disease: { type: String, default: '' }
}, { timestamps: true });

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
      .sort({ createdAt: -1 });
    
    // Format the data to match the expected frontend format
    return medicines.map(med => ({
      id: med._id.toString(),
      name: med.name,
      dosage: med.dosage,
      frequency: med.frequency,
      duration: med.duration,
      completed: med.completed,
      date: med.date ? med.date.toLocaleDateString() : new Date().toLocaleDateString(),
      time: med.time,
      disease: med.disease || (med.reportid ? med.reportid.disease : ''),
      datetime: `${med.date ? med.date.toLocaleDateString() : ''} ${med.time || ''}`
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
      { completed: true }, 
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
      completed: true 
    });
  } catch (error) {
    console.error("Error clearing completed medicines:", error);
    throw error;
  }
};

module.exports = {
  createTable,
  createMedicine,
  getPatientMedicine,
  markAsCompleted,
  removeMedicine,
  clearCompleted,
};
