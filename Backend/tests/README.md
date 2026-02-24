# Backend Tests & Utilities

This folder contains all test scripts and utility files for the E-Health Management Hub backend.

## Test Categories

### 🧪 AI Feature Tests
- `test-gemini-ai.js` - Test Gemini AI integration for lab reports
- `test-doctor-report-ai.js` - Test doctor report AI interpretation
- `test-doctor-ai-fix.js` - Quick test for doctor AI fixes
- `debug-doctor-report-ai.js` - Debug tool for doctor report AI

### 🔐 Authentication Tests
- `test-auth-usertype.js` - Test user type authentication
- `test-login-both-types.js` - Test login for different user types
- `test-doctor-login-simple.js` - Simple doctor login test
- `test-unified-login.js` - Test unified login system
- `test-token-handling.js` - Test JWT token handling
- `test-login-curl.ps1` - PowerShell script for login testing

### 🧬 Laboratory System Tests
- `test-complete-lab-flow.js` - Complete laboratory workflow test
- `test-lab-reports-integration.js` - Lab reports integration test
- `test-lab-reports-routes.js` - Lab reports API routes test
- `test-lab-personnel-integration.js` - Lab personnel integration test
- `test-lab-personnel-routes.js` - Lab personnel API routes test
- `test-lab-personnel-simple.js` - Simple lab personnel test
- `test-lab-personnel-property.js` - Lab personnel property test
- `test-lab-personnel-email.js` - Lab personnel email test
- `test-lab-personnel-email-error.js` - Lab personnel email error handling
- `test-add-lab-personnel.js` - Add lab personnel test
- `test-patient-lab-history.js` - Patient lab history test

### 📧 Notification Tests
- `test-email.js` - Email service test
- `test-notification.js` - Notification system test

### 📄 Document Tests
- `test-documents-route.js` - Document management routes test

### 👨‍⚕️ Admin Tests
- `test-admin-api.js` - Admin API endpoints test

### 🔍 Verification Scripts
- `verify-complete-wiring.js` - Verify complete system wiring
- `verify-integration-test-structure.js` - Verify integration test structure
- `verify-login-implementation.js` - Verify login implementation

## Utility Scripts

### 📊 Data Creation
- `create-test-users.js` - Create test users in database
- `create-test-doctor.js` - Create test doctor account
- `create-test-data.js` - Create general test data
- `create-completed-lab-test.js` - Create completed lab test with results

### 🛠️ Database Utilities
- `clear-reports.js` - Clear all reports from database
- `add-receipt-to-appointments.js` - Add receipt field to appointments

### 📋 List Utilities
- `list-doctors.js` - List all doctors in database
- `list-available-models.js` - List available Gemini AI models

## How to Run Tests

### Individual Test:
```bash
cd E-Health-Management-Hub-main/Backend
node tests/test-gemini-ai.js
```

### With Database Connection:
Most tests require the backend server to be running or a direct database connection.

```bash
# Start backend first
npm start

# Then run test in another terminal
node tests/test-complete-lab-flow.js
```

## Important Notes

⚠️ **Do not delete these files** - They are used for:
- Testing new features
- Debugging issues
- Creating test data
- Verifying system functionality

✅ **Safe to run** - All test scripts are read-only or create test data only. They won't break production functionality.

🔧 **Utility scripts** - Some scripts modify the database (like `clear-reports.js`). Use with caution!

## Test Data

Test scripts create data with predictable IDs and credentials:
- Test patient: Check individual test files for credentials
- Test doctor: Check `create-test-doctor.js`
- Test admin: `adminID: 'admin'`, `password: 'admin@123'`

## Troubleshooting

If tests fail:
1. Check backend server is running (`npm start`)
2. Check database connection in `.env`
3. Check MongoDB is running
4. Review test output for specific errors

## Adding New Tests

When adding new tests:
1. Name them clearly: `test-[feature]-[aspect].js`
2. Add description to this README
3. Include error handling
4. Add console output for debugging
5. Document any test data created
