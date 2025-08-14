const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: '45.77.196.170',
  user: 'ebizdash_products_react',
  password: 'products_react',
  database: 'ebizdash_products_react',
  charset: 'utf8mb4'
};

async function cleanupDuplicateCategories() {
  let connection;
  
  try {
    console.log('🔍 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    
    console.log('🧹 Starting duplicate category cleanup...');
    
    // Step 1: Find categories with duplicate names under the same parent
    console.log('📋 Finding duplicate categories...');
    const [duplicates] = await connection.execute(`
      SELECT 
        c1.id as duplicate_id,
        c1.name,
        c1.parent_id,
        c1.type,
        c1.level,
        c1.created_at,
        c2.id as original_id,
        c2.created_at as original_created_at
      FROM categories c1
      INNER JOIN categories c2 ON 
        c1.name = c2.name AND 
        c1.parent_id = c2.parent_id AND 
        c1.type = c2.type AND
        c1.id > c2.id
      ORDER BY c1.parent_id, c1.name, c1.created_at
    `);
    
    if (duplicates.length === 0) {
      console.log('✅ No duplicate categories found!');
      return;
    }
    
    console.log(`🔍 Found ${duplicates.length} duplicate categories to clean up`);
    
    // Step 2: Show what will be deleted
    console.log('\n📋 Duplicates to be removed:');
    duplicates.forEach((dup, index) => {
      console.log(`${index + 1}. ${dup.name} (ID: ${dup.duplicate_id}) - Parent: ${dup.parent_id || 'ROOT'} - Type: ${dup.type} - Level: ${dup.level}`);
    });
    
    // Step 3: Update products that reference duplicate categories
    console.log('\n🔄 Updating products to reference original categories...');
    let updatedProducts = 0;
    
    for (const dup of duplicates) {
      const [productsToUpdate] = await connection.execute(`
        SELECT id, sku, name FROM products 
        WHERE vendor_category_id = ? OR store_category_id = ?
      `, [dup.duplicate_id, dup.duplicate_id]);
      
      if (productsToUpdate.length > 0) {
        console.log(`📦 Updating ${productsToUpdate.length} products from category ${dup.duplicate_id} to ${dup.original_id}`);
        
        await connection.execute(`
          UPDATE products 
          SET vendor_category_id = CASE 
            WHEN vendor_category_id = ? THEN ? 
            ELSE vendor_category_id 
          END,
          store_category_id = CASE 
            WHEN store_category_id = ? THEN ? 
            ELSE store_category_id 
          END
          WHERE vendor_category_id = ? OR store_category_id = ?
        `, [dup.duplicate_id, dup.original_id, dup.duplicate_id, dup.original_id, dup.duplicate_id, dup.duplicate_id]);
        
        updatedProducts += productsToUpdate.length;
      }
    }
    
    // Step 4: Update subcategories to point to original parent
    console.log('\n🔄 Updating subcategories to point to original parents...');
    let updatedSubcategories = 0;
    
    for (const dup of duplicates) {
      const [subcategoriesToUpdate] = await connection.execute(`
        SELECT id, name FROM categories WHERE parent_id = ?
      `, [dup.duplicate_id]);
      
      if (subcategoriesToUpdate.length > 0) {
        console.log(`📁 Updating ${subcategoriesToUpdate.length} subcategories from parent ${dup.duplicate_id} to ${dup.original_id}`);
        
        await connection.execute(`
          UPDATE categories SET parent_id = ? WHERE parent_id = ?
        `, [dup.original_id, dup.duplicate_id]);
        
        updatedSubcategories += subcategoriesToUpdate.length;
      }
    }
    
    // Step 5: Delete duplicate categories
    console.log('\n🗑️ Deleting duplicate categories...');
    const duplicateIds = duplicates.map(d => d.duplicate_id);
    const placeholders = duplicateIds.map(() => '?').join(',');
    
    const [deleteResult] = await connection.execute(`
      DELETE FROM categories WHERE id IN (${placeholders})
    `, duplicateIds);
    
    console.log(`✅ Deleted ${deleteResult.affectedRows} duplicate categories`);
    
    // Step 6: Summary
    console.log('\n📊 Cleanup Summary:');
    console.log(`- Duplicate categories found: ${duplicates.length}`);
    console.log(`- Products updated: ${updatedProducts}`);
    console.log(`- Subcategories updated: ${updatedSubcategories}`);
    console.log(`- Duplicate categories deleted: ${deleteResult.affectedRows}`);
    
    // Step 7: Verify cleanup
    console.log('\n🔍 Verifying cleanup...');
    const [remainingDuplicates] = await connection.execute(`
      SELECT COUNT(*) as count
      FROM categories c1
      INNER JOIN categories c2 ON 
        c1.name = c2.name AND 
        c1.parent_id = c2.parent_id AND 
        c1.type = c2.type AND
        c1.id > c2.id
    `);
    
    if (remainingDuplicates[0].count === 0) {
      console.log('✅ Cleanup successful! No duplicate categories remain.');
    } else {
      console.log(`⚠️ Warning: ${remainingDuplicates[0].count} duplicate categories still exist.`);
    }
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the cleanup
if (require.main === module) {
  cleanupDuplicateCategories()
    .then(() => {
      console.log('\n🎉 Cleanup completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Cleanup failed:', error);
      process.exit(1);
    });
}

module.exports = { cleanupDuplicateCategories };
