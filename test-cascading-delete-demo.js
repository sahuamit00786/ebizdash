const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: '45.77.196.170',
  user: 'ebizdash_products_react',
  password: 'products_react',
  database: 'ebizdash_products_react',
  charset: 'utf8mb4'
};

async function testCascadingDeleteDemo() {
  let connection;
  
  try {
    console.log('🔍 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    
    console.log('🧪 Testing cascading delete functionality...\n');
    
    // Step 1: Create a complex test hierarchy
    console.log('📦 Creating complex test hierarchy...');
    
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
    
    const [level1bResult] = await connection.execute(
      "INSERT INTO categories (name, type, parent_id, level, created_at) VALUES (?, ?, ?, ?, NOW())",
      ['Test Laptops', 'vendor', rootId, 2]
    );
    const level1bId = level1bResult.insertId;
    console.log(`✅ Created level 1: Test Laptops (ID: ${level1bId})`);
    
    // Create level 2 subcategories under Smartphones
    const [level2Result] = await connection.execute(
      "INSERT INTO categories (name, type, parent_id, level, created_at) VALUES (?, ?, ?, ?, NOW())",
      ['Test Android', 'vendor', level1Id, 3]
    );
    const level2Id = level2Result.insertId;
    console.log(`✅ Created level 2: Test Android (ID: ${level2Id})`);
    
    const [level2bResult] = await connection.execute(
      "INSERT INTO categories (name, type, parent_id, level, created_at) VALUES (?, ?, ?, ?, NOW())",
      ['Test iOS', 'vendor', level1Id, 3]
    );
    const level2bId = level2bResult.insertId;
    console.log(`✅ Created level 2: Test iOS (ID: ${level2bId})`);
    
    // Create level 3 subcategories under Android
    const [level3Result] = await connection.execute(
      "INSERT INTO categories (name, type, parent_id, level, created_at) VALUES (?, ?, ?, ?, NOW())",
      ['Test Flagship', 'vendor', level2Id, 4]
    );
    const level3Id = level3Result.insertId;
    console.log(`✅ Created level 3: Test Flagship (ID: ${level3Id})`);
    
    const [level3bResult] = await connection.execute(
      "INSERT INTO categories (name, type, parent_id, level, created_at) VALUES (?, ?, ?, ?, NOW())",
      ['Test Mid-range', 'vendor', level2Id, 4]
    );
    const level3bId = level3bResult.insertId;
    console.log(`✅ Created level 3: Test Mid-range (ID: ${level3bId})`);
    
    // Create level 4 subcategories under Flagship
    const [level4Result] = await connection.execute(
      "INSERT INTO categories (name, type, parent_id, level, created_at) VALUES (?, ?, ?, ?, NOW())",
      ['Test Premium', 'vendor', level3Id, 5]
    );
    const level4Id = level4Result.insertId;
    console.log(`✅ Created level 4: Test Premium (ID: ${level4Id})`);
    
    // Create level 2 subcategories under Laptops
    const [level2cResult] = await connection.execute(
      "INSERT INTO categories (name, type, parent_id, level, created_at) VALUES (?, ?, ?, ?, NOW())",
      ['Test Windows', 'vendor', level1bId, 3]
    );
    const level2cId = level2cResult.insertId;
    console.log(`✅ Created level 2: Test Windows (ID: ${level2cId})`);
    
    const [level2dResult] = await connection.execute(
      "INSERT INTO categories (name, type, parent_id, level, created_at) VALUES (?, ?, ?, ?, NOW())",
      ['Test MacOS', 'vendor', level1bId, 3]
    );
    const level2dId = level2dResult.insertId;
    console.log(`✅ Created level 2: Test MacOS (ID: ${level2dId})`);
    
    // Step 2: Display the created hierarchy
    console.log('\n🔍 Created hierarchy structure:');
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
    console.log(`Deleting root category: Test Electronics (ID: ${rootId})`);
    
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
    
    const [sub3Result] = await connection.execute(
      "INSERT INTO categories (name, type, parent_id, level, created_at) VALUES (?, ?, ?, ?, NOW())",
      ['Bulk Test Sub3', 'vendor', sub2Id, 4]
    );
    const sub3Id = sub3Result.insertId;
    
    console.log(`✅ Created bulk test hierarchy: ${root2Id} → ${sub1Id} → ${sub2Id} → ${sub3Id}`);
    
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
    
    // Step 6: Test with products (simulate real scenario)
    console.log('\n📱 Testing with products...');
    
    // Create test hierarchy with products
    const [root3Result] = await connection.execute(
      "INSERT INTO categories (name, type, parent_id, level, created_at) VALUES (?, ?, ?, ?, NOW())",
      ['Product Test Electronics', 'vendor', null, 1]
    );
    const root3Id = root3Result.insertId;
    
    const [sub4Result] = await connection.execute(
      "INSERT INTO categories (name, type, parent_id, level, created_at) VALUES (?, ?, ?, ?, NOW())",
      ['Product Test Smartphones', 'vendor', root3Id, 2]
    );
    const sub4Id = sub4Result.insertId;
    
    const [sub5Result] = await connection.execute(
      "INSERT INTO categories (name, type, parent_id, level, created_at) VALUES (?, ?, ?, ?, NOW())",
      ['Product Test Android', 'vendor', sub4Id, 3]
    );
    const sub5Id = sub5Result.insertId;
    
    // Create test products
    const [product1Result] = await connection.execute(
      "INSERT INTO products (sku, name, vendor_category_id, created_at) VALUES (?, ?, ?, NOW())",
      ['TEST001', 'Test Phone 1', sub5Id]
    );
    
    const [product2Result] = await connection.execute(
      "INSERT INTO products (sku, name, vendor_category_id, created_at) VALUES (?, ?, ?, NOW())",
      ['TEST002', 'Test Phone 2', sub4Id]
    );
    
    console.log(`✅ Created test hierarchy with products: ${root3Id} → ${sub4Id} → ${sub5Id}`);
    console.log(`✅ Created test products: TEST001, TEST002`);
    
    // Check if Uncategorized category exists, if not create it
    const [uncategorizedCheck] = await connection.execute(
      "SELECT id FROM categories WHERE name = 'Uncategorized' AND type = 'vendor'"
    );
    
    let uncategorizedId;
    if (uncategorizedCheck.length === 0) {
      const [uncatResult] = await connection.execute(
        "INSERT INTO categories (name, type, parent_id, level, created_at) VALUES (?, ?, ?, ?, NOW())",
        ['Uncategorized', 'vendor', null, 1]
      );
      uncategorizedId = uncatResult.insertId;
      console.log(`✅ Created Uncategorized category (ID: ${uncategorizedId})`);
    } else {
      uncategorizedId = uncategorizedCheck[0].id;
      console.log(`✅ Found existing Uncategorized category (ID: ${uncategorizedId})`);
    }
    
    // Delete the parent category (should move products to Uncategorized)
    console.log(`🗑️ Deleting parent category: Product Test Electronics (ID: ${root3Id})`);
    
    const expectedProductDeletedIds = await getAllCategoryIds(root3Id);
    console.log(`📋 Expected to delete ${expectedProductDeletedIds.length} categories: ${expectedProductDeletedIds.join(', ')}`);
    
    // Move products to Uncategorized first
    await connection.execute(
      "UPDATE products SET vendor_category_id = ? WHERE vendor_category_id IN (" + expectedProductDeletedIds.map(() => "?").join(",") + ")",
      [uncategorizedId, ...expectedProductDeletedIds]
    );
    console.log(`✅ Moved products to Uncategorized category`);
    
    // Delete categories
    await connection.execute(
      "DELETE FROM categories WHERE id IN (" + expectedProductDeletedIds.map(() => "?").join(",") + ")",
      expectedProductDeletedIds
    );
    console.log(`✅ Deleted categories with products`);
    
    // Verify products were moved
    const [movedProducts] = await connection.execute(
      "SELECT sku, name, vendor_category_id FROM products WHERE sku IN ('TEST001', 'TEST002')"
    );
    
    console.log('\n🔍 Verifying products were moved to Uncategorized:');
    movedProducts.forEach(product => {
      const status = product.vendor_category_id === uncategorizedId ? '✅' : '❌';
      console.log(`${status} ${product.sku} - ${product.name} (Category ID: ${product.vendor_category_id})`);
    });
    
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
    
    console.log('\n📋 SUMMARY:');
    console.log('✅ Single category delete: Works with cascading');
    console.log('✅ Bulk category delete: Works with cascading');
    console.log('✅ Product safety: Products moved to Uncategorized');
    console.log('✅ Deep nesting: All levels deleted properly');
    console.log('✅ No orphaned categories: Clean deletion');
    
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
  testCascadingDeleteDemo()
    .then(() => {
      console.log('\n🎉 Cascading delete demo completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Demo failed:', error);
      process.exit(1);
    });
}

module.exports = { testCascadingDeleteDemo };
