console.log('🔍 DEBUGGING SUBCATEGORY ISSUE...');

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

// Simulate the mapping from your CSV
const mapping = {
  vendor_category: "vendor_category",
  store_category: "store_category",
  vendor_subcategory_1: "vendor_subcategory_1",
  vendor_subcategory_2: "vendor_subcategory_2",
  vendor_subcategory_3: "vendor_subcategory_3",
  vendor_subcategory_4: "vendor_subcategory_4",
  store_subcategory_1: "store_subcategory_1",
  store_subcategory_2: "store_subcategory_2",
  store_subcategory_3: "store_subcategory_3",
  store_subcategory_4: "store_subcategory_4"
};

console.log('\n📊 TESTING PATH BUILDING LOGIC:');
console.log('=====================================');

const vendorCategoryPaths = new Map();
const storeCategoryPaths = new Map();

for (const row of testData) {
  console.log(`\n📦 Processing row: ${row.vendor_category} / ${row.store_category}`);
  
  // Build vendor category path
  const vendorParent = row[mapping.vendor_category];
  if (vendorParent) {
    const path = [vendorParent.trim()];
    let hasSubcategories = false;
    
    console.log(`   🏷️  Vendor parent: "${vendorParent}"`);
    
    for (let i = 1; i <= 5; i++) {
      const subcategoryKey = `vendor_subcategory_${i}`;
      const csvHeader = mapping[subcategoryKey];
      
      if (csvHeader && row[csvHeader] && row[csvHeader].trim() !== '') {
        const subcategoryValue = row[csvHeader].trim();
        console.log(`      Sub ${i}: "${subcategoryValue}"`);
        path.push(subcategoryValue);
        hasSubcategories = true;
      } else {
        console.log(`      Sub ${i}: (empty)`);
      }
    }
    
    vendorCategoryPaths.set(vendorParent.trim(), path);
    console.log(`   ✅ Vendor path: ${path.join(' > ')}`);
  }
  
  // Build store category path
  const storeParent = row[mapping.store_category];
  if (storeParent) {
    const path = [storeParent.trim()];
    let hasSubcategories = false;
    
    console.log(`   🏪 Store parent: "${storeParent}"`);
    
    for (let i = 1; i <= 5; i++) {
      const subcategoryKey = `store_subcategory_${i}`;
      const csvHeader = mapping[subcategoryKey];
      
      if (csvHeader && row[csvHeader] && row[csvHeader].trim() !== '') {
        const subcategoryValue = row[csvHeader].trim();
        console.log(`      Sub ${i}: "${subcategoryValue}"`);
        path.push(subcategoryValue);
        hasSubcategories = true;
      } else {
        console.log(`      Sub ${i}: (empty)`);
      }
    }
    
    storeCategoryPaths.set(storeParent.trim(), path);
    console.log(`   ✅ Store path: ${path.join(' > ')}`);
  }
}

console.log('\n🎯 FINAL PATHS TO BE CREATED:');
console.log('=====================================');
console.log('🏷️  VENDOR HIERARCHIES:');
for (const [parent, path] of vendorCategoryPaths) {
  console.log(`   ${parent} -> ${path.join(' > ')}`);
}

console.log('\n🏪 STORE HIERARCHIES:');
for (const [parent, path] of storeCategoryPaths) {
  console.log(`   ${parent} -> ${path.join(' > ')}`);
}

console.log('\n🔧 SIMULATING CATEGORY CREATION:');
console.log('=====================================');

// Simulate category creation
for (const [parentCategory, path] of vendorCategoryPaths) {
  console.log(`\n🏷️  Creating vendor hierarchy: ${path.join(' > ')}`);
  let currentParentId = null;
  
  for (let i = 0; i < path.length; i++) {
    const categoryName = path[i];
    const level = i + 1;
    const parentId = currentParentId;
    
    console.log(`   Level ${level}: "${categoryName}" (Parent: ${parentId || 'null'})`);
    
    // Simulate category creation
    const newId = Math.floor(Math.random() * 1000) + 1;
    console.log(`   ✅ Created/Found: ${categoryName} (ID: ${newId})`);
    
    currentParentId = newId;
  }
  
  console.log(`   🎯 Final category ID: ${currentParentId}`);
}

for (const [parentCategory, path] of storeCategoryPaths) {
  console.log(`\n🏪 Creating store hierarchy: ${path.join(' > ')}`);
  let currentParentId = null;
  
  for (let i = 0; i < path.length; i++) {
    const categoryName = path[i];
    const level = i + 1;
    const parentId = currentParentId;
    
    console.log(`   Level ${level}: "${categoryName}" (Parent: ${parentId || 'null'})`);
    
    // Simulate category creation
    const newId = Math.floor(Math.random() * 1000) + 1;
    console.log(`   ✅ Created/Found: ${categoryName} (ID: ${newId})`);
    
    currentParentId = newId;
  }
  
  console.log(`   🎯 Final category ID: ${currentParentId}`);
}
