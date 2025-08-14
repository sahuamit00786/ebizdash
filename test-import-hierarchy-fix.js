const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');

// Test the import functionality
async function testHierarchicalImport() {
  try {
    console.log('🧪 Testing Hierarchical Category Import...\n');
    
    // Read the test CSV file
    const csvContent = fs.readFileSync('test-hierarchical-import-fix.csv', 'utf8');
    console.log('📄 Test CSV content:');
    console.log(csvContent);
    console.log('\n' + '='.repeat(80) + '\n');
    
    // Create a temporary CSV file for testing
    const tempCsvPath = `temp-test-${Date.now()}.csv`;
    fs.writeFileSync(tempCsvPath, csvContent);
    
    // Create form data
    const formData = new FormData();
    formData.append('csvFile', fs.createReadStream(tempCsvPath));
    
    // Define field mapping
    const fieldMapping = {
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
      'sku': 'sku',
      'name': 'name',
      'description': 'description',
      'brand': 'brand',
      'stock': 'stock',
      'list_price': 'list_price'
    };
    
    formData.append('fieldMapping', JSON.stringify(fieldMapping));
    formData.append('updateMode', 'false');
    formData.append('selectedVendor', '1'); // Assuming vendor ID 1 exists
    
    console.log('🔧 Field Mapping:');
    console.log(JSON.stringify(fieldMapping, null, 2));
    console.log('\n' + '='.repeat(80) + '\n');
    
    // Test the preview endpoint first
    console.log('📋 Testing Preview Endpoint...');
    
    const previewFormData = new FormData();
    previewFormData.append('csvFile', fs.createReadStream(tempCsvPath));
    previewFormData.append('fieldMapping', JSON.stringify(fieldMapping));
    
    const previewResponse = await fetch('http://localhost:5000/api/products/import/preview', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer YOUR_TOKEN_HERE' // Replace with actual token
      },
      body: previewFormData
    });
    
    if (previewResponse.ok) {
      const previewData = await previewResponse.json();
      console.log('✅ Preview successful!');
      console.log('Preview data:', JSON.stringify(previewData, null, 2));
    } else {
      console.log('❌ Preview failed:', await previewResponse.text());
    }
    
    console.log('\n' + '='.repeat(80) + '\n');
    
    // Clean up temp file
    fs.unlinkSync(tempCsvPath);
    
    console.log('🎯 Test completed!');
    console.log('\nNext steps:');
    console.log('1. Replace YOUR_TOKEN_HERE with an actual JWT token');
    console.log('2. Run this script to test the import functionality');
    console.log('3. Check the database to verify categories were created correctly');
    console.log('4. Verify that products are assigned to the deepest category in the hierarchy');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testHierarchicalImport();
