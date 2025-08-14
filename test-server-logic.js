const csv = require('csv-parser');
const fs = require('fs');

// Test with your exact CSV data
const testCSVData = `sku,name,short_description,description,brand,mfn,stock,list_price,market_price,vendor_cost,special_price,weight,length,width,height,google_category,vendor_category,store_category,vendor_subcategory_1,vendor_subcategory_2,vendor_subcategory_3,vendor_subcategory_4,store_subcategory_1,store_subcategory_2,store_subcategory_3,store_subcategory_4,published,featured,visibility,vendor_id,meta_title,meta_description,meta_keywords
SKU-0001,Noise-Cancelling Smartwatch 1,A high-quality smartwatch with noise-cancelling features.,This is a detailed description for the new Noise-Cancelling Smartwatch 1 from the InnoGadgets lineup. It is designed for optimal performance and user experience.,InnoGadgets,,143,641.56,690.67,425.56,550.27,4.57,20.91,33.23,3.89,Electronics > Audio,Audio,Electronics,Speakers,Headphones,,,,Speakers,Headphones,,,1,1,public,VEND002,Noise-Cancelling Smartwatch 1 | InnoGadgets,Discover the new Noise-Cancelling Smartwatch 1 from InnoGadgets. Perfect for your needs.,smartwatch, noise-cancelling, innogadgets, electronics
SKU-0002,Lightweight Gaming Console 2,A high-quality gaming console with lightweight features.,This is a detailed description for the new Lightweight Gaming Console 2 from the ElectroWorks lineup. It is designed for optimal performance and user experience.,ElectroWorks,,9,1566,1804.05,1103.04,1430.6,3.19,39.45,13.68,4.91,Electronics > Cameras & Drones,Cameras & Drones,Electronics,Digital Cameras,Drones,,,,Digital Cameras,Drones,,,0,0,private,VEND004,Lightweight Gaming Console 2 | ElectroWorks,Discover the new Lightweight Gaming Console 2 from ElectroWorks. Perfect for your needs.,gaming console, lightweight, electroworks, electronics
SKU-0003,Wireless Smartphone 3,A high-quality smartphone with wireless features.,This is a detailed description for the new Wireless Smartphone 3 from the TechCorp lineup. It is designed for optimal performance and user experience.,TechCorp,,61,1204.36,1368.33,879.99,1067.45,3.97,37.14,36.32,11.81,Electronics > Computers & Tablets,Computers & Tablets,Electronics,Monitors,Laptops,Tablets,,Monitors,Laptops,Tablets,,1,1,public,VEND002,Wireless Smartphone 3 | TechCorp,Discover the new Wireless Smartphone 3 from TechCorp. Perfect for your needs.,smartphone, wireless, techcorp, electronics`;

async function testServerLogic() {
  console.log('🔍 Testing Server-Side Logic...\n');

  // Simulate the mapping that would be used
  const mapping = {
    'sku': 'sku',
    'name': 'name',
    'short_description': 'short_description',
    'description': 'description',
    'brand': 'brand',
    'mfn': 'mfn',
    'stock': 'stock',
    'list_price': 'list_price',
    'market_price': 'market_price',
    'vendor_cost': 'vendor_cost',
    'special_price': 'special_price',
    'weight': 'weight',
    'length': 'length',
    'width': 'width',
    'height': 'height',
    'google_category': 'google_category',
    'vendor_category': 'vendor_category',
    'store_category': 'store_category',
    'vendor_subcategory_1': 'vendor_subcategory_1',
    'vendor_subcategory_2': 'vendor_subcategory_2',
    'vendor_subcategory_3': 'vendor_subcategory_3',
    'vendor_subcategory_4': 'vendor_subcategory_4',
    'store_subcategory_1': 'store_subcategory_1',
    'store_subcategory_2': 'store_subcategory_2',
    'store_subcategory_3': 'store_subcategory_3',
    'store_subcategory_4': 'store_subcategory_4',
    'published': 'published',
    'featured': 'featured',
    'visibility': 'visibility',
    'vendor_id': 'vendor_id',
    'meta_title': 'meta_title',
    'meta_description': 'meta_description',
    'meta_keywords': 'meta_keywords'
  };

  console.log('📋 Mapping:', mapping);

  // Parse CSV data
  const results = [];
  const stream = require('stream');
  const readable = stream.Readable.from(testCSVData);

  readable
    .pipe(csv())
    .on('data', (data) => {
      results.push(data);
    })
    .on('end', () => {
      console.log(`\n📊 Parsed ${results.length} rows from CSV`);
      
      // Simulate the EXACT server-side logic
      const allVendorCategories = new Set();
      const allStoreCategories = new Set();
      const vendorCategoryPaths = new Map();
      const storeCategoryPaths = new Map();

      for (const row of results) {
        console.log(`\n🔍 Processing row: ${row.sku}`);
        
        // Collect vendor categories
        if (mapping.vendor_category && row[mapping.vendor_category]) {
          allVendorCategories.add(row[mapping.vendor_category].trim());
        }
        if (mapping.vendor_ && row[mapping.vendor_]) {
          allVendorCategories.add(row[mapping.vendor_].trim());
        }
        
        // Collect store categories
        if (mapping.store_category && row[mapping.store_category]) {
          allStoreCategories.add(row[mapping.store_category].trim());
        }
        if (mapping.cat_store_ && row[mapping.cat_store_]) {
          allStoreCategories.add(row[mapping.cat_store_].trim());
        }
        
        // Build vendor category paths - EXACT SERVER LOGIC
        const vendorParent = row[mapping.vendor_category] || row[mapping.vendor_];
        if (vendorParent) {
          const path = [vendorParent.trim()];
          console.log(`   🔗 Building vendor path starting with: ${vendorParent.trim()}`);
          
          // Find the CSV headers that map to vendor subcategories
          for (let i = 1; i <= 4; i++) {
            const subcategoryKey = `vendor_subcategory_${i}`;
            const altSubcategoryKey = `suk_vendor_${i}`;
            
            // Find the CSV header that maps to this database field
            let csvHeader = null;
            for (const [csvCol, dbField] of Object.entries(mapping)) {
              if (dbField === subcategoryKey || dbField === altSubcategoryKey) {
                csvHeader = csvCol;
                break;
              }
            }
            
            console.log(`      Looking for ${subcategoryKey}, found CSV header: ${csvHeader}`);
            
            if (csvHeader && row[csvHeader] && row[csvHeader].trim() !== '') {
              path.push(row[csvHeader].trim());
              console.log(`      ➕ Added vendor subcategory ${i}: ${row[csvHeader].trim()}`);
            } else {
              console.log(`      ⚪ No vendor subcategory ${i} found (csvHeader: ${csvHeader}, value: "${row[csvHeader]}")`);
            }
          }
          
          if (path.length > 1) { // Only store if we have subcategories
            vendorCategoryPaths.set(vendorParent.trim(), path);
            console.log(`   ✅ Vendor hierarchy: ${path.join(' > ')}`);
          } else {
            console.log(`   ⚠️  No vendor subcategories found for ${vendorParent.trim()}`);
          }
        }
        
        // Build store category paths - EXACT SERVER LOGIC
        const storeParent = row[mapping.store_category] || row[mapping.cat_store_];
        if (storeParent) {
          const path = [storeParent.trim()];
          console.log(`   🔗 Building store path starting with: ${storeParent.trim()}`);
          
          // Find the CSV headers that map to store subcategories
          for (let i = 1; i <= 4; i++) {
            const subcategoryKey = `store_subcategory_${i}`;
            const altSubcategoryKey = `subc_store_${i}`;
            
            // Find the CSV header that maps to this database field
            let csvHeader = null;
            for (const [csvCol, dbField] of Object.entries(mapping)) {
              if (dbField === subcategoryKey || dbField === altSubcategoryKey) {
                csvHeader = csvCol;
                break;
              }
            }
            
            console.log(`      Looking for ${subcategoryKey}, found CSV header: ${csvHeader}`);
            
            if (csvHeader && row[csvHeader] && row[csvHeader].trim() !== '') {
              path.push(row[csvHeader].trim());
              console.log(`      ➕ Added store subcategory ${i}: ${row[csvHeader].trim()}`);
            } else {
              console.log(`      ⚪ No store subcategory ${i} found (csvHeader: ${csvHeader}, value: "${row[csvHeader]}")`);
            }
          }
          
          if (path.length > 1) { // Only store if we have subcategories
            storeCategoryPaths.set(storeParent.trim(), path);
            console.log(`   ✅ Store hierarchy: ${path.join(' > ')}`);
          } else {
            console.log(`   ⚠️  No store subcategories found for ${storeParent.trim()}`);
          }
        }
      }

      console.log(`\n📊 FINAL RESULTS:`);
      console.log(`   Vendor categories: ${allVendorCategories.size}`);
      console.log(`   Store categories: ${allStoreCategories.size}`);
      console.log(`   Vendor hierarchies: ${vendorCategoryPaths.size}`);
      console.log(`   Store hierarchies: ${storeCategoryPaths.size}`);

      if (vendorCategoryPaths.size > 0) {
        console.log(`   📋 VENDOR HIERARCHIES:`);
        for (const [parent, path] of vendorCategoryPaths) {
          console.log(`      ${path.join(' > ')}`);
        }
      }

      if (storeCategoryPaths.size > 0) {
        console.log(`   📋 STORE HIERARCHIES:`);
        for (const [parent, path] of storeCategoryPaths) {
          console.log(`      ${path.join(' > ')}`);
        }
      }
    });
}

testServerLogic();
