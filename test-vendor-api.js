const fetch = require('node-fetch');

async function testVendorAPI() {
  try {
    console.log('=== Testing Vendor API ===\n');
    
    // First, let's get a token by logging in
    const loginResponse = await fetch('http://localhost:5000/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      })
    });

    if (!loginResponse.ok) {
      console.error('Login failed:', await loginResponse.text());
      return;
    }

    const loginData = await loginResponse.json();
    const token = loginData.token;

    console.log('Login successful, token received\n');

    // Now test the vendors endpoint
    const vendorsResponse = await fetch('http://localhost:5000/vendors', {
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });

    if (!vendorsResponse.ok) {
      console.error('Vendors API failed:', await vendorsResponse.text());
      return;
    }

    const vendorsData = await vendorsResponse.json();
    const vendors = vendorsData.vendors || [];

    console.log('Vendors API Response:');
    console.log('Total vendors returned:', vendors.length);
    
    vendors.forEach(vendor => {
      console.log(`${vendor.name}: ${vendor.product_count} products (${vendor.in_stock_count} in stock, ${vendor.out_of_stock_count} out of stock)`);
    });

    // Calculate totals
    const totalProducts = vendors.reduce((sum, v) => sum + (v.product_count || 0), 0);
    const totalInStock = vendors.reduce((sum, v) => sum + (v.in_stock_count || 0), 0);
    const totalOutOfStock = vendors.reduce((sum, v) => sum + (v.out_of_stock_count || 0), 0);

    console.log('\nCalculated Totals:');
    console.log(`Total Products: ${totalProducts}`);
    console.log(`Total In Stock: ${totalInStock}`);
    console.log(`Total Out of Stock: ${totalOutOfStock}`);

    // Check if any vendors have null or undefined product_count
    const vendorsWithNullCount = vendors.filter(v => v.product_count === null || v.product_count === undefined);
    if (vendorsWithNullCount.length > 0) {
      console.log('\nVendors with null/undefined product_count:');
      vendorsWithNullCount.forEach(v => console.log(`- ${v.name}: ${v.product_count}`));
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

testVendorAPI();
