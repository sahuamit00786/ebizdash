const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '', // Add your password here
  database: 'product_management'
};

async function testBulkDelete() {
  let connection;
  
  try {
    console.log('🔍 Testing Bulk Delete Category Functionality...\n');
    
    // Connect to database
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database\n');
    
    // 1. Check if Uncategorized categories exist
    console.log('1️⃣ Checking Uncategorized categories...');
    const [uncategorizedCategories] = await connection.execute(
      "SELECT id, name, type FROM categories WHERE name = 'Uncategorized'"
    );
    
    if (uncategorizedCategories.length === 0) {
      console.log('❌ No Uncategorized categories found. Creating them...');
      
      // Create Uncategorized categories
      await connection.execute(
        "INSERT INTO categories (name, type, parent_id, level, status) VALUES ('Uncategorized', 'store', NULL, 1, 'active')"
      );
      
      await connection.execute(
        "INSERT INTO categories (name, type, parent_id, level, status) VALUES ('Uncategorized', 'vendor', NULL, 1, 'active')"
      );
      
      console.log('✅ Created Uncategorized categories');
    } else {
      console.log('✅ Found Uncategorized categories:');
      uncategorizedCategories.forEach(cat => {
        console.log(`   - ${cat.name} (${cat.type}) - ID: ${cat.id}`);
      });
    }
    
    // 2. Check existing categories
    console.log('\n2️⃣ Checking existing categories...');
    const [categories] = await connection.execute(
      "SELECT id, name, type, parent_id, level FROM categories ORDER BY type, name"
    );
    
    console.log(`Found ${categories.length} categories:`);
    categories.forEach(cat => {
      const parentInfo = cat.parent_id ? ` (Parent: ${cat.parent_id})` : ' (Root)';
      console.log(`   - ${cat.name} [${cat.type}] - ID: ${cat.id}${parentInfo}`);
    });
    
    // 3. Check products and their categories
    console.log('\n3️⃣ Checking products and their categories...');
    const [products] = await connection.execute(`
      SELECT p.id, p.name, p.sku, 
             p.store_category_id, p.vendor_category_id,
             sc.name as store_category_name,
             vc.name as vendor_category_name
      FROM products p
      LEFT JOIN categories sc ON p.store_category_id = sc.id
      LEFT JOIN categories vc ON p.vendor_category_id = vc.id
      ORDER BY p.name
    `);
    
    console.log(`Found ${products.length} products:`);
    products.forEach(product => {
      console.log(`   - ${product.name} (${product.sku})`);
      console.log(`     Store Category: ${product.store_category_name || 'None'} (ID: ${product.store_category_id})`);
      console.log(`     Vendor Category: ${product.vendor_category_name || 'None'} (ID: ${product.vendor_category_id})`);
    });
    
    // 4. Test bulk delete with sample categories (if any exist)
    if (categories.length > 2) {
      console.log('\n4️⃣ Testing bulk delete...');
      
      // Select first 2 non-Uncategorized categories
      const categoriesToDelete = categories
        .filter(cat => cat.name !== 'Uncategorized')
        .slice(0, 2);
      
      if (categoriesToDelete.length >= 2) {
        const categoryIds = categoriesToDelete.map(cat => cat.id);
        console.log(`Attempting to delete categories: ${categoryIds.join(', ')}`);
        
        // Simulate the bulk delete logic
        const getAllCategoryIds = async (parentIds) => {
          const allIds = new Set(parentIds);
          
          for (const parentId of parentIds) {
            const [subcategories] = await connection.execute(
              "SELECT id FROM categories WHERE parent_id = ?",
              [parentId]
            );
            
            if (subcategories.length > 0) {
              const subcategoryIds = subcategories.map(cat => cat.id);
              const nestedIds = await getAllCategoryIds(subcategoryIds);
              nestedIds.forEach(id => allIds.add(id));
            }
          }
          
          return Array.from(allIds);
        };
        
        const allCategoryIds = await getAllCategoryIds(categoryIds);
        console.log(`All categories to be deleted: ${allCategoryIds.join(', ')}`);
        
        // Check if any products use these categories
        const [affectedProducts] = await connection.execute(
          "SELECT id, name, store_category_id, vendor_category_id FROM products WHERE store_category_id IN (" + 
          allCategoryIds.map(() => "?").join(",") + 
          ") OR vendor_category_id IN (" + 
          allCategoryIds.map(() => "?").join(",") + ")",
          [...allCategoryIds, ...allCategoryIds]
        );
        
        console.log(`Products that would be affected: ${affectedProducts.length}`);
        affectedProducts.forEach(product => {
          console.log(`   - ${product.name} (ID: ${product.id})`);
        });
        
        console.log('\n⚠️  This is a test - no actual deletion performed');
      } else {
        console.log('❌ Not enough categories to test bulk delete');
      }
    }
    
    console.log('\n✅ Debug test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during debug test:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run the test
testBulkDelete().catch(console.error);
