// Test API endpoints without external dependencies
const https = require('https');
const http = require('http');

const API_BASE_URL = 'http://localhost:5000/api';

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: data, headers: res.headers });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

async function testAPI() {
  console.log('Testing API endpoints...\n');

  try {
    // Test server connection
    console.log('1. Testing server connection...');
    const response = await makeRequest(`${API_BASE_URL}/categories`);
    console.log('Response status:', response.status);
    
    if (response.status === 401) {
      console.log('❌ Authentication required - server is running but needs token');
    } else if (response.status === 200) {
      console.log('✅ Server is running and categories endpoint is accessible');
      console.log('Categories data:', response.data);
    } else {
      console.log('❌ Server error:', response.status);
    }
  } catch (error) {
    console.log('❌ Connection error:', error.message);
    console.log('Make sure the server is running on port 5000');
  }

  console.log('\n2. Testing vendors endpoint...');
  try {
    const response = await makeRequest(`${API_BASE_URL}/vendors`);
    console.log('Response status:', response.status);
    
    if (response.status === 401) {
      console.log('❌ Authentication required - vendors endpoint needs token');
    } else if (response.status === 200) {
      console.log('✅ Vendors endpoint is accessible');
      console.log('Vendors count:', response.data.length);
    } else {
      console.log('❌ Vendors error:', response.status);
    }
  } catch (error) {
    console.log('❌ Vendors connection error:', error.message);
  }

  console.log('\n3. Testing authentication endpoint...');
  try {
    const response = await makeRequest(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      body: {
        username: 'admin',
        password: 'admin123'
      }
    });
    
    console.log('Auth response status:', response.status);
    
    if (response.status === 200) {
      console.log('✅ Authentication successful');
      console.log('Token received:', response.data.token ? 'Yes' : 'No');
      
      // Test authenticated endpoints
      console.log('\n4. Testing authenticated categories endpoint...');
      const authResponse = await makeRequest(`${API_BASE_URL}/categories`, {
        headers: {
          'Authorization': `Bearer ${response.data.token}`
        }
      });
      
      console.log('Authenticated categories status:', authResponse.status);
      
      if (authResponse.status === 200) {
        console.log('✅ Categories loaded successfully');
        console.log('Categories count:', authResponse.data.categories?.length || 0);
      } else {
        console.log('❌ Categories error:', authResponse.data);
      }
    } else {
      console.log('❌ Authentication failed:', response.data);
    }
  } catch (error) {
    console.log('❌ Authentication error:', error.message);
  }
}

testAPI().catch(console.error); 