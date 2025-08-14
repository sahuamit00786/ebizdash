const API_BASE_URL = 'http://localhost:5000/api';

async function testBasicAPI() {
  console.log('Testing basic API connectivity...\n');

  try {
    // Test 1: Check if server is responding
    console.log('📝 Test 1: Checking server connectivity');
    const healthCheck = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' })
    });

    if (!healthCheck.ok) {
      const errorText = await healthCheck.text();
      console.log('Response status:', healthCheck.status);
      console.log('Response text:', errorText);
      throw new Error(`Server responded with status ${healthCheck.status}`);
    }

    const loginData = await healthCheck.json();
    console.log('✅ Server is responding and login works');
    console.log('Token received:', loginData.token ? 'Yes' : 'No');

    // Test 2: Try to fetch categories
    console.log('\n📝 Test 2: Testing categories endpoint');
    const categoriesResponse = await fetch(`${API_BASE_URL}/categories`, {
      headers: { 'Authorization': `Bearer ${loginData.token}` }
    });

    if (!categoriesResponse.ok) {
      const errorText = await categoriesResponse.text();
      console.log('Categories response status:', categoriesResponse.status);
      console.log('Categories response text:', errorText);
      throw new Error(`Categories endpoint failed with status ${categoriesResponse.status}`);
    }

    const categoriesData = await categoriesResponse.json();
    console.log('✅ Categories endpoint works');
    console.log('Categories count:', categoriesData.categories ? categoriesData.categories.length : 0);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Full error:', error);
  }
}

testBasicAPI();
