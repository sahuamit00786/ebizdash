const fs = require('fs');
const path = require('path');

// Test data with 5 levels of subcategories
const testData = [
  {
    sku: "TEST001",
    name: "Test Product with 5 Subcategories",
    description: "Testing category hierarchy with 5 levels",
    brand: "Test Brand",
    stock: 10,
    list_price: 99.99,
    market_price: 89.99,
    vendor_cost: 50.00,
    special_price: 79.99,
    weight: 1.0,
    length: 10,
    width: 5,
    height: 3,
    google_category: "Electronics",
    vendor_category: "Electronics",
    store_category: "Electronics",
    vendor_subcategory_1: "Computers",
    vendor_subcategory_2: "Laptops", 
    vendor_subcategory_3: "Gaming",
    vendor_subcategory_4: "High-End",
    vendor_subcategory_5: "RTX Series",
    store_subcategory_1: "Computing",
    store_subcategory_2: "Portable",
    store_subcategory_3: "Gaming",
    store_subcategory_4: "Premium",
    store_subcategory_5: "Latest",
    published: true,
    featured: false,
    visibility: "public",
    vendor_id: 1,
    meta_title: "Test Product",
    meta_description: "Test product description",
    meta_keywords: "test, product, category"
  },
  {
    sku: "TEST002", 
    name: "Test Product with 3 Subcategories",
    description: "Testing category hierarchy with 3 levels",
    brand: "Test Brand",
    stock: 5,
    list_price: 49.99,
    market_price: 39.99,
    vendor_cost: 25.00,
    special_price: 34.99,
    weight: 0.5,
    length: 5,
    width: 3,
    height: 2,
    google_category: "Electronics",
    vendor_category: "Electronics",
    store_category: "Electronics",
    vendor_subcategory_1: "Mobile",
    vendor_subcategory_2: "Smartphones",
    vendor_subcategory_3: "Android",
    vendor_subcategory_4: "",
    vendor_subcategory_5: "",
    store_subcategory_1: "Mobile",
    store_subcategory_2: "Smartphones", 
    store_subcategory_3: "Android",
    store_subcategory_4: "",
    store_subcategory_5: "",
    published: true,
    featured: false,
    visibility: "public",
    vendor_id: 1,
    meta_title: "Test Product 2",
    meta_description: "Test product 2 description",
    meta_keywords: "test, product, mobile"
  }
];

// Create CSV content
const csvHeader = Object.keys(testData[0]).join(",");
const csvRows = testData.map(row => Object.values(row).join(","));
const csvContent = [csvHeader, ...csvRows].join("\n");

// Write test CSV file
const testFileName = `test-category-hierarchy-${Date.now()}.csv`;
fs.writeFileSync(testFileName, csvContent);

console.log(`✅ Test CSV file created: ${testFileName}`);
console.log(`📊 Test data includes:`);
console.log(`   - Product 1: 5 levels of subcategories (Electronics > Computers > Laptops > Gaming > High-End > RTX Series)`);
console.log(`   - Product 2: 3 levels of subcategories (Electronics > Mobile > Smartphones > Android)`);
console.log(`\n🔧 Expected behavior after fix:`);
console.log(`   - All 5 subcategory levels should be properly mapped`);
console.log(`   - Category hierarchy should be created correctly in database`);
console.log(`   - Products should be assigned to the deepest subcategory level`);
console.log(`\n📝 To test:`);
console.log(`   1. Import this CSV file through the web interface`);
console.log(`   2. Check that all subcategories are created in the Categories section`);
console.log(`   3. Verify that products are assigned to the correct category levels`);
console.log(`   4. Check the category tree structure in the Categories page`);

console.log(`\n📄 CSV Content Preview:`);
console.log(csvContent.substring(0, 500) + "...");
