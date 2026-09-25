<div align="center">
  <h1>UB E-Health</h1>
  <h3>AI-Powered Integrated Healthcare and Hospital Management System</h3>
</div>

---

## Overview

**UB E-Health** is a comprehensive, modern, web-based Healthcare Management System. It leverages cutting-edge artificial intelligence to streamline hospital operations, automate administrative workflows, and dramatically improve patient care. 

The system provides dedicated interfaces for **Patients, Doctors, Lab Personnel, and Administrators**, making it easy to manage appointments, medical records, digital prescriptions, lab reports, and critical hospital resources all in one centralized platform.

## Core Features

- **AI Integration (Powered by Google Gemini AI)**: Intelligent health chatbot assistance and automated interpretation of complex lab reports.
- **Real-Time Operations (Powered by Socket.IO)**: Live chat systems for patient-doctor communication and real-time updates for scheduling.
- **Multi-Portal Access**: Specialized, secure dashboards for Patients, Doctors, Lab Personnel, and System Admins.
- **Smart Scheduling**: Real-time appointment scheduling, management, and tracking.
- **Digital Records**: Paperless, digital generation and secure storage of prescriptions and medical lab reports.
- **Resource Management**: Integrated ambulance dispatch and tracking management.
- **Notifications**: Automated email notifications and critical alerts.

## Tech Stack

| Category | Technologies |
| :--- | :--- |
| **Frontend** | React.js, Redux, Material-UI (MUI), Ant Design |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB (Mongoose) |
| **AI Integration** | Google Gemini AI |
| **Real-time Engine** | Socket.IO |
| **Security** | JWT Auth, bcrypt |

## Quick Start: 3-Step Run Guide

Follow these steps to get the project running locally:

### 1. Install Dependencies
Navigate to the frontend and backend directories to install required packages.
```bash
# In the backend directory
npm install

# In the frontend directory 
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in your backend folder and include your keys (ensure to use your own secure keys and never commit them):
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_gemini_api_key
```

### 3. Start the Servers
Run both the frontend and backend servers simultaneously.
```bash
# Start backend (from the backend directory)
npm run server

# Start frontend (from the frontend directory)
npm start
```
*The app should now be running on `http://localhost:3000` and the API on `http://localhost:5000`.*

---

## Project Structure

```text
UB E-Health 2211985046_2211985045/
├── IPR Submission Proof/       ← Research paper, patent, copyright forms & screenshots
├── Report and PPT/             ← Comprehensive project report file and presentation
├── Source Code/                ← Link/zip of the core project source code
└── README.md                   ← Project documentation
```

## Team Details

- **Shaishav** (Roll Number: 2211985046)
- **Sangram Jyoti Patra** (Roll Number: 2211985045)

## Legal & Status

- **Status:** Development Complete
- **Type:** Copyright
- **Copyright Status:** Form Submitted
