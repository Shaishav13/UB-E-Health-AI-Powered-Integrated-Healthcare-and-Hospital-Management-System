const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  docname: { type: String },
  department: { type: String },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  status: { type: String, enum: ['pending', 'confirmed', 'cancelled', 'paid', 'completed'], default: 'pending' },
  reason: { type: String, required: true },
  payment_id: { type: String },
  amount: { type: Number },
}, { timestamps: true });

const Appointment = mongoose.model("Appointment", appointmentSchema);

const createTable = async () => {
  // MongoDB collections are created automatically
  return Promise.resolve();
};

const getAllAppointments = async () => {
  return await Appointment.find({}).populate('patientId').populate('doctorId');
};

const addAppointment = async (appointment) => {
  const newAppointment = new Appointment(appointment);
  return await newAppointment.save();
};

const findById = async (ID) => {
  return await Appointment.findById(ID).populate('patientId').populate('doctorId');
};

const updateAppointment = async (id, updateData) => {
  return await Appointment.findByIdAndUpdate(id, updateData, { new: true });
};

const deleteAppointment = async (id) => {
  return await Appointment.findByIdAndDelete(id);
};

const getAppointmentsByPatient = async (patientId) => {
  return await Appointment.find({ patientId }).populate('doctorId');
};

const getAppointmentsByDoctor = async (doctorId) => {
  return await Appointment.find({ 
    doctorId, 
    status: { $ne: 'completed' } // Exclude completed appointments
  }).populate('patientId');
};

const getPendingAppointmentsByPatient = async (patientId) => {
  return await Appointment.find({ 
    patientId, 
    status: { $ne: 'completed' } // Exclude completed appointments
  }).populate('doctorId');
};

const createAppointment = async (appointment) => {
  const newAppointment = new Appointment(appointment);
  return await newAppointment.save();
};

const countAppointment = async () => {
  const count = await Appointment.countDocuments();
  return { count };
};

const markAppointmentCompleted = async (appointmentId) => {
  return await Appointment.findByIdAndUpdate(
    appointmentId, 
    { status: 'completed' }, 
    { new: true }
  );
};

module.exports = {
  getAllAppointments,
  createTable,
  addAppointment,
  findById,
  updateAppointment,
  deleteAppointment,
  getAppointmentsByPatient,
  getAppointmentsByDoctor,
  getPendingAppointmentsByPatient,
  createAppointment,
  countAppointment,
  markAppointmentCompleted,
};
