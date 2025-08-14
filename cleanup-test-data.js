const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: '45.77.196.170',
  user: 'ebizdash_products_react',
  password: 'products_react',
  database: 'ebizdash_products_react',
  charset: 'utf8mb4'
};

async function cleanupTestData() {
  let connection;
  
  try {
    console.log('🔍 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    
    console.log('🧹 Cleaning up test data...');
    
    // Delete test categories (vendor categories created during test)
    const [deleteResult] = await connection.execute(`
      DELETE FROM categories WHERE type = 'vendor' AND id >= 1502
    `);
    
    console.log(`✅ Deleted ${deleteResult.affectedRows} test categories`);
    
    // Verify cleanup
    const [remainingCategories] = await connection.execute(`
      SELECT COUNT(*) as count FROM categories WHERE type = 'vendor'
    `);
    
    console.log(`📊 Remaining vendor categories: ${remainingCategories[0].count}`);
    
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
  cleanupTestData()
    .then(() => {
      console.log('\n🎉 Test data cleanup completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Cleanup failed:', error);
      process.exit(1);
    });
}

module.exports = { cleanupTestData };
