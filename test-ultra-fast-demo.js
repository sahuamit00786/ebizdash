const fs = require('fs');
const path = require('path');

// Demo configuration
const TOTAL_PRODUCTS = 1000; // Start with 1000 for demo
const VENDOR_ID = 1;

console.log('🚀 ULTRA-FAST IMPORT DEMO');
console.log('='.repeat(50));

// Generate demo CSV data
function generateDemoData() {
  console.log(`📊 Generating ${TOTAL_PRODUCTS} demo products...`);
  
  const headers = [
    'sku',
    'name', 
    'description',
    'price',
    'cost',
    'stock_quantity',
    'vendor_category',
    'vendor_subcategory_1',
    'vendor_subcategory_2'
  ];
  
  const categories = [
    'Electronics',
    'Clothing', 
    'Home & Garden',
    'Sports & Outdoors',
    'Books & Media'
  ];
  
  const subcategories = {
    'Electronics': ['Smartphones', 'Laptops', 'Tablets'],
    'Clothing': ['Men', 'Women', 'Kids'],
    'Home & Garden': ['Furniture', 'Decor', 'Kitchen'],
    'Sports & Outdoors': ['Fitness', 'Camping', 'Cycling'],
    'Books & Media': ['Fiction', 'Non-Fiction', 'Educational']
  };
  
  let csvContent = headers.join(',') + '\n';
  
  for (let i = 1; i <= TOTAL_PRODUCTS; i++) {
    const category = categories[i % categories.length];
    const subcategory = subcategories[category][i % subcategories[category].length];
    
    const product = {
      sku: `DEMO-${String(i).padStart(6, '0')}`,
      name: `Demo Product ${i} - ${category}`,
      description: `This is demo product number ${i} in the ${category} category.`,
      price: (Math.random() * 1000 + 10).toFixed(2),
      cost: (Math.random() * 500 + 5).toFixed(2),
      stock_quantity: Math.floor(Math.random() * 1000) + 1,
      vendor_category: category,
      vendor_subcategory_1: subcategory,
      vendor_subcategory_2: ''
    };
    
    csvContent += Object.values(product).map(value => `"${value}"`).join(',') + '\n';
  }
  
  return csvContent;
}

// Calculate estimated time for different modes
function calculateEstimatedTime(rows, mode) {
  let productsPerSecond = 0;
  
  switch (mode) {
    case 'ultra-fast':
      productsPerSecond = 1000;
      break;
    case 'lightning':
      productsPerSecond = 200;
      break;
    case 'standard':
      productsPerSecond = 50;
      break;
    default:
      productsPerSecond = 50;
  }
  
  const estimatedSeconds = Math.ceil(rows / productsPerSecond);
  
  if (estimatedSeconds < 60) {
    return `${estimatedSeconds} seconds`;
  } else if (estimatedSeconds < 3600) {
    const minutes = Math.ceil(estimatedSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  } else {
    const hours = Math.ceil(estimatedSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  }
}

// Show performance comparison
function showPerformanceComparison() {
  console.log('\n📈 PERFORMANCE COMPARISON');
  console.log('─'.repeat(50));
  
  const modes = [
    { name: 'Ultra-Fast', rate: 1000, description: '10,000+ products in <60 seconds' },
    { name: 'Lightning', rate: 200, description: '1,000-10,000 products in 5-50 seconds' },
    { name: 'Standard', rate: 50, description: 'Best for small datasets <1,000 products' }
  ];
  
  modes.forEach(mode => {
    const time = calculateEstimatedTime(TOTAL_PRODUCTS, mode.name.toLowerCase().replace('-', '-'));
    console.log(`🚀 ${mode.name.padEnd(12)} | ${mode.rate.toString().padStart(4)} products/sec | ${time.padEnd(15)} | ${mode.description}`);
  });
  
  console.log('─'.repeat(50));
}

// Main demo function
async function runDemo() {
  try {
    // Generate demo data
    const csvData = generateDemoData();
    const csvPath = path.join(__dirname, 'demo-ultra-fast.csv');
    fs.writeFileSync(csvPath, csvData);
    
    console.log(`✅ Demo CSV created: ${csvPath}`);
    console.log(`📁 File size: ${(fs.statSync(csvPath).size / 1024).toFixed(2)} KB`);
    
    // Show performance comparison
    showPerformanceComparison();
    
    // Show estimated times
    console.log('\n⏱️ ESTIMATED TIMES FOR THIS DEMO');
    console.log('─'.repeat(50));
    console.log(`📊 Products: ${TOTAL_PRODUCTS}`);
    console.log(`🚀 Ultra-Fast: ${calculateEstimatedTime(TOTAL_PRODUCTS, 'ultra-fast')}`);
    console.log(`⚡ Lightning: ${calculateEstimatedTime(TOTAL_PRODUCTS, 'lightning')}`);
    console.log(`📊 Standard: ${calculateEstimatedTime(TOTAL_PRODUCTS, 'standard')}`);
    console.log('─'.repeat(50));
    
    console.log('\n🎯 RECOMMENDATION:');
    if (TOTAL_PRODUCTS > 1000) {
      console.log('✅ Use ULTRA-FAST import for best performance');
    } else if (TOTAL_PRODUCTS > 100) {
      console.log('⚡ Use LIGHTNING import for good performance');
    } else {
      console.log('📊 Use STANDARD import is fine for small datasets');
    }
    
    console.log('\n📋 NEXT STEPS:');
    console.log('1. Start your server: npm run server');
    console.log('2. Open the application in browser');
    console.log('3. Go to Products > Import CSV');
    console.log('4. Select "🚀 Ultra-Fast Import" mode');
    console.log('5. Upload the demo-ultra-fast.csv file');
    console.log('6. Watch the console for real-time progress!');
    
    console.log('\n🔍 CONSOLE LOGS TO WATCH FOR:');
    console.log('• 🚀 STARTING IMPORT - ULTRA-FAST');
    console.log('• 📊 Progress updates with rate and time estimates');
    console.log('• ✅ IMPORT COMPLETED SUCCESSFULLY!');
    
  } catch (error) {
    console.error('❌ Demo error:', error);
  }
}

// Run the demo
runDemo();
