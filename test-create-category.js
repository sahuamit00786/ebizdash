const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: '45.77.196.170',
  user: 'ebizdash_products_react',
  password: 'products_react',
  database: 'ebizdash_products_react',
  charset: 'utf8mb4'
};

// Helper function to create or get a category (copied from server/routes/products.js)
async function createOrGetCategory(connection, name, parentId, type) {
  // For root categories (parent_id = NULL), also check if a category with the same name exists at root level
  if (parentId === null) {
    const [existingRootCategory] = await connection.execute(
      "SELECT id FROM categories WHERE name = ? AND parent_id IS NULL AND type = ?",
      [name.trim(), type]
    )
    
    if (existingRootCategory.length > 0) {
      console.log(`Found existing root category: ${name} (${type}) with ID: ${existingRootCategory[0].id}`);
      return existingRootCategory[0].id
    }
  } else {
    // For subcategories, check with specific parent
    const [existingCategory] = await connection.execute(
      "SELECT id FROM categories WHERE name = ? AND parent_id = ? AND type = ?",
      [name.trim(), parentId, type]
    )

    if (existingCategory.length > 0) {
      console.log(`Found existing subcategory: ${name} (${type}) with ID: ${existingCategory[0].id} and parent: ${parentId}`);
      return existingCategory[0].id
    }
  }

  // Calculate level based on parent_id
  const level = parentId ? 1 : 0 // Level 0 for root categories, level 1+ for subcategories
  const [result] = await connection.execute(
    "INSERT INTO categories (name, parent_id, type, level, created_at) VALUES (?, ?, ?, ?, NOW())",
    [name.trim(), parentId, type, level]
  )
  console.log(`Created new category: ${name} (${type}) with ID: ${result.insertId}, parent: ${parentId}, level: ${level}`);
  return result.insertId
}

async function testCreateCategory() {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected to database successfully');
    
    console.log('\n=== Testing createOrGetCategory Function ===');
    
    // Test 1: Create "Electronics" store category
    console.log('\n--- Test 1: Creating "Electronics" store category ---');
    const electronics1 = await createOrGetCategory(connection, 'Electronics', null, 'store');
    console.log(`Result: ${electronics1}`);
    
    // Test 2: Try to create "Electronics" store category again
    console.log('\n--- Test 2: Trying to create "Electronics" store category again ---');
    const electronics2 = await createOrGetCategory(connection, 'Electronics', null, 'store');
    console.log(`Result: ${electronics2}`);
    
    // Test 3: Create "Electronics" vendor category (should be different)
    console.log('\n--- Test 3: Creating "Electronics" vendor category ---');
    const electronicsVendor = await createOrGetCategory(connection, 'Electronics', null, 'vendor');
    console.log(`Result: ${electronicsVendor}`);
    
    // Test 4: Create "Computers" under Electronics
    console.log('\n--- Test 4: Creating "Computers" under Electronics store ---');
    const computers1 = await createOrGetCategory(connection, 'Computers', electronics1, 'store');
    console.log(`Result: ${computers1}`);
    
    // Test 5: Try to create "Computers" under Electronics again
    console.log('\n--- Test 5: Trying to create "Computers" under Electronics store again ---');
    const computers2 = await createOrGetCategory(connection, 'Computers', electronics1, 'store');
    console.log(`Result: ${computers2}`);
    
    // Test 6: Create "Computers" under different parent (should be different)
    console.log('\n--- Test 6: Creating "Computers" under Electronics vendor ---');
    const computersVendor = await createOrGetCategory(connection, 'Computers', electronicsVendor, 'vendor');
    console.log(`Result: ${computersVendor}`);
    
    // Show final categories
    console.log('\n=== Final Categories ===');
    const [categories] = await connection.execute(`
      SELECT id, name, type, parent_id, level 
      FROM categories 
      ORDER BY type, level, name
    `);
    
    console.log(`Total categories: ${categories.length}`);
    categories.forEach(cat => {
      const indent = '  '.repeat(cat.level);
      console.log(`${indent}${cat.name} (${cat.type}, ID: ${cat.id}, Level: ${cat.level}, Parent: ${cat.parent_id || 'root'})`);
    });
    
  } catch (error) {
    console.error('Test error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\nDatabase connection closed');
    }
  }
}

// Run the test
testCreateCategory().catch(console.error);
