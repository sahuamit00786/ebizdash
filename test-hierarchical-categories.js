const fs = require('fs');
const path = require('path');

// Test data that matches the user's example
const testData = `vendor_category,store_category,vendor_subcategory_1,vendor_subcategory_2,vendor_subcategory_3,vendor_subcategory_4,store_subcategory_1,store_subcategory_2,store_subcategory_3,store_subcategory_4
Computer Accessories,Electronics,Computers,Accessories,Mice,,Computers,Accessories,Mice,
Gaming Accessories,Electronics,Computers,Accessories,Keyboards,,Computers,Accessories,Keyboards,
`;

// Write test CSV file
fs.writeFileSync('test-hierarchical-categories.csv', testData);
console.log('Test CSV file created: test-hierarchical-categories.csv');
console.log('\nExpected category structure:');
console.log('Store Categories:');
console.log('  Electronics (level 0)');
console.log('    └── Computers (level 1)');
console.log('        └── Accessories (level 2)');
console.log('            └── Mice (level 3)');
console.log('            └── Keyboards (level 3)');
console.log('\nVendor Categories:');
console.log('  Computer Accessories (level 0)');
console.log('    └── Computers (level 1)');
console.log('        └── Accessories (level 2)');
console.log('            └── Mice (level 3)');
console.log('  Gaming Accessories (level 0)');
console.log('    └── Computers (level 1)');
console.log('        └── Accessories (level 2)');
console.log('            └── Keyboards (level 3)');
