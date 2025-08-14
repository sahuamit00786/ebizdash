const fs = require('fs')
const mysql = require('mysql2/promise')

// Database configuration
const dbConfig = {
  host: "45.77.196.170",
  user: "ebizdash_products_react",
  password: "products_react",
  database: "ebizdash_products_react",
  charset: 'utf8mb4'
}

// Generate test data with clear hierarchy
function generateHierarchyTestData() {
  const csvData = []
  const headers = [
    'sku', 'name', 'description', 'brand', 'mfn', 'stock', 
    'list_price', 'market_price', 'vendor_cost', 'special_price',
    'weight', 'length', 'width', 'height', 'google_category',
    'vendor_category', 'store_category',
    'vendor_subcategory_1', 'vendor_subcategory_2', 'vendor_subcategory_3',
    'store_subcategory_1', 'store_subcategory_2', 'store_subcategory_3',
    'published', 'featured', 'visibility'
  ]
  
  // Create clear hierarchical structure
  const hierarchies = [
    {
      vendor: 'Electronics',
      vendorSub: ['Mobile Devices', 'Smartphones', 'Premium'],
      store: 'Electronics',
      storeSub: ['Mobile', 'Smartphones', 'Flagship']
    },
    {
      vendor: 'Electronics',
      vendorSub: ['Computers', 'Laptops', 'Gaming'],
      store: 'Electronics', 
      storeSub: ['Computing', 'Portable', 'Gaming']
    },
    {
      vendor: 'Electronics',
      vendorSub: ['Audio', 'Headphones', 'Wireless'],
      store: 'Electronics',
      storeSub: ['Audio', 'Headphones', 'Premium']
    }
  ]
  
  for (let i = 1; i <= 10; i++) {
    const hierarchy = hierarchies[i % hierarchies.length]
    
    const product = {
      sku: `HIERARCHY-TEST-${i.toString().padStart(3, '0')}`,
      name: `Hierarchy Test Product ${i}`,
      description: `Test product ${i} for hierarchy verification`,
      brand: 'Test Brand',
      mfn: `MFN-HIER-${i}`,
      stock: 100,
      list_price: '99.99',
      market_price: '89.99',
      vendor_cost: '50.00',
      special_price: '79.99',
      weight: '1.5',
      length: '10',
      width: '5',
      height: '3',
      google_category: `${hierarchy.vendor} > ${hierarchy.vendorSub[0]} > ${hierarchy.vendorSub[1]}`,
      vendor_category: hierarchy.vendor,
      store_category: hierarchy.store,
      vendor_subcategory_1: hierarchy.vendorSub[0],
      vendor_subcategory_2: hierarchy.vendorSub[1],
      vendor_subcategory_3: hierarchy.vendorSub[2],
      store_subcategory_1: hierarchy.storeSub[0],
      store_subcategory_2: hierarchy.storeSub[1],
      store_subcategory_3: hierarchy.storeSub[2],
      published: 'true',
      featured: 'false',
      visibility: 'public'
    }
    csvData.push(product)
  }
  
  return { headers, csvData }
}

// Create CSV file
function createCSVFile(headers, csvData, filename) {
  const csvContent = [headers.join(',')]
  csvData.forEach(row => {
    csvContent.push(headers.map(header => `"${row[header]}"`).join(','))
  })
  
  fs.writeFileSync(filename, csvContent.join('\n'))
  return filename
}

// Verify category hierarchy in database
async function verifyCategoryHierarchy() {
  console.log(`🔍 VERIFYING CATEGORY HIERARCHY`)
  console.log(`===============================`)
  
  const connection = await mysql.createConnection(dbConfig)
  
  try {
    // Get all categories with their hierarchy information
    const [categories] = await connection.execute(`
      SELECT 
        c.id,
        c.name,
        c.parent_id,
        c.type,
        c.level,
        p.name as parent_name
      FROM categories c
      LEFT JOIN categories p ON c.parent_id = p.id
      WHERE c.type IN ('vendor', 'store')
      ORDER BY c.type, c.level, c.name
    `)
    
    console.log(`\n📊 Total categories found: ${categories.length}`)
    
    // Group by type
    const vendorCategories = categories.filter(c => c.type === 'vendor')
    const storeCategories = categories.filter(c => c.type === 'store')
    
    console.log(`\n🏷️  VENDOR CATEGORIES (${vendorCategories.length}):`)
    console.log(`   Level | ID | Name | Parent ID | Parent Name`)
    console.log(`   ------|----|------|-----------|------------`)
    
    vendorCategories.forEach(cat => {
      console.log(`   ${cat.level.toString().padStart(5)} | ${cat.id.toString().padStart(2)} | ${cat.name.padEnd(20)} | ${(cat.parent_id || 'NULL').toString().padStart(9)} | ${(cat.parent_name || 'ROOT').padEnd(11)}`)
    })
    
    console.log(`\n🏷️  STORE CATEGORIES (${storeCategories.length}):`)
    console.log(`   Level | ID | Name | Parent ID | Parent Name`)
    console.log(`   ------|----|------|-----------|------------`)
    
    storeCategories.forEach(cat => {
      console.log(`   ${cat.level.toString().padStart(5)} | ${cat.id.toString().padStart(2)} | ${cat.name.padEnd(20)} | ${(cat.parent_id || 'NULL').toString().padStart(9)} | ${(cat.parent_name || 'ROOT').padEnd(11)}`)
    })
    
    // Check for hierarchy issues
    console.log(`\n🔍 HIERARCHY ANALYSIS:`)
    
    // Check for categories with level > 1 but no parent
    const orphanedCategories = categories.filter(c => c.level > 1 && !c.parent_id)
    if (orphanedCategories.length > 0) {
      console.log(`   ❌ Found ${orphanedCategories.length} orphaned categories (level > 1 but no parent):`)
      orphanedCategories.forEach(cat => {
        console.log(`      - ${cat.name} (ID: ${cat.id}, Level: ${cat.level}, Type: ${cat.type})`)
      })
    } else {
      console.log(`   ✅ No orphaned categories found`)
    }
    
    // Check for proper hierarchy depth
    const maxLevels = {}
    categories.forEach(cat => {
      if (!maxLevels[cat.type]) maxLevels[cat.type] = 0
      if (cat.level > maxLevels[cat.type]) maxLevels[cat.type] = cat.level
    })
    
    console.log(`   📊 Maximum hierarchy depth:`)
    console.log(`      - Vendor categories: ${maxLevels.vendor || 0} levels`)
    console.log(`      - Store categories: ${maxLevels.store || 0} levels`)
    
    // Check for expected hierarchies
    const expectedHierarchies = [
      { type: 'vendor', path: ['Electronics', 'Mobile Devices', 'Smartphones', 'Premium'] },
      { type: 'vendor', path: ['Electronics', 'Computers', 'Laptops', 'Gaming'] },
      { type: 'vendor', path: ['Electronics', 'Audio', 'Headphones', 'Wireless'] },
      { type: 'store', path: ['Electronics', 'Mobile', 'Smartphones', 'Flagship'] },
      { type: 'store', path: ['Electronics', 'Computing', 'Portable', 'Gaming'] },
      { type: 'store', path: ['Electronics', 'Audio', 'Headphones', 'Premium'] }
    ]
    
    console.log(`\n🎯 EXPECTED HIERARCHIES:`)
    for (const expected of expectedHierarchies) {
      console.log(`   ${expected.type.toUpperCase()}: ${expected.path.join(' > ')}`)
    }
    
    // Verify each expected hierarchy
    console.log(`\n✅ HIERARCHY VERIFICATION:`)
    for (const expected of expectedHierarchies) {
      const hierarchyCategories = categories.filter(c => 
        c.type === expected.type && expected.path.includes(c.name)
      )
      
      if (hierarchyCategories.length === expected.path.length) {
        console.log(`   ✅ ${expected.type.toUpperCase()}: ${expected.path.join(' > ')} - FOUND`)
      } else {
        console.log(`   ❌ ${expected.type.toUpperCase()}: ${expected.path.join(' > ')} - MISSING (found ${hierarchyCategories.length}/${expected.path.length})`)
      }
    }
    
  } catch (error) {
    console.error(`   ❌ Hierarchy verification failed:`, error.message)
  } finally {
    await connection.end()
  }
}

// Generate test file
async function generateTestFile() {
  console.log(`\n📁 GENERATING HIERARCHY TEST FILE`)
  console.log(`=================================`)
  
  const { headers, csvData } = generateHierarchyTestData()
  const filename = 'hierarchy-test-10-products.csv'
  createCSVFile(headers, csvData, filename)
  
  console.log(`   ✅ Generated ${filename} with 10 products`)
  console.log(`   📊 Contains clear hierarchical structure:`)
  console.log(`      - Electronics > Mobile Devices > Smartphones > Premium`)
  console.log(`      - Electronics > Computers > Laptops > Gaming`)
  console.log(`      - Electronics > Audio > Headphones > Wireless`)
  
  return filename
}

// Run the verification
async function runHierarchyVerification() {
  console.log(`🚀 CATEGORY HIERARCHY VERIFICATION`)
  console.log(`===================================`)
  console.log(`⏰ Started at: ${new Date().toLocaleString()}`)
  
  await generateTestFile()
  await verifyCategoryHierarchy()
  
  console.log(`\n🎯 NEXT STEPS:`)
  console.log(`   1. Start the server: npm run server`)
  console.log(`   2. Import the hierarchy-test-10-products.csv file`)
  console.log(`   3. Run this verification again to check results`)
  console.log(`   4. Verify that categories have proper parent-child relationships`)
  
  console.log(`\n⏰ Completed at: ${new Date().toLocaleString()}`)
}

// Run the verification
if (require.main === module) {
  runHierarchyVerification().catch(console.error)
}

module.exports = {
  generateHierarchyTestData,
  createCSVFile,
  verifyCategoryHierarchy,
  generateTestFile
}
