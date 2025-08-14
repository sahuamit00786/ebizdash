const mysql = require('mysql2/promise');

// Database configuration (adjust as needed)
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'product_management'
};

async function testHierarchicalCategory() {
  let connection;
  
  try {
    console.log('🔍 Testing hierarchical category processing...');
    
    // Connect to database
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');
    
    // Test data
    const testHierarchy = "Electronics > Mobile Devices > Smartphones > Premium";
    console.log(`📋 Testing hierarchy: "${testHierarchy}"`);
    
    // Parse the hierarchy
    const categories = testHierarchy.split('>').map(cat => cat.trim()).filter(cat => cat !== '');
    console.log('📝 Parsed categories:', categories);
    
    // Simulate the hierarchy creation process
    let currentParentId = null;
    let finalCategoryId = null;
    
    for (let i = 0; i < categories.length; i++) {
      const categoryName = categories[i];
      const level = i + 1;
      
      console.log(`\n🔄 Processing level ${level}: "${categoryName}"`);
      console.log(`   Parent ID: ${currentParentId}`);
      
      // Check if category exists
      let query, params;
      if (currentParentId === null) {
        query = "SELECT id FROM categories WHERE name = ? AND parent_id IS NULL AND type = ?";
        params = [categoryName, 'store'];
      } else {
        query = "SELECT id FROM categories WHERE name = ? AND parent_id = ? AND type = ?";
        params = [categoryName, currentParentId, 'store'];
      }
      
      const [existingCategories] = await connection.execute(query, params);
      
      if (existingCategories.length > 0) {
        finalCategoryId = existingCategories[0].id;
        console.log(`   ✅ Category exists with ID: ${finalCategoryId}`);
      } else {
        console.log(`   ❌ Category doesn't exist, would create new one`);
        
        // Calculate level
        let newLevel = 1;
        if (currentParentId) {
          const [parentResult] = await connection.execute(
            "SELECT level FROM categories WHERE id = ?",
            [currentParentId]
          );
          if (parentResult.length > 0) {
            newLevel = parentResult[0].level + 1;
          }
        }
        
        console.log(`   📊 Would create with level: ${newLevel}`);
        
        // For testing, let's create it
        const [result] = await connection.execute(
          "INSERT INTO categories (name, type, parent_id, level, status) VALUES (?, ?, ?, ?, ?)",
          [categoryName, 'store', currentParentId, newLevel, 'active']
        );
        
        finalCategoryId = result.insertId;
        console.log(`   ✅ Created category with ID: ${finalCategoryId}`);
      }
      
      currentParentId = finalCategoryId;
    }
    
    console.log(`\n🎯 Final category ID: ${finalCategoryId}`);
    
    // Show the full hierarchy
    console.log('\n📊 Full hierarchy created:');
    const [hierarchyResult] = await connection.execute(`
      WITH RECURSIVE category_tree AS (
        SELECT id, name, parent_id, level, type, CAST(name AS CHAR(1000)) as path
        FROM categories 
        WHERE id = ?
        
        UNION ALL
        
        SELECT c.id, c.name, c.parent_id, c.level, c.type, 
               CONCAT(ct.path, ' > ', c.name) as path
        FROM categories c
        INNER JOIN category_tree ct ON c.parent_id = ct.id
      )
      SELECT * FROM category_tree ORDER BY level
    `, [finalCategoryId]);
    
    hierarchyResult.forEach(row => {
      console.log(`   Level ${row.level}: ${row.name} (ID: ${row.id})`);
    });
    
    console.log('\n✅ Hierarchical category test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during test:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the test
testHierarchicalCategory().catch(console.error);
