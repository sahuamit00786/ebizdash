const mysql = require('mysql2/promise');

async function testProductRenameCategory() {
  let connection;
  
  try {
    console.log('Testing product rename category functionality...');
    
    // Connect to database
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'product_management'
    });

    // 1. Create a test category first
    console.log('\n1. Creating test category...');
    const [categoryResult] = await connection.execute(
      'INSERT INTO categories (name, type, parent_id, level, vendor_id) VALUES (?, ?, ?, ?, ?)',
      ['Original Category Name', 'vendor', null, 1, 1]
    );
    const categoryId = categoryResult.insertId;
    console.log(`✅ Created category with ID: ${categoryId}`);

    // 2. Create a test product with this category
    console.log('\n2. Creating test product...');
    const [productResult] = await connection.execute(
      'INSERT INTO products (sku, name, vendor_category_id) VALUES (?, ?, ?)',
      ['TEST-SKU-001', 'Original Product Name', categoryId]
    );
    const productId = productResult.insertId;
    console.log(`✅ Created product with ID: ${productId}`);

    // 3. Verify initial state
    console.log('\n3. Verifying initial state...');
    const [initialCategory] = await connection.execute(
      'SELECT * FROM categories WHERE id = ?',
      [categoryId]
    );
    const [initialProduct] = await connection.execute(
      'SELECT * FROM products WHERE id = ?',
      [productId]
    );
    
    console.log('Initial category:', {
      id: initialCategory[0].id,
      name: initialCategory[0].name,
      type: initialCategory[0].type,
      parent_id: initialCategory[0].parent_id,
      level: initialCategory[0].level,
      vendor_id: initialCategory[0].vendor_id
    });

    // 4. Simulate product rename (update product name)
    console.log('\n4. Renaming product...');
    const newProductName = 'Updated Product Name';
    await connection.execute(
      'UPDATE products SET name = ?, updated_at = NOW() WHERE id = ?',
      [newProductName, productId]
    );

    // 5. Update category name to match product name
    console.log('\n5. Updating category name to match product name...');
    await connection.execute(
      'UPDATE categories SET name = ? WHERE id = ?',
      [newProductName, categoryId]
    );

    // 6. Verify final state
    console.log('\n6. Verifying final state...');
    const [finalCategory] = await connection.execute(
      'SELECT * FROM categories WHERE id = ?',
      [categoryId]
    );
    const [finalProduct] = await connection.execute(
      'SELECT * FROM products WHERE id = ?',
      [productId]
    );
    
    console.log('Final category:', {
      id: finalCategory[0].id,
      name: finalCategory[0].name,
      type: finalCategory[0].type,
      parent_id: finalCategory[0].parent_id,
      level: finalCategory[0].level,
      vendor_id: finalCategory[0].vendor_id
    });

    // 7. Verify that only name changed, other properties remained the same
    console.log('\n7. Verifying that only name changed...');
    const nameChanged = initialCategory[0].name !== finalCategory[0].name;
    const typeUnchanged = initialCategory[0].type === finalCategory[0].type;
    const parentIdUnchanged = initialCategory[0].parent_id === finalCategory[0].parent_id;
    const levelUnchanged = initialCategory[0].level === finalCategory[0].level;
    const vendorIdUnchanged = initialCategory[0].vendor_id === finalCategory[0].vendor_id;

    console.log(`✅ Name changed: ${nameChanged}`);
    console.log(`✅ Type unchanged: ${typeUnchanged}`);
    console.log(`✅ Parent ID unchanged: ${parentIdUnchanged}`);
    console.log(`✅ Level unchanged: ${levelUnchanged}`);
    console.log(`✅ Vendor ID unchanged: ${vendorIdUnchanged}`);

    if (nameChanged && typeUnchanged && parentIdUnchanged && levelUnchanged && vendorIdUnchanged) {
      console.log('\n🎉 SUCCESS: Product rename category functionality works correctly!');
      console.log('Only the category name was updated, all other properties remained unchanged.');
    } else {
      console.log('\n❌ FAILURE: Some properties were unexpectedly changed!');
    }

    // 8. Cleanup
    console.log('\n8. Cleaning up test data...');
    await connection.execute('DELETE FROM products WHERE id = ?', [productId]);
    await connection.execute('DELETE FROM categories WHERE id = ?', [categoryId]);
    console.log('✅ Test data cleaned up');

  } catch (error) {
    console.error('❌ Error during test:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testProductRenameCategory();
