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
        console.log(`Parent ${parentId} has level ${parentResult[0].level}, so new category will have level ${level}`);
      } else {
        level = 1 // Fallback if parent not found
        console.log(`Parent ${parentId} not found, using fallback level 1`);
      }
    } else {
      console.log(`Root category, using level 0`);
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

async function testLevelCalculation() {
  try {
    console.log('Connected to database successfully');
    
    console.log('\n=== Testing Level Calculation ===');
    
    // Test data for a single product with clear hierarchy
    const productData = {
      sku: 'TEST001',
      name: 'Test Product',
      store_category: 'Electronics',
      store_subcategory_1: 'Computers',
      store_subcategory_2: 'Accessories',
      store_subcategory_3: 'Mice'
    };
    
    console.log('\n--- Processing Single Product ---');
    console.log('Product data:', productData);
    
    // Step 1: Create main category
    let storeCategoryId = null;
    
    if (productData.store_category) {
      storeCategoryId = await createOrGetCategory(productData.store_category, null, 'store');
      console.log(`Created/Found store category: ${productData.store_category} (ID: ${storeCategoryId})`);
    }
    
    // Step 2: Process store subcategories
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
      const finalStoreCategoryId = await processSubcategories(null, storeSubcategories, 'store', storeCategoryId);
      console.log(`Final store category ID: ${finalStoreCategoryId}`);
    }
    
    // Show final category structure
    console.log('\n=== Final Category Structure ===');
    const [categories] = await db.execute(`
      SELECT id, name, type, parent_id, level 
      FROM categories 
      WHERE type = 'store'
      ORDER BY level, name
    `);
    
    console.log(`Total store categories: ${categories.length}`);
    
    console.log('\nStore Categories:');
    categories.forEach(cat => {
      const indent = '  '.repeat(cat.level);
      console.log(`${indent}${cat.name} (ID: ${cat.id}, Level: ${cat.level}, Parent: ${cat.parent_id || 'root'})`);
    });
    
    // Verify the hierarchy is correct
    console.log('\n=== Level Verification ===');
    
    // Check if Electronics has Computers as child
    const electronics = categories.find(c => c.name === 'Electronics' && c.level === 0);
    if (electronics) {
      console.log(`✅ Electronics (ID: ${electronics.id}, Level: ${electronics.level})`);
      
      const computers = categories.find(c => c.name === 'Computers' && c.parent_id === electronics.id);
      if (computers) {
        console.log(`✅ Computers (ID: ${computers.id}, Level: ${computers.level}) - should be level 1`);
        
        const accessories = categories.find(c => c.name === 'Accessories' && c.parent_id === computers.id);
        if (accessories) {
          console.log(`✅ Accessories (ID: ${accessories.id}, Level: ${accessories.level}) - should be level 2`);
          
          const mice = categories.find(c => c.name === 'Mice' && c.parent_id === accessories.id);
          if (mice) {
            console.log(`✅ Mice (ID: ${mice.id}, Level: ${mice.level}) - should be level 3`);
            
            // Check if levels are correct
            if (electronics.level === 0 && computers.level === 1 && accessories.level === 2 && mice.level === 3) {
              console.log('✅ All levels are correct!');
            } else {
              console.log('❌ Some levels are incorrect!');
              console.log(`Expected: Electronics(0) → Computers(1) → Accessories(2) → Mice(3)`);
              console.log(`Actual: Electronics(${electronics.level}) → Computers(${computers.level}) → Accessories(${accessories.level}) → Mice(${mice.level})`);
            }
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
    await db.end();
    console.log('\nDatabase connection closed');
  }
}

// Run the test
testLevelCalculation().catch(console.error);
