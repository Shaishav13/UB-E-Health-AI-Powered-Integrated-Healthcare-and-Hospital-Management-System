

## 👥 Team

| Name | Roll Number | Role |
|---|---|---|
| Shaishav | 2211985046 | Full Stack Developer |
| Sangram Jyoti Patra | 2211985045 | Full Stack Developer |

**Project Title:** UB E-Health: AI-Powered Integrated Healthcare and Hospital Management System  
**Type:** Copyright  
**Institution:** University of Bolton

---
<div align="center">

# 🏥 UB E-Health
### AI-Powered Integrated Healthcare and Hospital Management System

[![Node.js](https://img.shields.io/badge/Node.js-v14+-339933?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.2-61DAFB?style=flat&logo=react&logoColor=black)](https://reactjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.x-47A248?style=flat&logo=mongodb&logoColor=white)](https://mongodb.com/)
[![Express](https://img.shields.io/badge/Express-4.18-000000?style=flat&logo=express&logoColor=white)](https://expressjs.com/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat)](LICENSE)

A full-stack healthcare management platform with AI-powered features, real-time communication, and role-based portals for Patients, Doctors, Lab Personnel, and Administrators.

</div>

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Login Credentials](#-default-login-credentials)
- [API Overview](#-api-overview)
- [Deployment](#-deployment)
- [Security](#-security)
- [License](#-license)

---

## ✨ Features

### 🧑‍⚕️ Patient Portal
- Secure registration, login, and profile management
- Book appointments with available doctors
- View medical reports, prescriptions, and lab results
- Upload and share medical documents (X-rays, scans, PDFs)
- Health trends with interactive charts (BP, weight, glucose, temperature)
- Download appointment receipts as PDF
- Email notifications for appointments and medications

### 👨‍⚕️ Doctor Portal
- View and manage assigned patients
- Check and manage scheduled appointments
- Create detailed medical reports with diagnoses and medications
- Upload documents for patients
- AI-powered report interpretation (Google Gemini AI)
- Change password securely

### 🔬 Lab Personnel Portal
- Manage and upload lab reports for patients
- View assigned lab tests
- Communicate with doctors via real-time chat

### 🔧 Admin Dashboard
- Add, edit, and remove doctors and lab personnel
- Manage patient accounts
- Manage ambulance fleet
- Add additional admin users
- System-wide oversight

### 🤖 AI Features
- **Health Chatbot** — AI-powered assistant for health queries
- **Report Interpretation** — Gemini AI analyses medical reports
- **Doctor AI Assistant** — Helps doctors with report creation

### 💬 Real-Time Features
- Socket.IO-based real-time chat between users
- Live notifications
- Redis-backed message caching

---

## 🛠 Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| Node.js + Express.js | REST API server |
| MongoDB + Mongoose | Primary database |
| Socket.IO | Real-time communication |
| Redis (ioredis) | Chat caching & pub/sub |
| JWT + bcrypt | Authentication & password hashing |
| Multer + Sharp | File uploads & image processing |
| Nodemailer | Email notifications |
| Node-cron | Scheduled background tasks |
| Google Gemini AI | AI features |
| Winston | Logging |

### Frontend
| Technology | Purpose |
|---|---|
| React 18 + Hooks | UI framework |
| Redux + Redux Thunk | State management |
| React Router v6 | Client-side routing |
| Axios | HTTP client |
| Material-UI + Ant Design | UI component libraries |
| Chart.js + react-chartjs-2 | Data visualisation |
| jsPDF + html2canvas | PDF generation |
| Socket.IO Client | Real-time communication |
| FullCalendar | Appointment calendar |
| React Toastify | Toast notifications |

---

## 📁 Project Structure

```
Source Code/
├── Backend/
│   ├── configs/            # DB connection, Redis, Socket.IO, Multer config
│   ├── middlewares/        # Auth middlewares (patient, doctor, admin, lab)
│   ├── models/             # Mongoose schemas
│   ├── routes/             # Express route handlers
│   ├── services/           # AI, email, chat, notification services
│   ├── socket/             # Socket.IO server and handlers
│   ├── utils/              # Helpers (sanitizer, validators, age calculator)
│   ├── uploads/            # Uploaded files storage
│   ├── .env                # Environment variables
│   ├── index.js            # Server entry point
│   └── package.json
│
└── FrontEnd/
    ├── public/             # Static assets
    └── src/
        ├── Components/     # Reusable components (Chat, PDF generators)
        ├── Pages/
        │   └── Dashboard/
        │       ├── Dashboard-Login/    # Login & Signup pages
        │       └── Main-Dashboard/
        │           ├── GlobalFiles/    # Sidebar, Topbar, FrontPage
        │           └── AllPages/
        │               ├── Patient/   # Patient portal pages
        │               ├── Doctor/    # Doctor portal pages
        │               ├── Admin/     # Admin portal pages
        │               └── Chat/      # Chat pages
        ├── Redux/          # Store, reducers, actions
        ├── Routes/         # AllRoutes.jsx
        ├── services/       # API service layer
        ├── App.js
        └── index.js
```

---

## ✅ Prerequisites

Make sure you have the following installed before running the project:

- **Node.js** v14 or higher — [Download](https://nodejs.org/)
- **MongoDB** (local) or a [MongoDB Atlas](https://www.mongodb.com/atlas) account
- **Git** — [Download](https://git-scm.com/)
- **Redis** ( required only for real-time chat caching)

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/Shaishav13/E-Health-Management-Hub-main.git
cd "UB E-Health 2211985046_2211985045/Source Code"
```

---

### 2. Backend Setup

```bash
cd Backend
npm install
```

Create a `.env` file in the `Backend/` folder (see [Environment Variables](#-environment-variables) below), then start the server:

```bash
# Production
npm start

# Development (auto-restarts on file changes)
npm run dev
```

The backend will start on **http://localhost:3001**

---

### 3. Frontend Setup

Open a **new terminal**, then:

```bash
cd FrontEnd
npm install
npm start
```

The frontend will start on **http://localhost:3000**

---

### 4. Open the App

| Service | URL |
|---|---|
| Frontend (App) | http://localhost:3000 |
| Backend (API) | http://localhost:3001 |

---

## 🔐 Environment Variables

Create a `.env` file inside the `Backend/` folder with the following:

```env
# Server
port=3001

# MongoDB
MONGO_URI=mongodb://localhost:27017/healthcare_db

# JWT Secret
KEY=your_strong_secret_key_here

# Email (Gmail SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_MAIL=your_email@gmail.com
SMTP_PASSWORD=your_gmail_app_password

# Google Gemini AI (optional — for AI features)
GEMINI_API_KEY=your_gemini_api_key

# Redis (optional — for real-time chat caching)
REDIS_URL=redis://localhost:6379


---

## 🔑 Default Login Credentials

The system uses a **single smart login form** — it auto-detects the account type based on what you enter:

| User Type | Login Field | Example | Password |
|---|---|---|---|
| **Patient** | Email address | `patient@email.com` | Set during registration |
| **Doctor** | Numeric ID | `1`, `2`, `3` | Assigned by admin |
| **Lab Personnel** | Lab ID | `L1`, `L2`, `L3` | Assigned by admin |
| **Admin** | Username | `admin` | `admin@123` |

> Patients can self-register. Doctor, Lab, and Admin accounts are created by the Admin.

---

## 📡 API Overview

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/patients/register` | Patient registration |
| POST | `/patients/login` | Patient login |
| POST | `/doctors/login` | Doctor / Lab login |
| POST | `/admin/login` | Admin login |

### Core Resources
| Prefix | Description |
|---|---|
| `/patients/*` | Patient CRUD and profile |
| `/doctors/*` | Doctor management |
| `/appointments/*` | Appointment booking and management |
| `/reports/*` | Medical reports |
| `/prescriptions/*` | Prescriptions |
| `/ambulances/*` | Ambulance fleet |
| `/documents/*` | File uploads and sharing |
| `/lab-reports/*` | Lab reports |
| `/notifications/*` | Notification preferences |
| `/analytics/*` | Health trends data |
| `/chatbot/*` | AI health chatbot |

---

## 🌐 Deployment

### Backend
```bash
# Install PM2 process manager
npm install -g pm2

# Start backend
pm2 start index.js --name "ub-ehealth-api"
pm2 save
```

### Frontend
```bash
cd FrontEnd
npm run build
# Deploy the generated build/ folder to Vercel, Netlify, or any static host
```

### Recommended Platforms
| Service | Platform |
|---|---|
| Backend API | [Render](https://render.com), [Railway](https://railway.app), [Heroku](https://heroku.com) |
| Frontend | [Vercel](https://vercel.com), [Netlify](https://netlify.com) |
| Database | [MongoDB Atlas](https://www.mongodb.com/atlas) (free tier) |

---

## 🔒 Security

- Passwords hashed with **bcrypt** (10 salt rounds)
- **JWT** tokens for stateless authentication
- Role-based access control (Patient / Doctor / Lab / Admin)
- Input sanitization and server-side validation
- File type and size validation on uploads
- Environment variables for all secrets

---

## 🛠 Troubleshooting

**Backend won't start**
- Check MongoDB is running: `mongod --version`
- Verify port 3001 is free
- Confirm all `.env` values are set

**Frontend can't reach backend**
- Ensure backend is running on port 3001
- Check browser console for CORS errors

**Email not sending**
- Use a Gmail App Password, not your regular password
- Check spam folder for test emails

**AI features not working**
- Add a valid `GEMINI_API_KEY` to `.env`
- Get a free key at [Google AI Studio](https://aistudio.google.com/)

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**© 2025–2026 Shaishav & Sangram Jyoti Patra. All rights reserved.**



</div>
