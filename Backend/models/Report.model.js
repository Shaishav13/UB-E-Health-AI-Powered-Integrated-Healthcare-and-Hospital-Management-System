const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema({
  patientid: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  doctorid: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  disease: { type: String, required: true },
  temperature: { type: String, required: false },
  weight: { type: String, required: false },
  bp: { type: String, required: false },
  glucose: { type: String, required: false },
  info: { type: String, required: false },
}, { timestamps: true });

const Report = mongoose.model("Report", reportSchema);

const createTable = async () => {
  // MongoDB collections are created automatically
  return Promise.resolve();
};

const getAllReports = async () => {
  return await Report.find({}).populate('patientid').populate('doctorid');
};

const countReport = async () => {
  const count = await Report.countDocuments();
  return { count };
};

const createReport = async (report) => {
  const newReport = new Report(report);
  return await newReport.save();
};

const findById = async (ID) => {
  return await Report.findById(ID).populate('patientid').populate('doctorid');
};

const updateReport = async (id, updateData) => {
  return await Report.findByIdAndUpdate(id, updateData, { new: true });
};

const deleteReport = async (id) => {
  return await Report.findByIdAndDelete(id);
};

const getReportsByPatient = async (patientId) => {
  return await Report.find({ patientid: patientId }).populate('doctorid');
};

const getReportsByDoctor = async (doctorId) => {
  return await Report.find({ doctorid: doctorId }).populate('patientid');
};

const getDoctorReports = async (doctorId) => {
  return await Report.find({ doctorid: doctorId }).populate('patientid');
};

const getPatientReports = async (patientId) => {
  return await Report.find({ patientid: patientId }).populate('doctorid');
};

const getLastReportId = async () => {
  const lastReport = await Report.findOne().sort({ _id: -1 });
  return lastReport ? { id: lastReport._id } : { id: null };
};

module.exports = {
  getAllReports,
  createTable,
  countReport,
  createReport,
  findById,
  updateReport,
  deleteReport,
  getReportsByPatient,
  getReportsByDoctor,
  getDoctorReports,
  getPatientReports,
  getLastReportId,
};
