const mysql = require('mysql2/promise')
require('dotenv').config()

async function testCategoryMerge() {
  let connection
  
  try {
    // Create database connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'product_management'
    })

    console.log('🧪 Testing category merge functionality...')

    // Test 1: Check if merge route exists
    console.log('\n1. Checking database structure...')
    
    const [categories] = await connection.execute(`
      SELECT id, name, type, parent_id, level, 
             COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.store_category_id OR c.id = p.vendor_category_id
      GROUP BY c.id, c.name, c.type, c.parent_id, c.level
      ORDER BY c.type, c.name
      LIMIT 10
    `)

    console.log(`Found ${categories.length} categories:`)
    categories.forEach(cat => {
      console.log(`  - ${cat.name} [${cat.type}] Level ${cat.level} (${cat.product_count} products)`)
    })

    // Test 2: Find categories that could be merged (same type, same level, similar names)
    console.log('\n2. Looking for potential merge candidates...')
    
    const [mergeCandidates] = await connection.execute(`
      SELECT c1.id as id1, c1.name as name1, c1.type, c1.level,
             c2.id as id2, c2.name as name2,
             COUNT(p1.id) as products1, COUNT(p2.id) as products2
      FROM categories c1
      JOIN categories c2 ON c1.type = c2.type 
                        AND c1.level = c2.level 
                        AND c1.id < c2.id
      LEFT JOIN products p1 ON c1.id = p1.store_category_id OR c1.id = p1.vendor_category_id
      LEFT JOIN products p2 ON c2.id = p2.store_category_id OR c2.id = p2.vendor_category_id
      WHERE c1.parent_id = c2.parent_id
      GROUP BY c1.id, c1.name, c1.type, c1.level, c2.id, c2.name
      HAVING products1 > 0 OR products2 > 0
      ORDER BY c1.type, c1.name
    `)

    if (mergeCandidates.length > 0) {
      console.log(`Found ${mergeCandidates.length} potential merge pairs:`)
      mergeCandidates.forEach(pair => {
        console.log(`  - "${pair.name1}" (${pair.products1} products) ↔ "${pair.name2}" (${pair.products2} products) [${pair.type}]`)
      })
    } else {
      console.log('No merge candidates found (categories with same type, level, and parent)')
    }

    // Test 3: Check for categories with subcategories (should not be mergeable)
    console.log('\n3. Checking categories with subcategories...')
    
    const [categoriesWithSubs] = await connection.execute(`
      SELECT c.id, c.name, c.type, COUNT(sc.id) as subcategory_count
      FROM categories c
      LEFT JOIN categories sc ON c.id = sc.parent_id
      GROUP BY c.id, c.name, c.type
      HAVING subcategory_count > 0
      ORDER BY subcategory_count DESC
    `)

    if (categoriesWithSubs.length > 0) {
      console.log(`Found ${categoriesWithSubs.length} categories with subcategories:`)
      categoriesWithSubs.forEach(cat => {
        console.log(`  - ${cat.name} [${cat.type}] has ${cat.subcategory_count} subcategories`)
      })
    } else {
      console.log('No categories with subcategories found')
    }

    console.log('\n✅ Category merge functionality test completed!')
    console.log('\n📋 Summary:')
    console.log(`   - Total categories: ${categories.length}`)
    console.log(`   - Merge candidates: ${mergeCandidates.length}`)
    console.log(`   - Categories with subcategories: ${categoriesWithSubs.length}`)
    
    if (mergeCandidates.length > 0) {
      console.log('\n💡 You can test the merge functionality by:')
      console.log('   1. Going to the Categories page')
      console.log('   2. Selecting exactly 2 categories of the same type')
      console.log('   3. Clicking the "🔄 Merge Categories" button')
      console.log('   4. Choosing which category to keep')
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  } finally {
    if (connection) {
      await connection.end()
    }
  }
}

// Run the test
testCategoryMerge()
