const mysql = require('mysql2/promise');
const db = require('./server/config/database');

async function testBulkDelete() {
  try {
    console.log('=== Testing Bulk Delete Debug ===\n');
    
    // Check current categories
    console.log('1. Current categories in database:');
    const [categories] = await db.execute(`
      SELECT id, name, parent_id, type, level 
      FROM categories 
      ORDER BY id
      LIMIT 10
    `);
    
    categories.forEach(cat => {
      console.log(`  ID: ${cat.id}, Name: ${cat.name}, Parent: ${cat.parent_id || 'root'}, Type: ${cat.type}`);
    });
    
    // Test with some valid category IDs
    const testCategoryIds = categories.slice(0, 2).map(cat => cat.id);
    console.log('\n2. Testing bulk delete with category IDs:', testCategoryIds);
    
    // Simulate the bulk delete request
    const getAllCategoryIds = async (parentIds) => {
      const allIds = new Set(parentIds)
      
      for (const parentId of parentIds) {
        const [subcategories] = await db.execute(
          "SELECT id FROM categories WHERE parent_id = ?",
          [parentId]
        )
        
        if (subcategories.length > 0) {
          const subcategoryIds = subcategories.map(cat => cat.id)
          const nestedIds = await getAllCategoryIds(subcategoryIds)
          nestedIds.forEach(id => allIds.add(id))
        }
      }
      
      return Array.from(allIds)
    }

    const allCategoryIds = await getAllCategoryIds(testCategoryIds)
    console.log('3. All categories to be deleted:', allCategoryIds);
    
    // Check if categories exist
    const [existingCategories] = await db.execute(
      "SELECT id, name FROM categories WHERE id IN (" + testCategoryIds.map(() => "?").join(",") + ")",
      testCategoryIds
    )
    
    console.log('4. Found existing categories:', existingCategories.map(cat => `${cat.name} (ID: ${cat.id})`));
    
    if (existingCategories.length !== testCategoryIds.length) {
      const existingIds = existingCategories.map(cat => cat.id)
      const missingIds = testCategoryIds.filter(id => !existingIds.includes(id))
      console.log('5. Missing category IDs:', missingIds);
    }
    
    // Check if any are used by products
    const [products] = await db.execute(
      "SELECT id, name FROM products WHERE store_category_id IN (" + 
      allCategoryIds.map(() => "?").join(",") + 
      ") OR vendor_category_id IN (" + 
      allCategoryIds.map(() => "?").join(",") + ")",
      [...allCategoryIds, ...allCategoryIds]
    )
    
    console.log('6. Products using these categories:', products.map(p => p.name));
    
    console.log('\n=== Test Complete ===');
    
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    process.exit(0);
  }
}

testBulkDelete();
