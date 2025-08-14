const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: '45.77.196.170',
  user: 'ebizdash_products_react',
  password: 'products_react',
  database: 'ebizdash_products_react',
  charset: 'utf8mb4'
};

async function cleanupTestDebug() {
  let connection;
  
  try {
    console.log('🔍 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    
    console.log('🧹 Cleaning up test debug data...');
    
    // Delete test categories created during debug test
    const [deleteResult] = await connection.execute(`
      DELETE FROM categories WHERE type = 'vendor' AND id >= 1554
    `);
    
    console.log(`✅ Deleted ${deleteResult.affectedRows} test debug categories`);
    
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
  cleanupTestDebug()
    .then(() => {
      console.log('\n🎉 Test debug cleanup completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Cleanup failed:', error);
      process.exit(1);
    });
}

module.exports = { cleanupTestDebug };
