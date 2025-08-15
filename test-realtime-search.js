const fetch = require('node-fetch');

async function testRealtimeSearch() {
  try {
    console.log('Testing real-time search API...');
    
    // Test with a search query
    const response = await fetch('http://localhost:5000/api/products/search/realtime?q=test&limit=5', {
      headers: {
        'Authorization': 'Bearer test'
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Real-time search API is working!');
      console.log('Response:', JSON.stringify(data, null, 2));
    } else {
      console.log('❌ API returned error:', response.status, response.statusText);
      const errorText = await response.text();
      console.log('Error details:', errorText);
    }
  } catch (error) {
    console.log('❌ Error testing API:', error.message);
  }
}

testRealtimeSearch();
