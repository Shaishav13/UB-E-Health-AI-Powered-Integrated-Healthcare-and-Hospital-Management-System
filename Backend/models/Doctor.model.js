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
  profilePicture: { type: String, default: null }, // URL or base64 string
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
  // Find all existing doctors and get their IDs
  const allDoctors = await Doctor.find({}).sort({ doctorId: 1 });
  const existingIds = allDoctors.map(d => d.doctorId);
  
  // Find the first available ID (starting from 1)
  let nextDoctorId = 1;
  for (let i = 0; i < existingIds.length; i++) {
    if (existingIds[i] !== nextDoctorId) {
      // Found a gap - use this ID
      break;
    }
    nextDoctorId++;
  }
  
  // If no gaps found, use the next sequential ID
  if (existingIds.includes(nextDoctorId)) {
    nextDoctorId = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1;
  }
  
  console.log(`Assigning doctor ID: ${nextDoctorId}`);
  console.log(`Existing IDs: ${existingIds.join(', ')}`);
  
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
  
  try {
    // First find the doctor to get their _id
    const doctor = await Doctor.findOne({ doctorId: parseInt(doctorId) });
    if (!doctor) {
      throw new Error("Doctor not found");
    }
    
    console.log(`Deleting doctor with doctorId: ${doctorId}, _id: ${doctor._id}`);
    
    // Remove doctor reference from patients using the doctor's _id (ObjectId)
    const updateResult = await mongoose.model("Patient").updateMany(
      { docID: doctor._id }, 
      { $set: { docID: null } }
    );
    
    console.log(`Updated ${updateResult.modifiedCount} patients, unassigning doctor`);
    
    // Delete the doctor
    const deleteResult = await Doctor.findOneAndDelete({ doctorId: parseInt(doctorId) });
    console.log(`Doctor deleted successfully`);
    
    return deleteResult;
  } catch (error) {
    console.error("Error in deleteDoctor:", error);
    throw error;
  }
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
