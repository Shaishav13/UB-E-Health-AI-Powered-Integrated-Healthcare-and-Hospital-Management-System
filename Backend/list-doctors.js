const http = require('http');

function makeRequest(method, path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const response = {
            status: res.statusCode,
            data: body ? JSON.parse(body) : null
          };
          resolve(response);
        } catch (error) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function listDoctors() {
  console.log('\n=== Listing All Doctors ===');
  
  try {
    const response = await makeRequest('GET', '/doctors');
    
    if (response.status === 200 && Array.isArray(response.data)) {
      console.log(`Found ${response.data.length} doctors:`);
      response.data.forEach(doc => {
        console.log(`  - ID: ${doc.doctorId}, Name: ${doc.name}, Email: ${doc.email}`);
      });
    } else {
      console.log('✗ Failed to get doctors');
      console.log('Response:', response.data);
    }
  } catch (error) {
    console.log('✗ Error:', error.message);
  }
}

listDoctors();
