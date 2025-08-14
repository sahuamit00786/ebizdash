// Simple test script to verify advanced filters
async function testFilters() {
  try {
    const fetch = (await import('node-fetch')).default;
    
    // Test 1: Contains filter
    console.log('Testing contains filter...');
    const filters1 = [
      { column: 'name', operator: 'contains', value: 'test' }
    ];
    
    const response1 = await fetch('http://localhost:5000/api/products?advanced_filters=' + encodeURIComponent(JSON.stringify(filters1)) + '&page=1&limit=5', {
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });
    
    if (response1.ok) {
      const data1 = await response1.json();
      console.log('Contains filter - Products found:', data1.products.length);
      if (data1.products.length > 0) {
        console.log('Sample product:', data1.products[0].name);
      }
    } else {
      console.log('Error:', response1.status, response1.statusText);
    }
    
    // Test 2: Is filter
    console.log('\nTesting is filter...');
    const filters2 = [
      { column: 'published', operator: 'is', value: 'true' }
    ];
    
    const response2 = await fetch('http://localhost:5000/api/products?advanced_filters=' + encodeURIComponent(JSON.stringify(filters2)) + '&page=1&limit=5', {
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });
    
    if (response2.ok) {
      const data2 = await response2.json();
      console.log('Is filter - Products found:', data2.products.length);
      if (data2.products.length > 0) {
        console.log('Sample product published status:', data2.products[0].published);
      }
    } else {
      console.log('Error:', response2.status, response2.statusText);
    }
    
    // Test 3: Greater than filter
    console.log('\nTesting greater than filter...');
    const filters3 = [
      { column: 'stock', operator: 'greater_than', value: '0' }
    ];
    
    const response3 = await fetch('http://localhost:5000/api/products?advanced_filters=' + encodeURIComponent(JSON.stringify(filters3)) + '&page=1&limit=5', {
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });
    
    if (response3.ok) {
      const data3 = await response3.json();
      console.log('Greater than filter - Products found:', data3.products.length);
      if (data3.products.length > 0) {
        console.log('Sample product stock:', data3.products[0].stock);
      }
    } else {
      console.log('Error:', response3.status, response3.statusText);
    }
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

testFilters();
