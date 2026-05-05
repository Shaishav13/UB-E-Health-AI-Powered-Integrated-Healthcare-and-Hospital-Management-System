const mongoose = require("mongoose");

const ambulanceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: { type: String, required: true },
  contact: { type: String, required: true },
  availability: { type: Boolean, default: true },
}, { timestamps: true });

const Ambulance = mongoose.model("Ambulance", ambulanceSchema);

const createTable = async () => {
  // MongoDB collections are created automatically
  return Promise.resolve();
};

const getAllAmbulances = async () => {
  return await Ambulance.find({});
};

const addAmbulance = async (ambulance) => {
  const newAmbulance = new Ambulance(ambulance);
  return await newAmbulance.save();
};

const findById = async (ID) => {
  return await Ambulance.findById(ID);
};

const updateAmbulance = async (id, updateData) => {
  return await Ambulance.findByIdAndUpdate(id, updateData, { new: true });
};

const deleteAmbulance = async (id) => {
  return await Ambulance.findByIdAndDelete(id);
};

const countAmbulance = async () => {
  const count = await Ambulance.countDocuments();
  return { count };
};

module.exports = {
  getAllAmbulances,
  createTable,
  addAmbulance,
  findById,
  updateAmbulance,
  deleteAmbulance,
  countAmbulance,
};
