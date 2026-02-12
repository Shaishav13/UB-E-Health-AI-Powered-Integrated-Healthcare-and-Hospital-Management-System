/*
 * Test Documents Route
 * Quick test to verify documents endpoint is working
 */

const axios = require('axios');

const BASE_URL = 'http://127.0.0.1:3001';

async function testDocumentsRoute() {
  console.log('🧪 Testing Documents Route...\n');

  try {
    // Test 1: Check if server is running
    console.log('1️⃣ Testing server connection...');
    const serverTest = await axios.get(BASE_URL);
    console.log('✅ Server is running:', serverTest.data);

    // Test 2: Test documents route (should return 400 for invalid ID, not 404)
    console.log('\n2️⃣ Testing documents route...');
    try {
      await axios.get(`${BASE_URL}/documents/patient/invalid-id`);
    } catch (error) {
      if (error.response) {
        if (error.response.status === 404) {
          console.log('❌ Route not found (404) - Backend needs restart!');
          console.log('   Run: cd Backend && npm start');
        } else if (error.response.status === 400) {
          console.log('✅ Route exists! (Got 400 for invalid ID - expected)');
        } else {
          console.log(`⚠️ Got status ${error.response.status}:`, error.response.data);
        }
      } else {
        console.log('❌ Cannot connect to server');
        console.log('   Make sure backend is running: cd Backend && npm start');
      }
    }

    console.log('\n📋 Summary:');
    console.log('- If you see "Route not found (404)", restart the backend server');
    console.log('- If you see "Route exists!", the backend is configured correctly');
    console.log('- Make sure you have a valid patient ID to test with');

  } catch (error) {
    console.log('❌ Error:', error.message);
    console.log('\n💡 Make sure:');
    console.log('1. Backend server is running (cd Backend && npm start)');
    console.log('2. Server is on port 3001');
    console.log('3. MongoDB is connected');
  }
}

testDocumentsRoute();
