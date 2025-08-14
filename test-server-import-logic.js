const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: '45.77.196.170',
  user: 'ebizdash_products_react',
  password: 'products_react',
  database: 'ebizdash_products_react',
  charset: 'utf8mb4'
};

// Create database pool (same as server)
const db = mysql.createPool(dbConfig);

// Helper function to create or get a category (EXACT COPY from server)
async function createOrGetCategory(name, parentId, type) {
  // Use a transaction to ensure atomicity and prevent race conditions
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // For root categories (parent_id = NULL), also check if a category with the same name exists at root level
    if (parentId === null) {
      const [existingRootCategory] = await connection.execute(
        "SELECT id FROM categories WHERE name = ? AND parent_id IS NULL AND type = ? FOR UPDATE",
        [name.trim(), type]
      )
      
      if (existingRootCategory.length > 0) {
        console.log(`Found existing root category: ${name} (${type}) with ID: ${existingRootCategory[0].id}`);
        await connection.commit();
        return existingRootCategory[0].id
      }
    } else {
      // For subcategories, check with specific parent
      const [existingCategory] = await connection.execute(
        "SELECT id FROM categories WHERE name = ? AND parent_id = ? AND type = ? FOR UPDATE",
        [name.trim(), parentId, type]
      )

      if (existingCategory.length > 0) {
        console.log(`Found existing subcategory: ${name} (${type}) with ID: ${existingCategory[0].id} and parent: ${parentId}`);
        await connection.commit();
        return existingCategory[0].id
      }
    }

    // Calculate level based on parent_id
    let level = 0
    if (parentId) {
      // Get the parent's level and add 1
      const [parentResult] = await connection.execute(
        "SELECT level FROM categories WHERE id = ?",
        [parentId]
      )
      if (parentResult.length > 0) {
        level = parentResult[0].level + 1
      } else {
        level = 1 // Fallback if parent not found
      }
    }
    
    console.log(`Creating new category: ${name} (${type}) with parent: ${parentId}, calculated level: ${level}`);
    
    const [result] = await connection.execute(
      "INSERT INTO categories (name, parent_id, type, level, created_at) VALUES (?, ?, ?, ?, NOW())",
      [name.trim(), parentId, type, level]
    )
    
    await connection.commit();
    return result.insertId
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

// Helper function to process subcategories (EXACT COPY from server)
async function processSubcategories(productId, subcategories, type, parentCategoryId = null) {
  try {
    // Sort subcategories by level
    subcategories.sort((a, b) => a.level - b.level)
    
    let currentParentId = parentCategoryId
    let currentLevel = parentCategoryId ? 1 : 0 // Start at level 1 if we have a parent, 0 if root
    console.log(`Processing ${subcategories.length} subcategories for ${type} with parent ID: ${parentCategoryId}`)
    
    for (const subcategory of subcategories) {
      if (!subcategory.name || subcategory.name.trim() === '') {
        continue
      }
      
      console.log(`Processing ${type} subcategory level ${currentLevel}: "${subcategory.name}" with parent ID: ${currentParentId}`)
      
      // Use the createOrGetCategory function to ensure proper locking
      const categoryId = await createOrGetCategory(subcategory.name.trim(), currentParentId, type)
      
      // Update parent for next iteration
      currentParentId = categoryId
      currentLevel++
    }
    
    console.log(`Final ${type} category ID: ${currentParentId}`)
    // Return the final category ID (deepest subcategory)
    return currentParentId
  } catch (error) {
    console.error("Error processing subcategories:", error)
    throw error
  }
}

// Simulate the exact server import logic
async function simulateServerImport() {
  try {
    console.log('Connected to database successfully');
    
    console.log('\n=== Simulating Server Import Logic ===');
    
    // Test data for multiple products (same as your CSV)
    const products = [
      {
        sku: 'SKU001',
        name: 'Wireless Mouse',
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
        sku: 'SKU002',
        name: 'Gaming Keyboard',
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
    
    for (let i = 0; i < products.length; i++) {
      const row = products[i];
      console.log(`\n--- Processing Product ${i + 1}: ${row.sku} ---`);
      
      // Simulate the exact server logic
      const queryFields = []
      const queryValues = []
      const vendorSubcategories = []
      const storeSubcategories = []
      let vendorCategoryId = null
      let storeCategoryId = null
      let finalVendorCategoryId = null
      let finalStoreCategoryId = null

      // Process each field (simulating the server's mapping logic)
      for (const [fieldName, value] of Object.entries(row)) {
        if (!value || value.trim() === '') {
          continue
        }
        
        // Handle vendor category (create if doesn't exist)
        if (fieldName === 'vendor_category') {
          vendorCategoryId = await createOrGetCategory(value, null, 'vendor')
          continue
        }
        
        // Handle store category (create if doesn't exist)
        if (fieldName === 'store_category') {
          storeCategoryId = await createOrGetCategory(value, null, 'store')
          continue
        }
        
        // Handle vendor subcategory columns
        if (fieldName.startsWith('vendor_subcategory_')) {
          vendorSubcategories.push({
            level: parseInt(fieldName.split('_')[2]),
            name: value.trim()
          })
          continue // Skip adding to main product fields
        }
        
        // Handle store subcategory columns
        if (fieldName.startsWith('store_subcategory_')) {
          storeSubcategories.push({
            level: parseInt(fieldName.split('_')[2]),
            name: value.trim()
          })
          continue // Skip adding to main product fields
        }
        
        // Add other fields to product
        queryFields.push(fieldName)
        queryValues.push(value)
      }

      // Process subcategories using the main category as parent (FIXED ORDER)
      if (vendorSubcategories.length > 0) {
        // Use the main vendor category as parent for subcategories
        const vendorParentId = vendorCategoryId
        finalVendorCategoryId = await processSubcategories(null, vendorSubcategories, 'vendor', vendorParentId)
      } else {
        finalVendorCategoryId = vendorCategoryId
      }
      
      if (storeSubcategories.length > 0) {
        // Use the main store category as parent for subcategories
        const storeParentId = storeCategoryId
        finalStoreCategoryId = await processSubcategories(null, storeSubcategories, 'store', storeParentId)
      } else {
        finalStoreCategoryId = storeCategoryId
      }

      // Add category IDs if created (AFTER processing subcategories)
      if (finalVendorCategoryId) {
        if (!queryFields.includes('vendor_category_id')) {
          queryFields.push('vendor_category_id')
          queryValues.push(finalVendorCategoryId)
        }
      }

      if (finalStoreCategoryId) {
        if (!queryFields.includes('store_category_id')) {
          queryFields.push('store_category_id')
          queryValues.push(finalStoreCategoryId)
        }
      }

      console.log(`Final vendor category ID: ${finalVendorCategoryId}`);
      console.log(`Final store category ID: ${finalStoreCategoryId}`);
    }
    
    // Show final category structure
    console.log('\n=== Final Category Structure ===');
    const [categories] = await db.execute(`
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
    
    // Check for duplicates
    console.log('\n=== Duplicate Check ===');
    const categoryNames = categories.map(c => ({ name: c.name, type: c.type, id: c.id, parent_id: c.parent_id }));
    const duplicates = [];
    
    for (let i = 0; i < categoryNames.length; i++) {
      for (let j = i + 1; j < categoryNames.length; j++) {
        if (categoryNames[i].name === categoryNames[j].name && 
            categoryNames[i].type === categoryNames[j].type &&
            categoryNames[i].parent_id === categoryNames[j].parent_id) {
          duplicates.push({
            name: categoryNames[i].name,
            type: categoryNames[i].type,
            ids: [categoryNames[i].id, categoryNames[j].id],
            parent_id: categoryNames[i].parent_id
          });
        }
      }
    }
    
    if (duplicates.length > 0) {
      console.log('❌ Found duplicates:');
      duplicates.forEach(dup => {
        console.log(`  - ${dup.name} (${dup.type}) - IDs: ${dup.ids.join(', ')}, Parent: ${dup.parent_id || 'root'}`);
      });
    } else {
      console.log('✅ No duplicates found');
    }
    
  } catch (error) {
    console.error('Test error:', error.message);
  } finally {
    await db.end();
    console.log('\nDatabase connection closed');
  }
}

// Run the test
simulateServerImport().catch(console.error);
