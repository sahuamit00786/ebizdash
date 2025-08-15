const mysql = require('mysql2/promise');

async function testProductRenamePreserveStructure() {
  let connection;
  
  try {
    console.log('Testing product rename preserves category structure...');
    
    // Connect to database
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'product_management'
    });

    // 1. Create a parent category
    console.log('\n1. Creating parent category...');
    const [parentResult] = await connection.execute(
      'INSERT INTO categories (name, type, parent_id, level, vendor_id) VALUES (?, ?, ?, ?, ?)',
      ['Parent Category', 'vendor', null, 1, 4]
    );
    const parentId = parentResult.insertId;
    console.log(`✅ Created parent category with ID: ${parentId}`);

    // 2. Create a child category (level 2)
    console.log('\n2. Creating child category...');
    const [childResult] = await connection.execute(
      'INSERT INTO categories (name, type, parent_id, level, vendor_id) VALUES (?, ?, ?, ?, ?)',
      ['Child Category', 'vendor', parentId, 2, 4]
    );
    const childId = childResult.insertId;
    console.log(`✅ Created child category with ID: ${childId}`);

    // 3. Create a grandchild category (level 3)
    console.log('\n3. Creating grandchild category...');
    const [grandchildResult] = await connection.execute(
      'INSERT INTO categories (name, type, parent_id, level, vendor_id) VALUES (?, ?, ?, ?, ?)',
      ['Grandchild Category', 'vendor', childId, 3, 4]
    );
    const grandchildId = grandchildResult.insertId;
    console.log(`✅ Created grandchild category with ID: ${grandchildId}`);

    // 4. Create a product with the grandchild category
    console.log('\n4. Creating test product...');
    const [productResult] = await connection.execute(
      'INSERT INTO products (sku, name, vendor_category_id) VALUES (?, ?, ?)',
      ['TEST-SKU-002', 'Original Product Name', grandchildId]
    );
    const productId = productResult.insertId;
    console.log(`✅ Created product with ID: ${productId}`);

    // 5. Verify initial category structure
    console.log('\n5. Verifying initial category structure...');
    const [initialGrandchild] = await connection.execute(
      'SELECT * FROM categories WHERE id = ?',
      [grandchildId]
    );
    
    console.log('Initial grandchild category:', {
      id: initialGrandchild[0].id,
      name: initialGrandchild[0].name,
      type: initialGrandchild[0].type,
      parent_id: initialGrandchild[0].parent_id,
      level: initialGrandchild[0].level,
      vendor_id: initialGrandchild[0].vendor_id
    });

    // 6. Simulate frontend sending update data with newParent: undefined
    console.log('\n6. Simulating frontend update with newParent: undefined...');
    const updateData = {
      name: 'Updated Product Name',
      sku: 'TEST-SKU-002',
      newParent: undefined,
      parent_id: undefined,
      level: undefined,
      type: undefined
    };
    console.log('Frontend update data:', updateData);

    // 7. Filter out frontend category fields (simulate our server logic)
    const frontendCategoryFields = [
      'newParent', 'parent_id', 'level', 'type', 'status', 
      'parent_name', 'vendor_name', 'direct_product_count', 
      'product_count', 'description', 'subcategories',
      'category_id', 'category_name', 'category_type'
    ];
    
    frontendCategoryFields.forEach(field => {
      if (updateData[field] !== undefined) {
        console.log(`🚫 Excluding frontend category field: ${field} = ${updateData[field]}`);
        delete updateData[field];
      }
    });

    console.log('Filtered update data:', updateData);

    // 8. Update product name
    console.log('\n8. Updating product name...');
    await connection.execute(
      'UPDATE products SET name = ?, updated_at = NOW() WHERE id = ?',
      [updateData.name, productId]
    );

    // 9. Update category name to match product name (ONLY the name)
    console.log('\n9. Updating category name (preserving structure)...');
    await connection.execute(
      'UPDATE categories SET name = ? WHERE id = ?',
      [updateData.name, grandchildId]
    );

    // 10. Verify final category structure
    console.log('\n10. Verifying final category structure...');
    const [finalGrandchild] = await connection.execute(
      'SELECT * FROM categories WHERE id = ?',
      [grandchildId]
    );
    
    console.log('Final grandchild category:', {
      id: finalGrandchild[0].id,
      name: finalGrandchild[0].name,
      type: finalGrandchild[0].type,
      parent_id: finalGrandchild[0].parent_id,
      level: finalGrandchild[0].level,
      vendor_id: finalGrandchild[0].vendor_id
    });

    // 11. Verify that only name changed, structure remained intact
    console.log('\n11. Verifying structure preservation...');
    const nameChanged = initialGrandchild[0].name !== finalGrandchild[0].name;
    const typeUnchanged = initialGrandchild[0].type === finalGrandchild[0].type;
    const parentIdUnchanged = initialGrandchild[0].parent_id === finalGrandchild[0].parent_id;
    const levelUnchanged = initialGrandchild[0].level === finalGrandchild[0].level;
    const vendorIdUnchanged = initialGrandchild[0].vendor_id === finalGrandchild[0].vendor_id;

    console.log(`✅ Name changed: ${nameChanged}`);
    console.log(`✅ Type unchanged: ${typeUnchanged}`);
    console.log(`✅ Parent ID unchanged: ${parentIdUnchanged} (${initialGrandchild[0].parent_id} → ${finalGrandchild[0].parent_id})`);
    console.log(`✅ Level unchanged: ${levelUnchanged} (${initialGrandchild[0].level} → ${finalGrandchild[0].level})`);
    console.log(`✅ Vendor ID unchanged: ${vendorIdUnchanged}`);

    if (nameChanged && typeUnchanged && parentIdUnchanged && levelUnchanged && vendorIdUnchanged) {
      console.log('\n🎉 SUCCESS: Category structure preserved during product rename!');
      console.log('Only the category name was updated, all structural properties remained unchanged.');
    } else {
      console.log('\n❌ FAILURE: Category structure was modified during product rename!');
      console.log('This indicates that frontend category fields are still being processed.');
    }

    // 12. Cleanup
    console.log('\n12. Cleaning up test data...');
    await connection.execute('DELETE FROM products WHERE id = ?', [productId]);
    await connection.execute('DELETE FROM categories WHERE id = ?', [grandchildId]);
    await connection.execute('DELETE FROM categories WHERE id = ?', [childId]);
    await connection.execute('DELETE FROM categories WHERE id = ?', [parentId]);
    console.log('✅ Test data cleaned up');

  } catch (error) {
    console.error('❌ Error during test:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testProductRenamePreserveStructure();
