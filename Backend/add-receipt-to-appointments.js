const mongoose = require("mongoose");
require("dotenv").config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/hospital", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const appointmentSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
  docname: String,
  department: String,
  date: Date,
  time: String,
  status: String,
  reason: String,
  payment_id: String,
  amount: Number,
  tokenId: String,
  queueNumber: Number,
  receiptGenerated: Date,
}, { timestamps: true });

const Appointment = mongoose.model("Appointment", appointmentSchema);

async function addReceiptDataToAppointments() {
  try {
    console.log("Connected to MongoDB");
    
    // Find all appointments that don't have tokenId
    const appointments = await Appointment.find({ 
      tokenId: { $exists: false }
    });
    
    console.log(`Found ${appointments.length} appointments without receipt data`);
    
    for (let i = 0; i < appointments.length; i++) {
      const appointment = appointments[i];
      
      // Generate token data
      const dateStr = new Date(appointment.date).toISOString().split('T')[0].replace(/-/g, '');
      const queueNum = i + 1;
      const tokenId = `TKN${dateStr}${String(queueNum).padStart(3, '0')}`;
      const paymentId = `PAY${Date.now()}${Math.floor(Math.random() * 1000)}`;
      
      // Update appointment
      await Appointment.findByIdAndUpdate(appointment._id, {
        tokenId: tokenId,
        queueNumber: queueNum,
        payment_id: paymentId,
        receiptGenerated: new Date(),
        amount: appointment.amount || 1000 // Default amount if not set
      });
      
      console.log(`Updated appointment ${appointment._id} with token ${tokenId}`);
    }
    
    console.log("\nAll appointments updated successfully!");
    console.log("You can now download receipts for these appointments.");
    
    mongoose.connection.close();
  } catch (error) {
    console.error("Error:", error);
    mongoose.connection.close();
  }
}

addReceiptDataToAppointments();
