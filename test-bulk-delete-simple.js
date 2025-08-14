const fetch = require('node-fetch');

// Test bulk delete functionality
async function testBulkDelete() {
  try {
    console.log('🧪 Testing Bulk Delete Category Functionality...\n');
    
    // First, get all categories
    const token = 'your-token-here'; // Replace with actual token
    const baseUrl = 'http://localhost:3001/api';
    
    console.log('1️⃣ Getting all categories...');
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
    
    console.log(`Found ${categories.length} categories`);
    
    // Find some categories to delete (skip Uncategorized)
    const categoriesToDelete = categories
      .filter(cat => cat.name !== 'Uncategorized')
      .slice(0, 2);
    
    if (categoriesToDelete.length < 2) {
      console.log('❌ Not enough categories to test bulk delete');
      return;
    }
    
    const categoryIds = categoriesToDelete.map(cat => cat.id);
    console.log(`2️⃣ Attempting to delete categories: ${categoryIds.join(', ')}`);
    console.log(`   Categories: ${categoriesToDelete.map(cat => cat.name).join(', ')}`);
    
    // Perform bulk delete
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
    
    if (deleteResponse.ok) {
      const result = await deleteResponse.json();
      console.log('✅ Bulk delete successful!');
      console.log(`   Message: ${result.message}`);
      console.log(`   Deleted count: ${result.deletedCount}`);
      console.log(`   Affected products: ${result.affectedProductsCount}`);
    } else {
      const error = await deleteResponse.json();
      console.log('❌ Bulk delete failed:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Error during test:', error.message);
  }
}

// Run the test
testBulkDelete().catch(console.error);
