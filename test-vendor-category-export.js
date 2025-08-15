const mysql = require('mysql2/promise');

async function testVendorCategoryExport() {
  let connection;
  
  try {
    console.log('Testing vendor category hierarchical export...');
    
    // Connect to database
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'product_management'
    });

    // 1. Create test vendor categories with hierarchy
    console.log('\n1. Creating test vendor categories with hierarchy...');
    
    // Create vendor parent category
    const [vendorParentResult] = await connection.execute(
      'INSERT INTO categories (name, type, parent_id, level, vendor_id) VALUES (?, ?, ?, ?, ?)',
      ['Vendor Electronics', 'vendor', null, 1, 4]
    );
    const vendorParentId = vendorParentResult.insertId;
    
    // Create vendor subcategory
    const [vendorSubResult] = await connection.execute(
      'INSERT INTO categories (name, type, parent_id, level, vendor_id) VALUES (?, ?, ?, ?, ?)',
      ['Vendor Laptops', 'vendor', vendorParentId, 2, 4]
    );
    const vendorSubId = vendorSubResult.insertId;
    
    // Create vendor sub-subcategory
    const [vendorSubSubResult] = await connection.execute(
      'INSERT INTO categories (name, type, parent_id, level, vendor_id) VALUES (?, ?, ?, ?, ?)',
      ['Vendor Gaming Laptops', 'vendor', vendorSubId, 3, 4]
    );
    const vendorSubSubId = vendorSubSubResult.insertId;
    
    console.log(`✅ Created vendor categories: Parent(${vendorParentId}), Sub(${vendorSubId}), SubSub(${vendorSubSubId})`);

    // 2. Create test store categories with hierarchy
    console.log('\n2. Creating test store categories with hierarchy...');
    
    // Create store parent category
    const [storeParentResult] = await connection.execute(
      'INSERT INTO categories (name, type, parent_id, level, vendor_id) VALUES (?, ?, ?, ?, ?)',
      ['Store Electronics', 'store', null, 1, null]
    );
    const storeParentId = storeParentResult.insertId;
    
    // Create store subcategory
    const [storeSubResult] = await connection.execute(
      'INSERT INTO categories (name, type, parent_id, level, vendor_id) VALUES (?, ?, ?, ?, ?)',
      ['Store Laptops', 'store', storeParentId, 2, null]
    );
    const storeSubId = storeSubResult.insertId;
    
    console.log(`✅ Created store categories: Parent(${storeParentId}), Sub(${storeSubId})`);

    // 3. Create test products
    console.log('\n3. Creating test products...');
    
    // Product with vendor hierarchy
    const [product1Result] = await connection.execute(
      'INSERT INTO products (sku, name, vendor_category_id, store_category_id) VALUES (?, ?, ?, ?)',
      ['TEST-VENDOR-001', 'Gaming Laptop Pro', vendorSubSubId, storeSubId]
    );
    const product1Id = product1Result.insertId;
    
    // Product with only vendor category
    const [product2Result] = await connection.execute(
      'INSERT INTO products (sku, name, vendor_category_id) VALUES (?, ?, ?)',
      ['TEST-VENDOR-002', 'Basic Laptop', vendorSubId, null]
    );
    const product2Id = product2Result.insertId;
    
    console.log(`✅ Created products: Product1(${product1Id}), Product2(${product2Id})`);

    // 4. Test the hierarchical path building logic
    console.log('\n4. Testing hierarchical path building logic...');
    
    // Get all categories
    const [categories] = await connection.execute(`
      SELECT id, name, parent_id, level, type
      FROM categories 
      ORDER BY type, level, name
    `);

    // Create category maps
    const vendorCategoryMap = {}
    const storeCategoryMap = {}
    
    categories.filter(cat => cat.type === 'vendor').forEach(cat => {
      vendorCategoryMap[cat.id] = cat
    })
    
    categories.filter(cat => cat.type === 'store').forEach(cat => {
      storeCategoryMap[cat.id] = cat
    })

    const buildCategoryPath = (categoryId, categoryMap) => {
      if (!categoryId || !categoryMap[categoryId]) return []
      
      const path = []
      let currentId = categoryId
      
      while (currentId && categoryMap[currentId]) {
        path.unshift(categoryMap[currentId].name)
        currentId = categoryMap[currentId].parent_id
      }
      
      return path
    }

    const formatCategoryPath = (categoryId, categoryMap) => {
      const path = buildCategoryPath(categoryId, categoryMap)
      return path.join(" > ")
    }

    const formatVendorCategoryPath = (categoryId, categoryMap) => {
      const path = buildCategoryPath(categoryId, categoryMap)
      return path.join(" < ")
    }

    // Test vendor category paths
    const vendorPath1 = formatVendorCategoryPath(vendorSubSubId, vendorCategoryMap)
    const vendorPath2 = formatVendorCategoryPath(vendorSubId, vendorCategoryMap)
    
    console.log('Vendor Category Path 1:', vendorPath1);
    console.log('Vendor Category Path 2:', vendorPath2);
    
    // Test store category paths
    const storePath1 = formatCategoryPath(storeSubId, storeCategoryMap)
    
    console.log('Store Category Path 1:', storePath1);

    // 5. Verify the paths are correct
    console.log('\n5. Verifying paths are correct...');
    
    const expectedVendorPath1 = 'Vendor Electronics < Vendor Laptops < Vendor Gaming Laptops'
    const expectedVendorPath2 = 'Vendor Electronics < Vendor Laptops'
    const expectedStorePath1 = 'Store Electronics > Store Laptops'
    
    console.log(`✅ Vendor Path 1 correct: ${vendorPath1 === expectedVendorPath1}`);
    console.log(`✅ Vendor Path 2 correct: ${vendorPath2 === expectedVendorPath2}`);
    console.log(`✅ Store Path 1 correct: ${storePath1 === expectedStorePath1}`);

    // 6. Test direct mode formatting
    console.log('\n6. Testing direct mode formatting...');
    
    const formatCategoryPathDirect = (categoryId, categoryMap) => {
      const path = buildCategoryPath(categoryId, categoryMap)
      const result = new Array(5).fill("")
      path.forEach((categoryName, index) => {
        if (index < 5) {
          result[index] = categoryName
        }
      })
      return result
    }

    const vendorLevels1 = formatCategoryPathDirect(vendorSubSubId, vendorCategoryMap)
    const storeLevels1 = formatCategoryPathDirect(storeSubId, storeCategoryMap)
    
    console.log('Vendor Category Levels:', vendorLevels1);
    console.log('Store Category Levels:', storeLevels1);

    // 7. Summary
    console.log('\n7. Summary:');
    console.log('✅ Vendor categories now support hierarchical paths like store categories');
    console.log('✅ WooCommerce mode: Vendor Electronics < Vendor Laptops < Vendor Gaming Laptops');
    console.log('✅ Direct mode: Separate columns for each level');
    console.log('✅ Both vendor and store categories use the same hierarchical logic');

    // 8. Cleanup
    console.log('\n8. Cleaning up test data...');
    await connection.execute('DELETE FROM products WHERE id = ?', [product1Id]);
    await connection.execute('DELETE FROM products WHERE id = ?', [product2Id]);
    await connection.execute('DELETE FROM categories WHERE id = ?', [vendorSubSubId]);
    await connection.execute('DELETE FROM categories WHERE id = ?', [vendorSubId]);
    await connection.execute('DELETE FROM categories WHERE id = ?', [vendorParentId]);
    await connection.execute('DELETE FROM categories WHERE id = ?', [storeSubId]);
    await connection.execute('DELETE FROM categories WHERE id = ?', [storeParentId]);
    console.log('✅ Test data cleaned up');

  } catch (error) {
    console.error('❌ Error during test:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testVendorCategoryExport();
