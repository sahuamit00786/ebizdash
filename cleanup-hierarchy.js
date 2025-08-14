const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: '45.77.196.170',
  user: 'ebizdash_products_react',
  password: 'products_react',
  database: 'ebizdash_products_react',
  charset: 'utf8mb4'
};

async function cleanupHierarchy() {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected to database successfully');
    
    // First, let's see what we have
    console.log('\n=== Current Categories ===');
    const [categories] = await connection.execute(`
      SELECT id, name, type, parent_id, level 
      FROM categories 
      ORDER BY type, level, name
    `);
    
    console.log(`Found ${categories.length} categories:`);
    categories.forEach(cat => {
      const indent = '  '.repeat(cat.level);
      console.log(`${indent}${cat.name} (${cat.type}, ID: ${cat.id}, Level: ${cat.level}, Parent: ${cat.parent_id || 'root'})`);
    });
    
    // Clean up and rebuild hierarchy properly
    console.log('\n=== Rebuilding Hierarchy ===');
    
    // Delete all categories except the original ones
    await connection.execute('DELETE FROM categories WHERE id > 5');
    
    // Reset levels
    await connection.execute('UPDATE categories SET level = 0 WHERE parent_id IS NULL');
    await connection.execute('UPDATE categories SET level = 1 WHERE parent_id IS NOT NULL');
    
    // Show final result
    console.log('\n=== Final Categories ===');
    const [finalCategories] = await connection.execute(`
      SELECT id, name, type, parent_id, level 
      FROM categories 
      ORDER BY type, level, name
    `);
    
    console.log(`Final count: ${finalCategories.length} categories:`);
    finalCategories.forEach(cat => {
      const indent = '  '.repeat(cat.level);
      console.log(`${indent}${cat.name} (${cat.type}, ID: ${cat.id}, Level: ${cat.level}, Parent: ${cat.parent_id || 'root'})`);
    });
    
  } catch (error) {
    console.error('Database error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\nDatabase connection closed');
    }
  }
}

// Run the cleanup
cleanupHierarchy().catch(console.error);
