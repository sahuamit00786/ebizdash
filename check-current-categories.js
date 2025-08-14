const mysql = require('mysql2/promise');

async function checkCurrentCategories() {
  const connection = await mysql.createConnection({
    host: '45.77.196.170',
    user: 'ebizdash_products_react',
    password: 'products_react',
    database: 'ebizdash_products_react',
    charset: 'utf8mb4'
  });

  try {
    console.log('Checking current categories in database...\n');

    // Get all categories
    const [categories] = await connection.execute(`
      SELECT 
        c.id, c.name, c.type, c.parent_id, c.level, 
        c.status, c.created_at,
        COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.store_category_id OR c.id = p.vendor_category_id
      GROUP BY c.id, c.name, c.type, c.parent_id, c.level, 
               c.status, c.created_at
      ORDER BY c.type, COALESCE(c.parent_id, c.id), c.level, c.name
    `);

    console.log('All categories:');
    console.log('ID | Name | Type | Parent | Level | Products');
    console.log('---|------|------|--------|-------|---------');
    
    categories.forEach(cat => {
      const parent = cat.parent_id ? cat.parent_id : 'NULL';
      console.log(`${cat.id.toString().padStart(3)} | ${cat.name.padEnd(15)} | ${cat.type.padEnd(6)} | ${parent.toString().padStart(6)} | ${cat.level.toString().padStart(5)} | ${cat.product_count}`);
    });

    // Check for duplicate names
    console.log('\nChecking for duplicate names:');
    const [duplicates] = await connection.execute(`
      SELECT name, COUNT(*) as count, GROUP_CONCAT(CONCAT(type, ':', id, ':', level) ORDER BY type, level) as details
      FROM categories 
      GROUP BY name 
      HAVING COUNT(*) > 1
      ORDER BY name
    `);

    if (duplicates.length > 0) {
      console.log('Duplicate category names found:');
      duplicates.forEach(dup => {
        console.log(`  "${dup.name}" (${dup.count} instances): ${dup.details}`);
      });
    } else {
      console.log('No duplicate category names found.');
    }

    // Check hierarchy issues
    console.log('\nChecking hierarchy issues:');
    const [orphans] = await connection.execute(`
      SELECT c.id, c.name, c.parent_id, c.level
      FROM categories c
      LEFT JOIN categories parent ON c.parent_id = parent.id
      WHERE c.parent_id IS NOT NULL AND parent.id IS NULL
    `);

    if (orphans.length > 0) {
      console.log('Categories with invalid parent references:');
      orphans.forEach(orphan => {
        console.log(`  ID: ${orphan.id}, Name: ${orphan.name}, Parent: ${orphan.parent_id}, Level: ${orphan.level}`);
      });
    } else {
      console.log('No orphaned categories found.');
    }

    // Check level inconsistencies
    const [levelIssues] = await connection.execute(`
      SELECT c.id, c.name, c.parent_id, c.level, parent.level as parent_level
      FROM categories c
      LEFT JOIN categories parent ON c.parent_id = parent.id
      WHERE c.parent_id IS NOT NULL AND c.level != parent.level + 1
    `);

    if (levelIssues.length > 0) {
      console.log('Categories with incorrect levels:');
      levelIssues.forEach(issue => {
        console.log(`  ID: ${issue.id}, Name: ${issue.name}, Level: ${issue.level}, Parent Level: ${issue.parent_level}, Expected: ${issue.parent_level + 1}`);
      });
    } else {
      console.log('No level inconsistencies found.');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

checkCurrentCategories();
