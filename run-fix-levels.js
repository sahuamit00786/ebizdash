const mysql = require('mysql2/promise');
const fs = require('fs');

// Database configuration
const dbConfig = {
  host: '45.77.196.170',
  user: 'ebizdash_products_react',
  password: 'products_react',
  database: 'ebizdash_products_react',
  charset: 'utf8mb4'
};

async function fixCategoryLevels() {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected to database successfully');
    
    // Read the SQL file
    const sqlContent = fs.readFileSync('scripts/add-level-column.sql', 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = sqlContent.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          console.log('Executing:', statement.substring(0, 50) + '...');
          await connection.execute(statement);
        } catch (error) {
          console.log('Statement failed (might be expected):', error.message);
        }
      }
    }
    
    console.log('\nLevel column fix completed!');
    
    // Show the updated categories
    const [categories] = await connection.execute(`
      SELECT id, name, type, parent_id, level 
      FROM categories 
      ORDER BY type, level, name
    `);
    
    console.log('\nUpdated categories:');
    categories.forEach(cat => {
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

// Run the fix
fixCategoryLevels().catch(console.error);
