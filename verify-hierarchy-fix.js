const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: '45.77.196.170',
  user: 'ebizdash_products_react',
  password: 'products_react',
  database: 'ebizdash_products_react'
};

async function verifyHierarchicalCategories() {
  let connection;
  
  try {
    console.log('🔍 Verifying Hierarchical Category Creation...\n');
    
    // Connect to database
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database\n');
    
    // 1. Check all categories with their hierarchy
    console.log('📊 All Categories with Hierarchy:');
    console.log('='.repeat(80));
    
    const [categories] = await connection.execute(`
      SELECT 
        id, name, type, parent_id, level,
        CASE 
          WHEN parent_id IS NULL THEN name
          WHEN parent_id IN (SELECT id FROM categories WHERE parent_id IS NULL) THEN 
            CONCAT((SELECT name FROM categories WHERE id = c.parent_id), ' > ', name)
          WHEN parent_id IN (SELECT id FROM categories WHERE parent_id IN (SELECT id FROM categories WHERE parent_id IS NULL)) THEN
            CONCAT(
              (SELECT name FROM categories WHERE id = (SELECT parent_id FROM categories WHERE id = c.parent_id)), 
              ' > ',
              (SELECT name FROM categories WHERE id = c.parent_id),
              ' > ',
              name
            )
          ELSE CONCAT('Level ', level, ': ', name)
        END as hierarchy_path
      FROM categories c
      ORDER BY type, level, name
    `);
    
    if (categories.length === 0) {
      console.log('❌ No categories found in database');
      return;
    }
    
    // Group by type
    const vendorCategories = categories.filter(c => c.type === 'vendor');
    const storeCategories = categories.filter(c => c.type === 'store');
    
    console.log('\n🏪 Store Categories:');
    storeCategories.forEach(cat => {
      console.log(`  ID: ${cat.id.toString().padStart(3)} | Level: ${cat.level} | ${cat.hierarchy_path}`);
    });
    
    console.log('\n🏭 Vendor Categories:');
    vendorCategories.forEach(cat => {
      console.log(`  ID: ${cat.id.toString().padStart(3)} | Level: ${cat.level} | ${cat.hierarchy_path}`);
    });
    
    // 2. Check for duplicate categories
    console.log('\n🔍 Checking for Duplicate Categories:');
    console.log('='.repeat(80));
    
    const [duplicates] = await connection.execute(`
      SELECT name, type, COUNT(*) as count
      FROM categories
      GROUP BY name, type
      HAVING COUNT(*) > 1
    `);
    
    if (duplicates.length === 0) {
      console.log('✅ No duplicate categories found');
    } else {
      console.log('❌ Duplicate categories found:');
      duplicates.forEach(dup => {
        console.log(`  - ${dup.name} (${dup.type}): ${dup.count} instances`);
      });
    }
    
    // 3. Check for orphaned categories (parent_id references non-existent category)
    console.log('\n🔍 Checking for Orphaned Categories:');
    console.log('='.repeat(80));
    
    const [orphans] = await connection.execute(`
      SELECT c.id, c.name, c.type, c.parent_id
      FROM categories c
      LEFT JOIN categories parent ON c.parent_id = parent.id
      WHERE c.parent_id IS NOT NULL AND parent.id IS NULL
    `);
    
    if (orphans.length === 0) {
      console.log('✅ No orphaned categories found');
    } else {
      console.log('❌ Orphaned categories found:');
      orphans.forEach(orphan => {
        console.log(`  - ${orphan.name} (${orphan.type}): parent_id ${orphan.parent_id} not found`);
      });
    }
    
    // 4. Check level consistency
    console.log('\n🔍 Checking Level Consistency:');
    console.log('='.repeat(80));
    
    const [levelIssues] = await connection.execute(`
      SELECT c.id, c.name, c.type, c.level, c.parent_id,
             COALESCE(parent.level, 0) as parent_level,
             COALESCE(parent.level, 0) + 1 as expected_level
      FROM categories c
      LEFT JOIN categories parent ON c.parent_id = parent.id
      WHERE c.level != COALESCE(parent.level, 0) + 1
    `);
    
    if (levelIssues.length === 0) {
      console.log('✅ All category levels are consistent');
    } else {
      console.log('❌ Level inconsistencies found:');
      levelIssues.forEach(issue => {
        console.log(`  - ${issue.name} (${issue.type}): level ${issue.level}, expected ${issue.expected_level}`);
      });
    }
    
    // 5. Check products and their category assignments
    console.log('\n📦 Products and Category Assignments:');
    console.log('='.repeat(80));
    
    const [products] = await connection.execute(`
      SELECT 
        p.id, p.sku, p.name,
        vc.name as vendor_category, vc.level as vendor_level,
        sc.name as store_category, sc.level as store_level
      FROM products p
      LEFT JOIN categories vc ON p.vendor_category_id = vc.id
      LEFT JOIN categories sc ON p.store_category_id = sc.id
      ORDER BY p.id
      LIMIT 10
    `);
    
    if (products.length === 0) {
      console.log('ℹ️  No products found in database');
    } else {
      console.log('Recent products:');
      products.forEach(prod => {
        console.log(`  ${prod.sku}: ${prod.name}`);
        console.log(`    Vendor: ${prod.vendor_category || 'None'} (level ${prod.vendor_level || 'N/A'})`);
        console.log(`    Store: ${prod.store_category || 'None'} (level ${prod.store_level || 'N/A'})`);
        console.log('');
      });
    }
    
    // 6. Summary statistics
    console.log('\n📈 Summary Statistics:');
    console.log('='.repeat(80));
    
    const [stats] = await connection.execute(`
      SELECT 
        type,
        COUNT(*) as total_categories,
        COUNT(CASE WHEN parent_id IS NULL THEN 1 END) as root_categories,
        COUNT(CASE WHEN parent_id IS NOT NULL THEN 1 END) as subcategories,
        MAX(level) as max_level
      FROM categories
      GROUP BY type
    `);
    
    stats.forEach(stat => {
      console.log(`${stat.type.toUpperCase()} Categories:`);
      console.log(`  Total: ${stat.total_categories}`);
      console.log(`  Root: ${stat.root_categories}`);
      console.log(`  Subcategories: ${stat.subcategories}`);
      console.log(`  Max Level: ${stat.max_level}`);
      console.log('');
    });
    
    console.log('✅ Verification completed successfully!');
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run verification
verifyHierarchicalCategories();
