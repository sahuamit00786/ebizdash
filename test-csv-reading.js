const fs = require('fs')
const csv = require('csv-parser')

// Test CSV reading and field mapping
async function testCsvReading() {
  console.log(`📖 TESTING CSV READING AND FIELD MAPPING`)
  console.log(`========================================`)
  
  const testFile = 'hierarchy-test-10-products.csv'
  
  if (!fs.existsSync(testFile)) {
    console.log(`❌ Test file ${testFile} not found!`)
    return
  }
  
  console.log(`✅ Test file found: ${testFile}`)
  
  // Read CSV and analyze
  const results = []
  await new Promise((resolve, reject) => {
    fs.createReadStream(testFile)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', resolve)
      .on('error', reject)
  })
  
  console.log(`\n📊 CSV ANALYSIS:`)
  console.log(`   Total rows: ${results.length}`)
  console.log(`   Headers: ${Object.keys(results[0]).join(', ')}`)
  
  // Show first row
  console.log(`\n📋 FIRST ROW DATA:`)
  const firstRow = results[0]
  for (const [key, value] of Object.entries(firstRow)) {
    console.log(`   ${key}: "${value}"`)
  }
  
  // Test field mapping logic
  console.log(`\n🔍 FIELD MAPPING TEST:`)
  
  // Simulate the mapping that would be created
  const mapping = {
    'sku': 'sku',
    'name': 'name',
    'description': 'description',
    'brand': 'brand',
    'mfn': 'mfn',
    'stock': 'stock',
    'list_price': 'list_price',
    'market_price': 'market_price',
    'vendor_cost': 'vendor_cost',
    'special_price': 'special_price',
    'weight': 'weight',
    'length': 'length',
    'width': 'width',
    'height': 'height',
    'google_category': 'google_category',
    'vendor_category': 'vendor_category',
    'store_category': 'store_category',
    'vendor_subcategory_1': 'vendor_subcategory_1',
    'vendor_subcategory_2': 'vendor_subcategory_2',
    'vendor_subcategory_3': 'vendor_subcategory_3',
    'store_subcategory_1': 'store_subcategory_1',
    'store_subcategory_2': 'store_subcategory_2',
    'store_subcategory_3': 'store_subcategory_3',
    'published': 'published',
    'featured': 'featured',
    'visibility': 'visibility'
  }
  
  console.log(`   Mapping created: ${Object.keys(mapping).length} fields`)
  
  // Test category path building
  console.log(`\n🏷️  CATEGORY PATH BUILDING TEST:`)
  
  for (let i = 0; i < Math.min(3, results.length); i++) {
    const row = results[i]
    console.log(`\n   Row ${i + 1}:`)
    
    // Test vendor category path
    const vendorParent = row[mapping.vendor_category]
    if (vendorParent) {
      const vendorPath = [vendorParent.trim()]
      
      for (let j = 1; j <= 4; j++) {
        const subcategoryKey = `vendor_subcategory_${j}`
        
        // Find the CSV header that maps to this database field
        let csvHeader = null
        for (const [csvCol, dbField] of Object.entries(mapping)) {
          if (dbField === subcategoryKey) {
            csvHeader = csvCol
            break
          }
        }
        
        if (csvHeader && row[csvHeader] && row[csvHeader].trim() !== '') {
          vendorPath.push(row[csvHeader].trim())
          console.log(`     Vendor subcategory ${j}: "${row[csvHeader].trim()}" (from CSV header: "${csvHeader}")`)
        }
      }
      
      console.log(`     Vendor path: ${vendorPath.join(' > ')}`)
    }
    
    // Test store category path
    const storeParent = row[mapping.store_category]
    if (storeParent) {
      const storePath = [storeParent.trim()]
      
      for (let j = 1; j <= 4; j++) {
        const subcategoryKey = `store_subcategory_${j}`
        
        // Find the CSV header that maps to this database field
        let csvHeader = null
        for (const [csvCol, dbField] of Object.entries(mapping)) {
          if (dbField === subcategoryKey) {
            csvHeader = csvCol
            break
          }
        }
        
        if (csvHeader && row[csvHeader] && row[csvHeader].trim() !== '') {
          storePath.push(row[csvHeader].trim())
          console.log(`     Store subcategory ${j}: "${row[csvHeader].trim()}" (from CSV header: "${csvHeader}")`)
        }
      }
      
      console.log(`     Store path: ${storePath.join(' > ')}`)
    }
  }
  
  // Test the actual logic from the server
  console.log(`\n🧪 SERVER LOGIC SIMULATION:`)
  
  const vendorCategoryPaths = new Map()
  const storeCategoryPaths = new Map()
  
  for (const row of results) {
    // Build complete vendor category paths
    const vendorParent = row[mapping.vendor_category]
    if (vendorParent) {
      const path = [vendorParent.trim()]
      
      // Find the CSV headers that map to vendor subcategories
      for (let i = 1; i <= 4; i++) {
        const subcategoryKey = `vendor_subcategory_${i}`
        
        // Find the CSV header that maps to this database field
        let csvHeader = null
        for (const [csvCol, dbField] of Object.entries(mapping)) {
          if (dbField === subcategoryKey) {
            csvHeader = csvCol
            break
          }
        }
        
        if (csvHeader && row[csvHeader] && row[csvHeader].trim() !== '') {
          path.push(row[csvHeader].trim())
        }
      }
      
      if (path.length > 1) {
        vendorCategoryPaths.set(vendorParent.trim(), path)
      }
    }
    
    // Build complete store category paths
    const storeParent = row[mapping.store_category]
    if (storeParent) {
      const path = [storeParent.trim()]
      
      // Find the CSV headers that map to store subcategories
      for (let i = 1; i <= 4; i++) {
        const subcategoryKey = `store_subcategory_${i}`
        
        // Find the CSV header that maps to this database field
        let csvHeader = null
        for (const [csvCol, dbField] of Object.entries(mapping)) {
          if (dbField === subcategoryKey) {
            csvHeader = csvCol
            break
          }
        }
        
        if (csvHeader && row[csvHeader] && row[csvHeader].trim() !== '') {
          path.push(row[csvHeader].trim())
        }
      }
      
      if (path.length > 1) {
        storeCategoryPaths.set(storeParent.trim(), path)
      }
    }
  }
  
  console.log(`   Vendor hierarchies found: ${vendorCategoryPaths.size}`)
  console.log(`   Store hierarchies found: ${storeCategoryPaths.size}`)
  
  for (const [parent, path] of vendorCategoryPaths) {
    console.log(`   VENDOR: ${path.join(' > ')}`)
  }
  for (const [parent, path] of storeCategoryPaths) {
    console.log(`   STORE: ${path.join(' > ')}`)
  }
}

// Run the test
if (require.main === module) {
  testCsvReading().catch(console.error)
}

module.exports = {
  testCsvReading
}
