const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: '45.77.196.170',
  user: 'ebizdash_products_react',
  password: 'products_react',
  database: 'ebizdash_products_react',
  charset: 'utf8mb4'
};

async function testCategoryHierarchy() {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected to database successfully');
    
    // Test 1: Check if categories table exists and has the right structure
    console.log('\n=== Test 1: Database Structure ===');
    const [tables] = await connection.execute("SHOW TABLES LIKE 'categories'");
    if (tables.length > 0) {
      console.log('✓ Categories table exists');
      
      const [columns] = await connection.execute("DESCRIBE categories");
      console.log('Categories table columns:');
      columns.forEach(col => {
        console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'YES' ? '(NULL)' : '(NOT NULL)'}`);
      });
    } else {
      console.log('✗ Categories table does not exist');
      return;
    }
    
    // Test 2: Check current categories
    console.log('\n=== Test 2: Current Categories ===');
    const [categories] = await connection.execute(`
      SELECT id, name, parent_id, type, level, created_at 
      FROM categories 
      ORDER BY type, level, name
    `);
    
    if (categories.length === 0) {
      console.log('No categories found in database');
    } else {
      console.log(`Found ${categories.length} categories:`);
      
      // Group by type
      const storeCategories = categories.filter(c => c.type === 'store');
      const vendorCategories = categories.filter(c => c.type === 'vendor');
      
      console.log(`\nStore Categories (${storeCategories.length}):`);
      storeCategories.forEach(cat => {
        const indent = '  '.repeat(cat.level);
        console.log(`${indent}${cat.name} (ID: ${cat.id}, Level: ${cat.level}, Parent: ${cat.parent_id || 'root'})`);
      });
      
      console.log(`\nVendor Categories (${vendorCategories.length}):`);
      vendorCategories.forEach(cat => {
        const indent = '  '.repeat(cat.level);
        console.log(`${indent}${cat.name} (ID: ${cat.id}, Level: ${cat.level}, Parent: ${cat.parent_id || 'root'})`);
      });
    }
    
    // Test 3: Check for hierarchical relationships
    console.log('\n=== Test 3: Hierarchical Relationships ===');
    const [hierarchy] = await connection.execute(`
      SELECT 
        c1.id as parent_id,
        c1.name as parent_name,
        c1.type as parent_type,
        c1.level as parent_level,
        c2.id as child_id,
        c2.name as child_name,
        c2.level as child_level
      FROM categories c1
      LEFT JOIN categories c2 ON c1.id = c2.parent_id
      WHERE c2.id IS NOT NULL
      ORDER BY c1.type, c1.level, c1.name, c2.level, c2.name
    `);
    
    if (hierarchy.length === 0) {
      console.log('No hierarchical relationships found');
    } else {
      console.log('Hierarchical relationships:');
      hierarchy.forEach(rel => {
        console.log(`  ${rel.parent_name} (${rel.parent_type}, L${rel.parent_level}) → ${rel.child_name} (L${rel.child_level})`);
      });
    }
    
    // Test 4: Check for potential issues
    console.log('\n=== Test 4: Potential Issues ===');
    
    // Check for categories with invalid parent_id
    const [orphanedCategories] = await connection.execute(`
      SELECT c.id, c.name, c.parent_id, c.type, c.level
      FROM categories c
      LEFT JOIN categories parent ON c.parent_id = parent.id
      WHERE c.parent_id IS NOT NULL AND parent.id IS NULL
    `);
    
    if (orphanedCategories.length > 0) {
      console.log('⚠️  Found categories with invalid parent_id:');
      orphanedCategories.forEach(cat => {
        console.log(`  - ${cat.name} (ID: ${cat.id}, Parent ID: ${cat.parent_id})`);
      });
    } else {
      console.log('✓ No orphaned categories found');
    }
    
    // Check for duplicate names at same level and parent
    const [duplicates] = await connection.execute(`
      SELECT name, parent_id, type, COUNT(*) as count
      FROM categories
      GROUP BY name, parent_id, type
      HAVING COUNT(*) > 1
    `);
    
    if (duplicates.length > 0) {
      console.log('⚠️  Found duplicate category names:');
      duplicates.forEach(dup => {
        console.log(`  - ${dup.name} (${dup.type}, Parent: ${dup.parent_id || 'root'}) - ${dup.count} instances`);
      });
    } else {
      console.log('✓ No duplicate category names found');
    }
    
  } catch (error) {
    console.error('Database error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\nDatabase connection closed');
    }
  }
}

// Run the test
testCategoryHierarchy().catch(console.error);
