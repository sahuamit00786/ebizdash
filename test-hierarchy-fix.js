const fs = require('fs');
const csv = require('csv-parser');

// Test data that should create a clean hierarchy
const testData = [
  {
    vendor_category: 'Electronics',
    vendor_subcategory_1: 'Smartphones',
    vendor_subcategory_2: 'Android',
    vendor_subcategory_3: 'Flagship',
    vendor_subcategory_4: 'New Premium'
  },
  {
    vendor_category: 'Electronics',
    vendor_subcategory_1: 'Smartphones',
    vendor_subcategory_2: 'Android',
    vendor_subcategory_3: 'Flagship',
    vendor_subcategory_4: 'New Premium'
  },
  {
    vendor_category: 'Electronics',
    vendor_subcategory_1: 'Smartphones',
    vendor_subcategory_2: 'Android',
    vendor_subcategory_3: 'Flagship',
    vendor_subcategory_4: 'New Premium'
  }
];

// Create test CSV file
const csvContent = [
  'vendor_category,vendor_subcategory_1,vendor_subcategory_2,vendor_subcategory_3,vendor_subcategory_4',
  'Electronics,Smartphones,Android,Flagship,New Premium',
  'Electronics,Smartphones,Android,Flagship,New Premium',
  'Electronics,Smartphones,Android,Flagship,New Premium'
].join('\n');

fs.writeFileSync('test-hierarchy-fix.csv', csvContent);

console.log('✅ Test CSV file created: test-hierarchy-fix.csv');
console.log('📋 Expected hierarchy: Electronics → Smartphones → Android → Flagship → New Premium');
console.log('🔍 This should create only 5 categories total, not 15+ duplicate categories');
console.log('');
console.log('📝 To test:');
console.log('1. Upload test-hierarchy-fix.csv to your product import');
console.log('2. Check that only 5 categories are created');
console.log('3. Verify the hierarchy is clean and flat');
