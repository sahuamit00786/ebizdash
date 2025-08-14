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

// Test the import process
async function testImportWithHierarchy() {
  console.log(`🧪 TESTING IMPORT WITH HIERARCHY`)
  console.log(`================================`)
  
  const connection = await mysql.createConnection(dbConfig)
  
  try {
    // Check current state
    console.log(`\n📊 CURRENT DATABASE STATE:`)
    
    const [currentCategories] = await connection.execute(`
      SELECT COUNT(*) as count FROM categories WHERE type IN ('vendor', 'store')
    `)
    
    const [currentProducts] = await connection.execute(`
      SELECT COUNT(*) as count FROM products
    `)
    
    console.log(`   Categories: ${currentCategories[0].count}`)
    console.log(`   Products: ${currentProducts[0].count}`)
    
    // Check if test file exists
    const testFile = 'hierarchy-test-10-products.csv'
    if (!fs.existsSync(testFile)) {
      console.log(`\n❌ Test file ${testFile} not found!`)
      console.log(`   Please run: node test-hierarchy-verification.js first`)
      return
    }
    
    console.log(`\n✅ Test file found: ${testFile}`)
    
    // Read and analyze the test file
    const csvContent = fs.readFileSync(testFile, 'utf8')
    const lines = csvContent.split('\n')
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim())
    const dataLines = lines.slice(1).filter(line => line.trim())
    
    console.log(`\n📊 TEST FILE ANALYSIS:`)
    console.log(`   Headers: ${headers.length} fields`)
    console.log(`   Data rows: ${dataLines.length} products`)
    
    // Analyze category structure in the file
    const vendorCategories = new Set()
    const storeCategories = new Set()
    const vendorPaths = new Map()
    const storePaths = new Map()
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i]
      if (!line.trim()) continue
      
      const values = line.split(',').map(v => v.replace(/"/g, '').trim())
      const row = {}
      headers.forEach((header, index) => {
        row[header] = values[index] || ''
      })
      
      // Collect vendor categories
      if (row.vendor_category) {
        vendorCategories.add(row.vendor_category)
        
        const path = [row.vendor_category]
        if (row.vendor_subcategory_1) path.push(row.vendor_subcategory_1)
        if (row.vendor_subcategory_2) path.push(row.vendor_subcategory_2)
        if (row.vendor_subcategory_3) path.push(row.vendor_subcategory_3)
        
        if (path.length > 1) {
          vendorPaths.set(row.vendor_category, path)
        }
      }
      
      // Collect store categories
      if (row.store_category) {
        storeCategories.add(row.store_category)
        
        const path = [row.store_category]
        if (row.store_subcategory_1) path.push(row.store_subcategory_1)
        if (row.store_subcategory_2) path.push(row.store_subcategory_2)
        if (row.store_subcategory_3) path.push(row.store_subcategory_3)
        
        if (path.length > 1) {
          storePaths.set(row.store_category, path)
        }
      }
    }
    
    console.log(`\n🏷️  CATEGORY STRUCTURE IN FILE:`)
    console.log(`   Vendor categories: ${vendorCategories.size}`)
    console.log(`   Store categories: ${storeCategories.size}`)
    console.log(`   Vendor hierarchies: ${vendorPaths.size}`)
    console.log(`   Store hierarchies: ${storePaths.size}`)
    
    // Show expected hierarchies
    console.log(`\n📋 EXPECTED HIERARCHIES:`)
    for (const [parent, path] of vendorPaths) {
      console.log(`   VENDOR: ${path.join(' > ')}`)
    }
    for (const [parent, path] of storePaths) {
      console.log(`   STORE: ${path.join(' > ')}`)
    }
    
    console.log(`\n🎯 IMPORT TEST INSTRUCTIONS:`)
    console.log(`   1. Start the server: npm run server`)
    console.log(`   2. Open the application in browser`)
    console.log(`   3. Go to Products > Import CSV`)
    console.log(`   4. Upload: ${testFile}`)
    console.log(`   5. Map fields (auto-mapping should work)`)
    console.log(`   6. Run the import`)
    console.log(`   7. Check the results in the database`)
    
    console.log(`\n🔍 WHAT TO LOOK FOR:`)
    console.log(`   ✅ Categories should be created with proper hierarchy`)
    console.log(`   ✅ Parent-child relationships should be maintained`)
    console.log(`   ✅ Import should be fast (under 10 seconds)`)
    console.log(`   ✅ No database errors or timeouts`)
    
    console.log(`\n📊 EXPECTED RESULTS:`)
    console.log(`   - ${vendorPaths.size} vendor hierarchies created`)
    console.log(`   - ${storePaths.size} store hierarchies created`)
    console.log(`   - ${dataLines.length} products imported`)
    console.log(`   - Proper parent_id relationships in database`)
    
  } catch (error) {
    console.error(`   ❌ Test failed:`, error.message)
  } finally {
    await connection.end()
  }
}

// Run the test
if (require.main === module) {
  testImportWithHierarchy().catch(console.error)
}

module.exports = {
  testImportWithHierarchy
}
