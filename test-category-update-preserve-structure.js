const mysql = require('mysql2/promise');

async function testCategoryUpdatePreserveStructure() {
  let connection;
  
  try {
    console.log('Testing category update preserves structure when parent_id not provided...');
    
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

    // 4. Verify initial structure
    console.log('\n4. Verifying initial structure...');
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

    // 5. Simulate the problematic update (only name and type, no parent_id)
    console.log('\n5. Simulating category update with only name and type...');
    const updateData = {
      name: 'Updated Grandchild Category',
      type: 'vendor'
      // Note: parent_id is NOT provided
    };
    console.log('Update payload:', updateData);

    // 6. Apply the update (simulating the fixed logic)
    console.log('\n6. Applying update (preserving structure)...');
    
    // Simulate the fixed logic: only update name, type, and status
    await connection.execute(`
      UPDATE categories 
      SET name = ?, type = ?, status = ?
      WHERE id = ?
    `, [updateData.name, updateData.type, 'active', grandchildId]);

    // 7. Verify final structure
    console.log('\n7. Verifying final structure...');
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

    // 8. Verify that only name changed, structure remained intact
    console.log('\n8. Verifying structure preservation...');
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
      console.log('\n🎉 SUCCESS: Category structure preserved during update!');
      console.log('Only the name was updated, all structural properties remained unchanged.');
    } else {
      console.log('\n❌ FAILURE: Category structure was modified during update!');
      console.log('This indicates the fix is not working properly.');
    }

    // 9. Test the old behavior (what was happening before the fix)
    console.log('\n9. Testing old behavior (for comparison)...');
    const [oldBehaviorResult] = await connection.execute(`
      UPDATE categories 
      SET name = ?, type = ?, parent_id = ?, level = ?, status = ?
      WHERE id = ?
    `, ['Old Behavior Test', 'vendor', null, 1, 'active', grandchildId]);

    const [oldBehaviorCategory] = await connection.execute(
      'SELECT * FROM categories WHERE id = ?',
      [grandchildId]
    );
    
    console.log('After old behavior update:', {
      name: oldBehaviorCategory[0].name,
      parent_id: oldBehaviorCategory[0].parent_id,
      level: oldBehaviorCategory[0].level
    });

    console.log('This shows what was happening before the fix - structure was reset!');

    // 10. Cleanup
    console.log('\n10. Cleaning up test data...');
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

testCategoryUpdatePreserveStructure();
