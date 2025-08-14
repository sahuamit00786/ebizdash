const fs = require('fs');

// Your CSV data
const csvData = `sku,name,short_description,description,brand,mfn,stock,list_price,market_price,vendor_cost,special_price,weight,length,width,height,google_category,category_hierarchy,vendor_category,store_category,vendor_subcategory_1,vendor_subcategory_2,vendor_subcategory_3,vendor_subcategory_4,vendor_subcategory_5,store_subcategory_1,store_subcategory_2,store_subcategory_3,store_subcategory_4,store_subcategory_5,published,featured,visibility,vendor_id,meta_title,meta_description,meta_keywords
PROD001,Sample Product,Brief product description,Detailed product description,Sample Brand,MFN001,100,99.99,89.99,50,79.99,1.5,10,5,3,Electronics,Electronics > Mobile Devices > Smartphones > Premium,Electronics,Electronics,Smartphones,Android,Flagship,5G,Premium,Electronics,Mobile Devices,Premium,Latest Models,Flagship,TRUE,FALSE,public,1,Sample Product - Meta Title,Sample product meta description for SEO,sample product keywords
PROD002,Alternative Format Example,Example with alternative field names,This example uses the alternative field naming convention,Alt Brand,MFN002,50,149.99,129.99,75,119.99,2,15,8,4,Computers,Electronics,Tech,Computers,Laptops,Gaming,High-End,RTX Series,Computing,Portable,Gaming,Premium,Latest,TRUE,TRUE,public,2,Alternative Format - Meta Title,Alternative format example meta description,alternative format example`;

// Parse CSV
const lines = csvData.split('\n');
const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
const rows = lines.slice(1).map(line => {
  const values = line.split(',');
  const row = {};
  headers.forEach((header, index) => {
    row[header] = values[index] || '';
  });
  return row;
});

console.log('🔍 ANALYZING YOUR CSV DATA:');
console.log('=====================================');

rows.forEach((row, index) => {
  console.log(`\n📦 PRODUCT ${index + 1}: ${row.sku} - ${row.name}`);
  console.log('-------------------------------------');
  
  // Analyze vendor categories
  console.log('🏷️  VENDOR CATEGORIES:');
  console.log(`   Parent: "${row.vendor_category}"`);
  console.log(`   Sub 1:  "${row.vendor_subcategory_1}"`);
  console.log(`   Sub 2:  "${row.vendor_subcategory_2}"`);
  console.log(`   Sub 3:  "${row.vendor_subcategory_3}"`);
  console.log(`   Sub 4:  "${row.vendor_subcategory_4}"`);
  console.log(`   Sub 5:  "${row.vendor_subcategory_5}"`);
  
  // Build vendor path
  const vendorParent = row.vendor_category;
  const vendorPath = [vendorParent];
  let vendorHasSubcategories = false;
  
  for (let i = 1; i <= 5; i++) {
    const subcategoryValue = row[`vendor_subcategory_${i}`];
    if (subcategoryValue && subcategoryValue.trim() !== '') {
      const trimmedValue = subcategoryValue.trim();
      if (trimmedValue !== vendorParent && trimmedValue !== '') {
        vendorPath.push(trimmedValue);
        vendorHasSubcategories = true;
      }
    }
  }
  
  console.log(`   📍 Final Path: ${vendorPath.join(' > ')}`);
  console.log(`   ✅ Has Subcategories: ${vendorHasSubcategories}`);
  
  // Analyze store categories
  console.log('\n🏪 STORE CATEGORIES:');
  console.log(`   Parent: "${row.store_category}"`);
  console.log(`   Sub 1:  "${row.store_subcategory_1}"`);
  console.log(`   Sub 2:  "${row.store_subcategory_2}"`);
  console.log(`   Sub 3:  "${row.store_subcategory_3}"`);
  console.log(`   Sub 4:  "${row.store_subcategory_4}"`);
  console.log(`   Sub 5:  "${row.store_subcategory_5}"`);
  
  // Build store path
  const storeParent = row.store_category;
  const storePath = [storeParent];
  let storeHasSubcategories = false;
  
  for (let i = 1; i <= 5; i++) {
    const subcategoryValue = row[`store_subcategory_${i}`];
    if (subcategoryValue && subcategoryValue.trim() !== '') {
      const trimmedValue = subcategoryValue.trim();
      if (trimmedValue !== storeParent && trimmedValue !== '') {
        storePath.push(trimmedValue);
        storeHasSubcategories = true;
      }
    }
  }
  
  console.log(`   📍 Final Path: ${storePath.join(' > ')}`);
  console.log(`   ✅ Has Subcategories: ${storeHasSubcategories}`);
  
  // Check category hierarchy
  if (row.category_hierarchy) {
    console.log('\n🌳 CATEGORY HIERARCHY:');
    console.log(`   "${row.category_hierarchy}"`);
  }
});

console.log('\n🔧 ISSUES IDENTIFIED:');
console.log('=====================================');
console.log('1. PROD001: Vendor category "Electronics" matches subcategory_1 "Smartphones" - this should create a hierarchy');
console.log('2. PROD001: Store category "Electronics" matches subcategory_1 "Electronics" - this creates a duplicate');
console.log('3. PROD002: Vendor category "Tech" vs subcategory_1 "Computers" - different parent/child relationship');
console.log('4. PROD002: Store category "Computers" vs subcategory_1 "Computing" - different naming');

console.log('\n💡 RECOMMENDED FIXES:');
console.log('=====================================');
console.log('1. Ensure parent categories are different from subcategories');
console.log('2. Use consistent naming (e.g., "Electronics" as parent, "Smartphones" as child)');
console.log('3. The current logic should now handle these cases better with the updated filtering');

console.log('\n📝 EXPECTED BEHAVIOR AFTER FIX:');
console.log('=====================================');
console.log('PROD001 Vendor: Electronics > Smartphones > Android > Flagship > 5G > Premium');
console.log('PROD001 Store: Electronics > Mobile Devices > Premium > Latest Models > Flagship');
console.log('PROD002 Vendor: Tech > Computers > Laptops > Gaming > High-End > RTX Series');
console.log('PROD002 Store: Computing > Portable > Gaming > Premium > Latest');
