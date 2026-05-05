const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const adminSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phoneNum: { type: Number, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  age: { type: Number, required: true },
  gender: { type: String, required: true },
  DOB: { type: Date, required: true },
  address: { type: String, required: true },
}, { timestamps: true });

const Admin = mongoose.model("Admin", adminSchema);

const createTables = async () => {
  // MongoDB collections are created automatically
  return Promise.resolve();
};

const getAllAdmins = async () => {
  return await Admin.find({});
};

const findIfExists = async (email) => {
  const admin = await Admin.findOne({ email });
  return admin ? [admin] : [];
};

const countAdmin = async () => {
  const count = await Admin.countDocuments();
  return { count };
};

const addAdmin = async (admin) => {
  const hashedPassword = await bcrypt.hash(admin.password, 10);
  const newAdmin = new Admin({ ...admin, password: hashedPassword });
  return await newAdmin.save();
};

const findById = async (ID) => {
  return await Admin.findById(ID);
};

const updatePass = async (password, id) => {
  const hashedPassword = await bcrypt.hash(password, 10);
  return await Admin.findByIdAndUpdate(id, { password: hashedPassword });
};

const getAdminCredFromEmail = async (email) => {
  const admin = await Admin.findOne({ email });
  return admin ? [admin] : [];
};

module.exports = {
  getAllAdmins,
  createTables,
  findById,
  findIfExists,
  addAdmin,
  updatePass,
  getAdminCredFromEmail,
  countAdmin,
};
