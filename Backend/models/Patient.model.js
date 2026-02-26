const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const patientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phonenum: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  age: { type: Number, required: true }, // Kept for backward compatibility, but will be auto-calculated
  gender: { type: String, required: true },
  bloodgroup: { type: String, required: true },
  dob: { type: Date, required: true },
  address: { type: String, required: true },
  profilePicture: { type: String, default: null }, // URL or base64 string
  docID: { type: Number, ref: 'Doctor', default: null },
  status: { 
    type: String, 
    enum: ['active', 'follow-up', 'critical', 'under-treatment', 'recovered'],
    default: 'active'
  },
  notificationPreferences: {
    appointmentReminders: { type: Boolean, default: true },
    medicationReminders: { type: Boolean, default: true },
    labTestReminders: { type: Boolean, default: true },
    followUpReminders: { type: Boolean, default: true },
    generalNotifications: { type: Boolean, default: true }
  }
}, { timestamps: true });

// Virtual field to calculate age from DOB
patientSchema.virtual('calculatedAge').get(function() {
  if (!this.dob) return this.age || 0;
  
  const birthDate = new Date(this.dob);
  const today = new Date();
  
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
});

// Pre-save hook to auto-calculate age from DOB
patientSchema.pre('save', function(next) {
  if (this.dob) {
    const birthDate = new Date(this.dob);
    const today = new Date();
    
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    this.age = age;
  }
  next();
});

// Pre-update hook to auto-calculate age when DOB is updated
patientSchema.pre('findOneAndUpdate', function(next) {
  const update = this.getUpdate();
  
  if (update.dob || (update.$set && update.$set.dob)) {
    const dob = update.dob || update.$set.dob;
    const birthDate = new Date(dob);
    const today = new Date();
    
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    if (update.$set) {
      update.$set.age = age;
    } else {
      update.age = age;
    }
  }
  next();
});

const Patient = mongoose.model("Patient", patientSchema);

const createTable = async () => {
  // MongoDB collections are created automatically
  return Promise.resolve();
};

const getAllPatients = async () => {
  return await Patient.find({});
};

const findIfExists = async (email) => {
  const patient = await Patient.findOne({ email });
  return patient ? [patient] : [];
};

const countPatient = async () => {
  const count = await Patient.countDocuments();
  return { count };
};

const addPatient = async (patient) => {
  const hashedPassword = await bcrypt.hash(patient.password, 10);
  const newPatient = new Patient({ ...patient, password: hashedPassword });
  return await newPatient.save();
};

const findCred = async (ID) => {
  return await Patient.findById(ID);
};

const updatePass = async (password, id) => {
  const hashedPassword = await bcrypt.hash(password, 10);
  return await Patient.findByIdAndUpdate(id, { password: hashedPassword });
};

const getPatientCredFromEmail = async (email) => {
  const patient = await Patient.findOne({ email });
  return patient ? [patient] : [];
};

const getPatientsByDoctor = async (docID) => {
  return await Patient.find({ docID });
};

const updatePatient = async (patient) => {
  const { id, ...updateData } = patient;
  return await Patient.findByIdAndUpdate(id, updateData, { new: true });
};

const deletePatient = async (id) => {
  return await Patient.findByIdAndDelete(id);
};

const updatePatientPassword = async (id, hashedPassword) => {
  return await Patient.findByIdAndUpdate(id, { password: hashedPassword });
};

module.exports = {
  addPatient,
  getAllPatients,
  createTable,
  findCred,
  findIfExists,
  getPatientCredFromEmail,
  countPatient,
  updatePass,
  getPatientsByDoctor,
  updatePatient,
  deletePatient,
  updatePatientPassword,
};
