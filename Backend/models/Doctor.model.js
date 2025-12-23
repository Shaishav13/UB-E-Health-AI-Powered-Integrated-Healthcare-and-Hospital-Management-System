const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const doctorSchema = new mongoose.Schema({
  doctorId: { type: Number, required: true, unique: true }, // Simple numeric ID
  name: { type: String, required: true },
  phoneNum: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  age: { type: Number, required: true },
  gender: { type: String, required: true },
  bloodGroup: { type: String, required: true },
  DOB: { type: Date, required: true },
  address: { type: String, required: true },
  education: { type: String, required: true },
  department: { type: String, required: true },
  fees: { type: Number, required: true },
  availability: { type: String, default: "" },
}, { timestamps: true });

const Doctor = mongoose.model("Doctor", doctorSchema);

const createTables = async () => {
  // MongoDB collections are created automatically
  return Promise.resolve();
};

const getAllDoctors = async () => {
  return await Doctor.find({});
};

const findIfExists = async (email) => {
  const doctor = await Doctor.findOne({ email });
  return doctor ? [doctor] : [];
};

const countDoctor = async () => {
  const count = await Doctor.countDocuments();
  return { count };
};

const addDoctor = async (doctor) => {
  // Get the next available doctor ID
  const lastDoctor = await Doctor.findOne().sort({ doctorId: -1 });
  const nextDoctorId = lastDoctor ? lastDoctor.doctorId + 1 : 1;
  
  const hashedPassword = await bcrypt.hash(doctor.password, 10);
  const newDoctor = new Doctor({ 
    ...doctor, 
    doctorId: nextDoctorId,
    password: hashedPassword 
  });
  return await newDoctor.save();
};

const findById = async (doctorId) => {
  return await Doctor.findOne({ doctorId: parseInt(doctorId) });
};

const updatePass = async (password, doctorId) => {
  const hashedPassword = await bcrypt.hash(password, 10);
  return await Doctor.findOneAndUpdate({ doctorId: parseInt(doctorId) }, { password: hashedPassword });
};

const getDoctorCredFromEmail = async (email) => {
  const doctor = await Doctor.findOne({ email });
  return doctor ? [doctor] : [];
};

const addAvailableTimes = async (doctorId, availability) => {
  return await Doctor.findOneAndUpdate({ doctorId: parseInt(doctorId) }, { availability });
};

const updateDoctor = async (doctor) => {
  const { doctorId, ...updateData } = doctor;
  if (!doctorId) {
    throw new Error("Doctor ID is required");
  }
  return await Doctor.findOneAndUpdate({ doctorId: parseInt(doctorId) }, updateData, { new: true });
};

const deleteDoctor = async (doctorId) => {
  if (!doctorId) {
    throw new Error("Doctor ID is required");
  }
  // Remove doctor reference from patients
  await mongoose.model("Patient").updateMany({ docID: parseInt(doctorId) }, { docID: null });
  return await Doctor.findOneAndDelete({ doctorId: parseInt(doctorId) });
};

const updateDoctorPassword = async (id, hashedPassword) => {
  return await Doctor.findByIdAndUpdate(id, { password: hashedPassword });
};

module.exports = {
  getAllDoctors,
  createTables,
  findById,
  findIfExists,
  addDoctor,
  updatePass,
  getDoctorCredFromEmail,
  countDoctor,
  addAvailableTimes,
  updateDoctor,
  deleteDoctor,
  updateDoctorPassword,
};
