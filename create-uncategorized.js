const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '', // Add your password here
  database: 'product_management'
};

async function createUncategorizedCategories() {
  let connection;
  
  try {
    console.log('🔧 Creating Uncategorized categories...\n');
    
    // Connect to database
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database\n');
    
    // Check if Uncategorized categories already exist
    console.log('1️⃣ Checking existing Uncategorized categories...');
    const [existingCategories] = await connection.execute(
      "SELECT id, name, type FROM categories WHERE name = 'Uncategorized'"
    );
    
    if (existingCategories.length >= 2) {
      console.log('✅ Uncategorized categories already exist:');
      existingCategories.forEach(cat => {
        console.log(`   - ${cat.name} (${cat.type}) - ID: ${cat.id}`);
      });
      return;
    }
    
    // Create Uncategorized categories if they don't exist
    console.log('2️⃣ Creating Uncategorized categories...');
    
    // Check if store Uncategorized exists
    const [storeUncategorized] = await connection.execute(
      "SELECT id FROM categories WHERE name = 'Uncategorized' AND type = 'store'"
    );
    
    if (storeUncategorized.length === 0) {
      await connection.execute(
        "INSERT INTO categories (name, type, parent_id, level, status) VALUES ('Uncategorized', 'store', NULL, 1, 'active')"
      );
      console.log('✅ Created store Uncategorized category');
    } else {
      console.log('✅ Store Uncategorized category already exists');
    }
    
    // Check if vendor Uncategorized exists
    const [vendorUncategorized] = await connection.execute(
      "SELECT id FROM categories WHERE name = 'Uncategorized' AND type = 'vendor'"
    );
    
    if (vendorUncategorized.length === 0) {
      await connection.execute(
        "INSERT INTO categories (name, type, parent_id, level, status) VALUES ('Uncategorized', 'vendor', NULL, 1, 'active')"
      );
      console.log('✅ Created vendor Uncategorized category');
    } else {
      console.log('✅ Vendor Uncategorized category already exists');
    }
    
    // Verify creation
    console.log('\n3️⃣ Verifying Uncategorized categories...');
    const [finalCategories] = await connection.execute(
      "SELECT id, name, type FROM categories WHERE name = 'Uncategorized' ORDER BY type"
    );
    
    console.log('✅ Final Uncategorized categories:');
    finalCategories.forEach(cat => {
      console.log(`   - ${cat.name} (${cat.type}) - ID: ${cat.id}`);
    });
    
    console.log('\n🎉 Uncategorized categories are ready for bulk delete operations!');
    
  } catch (error) {
    console.error('❌ Error creating Uncategorized categories:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run the script
createUncategorizedCategories().catch(console.error);
