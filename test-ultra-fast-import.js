const fs = require('fs');
const path = require('path');

// Test configuration
const TOTAL_PRODUCTS = 10000;
const BATCH_SIZE = 1000;
const VENDOR_ID = 1;

// Generate test data
function generateTestData() {
  console.log(`🚀 Generating ${TOTAL_PRODUCTS} test products for ultra-fast import...`);
  
  const headers = [
    'sku',
    'name', 
    'description',
    'price',
    'cost',
    'stock_quantity',
    'vendor_category',
    'vendor_subcategory_1',
    'vendor_subcategory_2',
    'vendor_subcategory_3'
  ];
  
  const categories = [
    'Electronics',
    'Clothing', 
    'Home & Garden',
    'Sports & Outdoors',
    'Books & Media',
    'Automotive',
    'Health & Beauty',
    'Toys & Games',
    'Food & Beverages',
    'Tools & Hardware'
  ];
  
  const subcategories = {
    'Electronics': ['Smartphones', 'Laptops', 'Tablets', 'Accessories'],
    'Clothing': ['Men', 'Women', 'Kids', 'Accessories'],
    'Home & Garden': ['Furniture', 'Decor', 'Kitchen', 'Garden'],
    'Sports & Outdoors': ['Fitness', 'Camping', 'Cycling', 'Team Sports'],
    'Books & Media': ['Fiction', 'Non-Fiction', 'Educational', 'Entertainment'],
    'Automotive': ['Car Parts', 'Motorcycle', 'Truck', 'Accessories'],
    'Health & Beauty': ['Skincare', 'Haircare', 'Makeup', 'Wellness'],
    'Toys & Games': ['Board Games', 'Action Figures', 'Educational', 'Outdoor'],
    'Food & Beverages': ['Snacks', 'Beverages', 'Organic', 'Gourmet'],
    'Tools & Hardware': ['Power Tools', 'Hand Tools', 'Fasteners', 'Safety']
  };
  
  const subsubcategories = {
    'Smartphones': ['Android', 'iPhone', 'Accessories', 'Cases'],
    'Laptops': ['Gaming', 'Business', 'Student', 'Accessories'],
    'Men': ['Shirts', 'Pants', 'Shoes', 'Accessories'],
    'Women': ['Dresses', 'Tops', 'Shoes', 'Accessories'],
    'Furniture': ['Living Room', 'Bedroom', 'Office', 'Outdoor']
  };
  
  let csvContent = headers.join(',') + '\n';
  
  for (let i = 1; i <= TOTAL_PRODUCTS; i++) {
    const category = categories[i % categories.length];
    const subcategory = subcategories[category][i % subcategories[category].length];
    const subsubcategory = subsubcategories[subcategory] ? 
      subsubcategories[subcategory][i % subsubcategories[subcategory].length] : '';
    
    const product = {
      sku: `PROD-${String(i).padStart(6, '0')}`,
      name: `Test Product ${i} - ${category}`,
      description: `This is test product number ${i} in the ${category} category. Features include high quality and reliability.`,
      price: (Math.random() * 1000 + 10).toFixed(2),
      cost: (Math.random() * 500 + 5).toFixed(2),
      stock_quantity: Math.floor(Math.random() * 1000) + 1,
      vendor_category: category,
      vendor_subcategory_1: subcategory,
      vendor_subcategory_2: subsubcategory,
      vendor_subcategory_3: ''
    };
    
    csvContent += Object.values(product).map(value => `"${value}"`).join(',') + '\n';
    
    if (i % 1000 === 0) {
      console.log(`Generated ${i} products...`);
    }
  }
  
  return csvContent;
}

// Test ultra-fast import via API
async function testUltraFastImport(csvFilePath) {
  console.log('🧪 Testing ultra-fast import via API...');
  
  try {
    const FormData = require('form-data');
    const fs = require('fs');
    
    const formData = new FormData();
    formData.append('csvFile', fs.createReadStream(csvFilePath));
    
    const fieldMapping = {
      'sku': 'sku',
      'name': 'name',
      'description': 'description', 
      'price': 'price',
      'cost': 'cost',
      'stock_quantity': 'stock_quantity',
      'vendor_category': 'vendor_category',
      'vendor_subcategory_1': 'vendor_subcategory_1',
      'vendor_subcategory_2': 'vendor_subcategory_2',
      'vendor_subcategory_3': 'vendor_subcategory_3'
    };
    
    formData.append('fieldMapping', JSON.stringify(fieldMapping));
    formData.append('updateMode', 'false');
    formData.append('selectedVendor', VENDOR_ID.toString());
    
    const startTime = Date.now();
    
    const response = await fetch('http://localhost:3001/api/products/import/ultra-fast', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer YOUR_TOKEN_HERE' // Replace with actual token
      },
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    let imported = 0;
    let updated = 0;
    let skipped = 0;
    let errors = 0;
    let processingRate = 0;
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            
            if (data.type === 'progress') {
              imported = data.imported;
              updated = data.updated;
              skipped = data.skipped;
              errors = data.errors;
              processingRate = data.processingRate;
              
              const elapsed = (Date.now() - startTime) / 1000;
              const rate = Math.round(data.current / elapsed);
              
              console.log(`📊 Progress: ${data.current}/${data.total} (${Math.round(data.current/data.total*100)}%) | Rate: ${rate}/sec | Imported: ${imported} | Updated: ${updated} | Skipped: ${skipped} | Errors: ${errors}`);
            } else if (data.type === 'complete') {
              const totalTime = (Date.now() - startTime) / 1000;
              const avgRate = Math.round(data.total / totalTime);
              
              console.log(`✅ ULTRA FAST IMPORT COMPLETED!`);
              console.log(`📈 Results:`);
              console.log(`   - Total Products: ${data.total}`);
              console.log(`   - Imported: ${data.imported}`);
              console.log(`   - Updated: ${data.updated}`);
              console.log(`   - Skipped: ${data.skipped}`);
              console.log(`   - Errors: ${data.errors.length}`);
              console.log(`   - Processing Time: ${totalTime.toFixed(2)}s`);
              console.log(`   - Average Rate: ${avgRate} products/sec`);
              console.log(`   - Success Rate: ${Math.round((data.imported / data.total) * 100)}%`);
              
              return {
                success: true,
                data: data,
                processingTime: totalTime,
                avgRate: avgRate
              };
            } else if (data.type === 'error') {
              throw new Error(data.message);
            }
          } catch (parseError) {
            console.error('Error parsing progress data:', parseError);
          }
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Ultra-fast import test failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Performance comparison test
async function runPerformanceComparison() {
  console.log(`🚀 ULTRA FAST IMPORT PERFORMANCE TEST`);
  console.log(`=====================================`);
  
  // Generate test data
  const csvContent = generateTestData();
  const csvFilePath = `ultra-test-${Date.now()}.csv`;
  
  fs.writeFileSync(csvFilePath, csvContent);
  console.log(`📁 Test file created: ${csvFilePath}`);
  
  // Test ultra-fast import
  console.log(`\n🧪 Testing Ultra-Fast Import...`);
  const ultraFastResult = await testUltraFastImport(csvFilePath);
  
  if (ultraFastResult.success) {
    console.log(`\n🎯 PERFORMANCE SUMMARY:`);
    console.log(`   - Target: 10,000 products in under 60 seconds`);
    console.log(`   - Actual: ${ultraFastResult.processingTime.toFixed(2)} seconds`);
    console.log(`   - Rate: ${ultraFastResult.avgRate} products/sec`);
    console.log(`   - Status: ${ultraFastResult.processingTime <= 60 ? '✅ PASSED' : '❌ FAILED'}`);
    
    if (ultraFastResult.processingTime <= 60) {
      console.log(`\n🎉 SUCCESS! Ultra-fast import achieved target performance!`);
    } else {
      console.log(`\n⚠️  Performance target not met. Consider further optimizations.`);
    }
  } else {
    console.log(`\n❌ Test failed: ${ultraFastResult.error}`);
  }
  
  // Cleanup
  fs.unlinkSync(csvFilePath);
  console.log(`\n🧹 Test file cleaned up`);
}

// Run the test
if (require.main === module) {
  runPerformanceComparison().catch(console.error);
}

module.exports = {
  generateTestData,
  testUltraFastImport,
  runPerformanceComparison
};
