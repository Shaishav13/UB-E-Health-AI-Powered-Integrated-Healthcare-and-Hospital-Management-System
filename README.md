# 🏥 UB E-Health

A comprehensive, modern healthcare management system built with Node.js, MongoDB, and React. Streamline patient care, appointments, medical records, and hospital operations with an intuitive, feature-rich platform.

## ✨ Key Features

### 👤 Patient Portal
- **User Management**: Secure registration, login, and profile management
- **Appointment Booking**: Schedule appointments with doctors by specialty
- **Medical Reports**: View detailed medical reports with vital signs and diagnoses
- **Prescription Tracking**: Manage medications with dosage and duration tracking
- **Document Management**: Upload and share medical documents (X-rays, scans, lab reports)
- **Health Trends**: Visualize vital signs over time with interactive charts
- **Notification Settings**: Customize email notifications for appointments, medications, and lab tests
- **Receipt Generation**: Download appointment receipts as PDF
- **Auto Age Calculation**: Age automatically updates based on date of birth

### 👨‍⚕️ Doctor Portal
- **Patient Management**: View and manage patient information
- **Appointment Management**: Check and manage scheduled appointments
- **Report Creation**: Create comprehensive medical reports with medications and lab tests
- **Document Upload**: Upload medical documents for patients
- **Patient Documents**: View documents shared by patients
- **Report PDF Export**: Generate professional PDF reports
- **Password Management**: Secure password change functionality

### 🔧 Admin Dashboard
- **Doctor Management**: Add, edit, and remove doctors with ID reuse system
- **Patient Management**: Oversee all patient accounts
- **Ambulance Management**: Manage ambulance fleet and services
- **Admin Management**: Add additional admin users
- **System Oversight**: Monitor overall system operations

### 📊 Advanced Features
- **Health Analytics**: Track vital signs trends (temperature, weight, BP, glucose)
- **CSV Export**: Export health data for external analysis
- **Email Notifications**: Automated reminders for appointments, medications, and lab tests
- **Scheduled Tasks**: Daily cron jobs for age updates and notifications
- **Document Sharing**: Secure document sharing between patients and doctors
- **Search & Filter**: Advanced search and filtering across all modules
- **Responsive Design**: Mobile-friendly interface with modern UI/UX

## 🚀 Technology Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **bcrypt** for password hashing
- **Multer** for file uploads
- **Nodemailer** for email notifications
- **Node-cron** for scheduled tasks
- **jsPDF** for PDF generation
- **CORS** enabled for cross-origin requests

### Frontend
- **React 18** with functional components and hooks
- **React Router v6** for navigation
- **Redux** for state management
- **Axios** for API communication
- **Chart.js** with react-chartjs-2 for data visualization
- **React-Toastify** for notifications
- **Modern CSS** with gradient themes and animations
- **Responsive Design** for mobile and tablet support

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- npm or yarn package manager

## ⚡ Quick Start

### 1. Clone the Repository
```bash
git clone [your-repository-url]
cd E-Health-Management-Hub-main
```

### 2. Backend Setup
```bash
cd Backend
npm install
```

Configure environment variables in `.env`:
```env
port=3001
MONGO_URI=mongodb://localhost:27017/healthcare_db
KEY=your_jwt_secret_key

# Email Configuration (for notifications)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

**Note:** For Gmail, use an [App Password](https://support.google.com/accounts/answer/185833) instead of your regular password.

Start the backend server:
```bash
npm start
# or for development
npm run dev
```

### 3. Frontend Setup
```bash
cd ../FrontEnd
npm install
npm start
```

### 4. Seed Sample Data (Optional)
```bash
cd Backend
node seed-doctors.js
```

## 🌐 Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001

## 📚 API Documentation

### Authentication Endpoints
- `POST /patients/register` - Patient registration
- `POST /patients/login` - Patient login
- `POST /doctors/login` - Doctor login
- `POST /admin/login` - Admin login
- `POST /doctors/change-password` - Doctor password change

### Patient Endpoints
- `GET /patients` - Get all patients
- `GET /patients/:id` - Get patient by ID
- `PUT /patients/:id` - Update patient profile
- `DELETE /patients/:id` - Delete patient

### Doctor Endpoints
- `GET /doctors` - Get all doctors
- `GET /doctors/:id` - Get doctor by ID
- `POST /doctors` - Add new doctor
- `PUT /doctors/:id` - Update doctor
- `DELETE /doctors/:id` - Delete doctor

### Appointment Endpoints
- `GET /appointments` - Get all appointments
- `POST /appointments` - Book appointment
- `GET /appointments/patient/:patientId` - Get patient appointments
- `GET /appointments/doctor/:doctorId` - Get doctor appointments
- `PUT /appointments/:id` - Update appointment
- `DELETE /appointments/:id` - Cancel appointment

### Report Endpoints
- `GET /reports` - Get all reports
- `POST /reports` - Create medical report
- `GET /reports/patient/:patientId` - Get patient reports
- `GET /reports/doctor/:doctorId` - Get doctor's reports
- `PUT /reports/:id` - Update report
- `DELETE /reports/:id` - Delete report

### Prescription Endpoints
- `GET /prescriptions/:patientId` - Get patient prescriptions
- `POST /prescriptions` - Create prescription
- `PATCH /prescriptions/complete/:id` - Mark medication as completed
- `DELETE /prescriptions/clear-completed/:patientId` - Clear completed medications

### Document Endpoints
- `POST /documents/upload` - Upload document
- `GET /documents/patient/:patientId` - Get patient documents
- `GET /documents/doctor/:doctorId` - Get documents shared with doctor
- `GET /documents/view/:documentId` - View document
- `GET /documents/download/:documentId` - Download document
- `POST /documents/:documentId/share/:doctorId` - Share document
- `DELETE /documents/:documentId/share/:doctorId` - Unshare document
- `DELETE /documents/:documentId` - Delete document

### Analytics Endpoints
- `GET /analytics/health-trends/:patientId` - Get patient health trends

### Notification Endpoints
- `GET /notifications/preferences/:patientId` - Get notification preferences
- `PUT /notifications/preferences/:patientId` - Update notification preferences

### Ambulance Endpoints
- `GET /ambulances` - Get all ambulances
- `POST /ambulances` - Add ambulance
- `PUT /ambulances/:id` - Update ambulance
- `DELETE /ambulances/:id` - Delete ambulance

## 🏗️ Project Structure

```
E-Health-Management-Hub-main/
├── Backend/
│   ├── configs/
│   │   ├── config.js           # Server configuration
│   │   ├── db.js               # Database connection
│   │   ├── multerConfig.js     # File upload configuration
│   │   └── queries/            # Database query helpers
│   ├── models/
│   │   ├── Patient.model.js    # Patient schema
│   │   ├── Doctor.model.js     # Doctor schema
│   │   ├── Admin.model.js      # Admin schema
│   │   ├── Appointment.model.js # Appointment schema
│   │   ├── Report.model.js     # Medical report schema
│   │   ├── Prescription.model.js # Prescription schema
│   │   ├── Document.model.js   # Document schema
│   │   └── Ambulance.model.js  # Ambulance schema
│   ├── routes/
│   │   ├── Patients.Route.js   # Patient routes
│   │   ├── Doctors.Route.js    # Doctor routes
│   │   ├── Admin.Route.js      # Admin routes
│   │   ├── Appointments.Route.js # Appointment routes
│   │   ├── Reports.Route.js    # Report routes
│   │   ├── Prescriptions.Route.js # Prescription routes
│   │   ├── Documents.Route.js  # Document routes
│   │   ├── Analytics.Route.js  # Analytics routes
│   │   ├── Notifications.Route.js # Notification routes
│   │   └── Ambulances.Route.js # Ambulance routes
│   ├── middlewares/
│   │   ├── patientAuth.js      # Patient authentication
│   │   ├── doctorAuth.js       # Doctor authentication
│   │   └── adminAuth.js        # Admin authentication
│   ├── services/
│   │   └── notificationService.js # Email & cron jobs
│   ├── utils/
│   │   └── ageCalculator.js    # Age calculation utility
│   ├── uploads/
│   │   └── documents/          # Uploaded documents storage
│   ├── .env                    # Environment variables
│   ├── package.json
│   └── index.js                # Server entry point
│
├── FrontEnd/
│   ├── public/
│   │   ├── index.html
│   │   └── manifest.json
│   ├── src/
│   │   ├── Components/
│   │   │   ├── ReceiptGenerator.jsx # PDF receipt generator
│   │   │   └── ReportGenerator.jsx  # PDF report generator
│   │   ├── Pages/
│   │   │   └── Dashboard/
│   │   │       ├── Dashboard-Login/
│   │   │       │   ├── DLogin.jsx
│   │   │       │   └── Signup/
│   │   │       └── Main-Dashboard/
│   │   │           ├── GlobalFiles/
│   │   │           │   ├── Sidebar.jsx
│   │   │           │   ├── Topbar.jsx
│   │   │           │   └── FrontPage.jsx
│   │   │           └── AllPages/
│   │   │               ├── Patient/
│   │   │               │   ├── Patient_Profile.jsx
│   │   │               │   ├── Book_Appointment.jsx
│   │   │               │   ├── My_Appointments.jsx
│   │   │               │   ├── My_Medications.jsx
│   │   │               │   ├── Health_Trends.jsx
│   │   │               │   ├── My_Documents.jsx
│   │   │               │   └── Notification_Settings.jsx
│   │   │               ├── Doctor/
│   │   │               │   ├── Doctor_Profile.jsx
│   │   │               │   ├── Patient_Details.jsx
│   │   │               │   ├── Check_Appointment.jsx
│   │   │               │   ├── Create_Report.jsx
│   │   │               │   ├── AllReport.jsx
│   │   │               │   └── Patient_Documents.jsx
│   │   │               └── Admin/
│   │   │                   ├── Admin_Profile.jsx
│   │   │                   ├── Add_Doctor.jsx
│   │   │                   ├── Add_Admin.jsx
│   │   │                   ├── Add_Ambulance.jsx
│   │   │                   ├── Manage_Doctors.jsx
│   │   │                   └── Manage_Patients.jsx
│   │   ├── Redux/              # State management
│   │   ├── Routes/
│   │   │   └── AllRoutes.jsx   # Route configuration
│   │   ├── utils/
│   │   │   └── timeFormat.js   # Time formatting utility
│   │   ├── App.js
│   │   ├── App.css
│   │   ├── modern-theme.css    # Modern UI theme
│   │   ├── responsive.css      # Responsive styles
│   │   └── index.js
│   └── package.json
│
├── docs/                       # Documentation
│   ├── DOCUMENT_MANAGEMENT_SYSTEM.md
│   ├── DOCUMENT_FEATURE_COMPLETE.md
│   ├── DOCUMENT_TESTING_GUIDE.md
│   ├── HEALTH_TRENDS_IMPLEMENTATION.md
│   ├── NOTIFICATION_SYSTEM_IMPLEMENTATION.md
│   ├── AGE_AUTO_CALCULATION_IMPLEMENTATION.md
│   └── TIME_FORMAT_UPDATE_SUMMARY.md
│
├── FEATURE_IDEAS.txt           # Feature roadmap
├── LICENSE                     # MIT License
├── COPYRIGHT.md                # Copyright information
└── README.md                   # This file
```

## 👥 Default Credentials

### Test Patient Account
- **Email**: `sk.shaishav.13@gmail.com`
- **Password**: `Shaishav123`

### Sample Doctor Accounts
All doctors use the password: `Doctor2123`

**Cardiology:**
- Dr. Rajesh Kumar: `rajesh.kumar@hospital.com`
- Dr. Priya Sharma: `priya.sharma@hospital.com`

**Neurology:**
- Dr. Amit Patel: `amit.patel@hospital.com`
- Dr. Sneha Reddy: `sneha.reddy@hospital.com`

**Orthopedics:**
- Dr. Vikram Singh: `vikram.singh@hospital.com`
- Dr. Anjali Desai: `anjali.desai@hospital.com`

**Pediatrics:**
- Dr. Suresh Iyer: `suresh.iyer@hospital.com`
- Dr. Kavita Nair: `kavita.nair@hospital.com`

*See backend seed files for complete list of doctors across 8 specialties.*

### Admin Account
- **Email**: `admin@hospital.com`
- **Password**: `Admin@123`

## 🔧 Development

### Running in Development Mode
```bash
# Backend with auto-reload
cd Backend && npm run dev

# Frontend with hot-reload
cd FrontEnd && npm start
```

### Testing Features

**Test Email Notifications:**
```bash
cd Backend
node test-email.js
```

**Test Notification System:**
```bash
cd Backend
node test-notification.js
```

**Test MongoDB Connection:**
```bash
cd Backend
node test-mongodb-connection.js
```

### Creating Test Data
```bash
cd Backend
node create-test-data.js
```

## 📖 Documentation

Comprehensive documentation is available in the `docs/` folder:

- **Document Management System**: Complete guide to file upload and sharing
- **Health Trends**: Implementation details for analytics and charts
- **Notification System**: Email notifications and cron job setup
- **Age Auto-Calculation**: Automatic age updates based on DOB
- **Testing Guides**: Step-by-step testing instructions

## 🎯 Feature Highlights

### 1. Document Management
- Upload medical documents (X-rays, scans, lab reports, prescriptions)
- Support for images (JPG, PNG) and documents (PDF, DOC, DOCX)
- Maximum file size: 10MB
- Share documents with specific doctors
- View documents in browser or download
- Search and filter by type
- Both patients and doctors can upload

### 2. Health Trends & Analytics
- Interactive charts for vital signs (temperature, weight, BP, glucose)
- Track changes over time
- View statistics (min, max, average, latest, trend)
- Export data to CSV
- Filter by specific metrics

### 3. Smart Notifications
- Appointment reminders (9 AM daily)
- Medication reminders (8 AM daily)
- Lab test reminders (10 AM Monday)
- Age update notifications (midnight daily)
- Customizable notification preferences
- Email delivery with professional templates

### 4. Auto Age Calculation
- Age automatically calculated from date of birth
- Updates daily at midnight
- Real-time calculation in forms
- Birthday notifications

### 5. PDF Generation
- Professional appointment receipts
- Detailed medical reports
- Includes patient information, vital signs, diagnosis
- Medications and lab tests included
- Download and print ready

### 6. Modern UI/UX
- Gradient-based color scheme
- Card-based layouts
- Smooth animations and transitions
- Responsive design for all devices
- Dark mode compatible
- Accessible interface

## 🚀 Deployment

### Backend Deployment
1. Set production environment variables
2. Use PM2 or similar process manager:
   ```bash
   npm install -g pm2
   pm2 start index.js --name "ub-ehealth-backend"
   ```
3. Configure reverse proxy (nginx):
   ```nginx
   location /api {
       proxy_pass http://localhost:3001;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection 'upgrade';
       proxy_set_header Host $host;
       proxy_cache_bypass $http_upgrade;
   }
   ```

### Frontend Deployment
```bash
cd FrontEnd
npm run build
# Deploy the build/ folder to your web server or hosting platform
```

### Environment Variables for Production
```env
# Backend .env
port=3001
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/healthcare_db
KEY=your_strong_jwt_secret
EMAIL_USER=your_production_email@gmail.com
EMAIL_PASS=your_app_password
NODE_ENV=production
```

### Recommended Hosting Platforms
- **Backend**: Heroku, Railway, Render, DigitalOcean
- **Frontend**: Vercel, Netlify, AWS S3 + CloudFront
- **Database**: MongoDB Atlas (free tier available)

## 🔒 Security Features

- **Password Hashing**: bcrypt with salt rounds
- **JWT Authentication**: Secure token-based auth
- **Input Validation**: Server-side validation for all inputs
- **File Upload Security**: File type and size validation
- **CORS Configuration**: Controlled cross-origin access
- **Environment Variables**: Sensitive data in .env files
- **Access Control**: Role-based permissions (patient/doctor/admin)

## 🧪 Testing

### Manual Testing
1. Register a new patient account
2. Book an appointment with a doctor
3. Login as doctor and create a medical report
4. Upload a document as patient
5. Share document with doctor
6. View health trends
7. Configure notification settings
8. Download receipt and report PDFs

### API Testing with Postman
Import the API endpoints and test each route with appropriate authentication tokens.

## 📊 Database Schema

### Collections
- **patients**: Patient information and credentials
- **doctors**: Doctor profiles and specializations
- **admins**: Admin accounts
- **appointments**: Appointment bookings
- **reports**: Medical reports with vital signs
- **prescriptions**: Medication prescriptions
- **documents**: Uploaded medical documents
- **ambulances**: Ambulance fleet information

## 🛠️ Troubleshooting

### Common Issues

**Backend won't start:**
- Check MongoDB connection string
- Verify port 3001 is available
- Ensure all dependencies are installed

**Frontend can't connect to backend:**
- Verify backend is running on port 3001
- Check CORS configuration
- Ensure API URLs are correct

**Email notifications not working:**
- Verify EMAIL_USER and EMAIL_PASS in .env
- Use Gmail App Password, not regular password
- Check spam folder for test emails

**File upload fails:**
- Ensure uploads/documents folder exists
- Check file size (max 10MB)
- Verify file type is allowed

**Age not updating:**
- Check if cron job is running
- Verify date of birth format
- Check server logs for errors

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/AmazingFeature
   ```
3. **Commit your changes**
   ```bash
   git commit -m 'Add some AmazingFeature'
   ```
4. **Push to the branch**
   ```bash
   git push origin feature/AmazingFeature
   ```
5. **Open a Pull Request**

### Contribution Guidelines
- Follow existing code style and patterns
- Write clear commit messages
- Add comments for complex logic
- Test your changes thoroughly
- Update documentation as needed
- Ensure responsive design for UI changes

## 🗺️ Roadmap

See `FEATURE_IDEAS.txt` for the complete feature roadmap. Upcoming features include:

- [ ] Prescription Management with QR codes
- [ ] Doctor Performance Dashboard
- [ ] In-app Chat System
- [ ] Video Consultation (Telemedicine)
- [ ] Two-Factor Authentication
- [ ] Insurance Integration
- [ ] Allergy Alerts
- [ ] Drug Interaction Checker
- [ ] Vaccination Records
- [ ] Progressive Web App (PWA)
- [ ] Multi-language Support
- [ ] Dark Mode
- [ ] AI Symptom Checker
- [ ] Chatbot Assistant

## 📈 Project Stats

- **Total Routes**: 50+ API endpoints
- **Database Models**: 8 collections
- **Frontend Pages**: 20+ components
- **Features Implemented**: 15+ major features
- **Lines of Code**: 10,000+
- **Documentation**: Comprehensive guides and API docs

## 🎓 Learning Resources

This project demonstrates:
- RESTful API design
- JWT authentication
- File upload handling
- Email integration
- Scheduled tasks with cron
- PDF generation
- Data visualization with charts
- State management with Redux
- Responsive web design
- Modern React patterns (hooks, context)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

### MIT License Summary
- ✅ Commercial use allowed
- ✅ Modification allowed
- ✅ Distribution allowed
- ✅ Private use allowed
- ⚠️ Liability and warranty not provided
- ℹ️ License and copyright notice required

## 📞 Support & Contact

- **Email**: sk.shaishav.9@gmail.com
- **GitHub Issues**: Create an issue for bug reports or feature requests
- **Documentation**: Check the `docs/` folder for detailed guides

## 🙏 Acknowledgments

- Built with modern web technologies and best practices
- Inspired by the need for efficient healthcare management
- Thanks to the open-source community for amazing tools and libraries
- Special thanks to all contributors and testers

## 📝 Changelog

### Version 2.0.0 (February 2026)
- ✅ Added Document Management System
- ✅ Implemented Health Trends & Analytics
- ✅ Added Email Notification System
- ✅ Implemented Auto Age Calculation
- ✅ Added PDF Report Generation
- ✅ Enhanced UI with modern theme
- ✅ Improved responsive design
- ✅ Added comprehensive documentation

### Version 1.0.0 (Initial Release)
- ✅ Patient, Doctor, Admin portals
- ✅ Appointment booking system
- ✅ Medical report creation
- ✅ Prescription management
- ✅ Ambulance services
- ✅ Basic authentication

---

**Copyright © 2025-2026 Shaishav. All rights reserved.**

*UB E-Health - Transforming Healthcare Management*

**Built with ❤️ using Node.js, MongoDB, and React**