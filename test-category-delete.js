const mysql = require('mysql2/promise');
const db = require('./server/config/database');

async function testCategoryDelete() {
  try {
    console.log('=== Testing Category Cascading Delete ===\n');
    
    // Test 1: Create a test hierarchy
    console.log('1. Creating test category hierarchy...');
    
    // Create parent category
    const [parentResult] = await db.execute(
      "INSERT INTO categories (name, type, parent_id, level, created_at) VALUES (?, ?, ?, ?, NOW())",
      ['Test Parent', 'store', null, 1]
    );
    const parentId = parentResult.insertId;
    console.log(`  Created parent category: Test Parent (ID: ${parentId})`);
    
    // Create subcategory 1
    const [sub1Result] = await db.execute(
      "INSERT INTO categories (name, type, parent_id, level, created_at) VALUES (?, ?, ?, ?, NOW())",
      ['Test Sub 1', 'store', parentId, 2]
    );
    const sub1Id = sub1Result.insertId;
    console.log(`  Created subcategory: Test Sub 1 (ID: ${sub1Id})`);
    
    // Create subcategory 2
    const [sub2Result] = await db.execute(
      "INSERT INTO categories (name, type, parent_id, level, created_at) VALUES (?, ?, ?, ?, NOW())",
      ['Test Sub 2', 'store', parentId, 2]
    );
    const sub2Id = sub2Result.insertId;
    console.log(`  Created subcategory: Test Sub 2 (ID: ${sub2Id})`);
    
    // Create sub-subcategory
    const [subSubResult] = await db.execute(
      "INSERT INTO categories (name, type, parent_id, level, created_at) VALUES (?, ?, ?, ?, NOW())",
      ['Test Sub-Sub', 'store', sub1Id, 3]
    );
    const subSubId = subSubResult.insertId;
    console.log(`  Created sub-subcategory: Test Sub-Sub (ID: ${subSubId})`);
    
    console.log('\n2. Current hierarchy:');
    const [categories] = await db.execute(`
      SELECT id, name, parent_id, level 
      FROM categories 
      WHERE name LIKE 'Test%'
      ORDER BY level, name
    `);
    
    categories.forEach(cat => {
      const indent = '  '.repeat(cat.level);
      console.log(`${indent}${cat.name} (ID: ${cat.id}, Parent: ${cat.parent_id || 'root'})`);
    });
    
    console.log('\n3. Testing cascading delete...');
    
    // Simulate the delete request
    const getAllCategoryIds = async (parentId) => {
      const allIds = new Set([parentId])
      
      const [subcategories] = await db.execute(
        "SELECT id FROM categories WHERE parent_id = ?",
        [parentId]
      )
      
      for (const subcategory of subcategories) {
        const nestedIds = await getAllCategoryIds(subcategory.id)
        nestedIds.forEach(id => allIds.add(id))
      }
      
      return Array.from(allIds)
    }

    const allCategoryIds = await getAllCategoryIds(parentId)
    console.log(`  Categories to be deleted: ${allCategoryIds.join(', ')}`);
    
    // Check if any categories are used by products
    const [products] = await db.execute(
      "SELECT id, name FROM products WHERE store_category_id IN (" + 
      allCategoryIds.map(() => "?").join(",") + 
      ") OR vendor_category_id IN (" + 
      allCategoryIds.map(() => "?").join(",") + ")",
      [...allCategoryIds, ...allCategoryIds]
    )
    
    if (products.length > 0) {
      console.log(`  ⚠️  Cannot delete - categories used by products: ${products.map(p => p.name).join(', ')}`);
    } else {
      // Delete all categories (cascading delete)
      await db.execute(
        "DELETE FROM categories WHERE id IN (" + allCategoryIds.map(() => "?").join(",") + ")",
        allCategoryIds
      )
      console.log(`  ✅ Successfully deleted ${allCategoryIds.length} categories`);
    }
    
    console.log('\n4. Verifying deletion...');
    const [remainingCategories] = await db.execute(`
      SELECT id, name, parent_id, level 
      FROM categories 
      WHERE name LIKE 'Test%'
      ORDER BY level, name
    `);
    
    if (remainingCategories.length === 0) {
      console.log('  ✅ All test categories successfully deleted');
    } else {
      console.log('  ❌ Some test categories still exist:');
      remainingCategories.forEach(cat => {
        const indent = '  '.repeat(cat.level);
        console.log(`${indent}${cat.name} (ID: ${cat.id}, Parent: ${cat.parent_id || 'root'})`);
      });
    }
    
    console.log('\n=== Test Complete ===');
    
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    process.exit(0);
  }
}

testCategoryDelete();
