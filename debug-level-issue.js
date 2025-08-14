// Debug the level calculation issue

console.log('=== DEBUGGING LEVEL CALCULATION ===\n');

// Your real headers
const headers = [
  'vendor_category',
  'store_category', 
  'vendor_subcategory_1',
  'vendor_subcategory_2',
  'vendor_subcategory_3',
  'vendor_subcategory_4',
  'store_subcategory_1',
  'store_subcategory_2',
  'store_subcategory_3',
  'store_subcategory_4'
];

// Example row data
const row = {
  vendor_category: "Electronics",
  store_category: "Tech",
  vendor_subcategory_1: "Computers",
  vendor_subcategory_2: "Laptops",
  vendor_subcategory_3: "Gaming",
  vendor_subcategory_4: "High-End",
  store_subcategory_1: "Computing",
  store_subcategory_2: "Portable",
  store_subcategory_3: "Gaming",
  store_subcategory_4: "Premium"
};

console.log('1. Headers:', headers);
console.log('2. Row data:', row);

// Simulate the processing logic
const vendorSubcategories = [];
const storeSubcategories = [];

// Process vendor subcategories
for (let i = 1; i <= 4; i++) {
  const fieldName = `vendor_subcategory_${i}`;
  if (row[fieldName] && row[fieldName].trim() !== '') {
    const level = parseInt(fieldName.split('_')[2]) || 1;
    vendorSubcategories.push({
      level: level,
      name: row[fieldName].trim()
    });
    console.log(`Vendor subcategory: ${fieldName} → level ${level}, name "${row[fieldName]}"`);
  }
}

// Process store subcategories
for (let i = 1; i <= 4; i++) {
  const fieldName = `store_subcategory_${i}`;
  if (row[fieldName] && row[fieldName].trim() !== '') {
    const level = parseInt(fieldName.split('_')[2]) || 1;
    storeSubcategories.push({
      level: level,
      name: row[fieldName].trim()
    });
    console.log(`Store subcategory: ${fieldName} → level ${level}, name "${row[fieldName]}"`);
  }
}

console.log('\n3. Extracted subcategories:');
console.log('Vendor:', vendorSubcategories);
console.log('Store:', storeSubcategories);

// Sort by level
vendorSubcategories.sort((a, b) => a.level - b.level);
storeSubcategories.sort((a, b) => a.level - b.level);

console.log('\n4. Sorted subcategories:');
console.log('Vendor:', vendorSubcategories);
console.log('Store:', storeSubcategories);

console.log('\n5. Expected hierarchy:');
console.log('Vendor: Electronics > Computers > Laptops > Gaming > High-End');
console.log('Store: Tech > Computing > Portable > Gaming > Premium');

console.log('\n6. The issue might be:');
console.log('- Categories are being created correctly but not linked properly');
console.log('- Level calculation is wrong');
console.log('- Parent-child relationships are not being set correctly');
console.log('- The createOrGetCategory function might have an issue');
