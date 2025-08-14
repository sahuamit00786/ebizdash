console.log('Testing with your exact CSV data...');

// Your exact CSV data
const testData = [
  {
    vendor_category: "Audio",
    store_category: "Electronics",
    vendor_subcategory_1: "Speakers",
    vendor_subcategory_2: "Headphones",
    vendor_subcategory_3: "",
    vendor_subcategory_4: "",
    store_subcategory_1: "Speakers",
    store_subcategory_2: "Headphones",
    store_subcategory_3: "",
    store_subcategory_4: ""
  },
  {
    vendor_category: "Cameras & Drones",
    store_category: "Electronics",
    vendor_subcategory_1: "Digital Cameras",
    vendor_subcategory_2: "Drones",
    vendor_subcategory_3: "",
    vendor_subcategory_4: "",
    store_subcategory_1: "Digital Cameras",
    store_subcategory_2: "Drones",
    store_subcategory_3: "",
    store_subcategory_4: ""
  },
  {
    vendor_category: "Computers & Tablets",
    store_category: "Electronics",
    vendor_subcategory_1: "Monitors",
    vendor_subcategory_2: "Laptops",
    vendor_subcategory_3: "Tablets",
    vendor_subcategory_4: "",
    store_subcategory_1: "Monitors",
    store_subcategory_2: "Laptops",
    store_subcategory_3: "Tablets",
    store_subcategory_4: ""
  }
];

testData.forEach((row, index) => {
  console.log(`\n📦 ROW ${index + 1}:`);
  console.log('-------------------------------------');
  
  // Test vendor category path
  const vendorParent = row.vendor_category;
  const vendorPath = [vendorParent];
  let vendorHasSubcategories = false;
  
  for (let i = 1; i <= 5; i++) {
    const subcategoryValue = row[`vendor_subcategory_${i}`];
    if (subcategoryValue && subcategoryValue.trim() !== '') {
      vendorPath.push(subcategoryValue.trim());
      vendorHasSubcategories = true;
    }
  }
  
  console.log(`🏷️  VENDOR: ${vendorPath.join(' > ')}`);
  console.log(`   Has subcategories: ${vendorHasSubcategories}`);
  
  // Test store category path
  const storeParent = row.store_category;
  const storePath = [storeParent];
  let storeHasSubcategories = false;
  
  for (let i = 1; i <= 5; i++) {
    const subcategoryValue = row[`store_subcategory_${i}`];
    if (subcategoryValue && subcategoryValue.trim() !== '') {
      storePath.push(subcategoryValue.trim());
      storeHasSubcategories = true;
    }
  }
  
  console.log(`🏪 STORE: ${storePath.join(' > ')}`);
  console.log(`   Has subcategories: ${storeHasSubcategories}`);
});

console.log('\n✅ EXPECTED RESULTS:');
console.log('=====================================');
console.log('Row 1:');
console.log('  Vendor: Audio > Speakers > Headphones');
console.log('  Store: Electronics > Speakers > Headphones');
console.log('');
console.log('Row 2:');
console.log('  Vendor: Cameras & Drones > Digital Cameras > Drones');
console.log('  Store: Electronics > Digital Cameras > Drones');
console.log('');
console.log('Row 3:');
console.log('  Vendor: Computers & Tablets > Monitors > Laptops > Tablets');
console.log('  Store: Electronics > Monitors > Laptops > Tablets');
