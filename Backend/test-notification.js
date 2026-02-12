/**
 * Test script for notification system
 * Run with: node test-notification.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { sendEmail, emailTemplates } = require('./services/notificationService');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Test sending notification
const testNotification = async () => {
  try {
    console.log('\n🔔 Testing Notification System\n');
    console.log('Email User:', process.env.EMAIL_USER);
    console.log('Target Email: sk.shaishav.13@gmail.com\n');

    // Test 1: Appointment Reminder
    console.log('📅 Test 1: Sending Appointment Reminder...');
    const appointmentEmail = emailTemplates.appointmentReminder(
      'Shaishav',
      'Dr. Test Doctor',
      'February 15, 2026',
      '10:00 AM'
    );
    
    const result1 = await sendEmail(
      'sk.shaishav.13@gmail.com',
      appointmentEmail.subject,
      appointmentEmail.html
    );
    
    if (result1.success) {
      console.log('✅ Appointment reminder sent successfully!');
      console.log('   Message ID:', result1.messageId);
    } else {
      console.log('❌ Failed to send appointment reminder');
      console.log('   Error:', result1.error);
    }

    console.log('\n⏳ Waiting 2 seconds...\n');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 2: Medication Reminder
    console.log('💊 Test 2: Sending Medication Reminder...');
    const medicationEmail = emailTemplates.medicationReminder(
      'Shaishav',
      [
        { name: 'Paracetamol', dosage: '500mg', frequency: 'Twice daily' },
        { name: 'Vitamin D', dosage: '1000 IU', frequency: 'Once daily' }
      ]
    );
    
    const result2 = await sendEmail(
      'sk.shaishav.13@gmail.com',
      medicationEmail.subject,
      medicationEmail.html
    );
    
    if (result2.success) {
      console.log('✅ Medication reminder sent successfully!');
      console.log('   Message ID:', result2.messageId);
    } else {
      console.log('❌ Failed to send medication reminder');
      console.log('   Error:', result2.error);
    }

    console.log('\n⏳ Waiting 2 seconds...\n');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 3: Lab Test Reminder
    console.log('🔬 Test 3: Sending Lab Test Reminder...');
    const labTestEmail = emailTemplates.labTestReminder(
      'Shaishav',
      'Complete Blood Count\nLipid Profile\nThyroid Function Test',
      'Routine Health Checkup',
      'Dr. Test Doctor'
    );
    
    const result3 = await sendEmail(
      'sk.shaishav.13@gmail.com',
      labTestEmail.subject,
      labTestEmail.html
    );
    
    if (result3.success) {
      console.log('✅ Lab test reminder sent successfully!');
      console.log('   Message ID:', result3.messageId);
    } else {
      console.log('❌ Failed to send lab test reminder');
      console.log('   Error:', result3.error);
    }

    console.log('\n✅ All tests completed!');
    console.log('\n📧 Check the inbox of sk.shaishav.13@gmail.com');
    console.log('   (Also check spam/junk folder if not in inbox)\n');

  } catch (error) {
    console.error('\n❌ Error during testing:', error);
  } finally {
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
    process.exit(0);
  }
};

// Run tests
(async () => {
  await connectDB();
  await testNotification();
})();
