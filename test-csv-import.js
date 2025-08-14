const mysql = require('mysql2/promise');
const db = require('./server/config/database');

async function testCsvImport() {
  try {
    console.log('=== Testing CSV Import Category Logic ===\n');
    
    // Simulate CSV row processing
    const testRows = [
      {
        sku: 'PROD001',
        name: 'Wireless Mouse',
        store_category: 'Electronics',
        store_subcategory_1: 'Computers',
        store_subcategory_2: 'Accessories',
        store_subcategory_3: 'Mice'
      },
      {
        sku: 'PROD002',
        name: 'Gaming Keyboard',
        store_category: 'Electronics',
        store_subcategory_1: 'Computers',
        store_subcategory_2: 'Accessories',
        store_subcategory_3: 'Keyboards'
      }
    ];
    
    for (let i = 0; i < testRows.length; i++) {
      const row = testRows[i];
      console.log(`\n--- Processing Row ${i + 1}: ${row.name} ---`);
      
      // Simulate the CSV import logic
      const storeSubcategories = []
      let storeCategoryId = null
      
      // Handle main store category - only create if no subcategories
      if (row.store_category && !row.store_subcategory_1) {
        storeCategoryId = await createOrGetCategory(row.store_category, null, 'store')
        console.log(`Main category "${row.store_category}" - ID: ${storeCategoryId}`)
      }
      
      // Handle subcategories
      if (row.store_subcategory_1) {
        storeSubcategories.push({
          level: 1,
          name: row.store_subcategory_1.trim()
        })
      }
      if (row.store_subcategory_2) {
        storeSubcategories.push({
          level: 2,
          name: row.store_subcategory_2.trim()
        })
      }
      if (row.store_subcategory_3) {
        storeSubcategories.push({
          level: 3,
          name: row.store_subcategory_3.trim()
        })
      }
      
      // If we have subcategories but no main category, include the main category as level 0
      if (storeSubcategories.length > 0 && !storeCategoryId && row.store_category) {
        storeSubcategories.unshift({
          level: 0,
          name: row.store_category.trim()
        })
      }
      
      console.log(`Subcategories to process:`, storeSubcategories.map(s => `${s.name} (level ${s.level})`))
      
      // Process subcategories
      let finalStoreCategoryId = storeCategoryId
      if (storeSubcategories.length > 0) {
        // If we have subcategories that include the main category (level 0), start from null parent
        const parentId = storeSubcategories[0]?.level === 0 ? null : storeCategoryId
        finalStoreCategoryId = await processSubcategories(999 + i, storeSubcategories, 'store', parentId)
      }
      
      console.log(`Final category ID: ${finalStoreCategoryId}`)
    }
    
    console.log('\n=== Final Category Structure ===');
    const [finalCategories] = await db.execute(`
      SELECT id, name, parent_id, type, level 
      FROM categories 
      WHERE type = 'store' AND name IN ('Electronics', 'Computers', 'Accessories', 'Mice', 'Keyboards', 'Cables', 'Stands')
      ORDER BY COALESCE(parent_id, id), level, name
    `);
    
    finalCategories.forEach(cat => {
      const indent = '  '.repeat(cat.level);
      console.log(`${indent}${cat.name} (ID: ${cat.id}, Parent: ${cat.parent_id || 'root'})`);
    });
    
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    process.exit(0);
  }
}

// Helper function to create or get a category (copied from products.js)
async function createOrGetCategory(name, parentId, type) {
  const [existingCategory] = await db.execute(
    "SELECT id FROM categories WHERE name = ? AND parent_id = ? AND type = ?",
    [name.trim(), parentId, type]
  )

  if (existingCategory.length > 0) {
    return existingCategory[0].id
  }

  const [result] = await db.execute(
    "INSERT INTO categories (name, parent_id, type, level, created_at) VALUES (?, ?, ?, ?, NOW())",
    [name.trim(), parentId, type, 0]
  )
  return result.insertId
}

// Helper function to process subcategories (copied from products.js)
async function processSubcategories(productId, subcategories, type, parentCategoryId = null) {
  try {
    // Sort subcategories by level
    subcategories.sort((a, b) => a.level - b.level)
    
    let currentParentId = parentCategoryId
    console.log(`  Processing ${subcategories.length} subcategories for ${type} with parent ID: ${parentCategoryId}`)
    
    for (const subcategory of subcategories) {
      if (!subcategory.name || subcategory.name.trim() === '') {
        continue
      }
      
      console.log(`    Processing ${type} subcategory level ${subcategory.level}: "${subcategory.name}" with parent ID: ${currentParentId}`)
      
      // Check if category exists with the same name and parent
      const [existingCategory] = await db.execute(
        "SELECT id FROM categories WHERE name = ? AND parent_id = ? AND type = ?",
        [subcategory.name.trim(), currentParentId, type]
      )
      
      let categoryId
      
      if (existingCategory.length > 0) {
        categoryId = existingCategory[0].id
        console.log(`    ✓ Found existing ${type} category: ${subcategory.name} (ID: ${categoryId}) with parent ID: ${currentParentId}`)
      } else {
        // Create new category
        const [result] = await db.execute(
          "INSERT INTO categories (name, parent_id, type, level, created_at) VALUES (?, ?, ?, ?, NOW())",
          [subcategory.name.trim(), currentParentId, type, subcategory.level]
        )
        categoryId = result.insertId
        console.log(`    + Created new ${type} category: ${subcategory.name} (ID: ${categoryId}) with parent ID: ${currentParentId}`)
      }
      
      // Update parent for next iteration
      currentParentId = categoryId
    }
    
    console.log(`    Final ${type} category ID: ${currentParentId}`)
    // Return the final category ID (deepest subcategory)
    return currentParentId
  } catch (error) {
    console.error("Error processing subcategories:", error)
    throw error
  }
}

testCsvImport();
