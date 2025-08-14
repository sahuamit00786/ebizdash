const fetch = require('node-fetch');

// Simple debug script for bulk delete
async function debugBulkDelete() {
  try {
    console.log('🔍 Debugging Bulk Delete Category Issue...\n');
    
    const baseUrl = 'http://localhost:3001/api';
    
    // Step 1: Test authentication
    console.log('1️⃣ Testing authentication...');
    const authResponse = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      })
    });
    
    if (!authResponse.ok) {
      console.log('❌ Authentication failed:', authResponse.status);
      return;
    }
    
    const authData = await authResponse.json();
    const token = authData.token;
    console.log('✅ Authentication successful\n');
    
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
      const errorText = await categoriesResponse.text();
      console.log('Error details:', errorText);
      return;
    }
    
    const categoriesData = await categoriesResponse.json();
    const categories = categoriesData.flatCategories || [];
    
    console.log(`✅ Found ${categories.length} categories`);
    
    if (categories.length === 0) {
      console.log('❌ No categories found to delete');
      return;
    }
    
    // Step 3: Select categories to delete
    const categoriesToDelete = categories
      .filter(cat => cat.name !== 'Uncategorized')
      .slice(0, 2);
    
    if (categoriesToDelete.length === 0) {
      console.log('❌ No categories available for deletion (all are Uncategorized)');
      return;
    }
    
    const categoryIds = categoriesToDelete.map(cat => cat.id);
    console.log(`3️⃣ Selected categories to delete:`);
    categoriesToDelete.forEach(cat => {
      console.log(`   - ${cat.name} (ID: ${cat.id}, Type: ${cat.type})`);
    });
    
    // Step 4: Test bulk delete
    console.log('\n4️⃣ Testing bulk delete...');
    console.log('Request payload:', JSON.stringify({ categoryIds }, null, 2));
    
    const deleteResponse = await fetch(`${baseUrl}/categories/bulk-delete`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        categoryIds: categoryIds
      })
    });
    
    console.log('Response status:', deleteResponse.status);
    console.log('Response headers:', Object.fromEntries(deleteResponse.headers.entries()));
    
    if (deleteResponse.ok) {
      const result = await deleteResponse.json();
      console.log('✅ Bulk delete successful!');
      console.log('Response:', JSON.stringify(result, null, 2));
    } else {
      console.log('❌ Bulk delete failed');
      const errorText = await deleteResponse.text();
      console.log('Error response:', errorText);
      
      try {
        const errorJson = JSON.parse(errorText);
        console.log('Error details:', JSON.stringify(errorJson, null, 2));
      } catch (e) {
        console.log('Raw error text:', errorText);
      }
    }
    
  } catch (error) {
    console.error('❌ Error during debug:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the debug
debugBulkDelete().catch(console.error);
