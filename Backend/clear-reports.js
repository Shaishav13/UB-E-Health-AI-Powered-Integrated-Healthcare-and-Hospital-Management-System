const mongoose = require("mongoose");
require("dotenv").config();

const clearReports = async () => {
  try {
    // Connect to MongoDB
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to MongoDB");
    
    console.log("🗑️ Clearing all reports and prescriptions...");
    
    // Clear reports collection
    const reportsResult = await mongoose.connection.db.collection('reports').deleteMany({});
    console.log(`✅ Deleted ${reportsResult.deletedCount} reports`);
    
    // Clear prescriptions collection
    const prescriptionsResult = await mongoose.connection.db.collection('prescriptions').deleteMany({});
    console.log(`✅ Deleted ${prescriptionsResult.deletedCount} prescriptions`);
    
    // Reset all appointments to pending status (remove completed status)
    const appointmentsResult = await mongoose.connection.db.collection('appointments').updateMany(
      { status: 'completed' },
      { $set: { status: 'paid' } }
    );
    console.log(`✅ Reset ${appointmentsResult.modifiedCount} appointments from completed to paid status`);
    
    console.log("🎉 All reports cleared successfully!");
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error clearing reports:", error);
    process.exit(1);
  }
};

clearReports();