const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: '45.77.196.170',
  user: 'ebizdash_products_react',
  password: 'products_react',
  database: 'ebizdash_products_react',
  charset: 'utf8mb4'
};

// Helper function to create or get a category (simplified for testing)
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

// Helper function to process subcategories
async function processSubcategories(connection, subcategories, type, parentCategoryId = null) {
  try {
    subcategories.sort((a, b) => a.level - b.level)
    
    let currentParentId = parentCategoryId
    let currentLevel = parentCategoryId ? 1 : 0
    
    console.log(`Processing ${subcategories.length} subcategories for ${type} with parent ID: ${parentCategoryId}`)
    
    for (const subcategory of subcategories) {
      if (!subcategory.name || subcategory.name.trim() === '') {
        continue
      }
      
      console.log(`Processing ${type} subcategory level ${currentLevel}: "${subcategory.name}" with parent ID: ${currentParentId}`)
      
      // Use the createOrGetCategory function to ensure proper locking
      const categoryId = await createOrGetCategory(connection, subcategory.name.trim(), currentParentId, type)
      
      // Update parent for next iteration
      currentParentId = categoryId
      currentLevel++
    }
    
    console.log(`Final ${type} category ID: ${currentParentId}`)
    return currentParentId
  } catch (error) {
    console.error("Error processing subcategories:", error)
    throw error
  }
}

async function testSingleProductHierarchy() {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected to database successfully');
    
    console.log('\n=== Testing Single Product Hierarchy ===');
    
    // Test data for a single product
    const productData = {
      vendor_category: 'Computer Accessories',
      store_category: 'Electronics',
      vendor_subcategory_1: 'Computers',
      vendor_subcategory_2: 'Accessories',
      vendor_subcategory_3: 'Mice',
      store_subcategory_1: 'Computers',
      store_subcategory_2: 'Accessories',
      store_subcategory_3: 'Mice'
    };
    
    console.log('\n--- Processing Single Product ---');
    console.log('Product data:', productData);
    
    // Step 1: Create main categories
    let vendorCategoryId = null;
    let storeCategoryId = null;
    
    if (productData.vendor_category) {
      vendorCategoryId = await createOrGetCategory(connection, productData.vendor_category, null, 'vendor');
      console.log(`Created/Found vendor category: ${productData.vendor_category} (ID: ${vendorCategoryId})`);
    }
    
    if (productData.store_category) {
      storeCategoryId = await createOrGetCategory(connection, productData.store_category, null, 'store');
      console.log(`Created/Found store category: ${productData.store_category} (ID: ${storeCategoryId})`);
    }
    
    // Step 2: Process vendor subcategories
    const vendorSubcategories = [];
    for (let j = 1; j <= 4; j++) {
      const subcatKey = `vendor_subcategory_${j}`;
      if (productData[subcatKey] && productData[subcatKey].trim()) {
        vendorSubcategories.push({
          level: j,
          name: productData[subcatKey].trim()
        });
      }
    }
    
    if (vendorSubcategories.length > 0) {
      console.log(`\nProcessing ${vendorSubcategories.length} vendor subcategories...`);
      const finalVendorCategoryId = await processSubcategories(connection, vendorSubcategories, 'vendor', vendorCategoryId);
      console.log(`Final vendor category ID: ${finalVendorCategoryId}`);
    }
    
    // Step 3: Process store subcategories
    const storeSubcategories = [];
    for (let j = 1; j <= 4; j++) {
      const subcatKey = `store_subcategory_${j}`;
      if (productData[subcatKey] && productData[subcatKey].trim()) {
        storeSubcategories.push({
          level: j,
          name: productData[subcatKey].trim()
        });
      }
    }
    
    if (storeSubcategories.length > 0) {
      console.log(`\nProcessing ${storeSubcategories.length} store subcategories...`);
      const finalStoreCategoryId = await processSubcategories(connection, storeSubcategories, 'store', storeCategoryId);
      console.log(`Final store category ID: ${finalStoreCategoryId}`);
    }
    
    // Show final category structure
    console.log('\n=== Final Category Structure ===');
    const [categories] = await connection.execute(`
      SELECT id, name, type, parent_id, level 
      FROM categories 
      ORDER BY type, level, name
    `);
    
    console.log(`Total categories: ${categories.length}`);
    
    const storeCategories = categories.filter(c => c.type === 'store');
    const vendorCategories = categories.filter(c => c.type === 'vendor');
    
    console.log('\nStore Categories:');
    storeCategories.forEach(cat => {
      const indent = '  '.repeat(cat.level);
      console.log(`${indent}${cat.name} (ID: ${cat.id}, Level: ${cat.level}, Parent: ${cat.parent_id || 'root'})`);
    });
    
    console.log('\nVendor Categories:');
    vendorCategories.forEach(cat => {
      const indent = '  '.repeat(cat.level);
      console.log(`${indent}${cat.name} (ID: ${cat.id}, Level: ${cat.level}, Parent: ${cat.parent_id || 'root'})`);
    });
    
    // Verify the hierarchy is correct
    console.log('\n=== Hierarchy Verification ===');
    
    // Check if Electronics has Computers as child
    const electronics = storeCategories.find(c => c.name === 'Electronics' && c.level === 0);
    if (electronics) {
      const computers = storeCategories.find(c => c.name === 'Computers' && c.parent_id === electronics.id);
      if (computers) {
        console.log(`✅ Electronics (ID: ${electronics.id}) → Computers (ID: ${computers.id})`);
        
        // Check if Computers has Accessories as child
        const accessories = storeCategories.find(c => c.name === 'Accessories' && c.parent_id === computers.id);
        if (accessories) {
          console.log(`✅ Computers (ID: ${computers.id}) → Accessories (ID: ${accessories.id})`);
          
          // Check if Accessories has Mice as child
          const mice = storeCategories.find(c => c.name === 'Mice' && c.parent_id === accessories.id);
          if (mice) {
            console.log(`✅ Accessories (ID: ${accessories.id}) → Mice (ID: ${mice.id})`);
            console.log('✅ Store category hierarchy is correct!');
          } else {
            console.log('❌ Accessories does not have Mice as child');
          }
        } else {
          console.log('❌ Computers does not have Accessories as child');
        }
      } else {
        console.log('❌ Electronics does not have Computers as child');
      }
    } else {
      console.log('❌ Electronics category not found');
    }
    
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
testSingleProductHierarchy().catch(console.error);
