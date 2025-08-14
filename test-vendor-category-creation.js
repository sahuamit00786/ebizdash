const fs = require('fs');
const csv = require('csv-parser');

// Test vendor-only category creation
async function testVendorCategoryCreation() {
  console.log('🧪 Testing Vendor-Only Category Creation...\n');
  
  const results = [];
  
  // Read the test CSV file
  fs.createReadStream('test-vendor-only-categories.csv')
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', () => {
      console.log('📊 CSV Data Analysis:');
      console.log(`Total products: ${results.length}\n`);
      
      // Analyze vendor categories
      const vendorCategories = new Map();
      const vendorSubcategories = new Map();
      
      results.forEach((row, index) => {
        const vendorCategory = row.vendor_category?.trim();
        if (vendorCategory) {
          if (!vendorCategories.has(vendorCategory)) {
            vendorCategories.set(vendorCategory, []);
          }
          vendorCategories.get(vendorCategory).push(row.sku);
          
          // Analyze subcategories
          for (let i = 1; i <= 3; i++) {
            const subcategoryKey = `vendor_subcategory_${i}`;
            const subcategory = row[subcategoryKey]?.trim();
            if (subcategory) {
              const hierarchyKey = `${vendorCategory} > ${subcategory}`;
              if (!vendorSubcategories.has(hierarchyKey)) {
                vendorSubcategories.set(hierarchyKey, []);
              }
              vendorSubcategories.get(hierarchyKey).push(row.sku);
            }
          }
        }
      });
      
      console.log('🏷️  Vendor Categories Found:');
      vendorCategories.forEach((products, category) => {
        console.log(`  📁 ${category} (${products.length} products)`);
        products.forEach(sku => console.log(`    - ${sku}`));
      });
      
      console.log('\n📂 Vendor Subcategory Hierarchies:');
      vendorSubcategories.forEach((products, hierarchy) => {
        console.log(`  🔗 ${hierarchy} (${products.length} products)`);
        products.forEach(sku => console.log(`    - ${sku}`));
      });
      
      console.log('\n✅ Test completed! This shows the vendor category structure that will be created during import.');
      console.log('💡 Each vendor will get their own category hierarchy with "(Vendor X)" suffix.');
    });
}

// Run the test
testVendorCategoryCreation().catch(console.error);
