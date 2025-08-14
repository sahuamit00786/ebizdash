const fetch = require('node-fetch');

// Test hierarchical category deletion
async function testHierarchicalDelete() {
  try {
    console.log('🧪 Testing Hierarchical Category Deletion...\n');
    
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
    
    // Step 3: Find categories with subcategories
    console.log('3️⃣ Looking for categories with subcategories...');
    const categoriesWithSubs = categories.filter(cat => cat.parent_id === null && cat.name !== 'Uncategorized');
    
    if (categoriesWithSubs.length === 0) {
      console.log('❌ No parent categories found for testing');
      return;
    }
    
    // Find a category that has subcategories
    let testCategory = null;
    for (const cat of categoriesWithSubs) {
      const hasSubs = categories.some(sub => sub.parent_id === cat.id);
      if (hasSubs) {
        testCategory = cat;
        break;
      }
    }
    
    if (!testCategory) {
      console.log('❌ No categories with subcategories found');
      return;
    }
    
    // Get all subcategories of the test category
    const subcategories = categories.filter(cat => cat.parent_id === testCategory.id);
    const allRelatedCategories = [testCategory, ...subcategories];
    
    console.log(`✅ Found test category: ${testCategory.name} (ID: ${testCategory.id})`);
    console.log(`   Subcategories: ${subcategories.length}`);
    subcategories.forEach(sub => {
      console.log(`     - ${sub.name} (ID: ${sub.id})`);
    });
    
    // Step 4: Test hierarchical delete
    console.log('\n4️⃣ Testing hierarchical delete...');
    console.log(`   Deleting parent category and ${subcategories.length} subcategories`);
    
    const deleteResponse = await fetch(`${baseUrl}/categories/bulk-delete`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        categoryIds: [testCategory.id] // Only send parent ID
      })
    });
    
    console.log('Delete response status:', deleteResponse.status);
    
    if (deleteResponse.ok) {
      const result = await deleteResponse.json();
      console.log('✅ Hierarchical delete successful!');
      console.log('Response:', JSON.stringify(result, null, 2));
      
      // Step 5: Verify deletion
      console.log('\n5️⃣ Verifying deletion...');
      const verifyResponse = await fetch(`${baseUrl}/categories`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (verifyResponse.ok) {
        const verifyData = await verifyResponse.json();
        const remainingCategories = verifyData.flatCategories || [];
        
        // Check if all related categories are deleted
        const stillExist = allRelatedCategories.filter(cat => 
          remainingCategories.some(remaining => remaining.id === cat.id)
        );
        
        if (stillExist.length === 0) {
          console.log('✅ All categories and subcategories successfully deleted!');
        } else {
          console.log('❌ Some categories still exist:', stillExist.map(cat => cat.name));
        }
      }
      
    } else {
      const errorText = await deleteResponse.text();
      console.log('❌ Hierarchical delete failed:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the test
testHierarchicalDelete().catch(console.error);
