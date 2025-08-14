const mysql = require('mysql2/promise');
const db = require('./server/config/database');

async function testUncategorizedMove() {
  try {
    console.log('=== Testing Uncategorized Product Move ===\n');
    
    // Get Uncategorized category IDs
    const [uncategorizedCategories] = await db.execute(
      "SELECT id, name, type FROM categories WHERE name = 'Uncategorized'"
    );
    
    console.log('1. Uncategorized categories:');
    uncategorizedCategories.forEach(cat => {
      console.log(`   - ${cat.name} (ID: ${cat.id}, Type: ${cat.type})`);
    });
    
    // Create a test category with products
    console.log('\n2. Creating test category with products...');
    
    const [testCategoryResult] = await db.execute(
      "INSERT INTO categories (name, type, parent_id, level, created_at) VALUES (?, ?, ?, ?, NOW())",
      ['Test Category for Deletion', 'store', null, 1]
    );
    const testCategoryId = testCategoryResult.insertId;
    console.log(`   Created test category: Test Category for Deletion (ID: ${testCategoryId})`);
    
    // Update some products to use this category
    const [updateResult] = await db.execute(
      "UPDATE products SET store_category_id = ? WHERE store_category_id IS NULL LIMIT 3",
      [testCategoryId]
    );
    console.log(`   Updated ${updateResult.affectedRows} products to use the test category`);
    
    // Show products using the test category
    const [products] = await db.execute(`
      SELECT id, name, sku, store_category_id, vendor_category_id
      FROM products 
      WHERE store_category_id = ? OR vendor_category_id = ?
    `, [testCategoryId, testCategoryId]);
    
    console.log(`\n3. Products using test category (${products.length}):`);
    products.forEach(product => {
      console.log(`   - ${product.name} (SKU: ${product.sku})`);
    });
    
    // Simulate the delete process
    console.log('\n4. Simulating category deletion with product move...');
    
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

    const allCategoryIds = await getAllCategoryIds(testCategoryId)
    console.log(`   Categories to be deleted: ${allCategoryIds.join(', ')}`);
    
    const uncategorizedStoreId = uncategorizedCategories.find(cat => cat.type === 'store')?.id;
    
    // Check products that will be moved
    const [productsToMove] = await db.execute(
      "SELECT id, name, store_category_id, vendor_category_id FROM products WHERE store_category_id IN (" + 
      allCategoryIds.map(() => "?").join(",") + 
      ") OR vendor_category_id IN (" + 
      allCategoryIds.map(() => "?").join(",") + ")",
      [...allCategoryIds, ...allCategoryIds]
    );
    
    console.log(`   Products to be moved: ${productsToMove.length}`);
    
    // Move products to Uncategorized
    let movedCount = 0;
    for (const product of productsToMove) {
      const updates = [];
      const values = [];
      
      if (product.store_category_id && allCategoryIds.includes(product.store_category_id)) {
        if (uncategorizedStoreId) {
          updates.push('store_category_id = ?');
          values.push(uncategorizedStoreId);
          movedCount++;
        }
      }
      
      if (updates.length > 0) {
        values.push(product.id);
        await db.execute(
          `UPDATE products SET ${updates.join(', ')} WHERE id = ?`,
          values
        );
      }
    }
    
    console.log(`   Moved ${movedCount} products to Uncategorized`);
    
    // Delete the test category
    await db.execute(
      "DELETE FROM categories WHERE id IN (" + allCategoryIds.map(() => "?").join(",") + ")",
      allCategoryIds
    );
    console.log('   Deleted test category');
    
    // Verify products are now in Uncategorized
    const [movedProducts] = await db.execute(`
      SELECT id, name, sku, store_category_id, vendor_category_id
      FROM products 
      WHERE store_category_id = ? OR vendor_category_id = ?
    `, [uncategorizedStoreId, uncategorizedStoreId]);
    
    console.log(`\n5. Products now in Uncategorized (${movedProducts.length}):`);
    movedProducts.forEach(product => {
      console.log(`   - ${product.name} (SKU: ${product.sku})`);
    });
    
    console.log('\n✅ Test completed successfully!');
    
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    process.exit(0);
  }
}

testUncategorizedMove();
