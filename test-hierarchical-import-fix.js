const fs = require('fs');
const path = require('path');

// Test data that matches the user's example with proper hierarchy
const testData = `vendor_category,store_category,vendor_subcategory_1,vendor_subcategory_2,vendor_subcategory_3,vendor_subcategory_4,store_subcategory_1,store_subcategory_2,store_subcategory_3,store_subcategory_4,sku,name,description,brand,stock,list_price
Audio,Electronics,Speakers,Headphones,,,Speakers,Headphones,,,AUD001,Audio Speaker,High-quality audio speaker,AudioTech,50,99.99
Cameras & Drones,Electronics,Digital Cameras,Drones,,,Digital Cameras,Drones,,,CAM001,Digital Camera,Professional digital camera,CameraPro,25,299.99
Computers & Tablets,Electronics,Monitors,Laptops,Tablets,,Monitors,Laptops,Tablets,,COMP001,Gaming Laptop,High-performance gaming laptop,CompTech,30,1299.99
`;

// Write test CSV file
fs.writeFileSync('test-hierarchical-import-fix.csv', testData);
console.log('Test CSV file created: test-hierarchical-import-fix.csv');
console.log('\nExpected category structure:');
console.log('\nStore Categories:');
console.log('  Electronics (level 0)');
console.log('    └── Speakers (level 1)');
console.log('        └── Headphones (level 2)');
console.log('    └── Digital Cameras (level 1)');
console.log('        └── Drones (level 2)');
console.log('    └── Monitors (level 1)');
console.log('        └── Laptops (level 2)');
console.log('            └── Tablets (level 3)');
console.log('\nVendor Categories:');
console.log('  Audio (level 0)');
console.log('    └── Speakers (level 1)');
console.log('        └── Headphones (level 2)');
console.log('  Cameras & Drones (level 0)');
console.log('    └── Digital Cameras (level 1)');
console.log('        └── Drones (level 2)');
console.log('  Computers & Tablets (level 0)');
console.log('    └── Monitors (level 1)');
console.log('        └── Laptops (level 2)');
console.log('            └── Tablets (level 3)');
console.log('\nThis test will verify:');
console.log('1. Root categories are created properly');
console.log('2. Subcategories are created in the correct hierarchy');
console.log('3. Products are assigned to the deepest category in the hierarchy');
console.log('4. No duplicate categories are created');
console.log('5. Level numbers are calculated correctly');
