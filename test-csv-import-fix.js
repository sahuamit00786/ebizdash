const fs = require('fs');
const path = require('path');

// Create a test CSV file with duplicate description fields
const testCsvContent = `sku,name,description,description2,brand,stock,list_price
TEST001,Test Product 1,Main description,Secondary description,Brand A,10,29.99
TEST002,Test Product 2,Main description,Secondary description,Brand B,5,19.99`;

// Write test CSV file
fs.writeFileSync('test_import.csv', testCsvContent);

console.log('Test CSV file created: test_import.csv');
console.log('This file has duplicate description fields to test the fix');
console.log('You can now try importing this file through the web interface');
