// Test the header mapping logic from CsvImportModal.js
function testHeaderMapping() {
  console.log('🔍 Testing Header Mapping Logic...\n');

  const testHeaders = [
    'vendor_subcategory_1',
    'vendor_subcategory_2', 
    'vendor_subcategory_3',
    'vendor_subcategory_4',
    'store_subcategory_1',
    'store_subcategory_2',
    'store_subcategory_3',
    'store_subcategory_4',
    'vendor_category',
    'store_category'
  ];

  const mapping = {};

  testHeaders.forEach(header => {
    const lowerHeader = header.toLowerCase();
    console.log(`\n📋 Testing header: "${header}" (lowercase: "${lowerHeader}")`);

    if (lowerHeader.includes('vendor') && lowerHeader.includes('category') && !lowerHeader.includes('subcategory')) {
      mapping[header] = "vendor_category";
      console.log(`   ✅ Mapped to: vendor_category`);
    }
    else if (lowerHeader.includes('store') && lowerHeader.includes('category') && !lowerHeader.includes('subcategory')) {
      mapping[header] = "store_category";
      console.log(`   ✅ Mapped to: store_category`);
    }
    // Auto-map vendor subcategory fields
    else if (lowerHeader.includes('vendor') && (lowerHeader.includes('subcategory') || lowerHeader.includes('sub_category'))) {
      // Extract number from vendor subcategory field (e.g., "Vendor Subcategory 1" -> "vendor_subcategory_1")
      const match = lowerHeader.match(/(\d+)/);
      if (match) {
        const number = match[1];
        if (number >= 1 && number <= 4) {
          mapping[header] = `vendor_subcategory_${number}`;
          console.log(`   ✅ Mapped to: vendor_subcategory_${number}`);
        } else {
          console.log(`   ❌ Number ${number} not in range 1-4`);
        }
      } else {
        console.log(`   ❌ No number found in header`);
      }
    }
    // Auto-map store subcategory fields
    else if (lowerHeader.includes('store') && (lowerHeader.includes('subcategory') || lowerHeader.includes('sub_category'))) {
      // Extract number from store subcategory field (e.g., "Store Subcategory 1" -> "store_subcategory_1")
      const match = lowerHeader.match(/(\d+)/);
      if (match) {
        const number = match[1];
        if (number >= 1 && number <= 4) {
          mapping[header] = `store_subcategory_${number}`;
          console.log(`   ✅ Mapped to: store_subcategory_${number}`);
        } else {
          console.log(`   ❌ Number ${number} not in range 1-4`);
        }
      } else {
        console.log(`   ❌ No number found in header`);
      }
    }
    else {
      console.log(`   ❌ No mapping found`);
    }
  });

  console.log(`\n📊 FINAL MAPPING:`);
  console.log(JSON.stringify(mapping, null, 2));

  // Check if all subcategory fields are mapped
  const vendorSubcategories = Object.values(mapping).filter(field => field.startsWith('vendor_subcategory_'));
  const storeSubcategories = Object.values(mapping).filter(field => field.startsWith('store_subcategory_'));

  console.log(`\n🔍 MAPPING ANALYSIS:`);
  console.log(`   Vendor subcategories mapped: ${vendorSubcategories.length}/4`);
  console.log(`   Store subcategories mapped: ${storeSubcategories.length}/4`);
  console.log(`   Vendor subcategories: ${vendorSubcategories.join(', ')}`);
  console.log(`   Store subcategories: ${storeSubcategories.join(', ')}`);

  if (vendorSubcategories.length === 4 && storeSubcategories.length === 4) {
    console.log(`\n✅ All subcategory fields are properly mapped!`);
  } else {
    console.log(`\n❌ Some subcategory fields are missing from mapping!`);
  }
}

testHeaderMapping();
