const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/hospital');

// Define schemas
const patientSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  phonenum: { type: String, required: true },
  age: Number,
  gender: String,
  bloodgroup: String,
  address: String,
  disease: String,
  dob: Date,
  userType: { type: String, default: 'patient' }
});

const doctorSchema = new mongoose.Schema({
  doctorId: Number,
  name: String,
  email: String,
  password: String,
  phonenum: { type: String, required: true },
  age: Number,
  gender: String,
  department: String,
  fees: Number,
  availability: [String],
  userType: { type: String, default: 'doctor' }
});

const adminSchema = new mongoose.Schema({
  username: String,
  password: String,
  userType: { type: String, default: 'admin' }
});

const reportSchema = new mongoose.Schema({
  patientid: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  doctorid: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  disease: { type: String, required: true },
  temperature: { type: String, required: true },
  weight: { type: String, required: true },
  bp: { type: String, required: true },
  glucose: { type: String, required: true },
  info: { type: String, required: true },
}, { timestamps: true });

const prescriptionSchema = new mongoose.Schema({
  patientid: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  reportid: { type: mongoose.Schema.Types.ObjectId, ref: 'Report', required: true },
  name: { type: String, required: true },
  dosage: { type: String, required: true },
  frequency: { type: String, required: true },
  duration: { type: String, required: true },
  completed: { type: Boolean, default: false },
  date: { type: Date, default: Date.now },
  time: { type: String, default: () => new Date().toLocaleTimeString() },
  disease: { type: String, default: '' }
}, { timestamps: true });

const Patient = mongoose.model('Patient', patientSchema);
const Doctor = mongoose.model('Doctor', doctorSchema);
const Admin = mongoose.model('Admin', adminSchema);
const Report = mongoose.model('Report', reportSchema);
const Prescription = mongoose.model('Prescription', prescriptionSchema);

async function createTestData() {
  try {
    console.log('Creating test data...');

    // Create test patient
    const hashedPatientPassword = await bcrypt.hash('patient123', 10);
    const testPatient = new Patient({
      name: 'John Doe',
      email: 'patient@test.com',
      password: hashedPatientPassword,
      phonenum: '1234567890',
      age: 30,
      gender: 'Male',
      bloodgroup: 'O+',
      address: '123 Test Street',
      disease: 'None',
      dob: new Date('1993-01-01'),
      userType: 'patient'
    });
    await testPatient.save();
    console.log('Test patient created:', testPatient._id);

    // Create test doctors
    const hashedDoctorPassword = await bcrypt.hash('Doctor2123', 10);
    
    const testDoctor1 = new Doctor({
      doctorId: 1,
      name: 'Dr. Smith',
      email: 'doctor1@test.com',
      password: hashedDoctorPassword,
      phonenum: '9876543210',
      age: 45,
      gender: 'Male',
      department: 'Cardiology',
      fees: 500,
      availability: ['09:00', '10:00', '11:00', '14:00', '15:00'],
      userType: 'doctor'
    });
    await testDoctor1.save();
    console.log('Test doctor 1 created:', testDoctor1._id);

    const testDoctor2 = new Doctor({
      doctorId: 2,
      name: 'Dr. Shaishav',
      email: 'sk.shaishav.17@gmail.com',
      password: hashedDoctorPassword,
      phonenum: '9876543211',
      age: 40,
      gender: 'Male',
      department: 'Cardiology',
      fees: 600,
      availability: ['09:30', '10:30', '11:30', '14:30', '15:30'],
      userType: 'doctor'
    });
    await testDoctor2.save();
    console.log('Test doctor 2 created:', testDoctor2._id);

    // Create test admin
    const hashedAdminPassword = await bcrypt.hash('admin@123', 10);
    const testAdmin = new Admin({
      username: 'admin',
      password: hashedAdminPassword,
      userType: 'admin'
    });
    await testAdmin.save();
    console.log('Test admin created:', testAdmin._id);

    // Create sample medical report
    const testReport = new Report({
      patientid: testPatient._id,
      doctorid: testDoctor1._id,
      date: new Date(),
      time: '10:00 AM',
      disease: 'Hypertension',
      temperature: '98.6',
      weight: '70',
      bp: '140/90',
      glucose: '120',
      info: 'Patient shows signs of mild hypertension. Recommended lifestyle changes and medication.'
    });
    await testReport.save();
    console.log('Test report created:', testReport._id);

    // Create sample prescriptions
    const prescriptions = [
      {
        patientid: testPatient._id,
        reportid: testReport._id,
        name: 'Lisinopril',
        dosage: '10mg',
        frequency: 'Once daily',
        duration: '30',
        disease: 'Hypertension',
        completed: false
      },
      {
        patientid: testPatient._id,
        reportid: testReport._id,
        name: 'Metformin',
        dosage: '500mg',
        frequency: 'Twice daily',
        duration: '30',
        disease: 'Hypertension',
        completed: false
      },
      {
        patientid: testPatient._id,
        reportid: testReport._id,
        name: 'Aspirin',
        dosage: '81mg',
        frequency: 'Once daily',
        duration: '30',
        disease: 'Hypertension',
        completed: true
      }
    ];

    for (const prescData of prescriptions) {
      const prescription = new Prescription(prescData);
      await prescription.save();
      console.log('Prescription created:', prescription.name);
    }

    console.log('\n=== Test Data Created Successfully ===');
    console.log('Patient Login: patient@test.com / patient123');
    console.log('Doctor Login: 1 / Doctor2123 or 2 / Doctor2123');
    console.log('Admin Login: admin / admin@123');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating test data:', error);
    process.exit(1);
  }
}

createTestData();