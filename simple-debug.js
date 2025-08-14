console.log('Testing category logic...');

// Test data from your CSV
const testRow = {
  vendor_category: "Electronics",
  vendor_subcategory_1: "Smartphones",
  vendor_subcategory_2: "Android",
  vendor_subcategory_3: "Flagship",
  vendor_subcategory_4: "5G",
  vendor_subcategory_5: "Premium",
  store_category: "Electronics",
  store_subcategory_1: "Electronics",
  store_subcategory_2: "Mobile Devices",
  store_subcategory_3: "Premium",
  store_subcategory_4: "Latest Models",
  store_subcategory_5: "Flagship"
};

console.log('Original data:', testRow);

// Test vendor path building (FIXED VERSION)
const vendorParent = testRow.vendor_category;
const vendorPath = [vendorParent];
let vendorHasSubcategories = false;

for (let i = 1; i <= 5; i++) {
  const subcategoryValue = testRow[`vendor_subcategory_${i}`];
  if (subcategoryValue && subcategoryValue.trim() !== '') {
    const trimmedValue = subcategoryValue.trim();
    // FIXED: Don't filter out subcategories that match parent
    vendorPath.push(trimmedValue);
    vendorHasSubcategories = true;
  }
}

console.log('Vendor path (FIXED):', vendorPath.join(' > '));
console.log('Has subcategories:', vendorHasSubcategories);

// Test store path building (FIXED VERSION)
const storeParent = testRow.store_category;
const storePath = [storeParent];
let storeHasSubcategories = false;

for (let i = 1; i <= 5; i++) {
  const subcategoryValue = testRow[`store_subcategory_${i}`];
  if (subcategoryValue && subcategoryValue.trim() !== '') {
    const trimmedValue = subcategoryValue.trim();
    // FIXED: Don't filter out subcategories that match parent
    storePath.push(trimmedValue);
    storeHasSubcategories = true;
  }
}

console.log('Store path (FIXED):', storePath.join(' > '));
console.log('Has subcategories:', storeHasSubcategories);

console.log('\n🔧 WHAT WAS FIXED:');
console.log('=====================================');
console.log('❌ OLD LOGIC (BROKEN):');
console.log('   if (subcategoryValue !== parent && subcategoryValue !== "") { ... }');
console.log('   This filtered out subcategories that matched the parent category');
console.log('');
console.log('✅ NEW LOGIC (FIXED):');
console.log('   if (subcategoryValue && subcategoryValue.trim() !== "") { ... }');
console.log('   This allows all non-empty subcategories, including duplicates');
console.log('');
console.log('📝 RESULT:');
console.log('   - Vendor: Electronics > Smartphones > Android > Flagship > 5G > Premium');
console.log('   - Store: Electronics > Electronics > Mobile Devices > Premium > Latest Models > Flagship');
console.log('   - Note: Store has "Electronics" twice, which is correct for your data structure');
