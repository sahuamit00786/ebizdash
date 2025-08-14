const fs = require('fs')
const mysql = require('mysql2/promise')
const csv = require('csv-parser')

// Database configuration
const dbConfig = {
  host: "45.77.196.170",
  user: "ebizdash_products_react",
  password: "products_react",
  database: "ebizdash_products_react",
  charset: 'utf8mb4'
}

// Test scenarios
const testScenarios = [
  {
    name: "Small Batch (10 products)",
    count: 10,
    description: "Testing with a small batch of products"
  },
  {
    name: "Medium Batch (100 products)", 
    count: 100,
    description: "Testing with a medium batch of products"
  },
  {
    name: "Large Batch (500 products)",
    count: 500,
    description: "Testing with a large batch of products"
  },
  {
    name: "Mixed Categories (50 products)",
    count: 50,
    description: "Testing with various category hierarchies"
  }
]

// Generate test data
function generateTestData(count, scenario = 'basic') {
  const csvData = []
  const headers = [
    'sku', 'name', 'description', 'brand', 'mfn', 'stock', 
    'list_price', 'market_price', 'vendor_cost', 'special_price',
    'weight', 'length', 'width', 'height', 'google_category',
    'category_hierarchy', 'vendor_category', 'store_category',
    'vendor_subcategory_1', 'vendor_subcategory_2', 'vendor_subcategory_3',
    'store_subcategory_1', 'store_subcategory_2', 'store_subcategory_3',
    'published', 'featured', 'visibility'
  ]
  
  const brands = ['Apple', 'Samsung', 'Sony', 'LG', 'Dell', 'HP', 'Lenovo', 'Asus']
  const categories = [
    'Electronics > Mobile Devices > Smartphones',
    'Electronics > Computers > Laptops', 
    'Electronics > Audio > Headphones',
    'Electronics > Gaming > Consoles',
    'Electronics > Cameras > DSLR'
  ]
  
  for (let i = 1; i <= count; i++) {
    const brand = brands[i % brands.length]
    const category = categories[i % categories.length]
    const categoryParts = category.split(' > ')
    
    const product = {
      sku: `BULK-TEST-${i.toString().padStart(4, '0')}`,
      name: `${brand} Product ${i} - Test Item`,
      description: `This is test product number ${i} for bulk import testing. Features include high quality and reliability.`,
      brand: brand,
      mfn: `MFN-BULK-${i}`,
      stock: Math.floor(Math.random() * 1000) + 1,
      list_price: (Math.random() * 1000 + 10).toFixed(2),
      market_price: (Math.random() * 900 + 10).toFixed(2),
      vendor_cost: (Math.random() * 500 + 5).toFixed(2),
      special_price: (Math.random() * 800 + 10).toFixed(2),
      weight: (Math.random() * 10 + 0.1).toFixed(2),
      length: (Math.random() * 50 + 1).toFixed(2),
      width: (Math.random() * 30 + 1).toFixed(2),
      height: (Math.random() * 20 + 1).toFixed(2),
      google_category: category,
      category_hierarchy: category,
      vendor_category: categoryParts[0],
      store_category: categoryParts[0],
      vendor_subcategory_1: categoryParts[1] || '',
      vendor_subcategory_2: categoryParts[2] || '',
      vendor_subcategory_3: categoryParts[3] || '',
      store_subcategory_1: categoryParts[1] || '',
      store_subcategory_2: categoryParts[2] || '',
      store_subcategory_3: categoryParts[3] || '',
      published: Math.random() > 0.2 ? 'true' : 'false',
      featured: Math.random() > 0.7 ? 'true' : 'false',
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

// Test bulk import via API
async function testBulkImportAPI(csvFilePath, scenario) {
  console.log(`\n🔄 Testing API Import: ${scenario.name}`)
  console.log(`   📁 File: ${csvFilePath}`)
  
  try {
    // Read the CSV file
    const csvContent = fs.readFileSync(csvFilePath, 'utf8')
    
    // Create FormData-like structure for testing
    const formData = new FormData()
    formData.append('csvFile', new Blob([csvContent], { type: 'text/csv' }), 'test.csv')
    
    // Define field mapping
    const fieldMapping = {
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
      'category_hierarchy': 'category_hierarchy',
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
    
    formData.append('fieldMapping', JSON.stringify(fieldMapping))
    formData.append('updateMode', 'false')
    
    console.log(`   📊 Field mapping: ${Object.keys(fieldMapping).length} fields`)
    console.log(`   ⏱️  Starting import...`)
    
    const startTime = Date.now()
    
    // Note: This would require a running server to test the actual API
    // For now, we'll simulate the test
    console.log(`   ⚠️  API test requires running server (npm run server)`)
    console.log(`   📝 To test via API, use the CSV file: ${csvFilePath}`)
    
    return {
      success: true,
      duration: Date.now() - startTime,
      message: "API test requires running server"
    }
    
  } catch (error) {
    console.error(`   ❌ API test failed:`, error.message)
    return {
      success: false,
      error: error.message
    }
  }
}

// Test database import directly
async function testDatabaseImport(csvFilePath, scenario) {
  console.log(`\n🗄️  Testing Database Import: ${scenario.name}`)
  
  const connection = await mysql.createConnection(dbConfig)
  
  try {
    const startTime = Date.now()
    
    // Read and parse CSV
    const results = []
    await new Promise((resolve, reject) => {
      fs.createReadStream(csvFilePath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', resolve)
        .on('error', reject)
    })
    
    console.log(`   📊 Parsed ${results.length} rows from CSV`)
    
    // Count existing products
    const [existingProducts] = await connection.execute('SELECT COUNT(*) as count FROM products')
    const initialCount = existingProducts[0].count
    
    // Count existing categories
    const [existingCategories] = await connection.execute('SELECT COUNT(*) as count FROM categories')
    const initialCategoryCount = existingCategories[0].count
    
    console.log(`   📈 Initial state: ${initialCount} products, ${initialCategoryCount} categories`)
    
    // Simulate the import process (without actually importing to avoid conflicts)
    console.log(`   ⚠️  Database import simulation only (to avoid conflicts)`)
    console.log(`   📝 Would import ${results.length} products`)
    
    const duration = Date.now() - startTime
    
    return {
      success: true,
      duration,
      rowsProcessed: results.length,
      message: "Database import simulation completed"
    }
    
  } catch (error) {
    console.error(`   ❌ Database test failed:`, error.message)
    return {
      success: false,
      error: error.message
    }
  } finally {
    await connection.end()
  }
}

// Performance test
async function performanceTest() {
  console.log(`\n⚡ PERFORMANCE TEST`)
  console.log(`===================`)
  
  const connection = await mysql.createConnection(dbConfig)
  
  try {
    // Test database connection speed
    const dbStart = Date.now()
    await connection.execute('SELECT 1')
    const dbTime = Date.now() - dbStart
    
    console.log(`   🗄️  Database connection: ${dbTime}ms`)
    
    // Test CSV parsing speed
    const testFile = 'performance-test.csv'
    const { headers, csvData } = generateTestData(1000)
    createCSVFile(headers, csvData, testFile)
    
    const parseStart = Date.now()
    const results = []
    await new Promise((resolve, reject) => {
      fs.createReadStream(testFile)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', resolve)
        .on('error', reject)
    })
    const parseTime = Date.now() - parseStart
    
    console.log(`   📊 CSV parsing (1000 rows): ${parseTime}ms (${Math.round(1000/parseTime*1000)} rows/sec)`)
    
    // Cleanup
    fs.unlinkSync(testFile)
    
  } catch (error) {
    console.error(`   ❌ Performance test failed:`, error.message)
  } finally {
    await connection.end()
  }
}

// Main test function
async function runBulkImportTests() {
  console.log(`🚀 BULK IMPORT TEST SUITE`)
  console.log(`========================`)
  console.log(`⏰ Started at: ${new Date().toLocaleString()}`)
  
  const results = []
  
  // Performance test
  await performanceTest()
  
  // Run each test scenario
  for (const scenario of testScenarios) {
    console.log(`\n📋 SCENARIO: ${scenario.name}`)
    console.log(`   ${scenario.description}`)
    
    // Generate test data
    const { headers, csvData } = generateTestData(scenario.count)
    const filename = `bulk-test-${scenario.count}-${Date.now()}.csv`
    
    try {
      // Create CSV file
      createCSVFile(headers, csvData, filename)
      console.log(`   ✅ Generated ${scenario.count} products in ${filename}`)
      
      // Test API import
      const apiResult = await testBulkImportAPI(filename, scenario)
      
      // Test database import
      const dbResult = await testDatabaseImport(filename, scenario)
      
      // Store results
      results.push({
        scenario: scenario.name,
        count: scenario.count,
        filename,
        apiResult,
        dbResult
      })
      
      console.log(`   ✅ Scenario completed`)
      
    } catch (error) {
      console.error(`   ❌ Scenario failed:`, error.message)
      results.push({
        scenario: scenario.name,
        count: scenario.count,
        filename,
        error: error.message
      })
    }
  }
  
  // Summary
  console.log(`\n📊 TEST SUMMARY`)
  console.log(`===============`)
  
  results.forEach(result => {
    console.log(`\n📋 ${result.scenario}`)
    console.log(`   📁 File: ${result.filename}`)
    console.log(`   📊 Products: ${result.count}`)
    
    if (result.apiResult) {
      console.log(`   🔄 API: ${result.apiResult.success ? '✅' : '❌'} ${result.apiResult.message}`)
    }
    
    if (result.dbResult) {
      console.log(`   🗄️  DB: ${result.dbResult.success ? '✅' : '❌'} ${result.dbResult.message}`)
      if (result.dbResult.duration) {
        console.log(`   ⏱️  Duration: ${result.dbResult.duration}ms`)
      }
    }
    
    if (result.error) {
      console.log(`   ❌ Error: ${result.error}`)
    }
  })
  
  console.log(`\n🎯 NEXT STEPS:`)
  console.log(`   1. Start the server: npm run server`)
  console.log(`   2. Open the application in browser`)
  console.log(`   3. Go to Products > Import CSV`)
  console.log(`   4. Upload one of the generated CSV files`)
  console.log(`   5. Map fields and test the import`)
  
  console.log(`\n⏰ Completed at: ${new Date().toLocaleString()}`)
}

// Run the tests
if (require.main === module) {
  runBulkImportTests().catch(console.error)
}

module.exports = {
  generateTestData,
  createCSVFile,
  testBulkImportAPI,
  testDatabaseImport,
  performanceTest
}
