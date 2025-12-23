# Healthcare Management System 🏥

A comprehensive web-based Healthcare Management System built with React.js and Node.js that streamlines hospital operations and improves patient care through separate interfaces for patients, doctors, and administrators.

## 🚀 Quick Start

Follow these steps to get the project running on your local machine:

### Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v14.0.0 or higher) - [Download here](https://nodejs.org/)
- **MongoDB** - [Download here](https://www.mongodb.com/try/download/community)
- **Git** - [Download here](https://git-scm.com/)

### Installation Steps

#### 1. Clone the Repository
```bash
git clone <your-repository-url>
cd healthcare-management-system
```

#### 2. Backend Setup

Navigate to the Backend directory and install dependencies:
```bash
cd Backend
npm install
```

#### 3. Frontend Setup

Open a new terminal, navigate to the Frontend directory and install dependencies:
```bash
cd FrontEnd
npm install
```

#### 4. Environment Configuration

The Backend already includes a `.env` file with default configurations. You may need to update these values:

```env
# Express server port
port=3001

# MongoDB connection string
MONGO_URI=mongodb://localhost:27017/healthcare_db

# JWT token secret key
KEY=SECRET

# Email service configuration (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_MAIL=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

**Important**: 
- Make sure MongoDB is running on your system
- Update email credentials if you want email notifications to work
- Change the JWT `KEY` to a secure secret in production

#### 5. Start the Application

You need to run both Backend and Frontend servers:

**Terminal 1 - Start Backend Server:**
```bash
cd Backend
npm start
```
The backend server will start on `http://localhost:3001`

**Terminal 2 - Start Frontend Server:**
```bash
cd FrontEnd
npm start
```
The frontend application will start on `http://localhost:3000`

#### 6. Access the Application

Once both servers are running, open your browser and navigate to:
- **Main Application**: `http://localhost:3000`
- **API Endpoints**: `http://localhost:3001`

## 🎯 Default Login Credentials

The system will be empty initially. You can:
1. Register as a new patient through the patient registration page
2. Use the admin panel to create doctor and admin accounts
3. Or run the test data creation script (if available)

## 📱 User Interfaces

### Patient Portal
- Register/Login as a patient
- Book appointments with doctors
- View medical records and prescriptions
- Manage personal health information

### Doctor Dashboard
- Login with doctor credentials
- Manage patient appointments
- Create medical reports and prescriptions
- View assigned patients

### Admin Panel
- Manage doctors, patients, and staff
- Oversee hospital resources and ambulances
- View system analytics and reports
- Configure system settings

## 🛠️ Development Commands

### Backend Commands
```bash
cd Backend
npm start          # Start production server
npm run dev        # Start development server with nodemon
```

### Frontend Commands
```bash
cd FrontEnd
npm start          # Start development server
npm run build      # Build for production
npm test           # Run tests
```

## 🗄️ Database Setup

### MongoDB
1. **Install MongoDB** on your system
2. **Start MongoDB service**:
   - Windows: MongoDB should start automatically
   - macOS: `brew services start mongodb/brew/mongodb-community`
   - Linux: `sudo systemctl start mongod`

3. **Verify Connection**: The application will automatically create the database and collections when you first run it.

### Optional: MongoDB Compass
For a GUI to view your database:
1. Download [MongoDB Compass](https://www.mongodb.com/products/compass)
2. Connect to `mongodb://localhost:27017`
3. View the `healthcare_db` database

## 🔧 Troubleshooting

### Common Issues

**Port Already in Use:**
```bash
# Kill process on port 3000 (Frontend)
npx kill-port 3000

# Kill process on port 3001 (Backend)
npx kill-port 3001
```

**MongoDB Connection Error:**
- Ensure MongoDB is running: `mongod --version`
- Check if MongoDB service is active
- Verify the connection string in `.env` file

**Module Not Found Errors:**
```bash
# Clear npm cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

**CORS Issues:**
- The backend is configured with CORS enabled
- Ensure frontend is running on `http://localhost:3000`

## 📋 Features Overview

- **Patient Management**: Registration, authentication, profile management
- **Doctor Management**: Professional profiles, availability scheduling
- **Appointment System**: Booking, scheduling, status tracking
- **Medical Records**: Patient history, reports, prescriptions
- **Admin Dashboard**: User management, system analytics
- **Ambulance Service**: Vehicle tracking and management
- **Email Notifications**: Appointment confirmations and updates

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and commit: `git commit -m 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## 📞 Support

If you encounter any issues:
1. Check the troubleshooting section above
2. Ensure all prerequisites are installed correctly
3. Verify that both servers are running
4. Check browser console for any error messages

## 🔒 Security Note

This project is for educational/development purposes. Before deploying to production:
- Change all default passwords and secrets
- Implement proper security headers
- Use environment variables for sensitive data
- Enable HTTPS
- Follow healthcare data compliance regulations (HIPAA, etc.)

---

**Happy Coding! 🚀**

For more detailed information about the project architecture and features, see [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md).