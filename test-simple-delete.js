const fetch = require('node-fetch');

// Simple test for basic delete functionality
async function testSimpleDelete() {
  try {
    console.log('🧪 Testing Simple Delete...\n');
    
    const baseUrl = 'http://localhost:3001/api';
    
    // Step 1: Login
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
      console.log('❌ Login failed:', loginResponse.status);
      return;
    }
    
    const { token } = await loginResponse.json();
    console.log('✅ Login successful\n');
    
    // Step 2: Get categories
    console.log('2️⃣ Getting categories...');
    const categoriesResponse = await fetch(`${baseUrl}/categories`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!categoriesResponse.ok) {
      console.log('❌ Failed to get categories:', categoriesResponse.status);
      return;
    }
    
    const categoriesData = await categoriesResponse.json();
    const categories = categoriesData.flatCategories || [];
    
    console.log(`✅ Found ${categories.length} categories`);
    
    // Step 3: Try to delete a single category first
    const singleCategory = categories.find(cat => cat.name !== 'Uncategorized');
    
    if (!singleCategory) {
      console.log('❌ No categories available for testing');
      return;
    }
    
    console.log(`3️⃣ Testing single category delete: ${singleCategory.name} (ID: ${singleCategory.id})`);
    
    const singleDeleteResponse = await fetch(`${baseUrl}/categories/${singleCategory.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Single delete response status:', singleDeleteResponse.status);
    
    if (singleDeleteResponse.ok) {
      const result = await singleDeleteResponse.json();
      console.log('✅ Single delete successful:', result);
    } else {
      const errorText = await singleDeleteResponse.text();
      console.log('❌ Single delete failed:', errorText);
    }
    
    // Step 4: Now test bulk delete with just one category
    console.log('\n4️⃣ Testing bulk delete with single category...');
    
    const bulkDeleteResponse = await fetch(`${baseUrl}/categories/bulk-delete`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        categoryIds: [singleCategory.id]
      })
    });
    
    console.log('Bulk delete response status:', bulkDeleteResponse.status);
    
    if (bulkDeleteResponse.ok) {
      const result = await bulkDeleteResponse.json();
      console.log('✅ Bulk delete successful:', result);
    } else {
      const errorText = await bulkDeleteResponse.text();
      console.log('❌ Bulk delete failed:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the test
testSimpleDelete().catch(console.error);
