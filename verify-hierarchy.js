const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: '45.77.196.170',
  user: 'ebizdash_products_react',
  password: 'products_react',
  database: 'ebizdash_products_react',
  charset: 'utf8mb4'
};

async function verifyHierarchy() {
  let connection;
  
  try {
    console.log('🔍 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    
    console.log('📋 Verifying category hierarchy...\n');
    
    // Get all categories with their hierarchy information
    const [categories] = await connection.execute(`
      SELECT 
        id,
        name,
        type,
        parent_id,
        level,
        created_at,
        (SELECT COUNT(*) FROM products WHERE vendor_category_id = c.id OR store_category_id = c.id) as product_count
      FROM categories c
      ORDER BY type, level, name
    `);
    
    if (categories.length === 0) {
      console.log('❌ No categories found in database');
      return;
    }
    
    console.log(`📊 Found ${categories.length} total categories\n`);
    
    // Group by type
    const vendorCategories = categories.filter(c => c.type === 'vendor');
    const storeCategories = categories.filter(c => c.type === 'store');
    
    console.log('🏢 VENDOR CATEGORIES:');
    console.log('='.repeat(50));
    
    if (vendorCategories.length === 0) {
      console.log('No vendor categories found');
    } else {
      displayHierarchy(vendorCategories);
    }
    
    console.log('\n🏪 STORE CATEGORIES:');
    console.log('='.repeat(50));
    
    if (storeCategories.length === 0) {
      console.log('No store categories found');
    } else {
      displayHierarchy(storeCategories);
    }
    
    // Check for duplicates
    console.log('\n🔍 DUPLICATE CHECK:');
    console.log('='.repeat(50));
    
    const [duplicates] = await connection.execute(`
      SELECT 
        c1.name,
        c1.type,
        c1.parent_id,
        COUNT(*) as count,
        GROUP_CONCAT(c1.id ORDER BY c1.id) as ids
      FROM categories c1
      INNER JOIN categories c2 ON 
        c1.name = c2.name AND 
        c1.parent_id = c2.parent_id AND 
        c1.type = c2.type
      GROUP BY c1.name, c1.type, c1.parent_id
      HAVING COUNT(*) > 1
    `);
    
    if (duplicates.length === 0) {
      console.log('✅ No duplicate categories found!');
    } else {
      console.log(`❌ Found ${duplicates.length} duplicate category groups:`);
      duplicates.forEach(dup => {
        console.log(`   ${dup.name} (${dup.type}) - ${dup.count} instances: IDs ${dup.ids}`);
      });
    }
    
    // Expected hierarchy check
    console.log('\n🎯 EXPECTED HIERARCHY CHECK:');
    console.log('='.repeat(50));
    
    const expectedHierarchy = [
      { name: 'Electronics', level: 0, parent: null },
      { name: 'Smartphones', level: 1, parent: 'Electronics' },
      { name: 'Laptops', level: 1, parent: 'Electronics' },
      { name: 'Android', level: 2, parent: 'Smartphones' },
      { name: 'iOS', level: 2, parent: 'Smartphones' },
      { name: 'Windows', level: 2, parent: 'Laptops' },
      { name: 'MacOS', level: 2, parent: 'Laptops' },
      { name: 'Flagship', level: 3, parent: 'Android' },
      { name: 'Flagship', level: 3, parent: 'iOS' },
      { name: 'Gaming', level: 3, parent: 'Windows' },
      { name: 'Business', level: 3, parent: 'Windows' },
      { name: 'Creative', level: 3, parent: 'MacOS' },
      { name: 'New Premium', level: 4, parent: 'Flagship' },
      { name: 'High Performance', level: 4, parent: 'Gaming' },
      { name: 'Professional', level: 4, parent: 'Business' },
      { name: 'Studio', level: 4, parent: 'Creative' }
    ];
    
    let foundCount = 0;
    for (const expected of expectedHierarchy) {
      const found = vendorCategories.find(c => 
        c.name === expected.name && 
        c.level === expected.level &&
        (expected.parent === null ? c.parent_id === null : 
         vendorCategories.find(p => p.name === expected.parent)?.id === c.parent_id)
      );
      
      if (found) {
        console.log(`✅ ${expected.name} (Level ${expected.level}, Parent: ${expected.parent || 'ROOT'})`);
        foundCount++;
      } else {
        console.log(`❌ ${expected.name} (Level ${expected.level}, Parent: ${expected.parent || 'ROOT'}) - NOT FOUND`);
      }
    }
    
    console.log(`\n📊 Hierarchy completeness: ${foundCount}/${expectedHierarchy.length} expected categories found`);
    
  } catch (error) {
    console.error('❌ Error during verification:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

function displayHierarchy(categories) {
  // Create a map for quick parent lookup
  const categoryMap = new Map();
  categories.forEach(cat => categoryMap.set(cat.id, cat));
  
  // Find root categories (level 0 or parent_id is null)
  const rootCategories = categories.filter(cat => cat.level === 0 || cat.parent_id === null);
  
  if (rootCategories.length === 0) {
    console.log('No root categories found');
    return;
  }
  
  // Display each root category and its children
  rootCategories.forEach(root => {
    displayCategoryTree(root, categoryMap, 0);
  });
}

function displayCategoryTree(category, categoryMap, depth) {
  const indent = '  '.repeat(depth);
  const productInfo = category.product_count > 0 ? ` (${category.product_count} products)` : '';
  console.log(`${indent}${category.name} [ID: ${category.id}, Level: ${category.level}]${productInfo}`);
  
  // Find children
  const children = Array.from(categoryMap.values()).filter(cat => cat.parent_id === category.id);
  
  // Sort children by name for consistent display
  children.sort((a, b) => a.name.localeCompare(b.name));
  
  children.forEach(child => {
    displayCategoryTree(child, categoryMap, depth + 1);
  });
}

// Run the verification
if (require.main === module) {
  verifyHierarchy()
    .then(() => {
      console.log('\n🎉 Hierarchy verification completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Verification failed:', error);
      process.exit(1);
    });
}

module.exports = { verifyHierarchy };
