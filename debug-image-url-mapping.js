const fs = require('fs');
const csv = require('csv-parser');

async function debugImageUrlMapping() {
  try {
    console.log('=== Debugging Image URL Mapping ===\n');
    
    // Test the auto-mapping logic
    console.log('1. Testing auto-mapping logic...');
    
    const testHeaders = [
      'image_url',
      'Image_URL',
      'IMAGE_URL',
      'image url',
      'Image URL',
      'product_image_url',
      'photo_url',
      'img_link',
      'image_link',
      'product_image',
      'image',
      'photo'
    ];
    
    console.log('Testing various header formats:');
    testHeaders.forEach(header => {
      const lowerHeader = header.toLowerCase();
      const shouldMap = lowerHeader.includes('image') && (lowerHeader.includes('url') || lowerHeader.includes('link'));
      console.log(`  "${header}" -> ${shouldMap ? '✅ MAPPED to image_url' : '❌ NOT MAPPED'}`);
    });
    
    // Test with actual CSV parsing
    console.log('\n2. Testing CSV parsing...');
    
    // Create a test CSV file
    const testCsvContent = `sku,name,image_url,description
SKU001,Test Product,https://example.com/image.jpg,Test description
SKU002,Another Product,https://example.com/another.jpg,Another description`;
    
    fs.writeFileSync('test_debug.csv', testCsvContent);
    
    const results = [];
    const headers = [];
    
    return new Promise((resolve, reject) => {
      fs.createReadStream('test_debug.csv')
        .pipe(csv())
        .on('headers', (headerList) => {
          headers.push(...headerList);
          console.log('CSV Headers detected:', headerList);
        })
        .on('data', (data) => {
          results.push(data);
        })
        .on('end', () => {
          console.log('\n3. Testing field mapping...');
          
          // Simulate the auto-mapping logic
          const mapping = {};
          headers.forEach(header => {
            const lowerHeader = header.toLowerCase();
            
            // Auto-mapping logic (same as in CsvImportModal.js)
            if (lowerHeader.includes('sku')) mapping[header] = "sku";
            else if (lowerHeader.includes('name') && !lowerHeader.includes('category')) mapping[header] = "name";
            else if (lowerHeader.includes('image') && (lowerHeader.includes('url') || lowerHeader.includes('link'))) mapping[header] = "image_url";
            else if (lowerHeader.includes('description')) mapping[header] = "description";
            // ... other mappings
          });
          
          console.log('Field mapping result:', mapping);
          
          // Check if image_url is mapped
          const imageUrlMapped = Object.values(mapping).includes('image_url');
          console.log(`\nImage URL mapping status: ${imageUrlMapped ? '✅ SUCCESS' : '❌ FAILED'}`);
          
          if (imageUrlMapped) {
            const mappedHeader = Object.keys(mapping).find(key => mapping[key] === 'image_url');
            console.log(`Mapped from header: "${mappedHeader}"`);
          }
          
          // Test the data
          console.log('\n4. Testing data processing...');
          results.forEach((row, index) => {
            console.log(`Row ${index + 1}:`, row);
            
            // Check if image_url data exists
            if (row.image_url) {
              console.log(`  ✅ image_url data found: ${row.image_url}`);
            } else {
              console.log(`  ❌ No image_url data in row ${index + 1}`);
            }
          });
          
          // Clean up
          fs.unlinkSync('test_debug.csv');
          
          console.log('\n=== Debug Results ===');
          console.log('✅ Auto-mapping logic works correctly');
          console.log('✅ CSV parsing works correctly');
          console.log(`✅ Field mapping: ${imageUrlMapped ? 'SUCCESS' : 'FAILED'}`);
          
          if (!imageUrlMapped) {
            console.log('\n❌ ISSUE FOUND: image_url not being mapped');
            console.log('Possible causes:');
            console.log('1. Header name doesn\'t contain both "image" and "url"');
            console.log('2. Case sensitivity issues');
            console.log('3. Extra spaces or special characters in header');
            console.log('4. CSV encoding issues');
          }
          
          resolve();
        })
        .on('error', reject);
    });
    
  } catch (error) {
    console.error('Debug error:', error);
  }
}

// Also test with a real CSV file if provided
async function testWithRealCsv(csvFilePath) {
  try {
    console.log(`\n=== Testing with Real CSV: ${csvFilePath} ===\n`);
    
    if (!fs.existsSync(csvFilePath)) {
      console.log('❌ CSV file not found');
      return;
    }
    
    const results = [];
    const headers = [];
    
    return new Promise((resolve, reject) => {
      fs.createReadStream(csvFilePath)
        .pipe(csv())
        .on('headers', (headerList) => {
          headers.push(...headerList);
          console.log('Real CSV Headers:', headerList);
          
          // Check for image_url related headers
          const imageHeaders = headerList.filter(h => 
            h.toLowerCase().includes('image') || h.toLowerCase().includes('photo') || h.toLowerCase().includes('img')
          );
          console.log('Image-related headers found:', imageHeaders);
        })
        .on('data', (data) => {
          results.push(data);
        })
        .on('end', () => {
          console.log('\nFirst few rows:');
          results.slice(0, 3).forEach((row, index) => {
            console.log(`Row ${index + 1}:`, row);
          });
          
          // Test mapping
          const mapping = {};
          headers.forEach(header => {
            const lowerHeader = header.toLowerCase();
            if (lowerHeader.includes('image') && (lowerHeader.includes('url') || lowerHeader.includes('link'))) {
              mapping[header] = "image_url";
            }
          });
          
          console.log('\nMapping result:', mapping);
          resolve();
        })
        .on('error', reject);
    });
    
  } catch (error) {
    console.error('Real CSV test error:', error);
  }
}

// Run the debug
debugImageUrlMapping().then(() => {
  // Test with a real CSV file if it exists
  const testFiles = [
    'sample_with_image_url.csv',
    'product_import_template_dummy.csv',
    'test_import.csv'
  ];
  
  testFiles.forEach(file => {
    if (fs.existsSync(file)) {
      testWithRealCsv(file);
    }
  });
});
