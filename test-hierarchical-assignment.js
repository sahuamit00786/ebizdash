const fs = require('fs');
const path = require('path');

// Test data with hierarchical categories
const testData = `vendor_category,vendor_subcategory_1,vendor_subcategory_2,vendor_subcategory_3,vendor_subcategory_4,vendor_subcategory_5,sku,name,description
Electronics,Smartphones,Android,Flagship,5G,Premium,PHONE001,iPhone 15 Pro,Latest flagship smartphone
Electronics,Smartphones,Android,Flagship,5G,Standard,PHONE002,Samsung Galaxy S24,Android flagship device
Electronics,Computers,Laptops,Gaming,High-End,RTX Series,LAPTOP001,Alienware X17,Gaming laptop with RTX 4090
Electronics,Computers,Laptops,Business,Standard,Office,LAPTOP002,Dell Latitude,Business laptop
Electronics,Audio,Headphones,Wireless,Bluetooth,Noise Cancelling,AUDIO001,Sony WH-1000XM5,Wireless noise cancelling headphones`;

// Write test data to file
fs.writeFileSync('test-hierarchical-assignment.csv', testData);

console.log('✅ Test file created: test-hierarchical-assignment.csv');
console.log('');
console.log('📋 Test data includes:');
console.log('- Electronics > Smartphones > Android > Flagship > 5G > Premium');
console.log('- Electronics > Smartphones > Android > Flagship > 5G > Standard');
console.log('- Electronics > Computers > Laptops > Gaming > High-End > RTX Series');
console.log('- Electronics > Computers > Laptops > Business > Standard > Office');
console.log('- Electronics > Audio > Headphones > Wireless > Bluetooth > Noise Cancelling');
console.log('');
console.log('🎯 Expected behavior:');
console.log('- Products should be assigned to the DEEPEST category in their hierarchy');
console.log('- iPhone 15 Pro → Premium category');
console.log('- Samsung Galaxy S24 → Standard category');
console.log('- Alienware X17 → RTX Series category');
console.log('- Dell Latitude → Office category');
console.log('- Sony WH-1000XM5 → Noise Cancelling category');
console.log('');
console.log('🚀 You can now test this with your import functionality!');
