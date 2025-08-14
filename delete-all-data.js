const mysql = require('mysql2/promise')

// Database configuration
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'product_management'
}

async function deleteAllData() {
  let connection
  
  try {
    console.log('Connecting to database...')
    connection = await mysql.createConnection(dbConfig)
    
    console.log('Starting deletion process...')
    
    // First, delete all products (they reference categories)
    console.log('Deleting all products...')
    const [productResult] = await connection.execute('DELETE FROM products')
    console.log(`Deleted ${productResult.affectedRows} products`)
    
    // Then delete all categories (they can reference each other)
    console.log('Deleting all categories...')
    const [categoryResult] = await connection.execute('DELETE FROM categories')
    console.log(`Deleted ${categoryResult.affectedRows} categories`)
    
    // Reset auto-increment counters
    console.log('Resetting auto-increment counters...')
    await connection.execute('ALTER TABLE products AUTO_INCREMENT = 1')
    await connection.execute('ALTER TABLE categories AUTO_INCREMENT = 1')
    
    console.log('✅ All data deleted successfully!')
    console.log('Database is now clean and ready for fresh data.')
    
  } catch (error) {
    console.error('❌ Error deleting data:', error)
  } finally {
    if (connection) {
      await connection.end()
      console.log('Database connection closed.')
    }
  }
}

// Run the deletion
deleteAllData()
