# UB E-Health

A comprehensive healthcare management system built with Node.js, MongoDB, and React.

## 🏥 Features

- **Patient Management**: Registration, login, and profile management
- **Doctor Portal**: Doctor authentication and patient management
- **Admin Dashboard**: System administration and oversight
- **Appointment Scheduling**: Book and manage medical appointments
- **Medical Reports**: Create and view patient medical reports
- **Prescription Management**: Digital prescription handling
- **Ambulance Services**: Emergency ambulance booking

## 🚀 Technology Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **bcrypt** for password hashing
- **CORS** enabled for cross-origin requests

### Frontend
- **React 18** with functional components
- **React Router** for navigation
- **Axios** for API communication
- **Modern CSS** with responsive design

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
KEY=SECRET
```

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

### Main Endpoints
- `/patients` - Patient management
- `/doctors` - Doctor management
- `/appointments` - Appointment scheduling
- `/reports` - Medical reports
- `/prescriptions` - Prescription management
- `/ambulances` - Ambulance services

## 🏗️ Project Structure

```
E-Health-Management-Hub-main/
├── Backend/
│   ├── configs/          # Database configuration
│   ├── models/           # Mongoose models
│   ├── routes/           # API routes
│   ├── middlewares/      # Authentication middleware
│   └── index.js          # Server entry point
│
├── FrontEnd/
│   ├── public/           # Static files
│   ├── src/
│   │   ├── pages/        # React components
│   │   ├── App.js        # Main app component
│   │   └── index.js      # Entry point
│   └── package.json
│
├── LICENSE               # MIT License
├── COPYRIGHT.md          # Copyright information
└── README.md            # This file
```

## 👥 Default Credentials

### Sample Doctor Accounts
All doctors use the password: `Doctor@123`

**Cardiology:**
- Dr. Rajesh Kumar: `rajesh.kumar@hospital.com`
- Dr. Priya Sharma: `priya.sharma@hospital.com`

**Neurology:**
- Dr. Amit Patel: `amit.patel@hospital.com`
- Dr. Sneha Reddy: `sneha.reddy@hospital.com`

*See `doctors_credentials.txt` for complete list of 16 doctors across 8 specialties.*

## 🔧 Development

### Running in Development Mode
```bash
# Backend with auto-reload
cd Backend && npm run dev

# Frontend with hot-reload
cd FrontEnd && npm start
```

### Testing MongoDB Connection
```bash
cd Backend
node test-mongodb-connection.js
```

## 🚀 Deployment

### Backend Deployment
1. Set production environment variables
2. Use PM2 or similar process manager
3. Configure reverse proxy (nginx)

### Frontend Deployment
```bash
cd FrontEnd
npm run build
# Deploy the build/ folder to your web server
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support, email sk.shaishav.9@gmail.com or create an issue in the GitHub repository.

## 🙏 Acknowledgments

- Built with modern web technologies
- Inspired by the need for efficient healthcare management
- Thanks to the open-source community

---

**Copyright © 2025 Shaishav. All rights reserved.**

*This project can be used for software copyright purposes. The MIT license ensures proper attribution while allowing others to use and modify the code.*