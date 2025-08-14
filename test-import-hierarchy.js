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

async function testHierarchicalImport() {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected to database successfully');
    
    // Test data that matches the user's example
    const testData = [
      {
        vendor_category: 'Computer Accessories',
        store_category: 'Electronics',
        vendor_subcategory_1: 'Computers',
        vendor_subcategory_2: 'Accessories',
        vendor_subcategory_3: 'Mice',
        store_subcategory_1: 'Computers',
        store_subcategory_2: 'Accessories',
        store_subcategory_3: 'Mice'
      },
      {
        vendor_category: 'Gaming Accessories',
        store_category: 'Electronics',
        vendor_subcategory_1: 'Computers',
        vendor_subcategory_2: 'Accessories',
        vendor_subcategory_3: 'Keyboards',
        store_subcategory_1: 'Computers',
        store_subcategory_2: 'Accessories',
        store_subcategory_3: 'Keyboards'
      }
    ];
    
    console.log('\n=== Testing Hierarchical Category Creation ===');
    
    // Simulate the import process for each row
    for (let i = 0; i < testData.length; i++) {
      const row = testData[i];
      console.log(`\n--- Processing Row ${i + 1} ---`);
      
      // Step 1: Create main categories
      let vendorCategoryId = null;
      let storeCategoryId = null;
      
      if (row.vendor_category) {
        vendorCategoryId = await createOrGetCategory(connection, row.vendor_category, null, 'vendor');
        console.log(`Created/Found vendor category: ${row.vendor_category} (ID: ${vendorCategoryId})`);
      }
      
      if (row.store_category) {
        storeCategoryId = await createOrGetCategory(connection, row.store_category, null, 'store');
        console.log(`Created/Found store category: ${row.store_category} (ID: ${storeCategoryId})`);
      }
      
      // Step 2: Process vendor subcategories
      const vendorSubcategories = [];
      for (let j = 1; j <= 4; j++) {
        const subcatKey = `vendor_subcategory_${j}`;
        if (row[subcatKey] && row[subcatKey].trim()) {
          vendorSubcategories.push({
            level: j,
            name: row[subcatKey].trim()
          });
        }
      }
      
      if (vendorSubcategories.length > 0) {
        console.log(`Processing ${vendorSubcategories.length} vendor subcategories...`);
        const finalVendorCategoryId = await processSubcategories(connection, vendorSubcategories, 'vendor', vendorCategoryId);
        console.log(`Final vendor category ID: ${finalVendorCategoryId}`);
      }
      
      // Step 3: Process store subcategories
      const storeSubcategories = [];
      for (let j = 1; j <= 4; j++) {
        const subcatKey = `store_subcategory_${j}`;
        if (row[subcatKey] && row[subcatKey].trim()) {
          storeSubcategories.push({
            level: j,
            name: row[subcatKey].trim()
          });
        }
      }
      
      if (storeSubcategories.length > 0) {
        console.log(`Processing ${storeSubcategories.length} store subcategories...`);
        const finalStoreCategoryId = await processSubcategories(connection, storeSubcategories, 'store', storeCategoryId);
        console.log(`Final store category ID: ${finalStoreCategoryId}`);
      }
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
    
  } catch (error) {
    console.error('Test error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\nDatabase connection closed');
    }
  }
}

// Helper function to create or get a category
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
    subcategories.sort((a, b) => a.level - b.level);
    
    let currentParentId = parentCategoryId;
    let currentLevel = parentCategoryId ? 1 : 0;
    
    console.log(`Processing ${subcategories.length} subcategories for ${type} with parent ID: ${parentCategoryId}`);
    
    for (const subcategory of subcategories) {
      if (!subcategory.name || subcategory.name.trim() === '') {
        continue;
      }
      
      console.log(`Processing ${type} subcategory level ${currentLevel}: "${subcategory.name}" with parent ID: ${currentParentId}`);
      
      const [existingCategory] = await connection.execute(
        "SELECT id FROM categories WHERE name = ? AND parent_id = ? AND type = ?",
        [subcategory.name.trim(), currentParentId, type]
      );
      
      let categoryId;
      
      if (existingCategory.length > 0) {
        categoryId = existingCategory[0].id;
        console.log(`Found existing ${type} category: ${subcategory.name} (ID: ${categoryId}) with parent ID: ${currentParentId}`);
      } else {
        const [result] = await connection.execute(
          "INSERT INTO categories (name, parent_id, type, level, created_at) VALUES (?, ?, ?, ?, NOW())",
          [subcategory.name.trim(), currentParentId, type, currentLevel]
        );
        categoryId = result.insertId;
        console.log(`Created new ${type} category: ${subcategory.name} (ID: ${categoryId}) with parent ID: ${currentParentId} at level ${currentLevel}`);
      }
      
      currentParentId = categoryId;
      currentLevel++;
    }
    
    console.log(`Final ${type} category ID: ${currentParentId}`);
    return currentParentId;
  } catch (error) {
    console.error("Error processing subcategories:", error);
    throw error;
  }
}

// Run the test
testHierarchicalImport().catch(console.error);
