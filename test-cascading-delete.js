const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: '45.77.196.170',
  user: 'ebizdash_products_react',
  password: 'products_react',
  database: 'ebizdash_products_react',
  charset: 'utf8mb4'
};

async function testCascadingDelete() {
  let connection;
  
  try {
    console.log('🔍 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    
    console.log('🧪 Testing cascading delete functionality...\n');
    
    // Step 1: Create test hierarchy
    console.log('📦 Creating test category hierarchy...');
    
    // Create root category
    const [rootResult] = await connection.execute(
      "INSERT INTO categories (name, type, parent_id, level, created_at) VALUES (?, ?, ?, ?, NOW())",
      ['Test Electronics', 'vendor', null, 1]
    );
    const rootId = rootResult.insertId;
    console.log(`✅ Created root category: Test Electronics (ID: ${rootId})`);
    
    // Create level 1 subcategories
    const [level1Result] = await connection.execute(
      "INSERT INTO categories (name, type, parent_id, level, created_at) VALUES (?, ?, ?, ?, NOW())",
      ['Test Smartphones', 'vendor', rootId, 2]
    );
    const level1Id = level1Result.insertId;
    console.log(`✅ Created level 1: Test Smartphones (ID: ${level1Id})`);
    
    // Create level 2 subcategories
    const [level2Result] = await connection.execute(
      "INSERT INTO categories (name, type, parent_id, level, created_at) VALUES (?, ?, ?, ?, NOW())",
      ['Test Android', 'vendor', level1Id, 3]
    );
    const level2Id = level2Result.insertId;
    console.log(`✅ Created level 2: Test Android (ID: ${level2Id})`);
    
    // Create level 3 subcategories
    const [level3Result] = await connection.execute(
      "INSERT INTO categories (name, type, parent_id, level, created_at) VALUES (?, ?, ?, ?, NOW())",
      ['Test Flagship', 'vendor', level2Id, 4]
    );
    const level3Id = level3Result.insertId;
    console.log(`✅ Created level 3: Test Flagship (ID: ${level3Id})`);
    
    // Create level 4 subcategories
    const [level4Result] = await connection.execute(
      "INSERT INTO categories (name, type, parent_id, level, created_at) VALUES (?, ?, ?, ?, NOW())",
      ['Test Premium', 'vendor', level3Id, 5]
    );
    const level4Id = level4Result.insertId;
    console.log(`✅ Created level 4: Test Premium (ID: ${level4Id})`);
    
    // Step 2: Verify hierarchy was created
    console.log('\n🔍 Verifying created hierarchy...');
    const [categories] = await connection.execute(`
      SELECT id, name, parent_id, level 
      FROM categories 
      WHERE name LIKE 'Test%' 
      ORDER BY level, name
    `);
    
    console.log(`📊 Found ${categories.length} test categories:`);
    categories.forEach(cat => {
      const indent = '  '.repeat(cat.level - 1);
      console.log(`${indent}${cat.name} [ID: ${cat.id}, Level: ${cat.level}, Parent: ${cat.parent_id || 'ROOT'}]`);
    });
    
    // Step 3: Test single category delete (should cascade)
    console.log('\n🗑️ Testing single category delete (cascading)...');
    
    // Get all category IDs that should be deleted
    const getAllCategoryIds = async (parentId) => {
      const allIds = new Set([parentId])
      
      const [subcategories] = await connection.execute(
        "SELECT id FROM categories WHERE parent_id = ?",
        [parentId]
      )
      
      for (const subcategory of subcategories) {
        const nestedIds = await getAllCategoryIds(subcategory.id)
        nestedIds.forEach(id => allIds.add(id))
      }
      
      return Array.from(allIds)
    }

    const expectedDeletedIds = await getAllCategoryIds(rootId);
    console.log(`📋 Expected to delete ${expectedDeletedIds.length} categories: ${expectedDeletedIds.join(', ')}`);
    
    // Delete the root category
    await connection.execute(
      "DELETE FROM categories WHERE id IN (" + expectedDeletedIds.map(() => "?").join(",") + ")",
      expectedDeletedIds
    );
    console.log(`✅ Deleted root category and all subcategories`);
    
    // Step 4: Verify all categories were deleted
    console.log('\n🔍 Verifying all categories were deleted...');
    const [remainingCategories] = await connection.execute(`
      SELECT id, name, parent_id, level 
      FROM categories 
      WHERE name LIKE 'Test%'
    `);
    
    if (remainingCategories.length === 0) {
      console.log('✅ SUCCESS: All test categories were deleted (cascading delete works!)');
    } else {
      console.log(`❌ FAILED: ${remainingCategories.length} categories still exist:`);
      remainingCategories.forEach(cat => {
        console.log(`   - ${cat.name} [ID: ${cat.id}, Level: ${cat.level}]`);
      });
    }
    
    // Step 5: Test bulk delete with cascading
    console.log('\n📦 Testing bulk delete with cascading...');
    
    // Create another test hierarchy
    const [root2Result] = await connection.execute(
      "INSERT INTO categories (name, type, parent_id, level, created_at) VALUES (?, ?, ?, ?, NOW())",
      ['Bulk Test Electronics', 'vendor', null, 1]
    );
    const root2Id = root2Result.insertId;
    
    const [sub1Result] = await connection.execute(
      "INSERT INTO categories (name, type, parent_id, level, created_at) VALUES (?, ?, ?, ?, NOW())",
      ['Bulk Test Sub1', 'vendor', root2Id, 2]
    );
    const sub1Id = sub1Result.insertId;
    
    const [sub2Result] = await connection.execute(
      "INSERT INTO categories (name, type, parent_id, level, created_at) VALUES (?, ?, ?, ?, NOW())",
      ['Bulk Test Sub2', 'vendor', sub1Id, 3]
    );
    const sub2Id = sub2Result.insertId;
    
    console.log(`✅ Created bulk test hierarchy: ${root2Id} → ${sub1Id} → ${sub2Id}`);
    
    // Test bulk delete
    const expectedBulkDeletedIds = await getAllCategoryIds(root2Id);
    console.log(`📋 Expected to delete ${expectedBulkDeletedIds.length} categories in bulk: ${expectedBulkDeletedIds.join(', ')}`);
    
    await connection.execute(
      "DELETE FROM categories WHERE id IN (" + expectedBulkDeletedIds.map(() => "?").join(",") + ")",
      expectedBulkDeletedIds
    );
    console.log(`✅ Bulk deleted categories`);
    
    // Verify bulk delete
    const [remainingBulkCategories] = await connection.execute(`
      SELECT id, name FROM categories WHERE name LIKE 'Bulk Test%'
    `);
    
    if (remainingBulkCategories.length === 0) {
      console.log('✅ SUCCESS: Bulk delete cascading works!');
    } else {
      console.log(`❌ FAILED: ${remainingBulkCategories.length} bulk test categories still exist`);
    }
    
    // Final verification
    console.log('\n🔍 Final verification...');
    const [allTestCategories] = await connection.execute(`
      SELECT COUNT(*) as count FROM categories WHERE name LIKE '%Test%'
    `);
    
    if (allTestCategories[0].count === 0) {
      console.log('🎉 PERFECT! All test categories were successfully deleted with cascading delete!');
    } else {
      console.log(`⚠️ Warning: ${allTestCategories[0].count} test categories still exist`);
    }
    
  } catch (error) {
    console.error('❌ Error during test:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the test
if (require.main === module) {
  testCascadingDelete()
    .then(() => {
      console.log('\n🎉 Cascading delete test completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Test failed:', error);
      process.exit(1);
    });
}

module.exports = { testCascadingDelete };
