# Healthcare Management System (HMS)

## 📋 Project Overview

A comprehensive web-based Healthcare Management System designed to streamline hospital operations and improve patient care. This full-stack application provides separate interfaces for patients, doctors, and administrators to manage appointments, medical records, prescriptions, and hospital resources efficiently.

## 🚀 Features

### Patient Portal
- **User Registration & Authentication** - Secure patient account creation and login
- **Appointment Booking** - Schedule appointments with available doctors
- **Medical Records** - View personal health records and reports
- **Prescription Management** - Access and track prescribed medications
- **Doctor Assignment** - Get assigned to specific doctors for continuity of care

### Doctor Dashboard
- **Patient Management** - View and manage assigned patients
- **Appointment Scheduling** - Manage appointment calendar and availability
- **Medical Records** - Create and update patient medical reports
- **Prescription Writing** - Issue digital prescriptions
- **Patient History** - Access comprehensive patient medical history

### Admin Panel
- **User Management** - Manage doctors, patients, and staff accounts
- **Hospital Resources** - Manage ambulances and hospital facilities
- **Analytics Dashboard** - View system statistics and reports
- **Appointment Oversight** - Monitor and manage all appointments
- **System Configuration** - Configure hospital settings and policies

### Additional Features
- **Ambulance Management** - Track and manage ambulance services
- **Report Generation** - Generate various medical and administrative reports
- **Real-time Notifications** - Email notifications for appointments and updates
- **Responsive Design** - Mobile-friendly interface for all user types

## 🛠️ Tech Stack

### Frontend
- **React.js** (v18.2.0) - Modern JavaScript library for building user interfaces
- **React Router DOM** (v6.4.4) - Client-side routing
- **Redux & Redux Thunk** - State management and async actions
- **Material-UI (MUI)** (v5.15.1) - React component library for consistent UI
- **Ant Design** (v5.0.3) - Additional UI components
- **Axios** (v1.2.0) - HTTP client for API requests
- **React Toastify** (v9.1.1) - Toast notifications
- **FullCalendar** (v6.0.3) - Calendar component for appointment scheduling
- **React Icons** (v4.7.1) - Icon library

### Backend
- **Node.js** - JavaScript runtime environment
- **Express.js** (v4.18.2) - Web application framework
- **MongoDB** (v7.0.0) - NoSQL database
- **Mongoose** (v6.8.4) - MongoDB object modeling
- **PostgreSQL** (v8.11.3) - Relational database (alternative/additional storage)
- **Knex.js** (v3.0.1) - SQL query builder

### Authentication & Security
- **JWT (jsonwebtoken)** (v8.5.1) - Token-based authentication
- **bcrypt** (v5.1.0) - Password hashing
- **Validator** (v13.7.0) - Input validation

### Additional Tools
- **CORS** (v2.8.5) - Cross-origin resource sharing
- **dotenv** (v16.0.3) - Environment variable management
- **Nodemailer** (v6.9.0) - Email service integration
- **Nodemon** (v2.0.20) - Development server auto-restart

## 📁 Project Structure

```
Healthcare-Management-System/
├── Backend/
│   ├── configs/
│   │   ├── queries/          # Database queries
│   │   ├── config.js         # Application configuration
│   │   ├── db.js            # Database connection
│   │   └── dbhelper.js      # Database utilities
│   ├── middlewares/         # Authentication middlewares
│   ├── models/              # Database models (Patient, Doctor, etc.)
│   ├── routes/              # API route handlers
│   ├── index.js             # Server entry point
│   └── package.json
├── FrontEnd/
│   ├── public/              # Static assets
│   ├── src/
│   │   ├── Components/      # Reusable React components
│   │   ├── Pages/           # Page components
│   │   ├── Redux/           # State management
│   │   ├── Routes/          # Application routing
│   │   ├── img/             # Images and assets
│   │   ├── App.js           # Main App component
│   │   └── index.js         # React entry point
│   └── package.json
└── README.md
```

## 🗄️ Database Schema

### Core Entities
- **Patients** - Personal info, medical history, assigned doctor
- **Doctors** - Professional details, specialization, availability
- **Appointments** - Scheduling, status tracking, payment info
- **Prescriptions** - Medication details, dosage, instructions
- **Reports** - Medical reports and test results
- **Ambulances** - Vehicle management and tracking
- **Admins** - System administrators and staff

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB
- PostgreSQL (optional)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd healthcare-management-system
   ```

2. **Backend Setup**
   ```bash
   cd Backend
   npm install
   cp .env.example .env  # Configure environment variables
   npm run dev
   ```

3. **Frontend Setup**
   ```bash
   cd FrontEnd
   npm install
   npm start
   ```

4. **Environment Configuration**
   - Configure MongoDB connection string
   - Set JWT secret key
   - Configure email service credentials
   - Set application port and other environment variables

## 🔧 API Endpoints

### Authentication
- `POST /admin/login` - Admin login
- `POST /doctors/login` - Doctor login  
- `POST /patients/login` - Patient login
- `POST /patients/register` - Patient registration

### Core Resources
- `/patients/*` - Patient management endpoints
- `/doctors/*` - Doctor management endpoints
- `/appointments/*` - Appointment scheduling endpoints
- `/prescriptions/*` - Prescription management endpoints
- `/reports/*` - Medical reports endpoints
- `/ambulances/*` - Ambulance service endpoints

## 🎯 Key Features Implementation

### Authentication System
- Role-based access control (Patient, Doctor, Admin)
- JWT token-based authentication
- Password encryption using bcrypt
- Secure middleware for route protection

### Appointment System
- Real-time availability checking
- Calendar integration with FullCalendar
- Email notifications for bookings
- Status tracking (pending, confirmed, completed, cancelled)

### Medical Records
- Comprehensive patient history
- Report generation and storage
- Prescription tracking
- Doctor notes and observations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License - see the LICENSE file for details.

## 👥 Authors

- **Development Team** - Initial work and ongoing maintenance

## 🙏 Acknowledgments

- React.js community for excellent documentation
- Material-UI team for the component library
- MongoDB team for the database solution
- Express.js community for the web framework

---

**Note**: This is a comprehensive healthcare management solution designed for educational and development purposes. Ensure proper security measures and compliance with healthcare regulations before deploying in a production environment.