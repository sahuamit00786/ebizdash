const mysql = require('mysql2/promise');
const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

// Database configuration
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'inventory_management'
};

async function debugProductCounts() {
  let connection;
  
  try {
    console.log('🔍 Debugging product count logic...\n');
    
    // Connect to database
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database\n');

    // Test 1: Check direct product counts in database
    console.log('📊 Test 1: Direct database product counts...');
    
    const [directCounts] = await connection.execute(`
      SELECT 
        c.id,
        c.name,
        c.type,
        c.parent_id,
        c.level,
        COUNT(DISTINCT p.id) as direct_product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.store_category_id OR c.id = p.vendor_category_id
      GROUP BY c.id, c.name, c.type, c.parent_id, c.level
      ORDER BY c.type, c.level, c.name
    `);
    
    console.log(`Found ${directCounts.length} categories with direct counts:`);
    directCounts.forEach(cat => {
      console.log(`  📁 ${cat.name} [${cat.type}] Level ${cat.level}: ${cat.direct_product_count} direct products`);
    });

    // Test 2: Check hierarchical counts manually
    console.log('\n📊 Test 2: Manual hierarchical count calculation...');
    
    // Get a specific category to test
    const testCategory = directCounts.find(cat => cat.direct_product_count > 0);
    
    if (testCategory) {
      console.log(`Testing hierarchical count for: ${testCategory.name} (ID: ${testCategory.id})`);
      
      // Get all subcategories recursively
      const [subcategories] = await connection.execute(`
        WITH RECURSIVE category_tree AS (
          SELECT id, parent_id, 0 as level
          FROM categories 
          WHERE id = ?
          
          UNION ALL
          
          SELECT c.id, c.parent_id, ct.level + 1
          FROM categories c
          INNER JOIN category_tree ct ON c.parent_id = ct.id
          WHERE ct.level < 10
        )
        SELECT id FROM category_tree
      `, [testCategory.id]);
      
      const allCategoryIds = subcategories.map(row => row.id);
      console.log(`  Subcategory IDs: [${allCategoryIds.join(', ')}]`);
      
      // Count products in all subcategories
      const [hierarchicalCount] = await connection.execute(`
        SELECT COUNT(DISTINCT p.id) as total_count
        FROM products p
        WHERE p.store_category_id IN (${allCategoryIds.map(() => '?').join(',')}) 
           OR p.vendor_category_id IN (${allCategoryIds.map(() => '?').join(',')})
      `, [...allCategoryIds, ...allCategoryIds]);
      
      console.log(`  Manual hierarchical count: ${hierarchicalCount[0].total_count}`);
    }

    // Test 3: Compare with API results
    console.log('\n📊 Test 3: Comparing with API results...');
    
    const apiResponse = await axios.get(`${API_BASE}/categories`);
    const apiCategories = apiResponse.data.flatCategories;
    
    console.log(`API returned ${apiCategories.length} categories`);
    
    // Compare counts
    let discrepancies = 0;
    apiCategories.forEach(apiCat => {
      const dbCat = directCounts.find(db => db.id === apiCat.id);
      if (dbCat) {
        const apiCount = apiCat.product_count;
        const dbDirectCount = dbCat.direct_product_count;
        
        if (apiCount !== dbDirectCount) {
          console.log(`  ⚠️  ${apiCat.name}: API=${apiCount}, DB Direct=${dbDirectCount}`);
          discrepancies++;
        }
      }
    });
    
    if (discrepancies === 0) {
      console.log('✅ No discrepancies found between API and direct DB counts');
    } else {
      console.log(`⚠️  Found ${discrepancies} discrepancies (this is expected for hierarchical counts)`);
    }

    // Test 4: Check for string vs number issues
    console.log('\n📊 Test 4: Checking data types...');
    
    let stringCounts = 0;
    apiCategories.forEach(cat => {
      if (typeof cat.product_count === 'string') {
        console.log(`  ⚠️  ${cat.name}: Product count is string "${cat.product_count}"`);
        stringCounts++;
      }
    });
    
    if (stringCounts === 0) {
      console.log('✅ All product counts are numbers');
    } else {
      console.log(`⚠️  Found ${stringCounts} categories with string product counts`);
    }

    console.log('\n✅ Debugging completed!');

  } catch (error) {
    console.error('❌ Error debugging product counts:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the debug
debugProductCounts();
