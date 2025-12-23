// Simple test to check admin API
const axios = require('axios');

async function testAdminAPI() {
  try {
    console.log('Testing admin API...');
    const response = await axios.get('http://localhost:3001/admin');
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    console.log('Number of admins:', response.data.length);
  } catch (error) {
    console.error('Error testing admin API:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testAdminAPI();