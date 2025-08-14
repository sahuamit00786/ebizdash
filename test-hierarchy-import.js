const mysql = require('mysql2/promise');

async function testHierarchicalImport() {
  const connection = await mysql.createConnection({
    host: '45.77.196.170',
    user: 'ebizdash_products_react',
    password: 'products_react',
    database: 'ebizdash_products_react',
    charset: 'utf8mb4'
  });

  try {
    console.log('Testing hierarchical category import with custom field names...\n');

    // Test data with your field names
    const testData = [
      {
        sku: "PROD001",
        name: "Gaming Laptop",
        vendor_: "Electronics",
        suk_vendor_1: "Computers",
        suk_vendor_2: "Laptops",
        suk_vendor_3: "Gaming",
        cat_store_: "Tech",
        subc_store_1: "Computing",
        subc_store_2: "Portable",
        subc_store_3: "Gaming"
      },
      {
        sku: "PROD002",
        name: "Smartphone",
        vendor_: "Electronics",
        suk_vendor_1: "Mobile",
        suk_vendor_2: "Phones",
        suk_vendor_3: "Smartphones",
        cat_store_: "Tech",
        subc_store_1: "Mobile",
        subc_store_2: "Devices",
        subc_store_3: "Smartphones"
      }
    ];

    // Simulate the import processing logic
    async function createOrGetCategory(name, parentId, type) {
      console.log(`  Creating/Getting category: "${name}" (${type}) with parent: ${parentId}`);
      
      // Check if category exists
      const [existing] = await connection.execute(
        "SELECT id FROM categories WHERE name = ? AND parent_id = ? AND type = ?",
        [name.trim(), parentId, type]
      );
      
      if (existing.length > 0) {
        console.log(`    Found existing category: ${existing[0].id}`);
        return existing[0].id;
      }
      
      // Calculate level
      let level = 0;
      if (parentId) {
        const [parentResult] = await connection.execute(
          "SELECT level FROM categories WHERE id = ?",
          [parentId]
        );
        if (parentResult.length > 0) {
          level = parentResult[0].level + 1;
        } else {
          level = 1;
        }
      }
      
      // Create new category
      const [result] = await connection.execute(
        "INSERT INTO categories (name, parent_id, type, level, created_at) VALUES (?, ?, ?, ?, NOW())",
        [name.trim(), parentId, type, level]
      );
      
      console.log(`    Created new category: ${result.insertId} (level ${level})`);
      return result.insertId;
    }

    async function processSubcategories(subcategories, type, parentCategoryId) {
      console.log(`\nProcessing ${subcategories.length} subcategories for ${type} with parent ID: ${parentCategoryId}`);
      
      // Sort subcategories by level
      subcategories.sort((a, b) => a.level - b.level);
      
      let currentParentId = parentCategoryId;
      
      for (const subcategory of subcategories) {
        if (!subcategory.name || subcategory.name.trim() === '') {
          continue;
        }
        
        console.log(`  Level ${subcategory.level}: "${subcategory.name}" -> Parent: ${currentParentId}`);
        
        const categoryId = await createOrGetCategory(subcategory.name.trim(), currentParentId, type);
        
        // Update parent for next iteration
        currentParentId = categoryId;
      }
      
      console.log(`  Final ${type} category ID: ${currentParentId}`);
      return currentParentId;
    }

    // Process each test row
    for (let i = 0; i < testData.length; i++) {
      const row = testData[i];
      console.log(`\n--- Processing Row ${i + 1} ---`);
      console.log(`SKU: ${row.sku}, Name: ${row.name}`);
      
      // Extract vendor categories
      const vendorSubcategories = [];
      const storeSubcategories = [];
      
      // Process vendor subcategories (suk_vendor_1, suk_vendor_2, etc.)
      for (let j = 1; j <= 5; j++) {
        const fieldName = `suk_vendor_${j}`;
        if (row[fieldName] && row[fieldName].trim() !== '') {
          vendorSubcategories.push({
            level: j,
            name: row[fieldName].trim()
          });
        }
      }
      
      // Process store subcategories (subc_store_1, subc_store_2, etc.)
      for (let j = 1; j <= 5; j++) {
        const fieldName = `subc_store_${j}`;
        if (row[fieldName] && row[fieldName].trim() !== '') {
          storeSubcategories.push({
            level: j,
            name: row[fieldName].trim()
          });
        }
      }
      
      console.log(`Vendor Category: ${row.vendor_}`);
      console.log(`Vendor Subcategories:`, vendorSubcategories);
      console.log(`Store Category: ${row.cat_store_}`);
      console.log(`Store Subcategories:`, storeSubcategories);
      
      // Create main categories
      const vendorCategoryId = await createOrGetCategory(row.vendor_, null, 'vendor');
      const storeCategoryId = await createOrGetCategory(row.cat_store_, null, 'store');
      
      // Process hierarchies
      let finalVendorCategoryId = vendorCategoryId;
      if (vendorSubcategories.length > 0) {
        finalVendorCategoryId = await processSubcategories(vendorSubcategories, 'vendor', vendorCategoryId);
      }
      
      let finalStoreCategoryId = storeCategoryId;
      if (storeSubcategories.length > 0) {
        finalStoreCategoryId = await processSubcategories(storeSubcategories, 'store', storeCategoryId);
      }
      
      console.log(`\nFinal Category IDs for ${row.sku}:`);
      console.log(`  Vendor: ${finalVendorCategoryId}`);
      console.log(`  Store: ${finalStoreCategoryId}`);
    }

    // Check the final hierarchy
    console.log('\n=== Final Category Hierarchy ===');
    const [categories] = await connection.execute(`
      SELECT 
        c.id, c.name, c.type, c.parent_id, c.level, 
        c.status, c.created_at
      FROM categories c
      ORDER BY c.type, COALESCE(c.parent_id, c.id), c.level, c.name
    `);

    console.log('All categories:');
    categories.forEach(cat => {
      const indent = '  '.repeat(cat.level);
      console.log(`${indent}📄 ${cat.name} [${cat.type}] Level ${cat.level} (ID: ${cat.id}, Parent: ${cat.parent_id})`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

testHierarchicalImport();
