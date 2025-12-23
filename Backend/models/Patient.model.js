const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const patientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phonenum: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  age: { type: Number, required: true },
  gender: { type: String, required: true },
  bloodgroup: { type: String, required: true },
  dob: { type: Date, required: true },
  address: { type: String, required: true },
  docID: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', default: null },
}, { timestamps: true });

const Patient = mongoose.model("Patient", patientSchema);

const createTable = async () => {
  // MongoDB collections are created automatically
  return Promise.resolve();
};

const getAllPatients = async () => {
  return await Patient.find({}).populate('docID');
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
  return await Patient.findById(ID).populate('docID');
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
