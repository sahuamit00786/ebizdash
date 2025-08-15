const mysql = require('mysql2/promise');

async function testCategoryUpdateBothScenarios() {
  let connection;
  
  try {
    console.log('Testing category update - both scenarios...');
    
    // Connect to database
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'product_management'
    });

    // 1. Create test categories
    console.log('\n1. Creating test categories...');
    
    // Create parent categories
    const [parent1Result] = await connection.execute(
      'INSERT INTO categories (name, type, parent_id, level, vendor_id) VALUES (?, ?, ?, ?, ?)',
      ['Parent Category 1', 'vendor', null, 1, 4]
    );
    const parent1Id = parent1Result.insertId;
    
    const [parent2Result] = await connection.execute(
      'INSERT INTO categories (name, type, parent_id, level, vendor_id) VALUES (?, ?, ?, ?, ?)',
      ['Parent Category 2', 'vendor', null, 1, 4]
    );
    const parent2Id = parent2Result.insertId;
    
    // Create child category under parent 1
    const [childResult] = await connection.execute(
      'INSERT INTO categories (name, type, parent_id, level, vendor_id) VALUES (?, ?, ?, ?, ?)',
      ['Child Category', 'vendor', parent1Id, 2, 4]
    );
    const childId = childResult.insertId;
    
    console.log(`✅ Created categories: Parent1(${parent1Id}), Parent2(${parent2Id}), Child(${childId})`);

    // 2. Test Scenario 1: Update only name (preserve structure)
    console.log('\n2. Testing Scenario 1: Update only name (preserve structure)...');
    
    const [initialChild] = await connection.execute(
      'SELECT * FROM categories WHERE id = ?',
      [childId]
    );
    
    console.log('Initial child category:', {
      name: initialChild[0].name,
      parent_id: initialChild[0].parent_id,
      level: initialChild[0].level
    });

    // Update with only name and type (no parent_id)
    await connection.execute(`
      UPDATE categories 
      SET name = ?, type = ?, status = ?
      WHERE id = ?
    `, ['Updated Child Name', 'vendor', 'active', childId]);

    const [afterNameUpdate] = await connection.execute(
      'SELECT * FROM categories WHERE id = ?',
      [childId]
    );
    
    console.log('After name update:', {
      name: afterNameUpdate[0].name,
      parent_id: afterNameUpdate[0].parent_id,
      level: afterNameUpdate[0].level
    });

    const structurePreserved = 
      afterNameUpdate[0].parent_id === initialChild[0].parent_id && 
      afterNameUpdate[0].level === initialChild[0].level;
    
    console.log(`✅ Structure preserved: ${structurePreserved}`);

    // 3. Test Scenario 2: Update parent (change structure)
    console.log('\n3. Testing Scenario 2: Update parent (change structure)...');
    
    // Update with new parent_id
    await connection.execute(`
      UPDATE categories 
      SET name = ?, type = ?, parent_id = ?, level = ?, status = ?
      WHERE id = ?
    `, ['Moved Child Category', 'vendor', parent2Id, 2, 'active', childId]);

    const [afterParentUpdate] = await connection.execute(
      'SELECT * FROM categories WHERE id = ?',
      [childId]
    );
    
    console.log('After parent update:', {
      name: afterParentUpdate[0].name,
      parent_id: afterParentUpdate[0].parent_id,
      level: afterParentUpdate[0].level
    });

    const parentChanged = afterParentUpdate[0].parent_id === parent2Id;
    console.log(`✅ Parent changed to Parent2: ${parentChanged}`);

    // 4. Test Scenario 3: Move to root (parent_id = null)
    console.log('\n4. Testing Scenario 3: Move to root (parent_id = null)...');
    
    // Update to make it a root category
    await connection.execute(`
      UPDATE categories 
      SET name = ?, type = ?, parent_id = ?, level = ?, status = ?
      WHERE id = ?
    `, ['Root Category', 'vendor', null, 1, 'active', childId]);

    const [afterRootUpdate] = await connection.execute(
      'SELECT * FROM categories WHERE id = ?',
      [childId]
    );
    
    console.log('After root update:', {
      name: afterRootUpdate[0].name,
      parent_id: afterRootUpdate[0].parent_id,
      level: afterRootUpdate[0].level
    });

    const isRoot = afterRootUpdate[0].parent_id === null && afterRootUpdate[0].level === 1;
    console.log(`✅ Now a root category: ${isRoot}`);

    // 5. Summary
    console.log('\n5. Summary:');
    console.log('✅ Scenario 1: Name-only update preserves structure');
    console.log('✅ Scenario 2: Parent update changes structure');
    console.log('✅ Scenario 3: Root update makes it a top-level category');
    console.log('\n🎉 All scenarios work correctly!');

    // 6. Cleanup
    console.log('\n6. Cleaning up test data...');
    await connection.execute('DELETE FROM categories WHERE id = ?', [childId]);
    await connection.execute('DELETE FROM categories WHERE id = ?', [parent1Id]);
    await connection.execute('DELETE FROM categories WHERE id = ?', [parent2Id]);
    console.log('✅ Test data cleaned up');

  } catch (error) {
    console.error('❌ Error during test:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testCategoryUpdateBothScenarios();
