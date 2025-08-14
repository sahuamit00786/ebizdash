const fs = require('fs');
const csv = require('csv-parser');
const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: "45.77.196.170",
  user: "ebizdash_products_react",
  password: "products_react",
  database: "ebizdash_products_react",
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 50,
  queueLimit: 0
};

// Generate test CSV data
function generateTestCSV(rows = 100) {
  const headers = [
    'sku', 'name', 'short_description', 'description', 'brand', 'mfn',
    'stock', 'list_price', 'market_price', 'vendor_cost', 'special_price',
    'weight', 'length', 'width', 'height', 'google_category',
    'category_hierarchy', 'vendor_category', 'store_category',
    'vendor_subcategory_1', 'vendor_subcategory_2', 'vendor_subcategory_3',
    'store_subcategory_1', 'store_subcategory_2', 'store_subcategory_3',
    'published', 'featured', 'visibility', 'vendor_id',
    'meta_title', 'meta_description', 'meta_keywords'
  ];

  const csvContent = [headers.join(',')];
  
  for (let i = 1; i <= rows; i++) {
    const row = [
      `TEST-SKU-${i.toString().padStart(3, '0')}`,
      `Test Product ${i}`,
      `Short description for product ${i}`,
      `Detailed description for test product ${i}`,
      `Test Brand ${(i % 5) + 1}`,
      `MFN-${i.toString().padStart(3, '0')}`,
      Math.floor(Math.random() * 1000) + 1,
      (Math.random() * 1000 + 10).toFixed(2),
      (Math.random() * 900 + 10).toFixed(2),
      (Math.random() * 500 + 5).toFixed(2),
      (Math.random() * 800 + 10).toFixed(2),
      (Math.random() * 10 + 0.1).toFixed(2),
      (Math.random() * 50 + 5).toFixed(2),
      (Math.random() * 30 + 3).toFixed(2),
      (Math.random() * 20 + 2).toFixed(2),
      `Electronics > Category ${(i % 10) + 1}`,
      `Electronics > Category ${(i % 10) + 1} > Subcategory ${(i % 5) + 1}`,
      `Vendor Category ${(i % 8) + 1}`,
      `Store Category ${(i % 8) + 1}`,
      `Vendor Sub ${(i % 4) + 1}`,
      `Vendor Sub ${(i % 4) + 1} Level 2`,
      `Vendor Sub ${(i % 4) + 1} Level 3`,
      `Store Sub ${(i % 4) + 1}`,
      `Store Sub ${(i % 4) + 1} Level 2`,
      `Store Sub ${(i % 4) + 1} Level 3`,
      Math.random() > 0.5 ? 'true' : 'false',
      Math.random() > 0.8 ? 'true' : 'false',
      'public',
      (i % 3) + 1,
      `Meta Title for Product ${i}`,
      `Meta description for test product ${i}`,
      `keyword1,keyword2,keyword3`
    ];
    csvContent.push(row.join(','));
  }
  
  return csvContent.join('\n');
}

// Test database connection and basic operations
async function testDatabasePerformance() {
  console.log('Testing database performance...');
  
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    // Test basic query performance
    const startTime = Date.now();
    const [categories] = await connection.execute('SELECT COUNT(*) as count FROM categories');
    const queryTime = Date.now() - startTime;
    console.log(`Categories count query: ${queryTime}ms`);
    
    // Test insert performance
    const insertStartTime = Date.now();
    const [insertResult] = await connection.execute(
      'INSERT INTO categories (name, type, level, created_at) VALUES (?, ?, ?, NOW())',
      [`PERF-TEST-${Date.now()}`, 'vendor', 1]
    );
    const insertTime = Date.now() - insertStartTime;
    console.log(`Single category insert: ${insertTime}ms`);
    
    // Test bulk insert performance
    const bulkInsertStartTime = Date.now();
    const bulkValues = [];
    for (let i = 0; i < 50; i++) {
      bulkValues.push([`BULK-TEST-${Date.now()}-${i}`, 'vendor', 1, new Date()]);
    }
    
    // Use individual inserts for bulk test
    for (const values of bulkValues) {
      await connection.execute(
        'INSERT INTO categories (name, type, level, created_at) VALUES (?, ?, ?, ?)',
        values
      );
    }
    const bulkInsertTime = Date.now() - bulkInsertStartTime;
    console.log(`Bulk insert (50 categories): ${bulkInsertTime}ms (${Math.round(50 / (bulkInsertTime / 1000))} items/sec)`);
    
    // Clean up test data
    await connection.execute('DELETE FROM categories WHERE name LIKE "PERF-TEST-%" OR name LIKE "BULK-TEST-%"');
    
  } catch (error) {
    console.error('Database test error:', error);
  } finally {
    await connection.end();
  }
}

// Test CSV parsing performance
async function testCSVParsingPerformance(rows = 100) {
  console.log(`\nTesting CSV parsing performance for ${rows} rows...`);
  
  const csvContent = generateTestCSV(rows);
  const tempFile = `temp-test-${Date.now()}.csv`;
  
  try {
    // Write file synchronously
    fs.writeFileSync(tempFile, csvContent);
    
    const startTime = Date.now();
    const results = [];
    
    return new Promise((resolve, reject) => {
      // Add a small delay to ensure file is written
      setTimeout(() => {
        fs.createReadStream(tempFile)
          .pipe(csv())
          .on('data', (data) => results.push(data))
          .on('end', () => {
            const parseTime = Date.now() - startTime;
            console.log(`CSV parsing (${rows} rows): ${parseTime}ms (${Math.round(rows / (parseTime / 1000))} rows/sec)`);
            resolve(results);
          })
          .on('error', reject);
      }, 100);
    });
  } finally {
    // Clean up file
    setTimeout(() => {
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
    }, 200);
  }
}

// Test category processing performance
async function testCategoryProcessingPerformance(rows = 100) {
  console.log(`\nTesting category processing performance for ${rows} rows...`);
  
  const csvData = await testCSVParsingPerformance(rows);
  
  // Simulate category collection
  const startTime = Date.now();
  const allVendorCategories = new Set();
  const allStoreCategories = new Set();
  const allCategoryHierarchies = new Set();
  
  for (const row of csvData) {
    if (row.vendor_category) {
      allVendorCategories.add(row.vendor_category.trim());
    }
    if (row.store_category) {
      allStoreCategories.add(row.store_category.trim());
    }
    if (row.category_hierarchy) {
      allCategoryHierarchies.add(row.category_hierarchy.trim());
    }
  }
  
  const processingTime = Date.now() - startTime;
  console.log(`Category processing (${rows} rows): ${processingTime}ms`);
  console.log(`- Unique vendor categories: ${allVendorCategories.size}`);
  console.log(`- Unique store categories: ${allStoreCategories.size}`);
  console.log(`- Unique hierarchies: ${allCategoryHierarchies.size}`);
}

// Main performance test
async function runPerformanceTests() {
  console.log('=== IMPORT PERFORMANCE TEST ===\n');
  
  // Test database performance
  await testDatabasePerformance();
  
  // Test CSV parsing with different sizes
  await testCSVParsingPerformance(100);
  await testCSVParsingPerformance(500);
  await testCSVParsingPerformance(1000);
  
  // Test category processing
  await testCategoryProcessingPerformance(100);
  await testCategoryProcessingPerformance(500);
  await testCategoryProcessingPerformance(1000);
  
  console.log('\n=== PERFORMANCE TEST COMPLETE ===');
  console.log('\nRecommendations:');
  console.log('1. If CSV parsing is slow: Consider using streaming for large files');
  console.log('2. If database queries are slow: Check connection pool and indexes');
  console.log('3. If category processing is slow: Optimize the collection logic');
  console.log('4. For bulk imports: Use larger batch sizes (200-500 items)');
}

// Run the tests
runPerformanceTests().catch(console.error);
