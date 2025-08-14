// Test frontend bulk delete simulation
const testFrontendBulkDelete = () => {
  console.log('🧪 Testing Frontend Bulk Delete Simulation...\n');
  
  // Simulate the exact request the frontend makes
  const simulateFrontendRequest = async () => {
    try {
      const baseUrl = 'http://localhost:3001/api';
      
      // Step 1: Login to get token
      console.log('1️⃣ Logging in...');
      const loginResponse = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: 'admin',
          password: 'admin123'
        })
      });
      
      if (!loginResponse.ok) {
        throw new Error(`Login failed: ${loginResponse.status}`);
      }
      
      const { token } = await loginResponse.json();
      console.log('✅ Login successful\n');
      
      // Step 2: Get categories (like frontend does)
      console.log('2️⃣ Getting categories...');
      const categoriesResponse = await fetch(`${baseUrl}/categories`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!categoriesResponse.ok) {
        throw new Error(`Failed to get categories: ${categoriesResponse.status}`);
      }
      
      const categoriesData = await categoriesResponse.json();
      const categories = categoriesData.flatCategories || [];
      
      console.log(`✅ Found ${categories.length} categories`);
      
      // Step 3: Select some categories (like frontend does)
      const selectedCategories = new Set();
      const categoriesToSelect = categories
        .filter(cat => cat.name !== 'Uncategorized')
        .slice(0, 2);
      
      categoriesToSelect.forEach(cat => {
        selectedCategories.add(cat.id);
      });
      
      if (selectedCategories.size === 0) {
        console.log('❌ No categories to select');
        return;
      }
      
      const categoryIds = Array.from(selectedCategories).map(id => parseInt(id));
      console.log(`3️⃣ Selected categories: ${categoryIds.join(', ')}`);
      
      // Step 4: Simulate frontend bulk delete request
      console.log('4️⃣ Simulating frontend bulk delete request...');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      const response = await fetch(`${baseUrl}/categories/bulk-delete`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          categoryIds: categoryIds
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Bulk delete successful!');
        console.log('Response:', JSON.stringify(result, null, 2));
      } else {
        console.log('❌ Bulk delete failed');
        const errorText = await response.text();
        console.log('Error response:', errorText);
        
        try {
          const errorJson = JSON.parse(errorText);
          console.log('Error details:', JSON.stringify(errorJson, null, 2));
        } catch (e) {
          console.log('Raw error text:', errorText);
        }
      }
      
    } catch (error) {
      console.error('❌ Error:', error.message);
      if (error.name === 'AbortError') {
        console.log('Request timed out');
      }
    }
  };
  
  // Run the simulation
  simulateFrontendRequest();
};

// Export for use in browser console
if (typeof window !== 'undefined') {
  window.testFrontendBulkDelete = testFrontendBulkDelete;
} else {
  // Node.js environment
  const fetch = require('node-fetch');
  testFrontendBulkDelete();
}
