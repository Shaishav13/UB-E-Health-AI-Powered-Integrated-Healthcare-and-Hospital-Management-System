const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const labPersonnelSchema = new mongoose.Schema({
  labId: { type: String, required: true, unique: true }, // Lab ID with "L" prefix (L1, L2, L3...)
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phoneNum: { type: String, required: true },
  age: { type: Number, required: true },
  gender: { type: String, required: true },
  bloodGroup: { type: String, required: true },
  DOB: { type: Date, required: true },
  address: { type: String, required: true },
  specialization: { type: String, required: true }, // e.g., "Hematology", "Biochemistry", "Microbiology"
  qualification: { type: String, required: true },
  userType: { type: String, default: "laboratory" }
}, { timestamps: true });

// Add indexes for optimized lookups
labPersonnelSchema.index({ labId: 1 });
labPersonnelSchema.index({ email: 1 });

const LabPersonnel = mongoose.model("LabPersonnel", labPersonnelSchema);

const createTables = async () => {
  // MongoDB collections are created automatically
  return Promise.resolve();
};

const addLabPersonnel = async (labPersonnel) => {
  // Check for duplicate email
  const existingEmail = await LabPersonnel.findOne({ email: labPersonnel.email });
  if (existingEmail) {
    throw new Error("Email already exists");
  }

  // Find all existing lab personnel and get their IDs
  const allLabPersonnel = await LabPersonnel.find({}).sort({ labId: 1 });
  const existingIds = allLabPersonnel.map(lp => {
    // Extract numeric part from labId (e.g., "L1" -> 1, "L2" -> 2)
    const numericPart = lp.labId.replace(/^L/, '');
    return parseInt(numericPart);
  }).filter(id => !isNaN(id));
  
  // Find the first available ID (starting from 1)
  let nextLabIdNumber = 1;
  for (let i = 0; i < existingIds.length; i++) {
    if (existingIds[i] !== nextLabIdNumber) {
      // Found a gap - use this ID
      break;
    }
    nextLabIdNumber++;
  }
  
  // If no gaps found, use the next sequential ID
  if (existingIds.includes(nextLabIdNumber)) {
    nextLabIdNumber = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1;
  }
  
  // Generate labId with "L" prefix
  const labId = `L${nextLabIdNumber}`;
  
  console.log(`Assigning lab ID: ${labId}`);
  console.log(`Existing IDs: ${existingIds.join(', ')}`);
  
  // Hash the password before saving
  const hashedPassword = await bcrypt.hash(labPersonnel.password, 10);
  
  const newLabPersonnel = new LabPersonnel({ 
    ...labPersonnel, 
    labId: labId,
    password: hashedPassword 
  });
  
  return await newLabPersonnel.save();
};

const getAllLabPersonnel = async () => {
  return await LabPersonnel.find({})
    .select('-password') // Exclude password field
    .sort({ labId: 1 }); // Sort by labId
};

const findById = async (labId) => {
  return await LabPersonnel.findOne({ labId: labId })
    .select('-password'); // Exclude password field
};

const updateLabPersonnel = async (labId, updateData) => {
  if (!labId) {
    throw new Error("Lab ID is required");
  }
  
  // If password is being updated, hash it before saving
  if (updateData.password) {
    const hashedPassword = await bcrypt.hash(updateData.password, 10);
    updateData.password = hashedPassword;
  }
  
  // Don't allow updating labId itself
  const { labId: _, ...dataToUpdate } = updateData;
  
  return await LabPersonnel.findOneAndUpdate(
    { labId: labId }, 
    dataToUpdate, 
    { new: true }
  ).select('-password'); // Exclude password from returned document
};

const deleteLabPersonnel = async (labId) => {
  if (!labId) {
    throw new Error("Lab ID is required");
  }
  
  try {
    // First find the lab personnel to verify they exist
    const labPersonnel = await LabPersonnel.findOne({ labId: labId });
    if (!labPersonnel) {
      throw new Error("Lab personnel not found");
    }
    
    console.log(`Deleting lab personnel with labId: ${labId}, _id: ${labPersonnel._id}`);
    
    // Delete the lab personnel
    const deleteResult = await LabPersonnel.findOneAndDelete({ labId: labId });
    console.log(`Lab personnel deleted successfully`);
    
    return deleteResult;
  } catch (error) {
    console.error("Error in deleteLabPersonnel:", error);
    throw error;
  }
};

const countLabPersonnel = async () => {
  const count = await LabPersonnel.countDocuments();
  return { count };
};

const findByEmail = async (email) => {
  // Include password field for login verification
  return await LabPersonnel.findOne({ email: email });
};


module.exports = {
  LabPersonnel,
  createTables,
  addLabPersonnel,
  getAllLabPersonnel,
  findById,
  updateLabPersonnel,
  deleteLabPersonnel,
  countLabPersonnel,
  findByEmail
};
