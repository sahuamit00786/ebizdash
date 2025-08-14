const http = require('http');

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, (res) => {
      let data = '';
      
      console.log(`Response status: ${res.statusCode}`);
      console.log(`Response headers:`, res.headers);
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`Raw response data:`, data.substring(0, 200) + '...');
        try {
          const jsonData = JSON.parse(data);
          resolve(jsonData);
        } catch (error) {
          console.error('JSON parse error:', error);
          reject(error);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('Request error:', error);
      reject(error);
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function testVendorFilter() {
  try {
    console.log('Testing vendor_id filtering...');
    
    // Test with vendor_id=2
    console.log('\n--- Testing with vendor_id=2 ---');
    const response = await makeRequest('http://localhost:5000/api/products/test?page=1&limit=5&vendor_id=2');
    
    console.log('Total products:', response.pagination?.total);
    console.log('Products returned:', response.products?.length);
    console.log('Debug info:', response.debug);
    
    if (response.products && response.products.length > 0) {
      console.log('\nFirst product vendor_id:', response.products[0].vendor_id);
      console.log('First product vendor_name:', response.products[0].vendor_name);
    }
    
    // Test without vendor_id filter
    console.log('\n--- Testing without vendor_id filter ---');
    const response2 = await makeRequest('http://localhost:5000/api/products/test?page=1&limit=5');
    
    console.log('Total products (no filter):', response2.pagination?.total);
    console.log('Products returned (no filter):', response2.products?.length);
    console.log('Debug info (no filter):', response2.debug);
    
    if (response2.products && response2.products.length > 0) {
      console.log('\nFirst product vendor_id (no filter):', response2.products[0].vendor_id);
      console.log('First product vendor_name (no filter):', response2.products[0].vendor_name);
    }
    
  } catch (error) {
    console.error('Error testing vendor filter:', error.message);
  }
}

testVendorFilter();
