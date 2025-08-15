const fs = require('fs');
const csv = require('csv-parser');

async function debugYourCsv(csvFilePath) {
  try {
    console.log(`=== Debugging Your CSV File: ${csvFilePath} ===\n`);
    
    if (!fs.existsSync(csvFilePath)) {
      console.log('❌ CSV file not found. Please provide the correct path.');
      return;
    }
    
    const results = [];
    const headers = [];
    
    return new Promise((resolve, reject) => {
      fs.createReadStream(csvFilePath)
        .pipe(csv())
        .on('headers', (headerList) => {
          headers.push(...headerList);
          console.log('📋 CSV Headers detected:');
          headerList.forEach((header, index) => {
            console.log(`  ${index + 1}. "${header}"`);
          });
          
          // Check for image_url related headers
          console.log('\n🔍 Looking for image-related headers...');
          const imageHeaders = headerList.filter(h => {
            const lower = h.toLowerCase();
            return lower.includes('image') || lower.includes('photo') || lower.includes('img') || lower.includes('picture');
          });
          
          if (imageHeaders.length > 0) {
            console.log('✅ Image-related headers found:');
            imageHeaders.forEach(header => {
              const lower = header.toLowerCase();
              const hasImage = lower.includes('image');
              const hasUrl = lower.includes('url');
              const hasLink = lower.includes('link');
              const willAutoMap = hasImage && (hasUrl || hasLink);
              
              console.log(`  - "${header}"`);
              console.log(`    Contains 'image': ${hasImage ? '✅' : '❌'}`);
              console.log(`    Contains 'url': ${hasUrl ? '✅' : '❌'}`);
              console.log(`    Contains 'link': ${hasLink ? '✅' : '❌'}`);
              console.log(`    Will auto-map: ${willAutoMap ? '✅ YES' : '❌ NO'}`);
            });
          } else {
            console.log('❌ No image-related headers found');
          }
        })
        .on('data', (data) => {
          results.push(data);
        })
        .on('end', () => {
          console.log(`\n📊 CSV Data Analysis:`);
          console.log(`  Total rows: ${results.length}`);
          
          // Test the auto-mapping logic
          console.log('\n🔧 Testing Auto-Mapping Logic:');
          const mapping = {};
          headers.forEach(header => {
            const lowerHeader = header.toLowerCase();
            
            // Same logic as in CsvImportModal.js
            if (lowerHeader.includes('sku')) mapping[header] = "sku";
            else if (lowerHeader.includes('name') && !lowerHeader.includes('category')) mapping[header] = "name";
            else if (lowerHeader.includes('image') && (lowerHeader.includes('url') || lowerHeader.includes('link'))) mapping[header] = "image_url";
            else if (lowerHeader.includes('description')) mapping[header] = "description";
            else if (lowerHeader.includes('brand')) mapping[header] = "brand";
            else if (lowerHeader.includes('mfn')) mapping[header] = "mfn";
            else if (lowerHeader.includes('stock')) mapping[header] = "stock";
            else if (lowerHeader.includes('price') && lowerHeader.includes('list')) mapping[header] = "list_price";
            else if (lowerHeader.includes('price') && lowerHeader.includes('market')) mapping[header] = "market_price";
            else if (lowerHeader.includes('cost')) mapping[header] = "vendor_cost";
            else if (lowerHeader.includes('special')) mapping[header] = "special_price";
            else if (lowerHeader.includes('weight')) mapping[header] = "weight";
            else if (lowerHeader.includes('length')) mapping[header] = "length";
            else if (lowerHeader.includes('width')) mapping[header] = "width";
            else if (lowerHeader.includes('height')) mapping[header] = "height";
            else if (lowerHeader.includes('google')) mapping[header] = "google_category";
            else if (lowerHeader.includes('published')) mapping[header] = "published";
            else if (lowerHeader.includes('featured')) mapping[header] = "featured";
            else if (lowerHeader.includes('visibility')) mapping[header] = "visibility";
            else if (lowerHeader.includes('vendor') && lowerHeader.includes('category')) mapping[header] = "vendor_category";
            else if (lowerHeader.includes('store') && lowerHeader.includes('category')) mapping[header] = "store_category";
          });
          
          console.log('\n📋 Field Mapping Result:');
          Object.entries(mapping).forEach(([csvHeader, dbField]) => {
            console.log(`  "${csvHeader}" -> "${dbField}"`);
          });
          
          // Check if image_url is mapped
          const imageUrlMapped = Object.values(mapping).includes('image_url');
          console.log(`\n🎯 Image URL Mapping Status: ${imageUrlMapped ? '✅ SUCCESS' : '❌ FAILED'}`);
          
          if (imageUrlMapped) {
            const mappedHeader = Object.keys(mapping).find(key => mapping[key] === 'image_url');
            console.log(`  Mapped from: "${mappedHeader}"`);
          } else {
            console.log('\n❌ ISSUE: image_url not mapped!');
            console.log('Possible solutions:');
            console.log('1. Rename your image column to include "image" and "url"');
            console.log('2. Use manual mapping during import');
            console.log('3. Check for extra spaces or special characters in header');
          }
          
          // Show sample data
          console.log('\n📄 Sample Data (First 3 rows):');
          results.slice(0, 3).forEach((row, index) => {
            console.log(`\nRow ${index + 1}:`);
            Object.entries(row).forEach(([key, value]) => {
              console.log(`  ${key}: "${value}"`);
            });
          });
          
          // Check for image_url data in rows
          console.log('\n🖼️ Checking for image_url data in rows:');
          let hasImageData = false;
          results.slice(0, 5).forEach((row, index) => {
            const imageHeaders = headers.filter(h => {
              const lower = h.toLowerCase();
              return lower.includes('image') || lower.includes('photo') || lower.includes('img');
            });
            
            imageHeaders.forEach(header => {
              if (row[header] && row[header].trim() !== '') {
                console.log(`  Row ${index + 1} - ${header}: "${row[header]}"`);
                hasImageData = true;
              }
            });
          });
          
          if (!hasImageData) {
            console.log('  ❌ No image data found in first 5 rows');
          }
          
          console.log('\n=== SUMMARY ===');
          console.log(`✅ CSV parsing: WORKING`);
          console.log(`✅ Headers detected: ${headers.length}`);
          console.log(`✅ Data rows: ${results.length}`);
          console.log(`✅ Image URL mapping: ${imageUrlMapped ? 'WORKING' : 'FAILED'}`);
          console.log(`✅ Image data present: ${hasImageData ? 'YES' : 'NO'}`);
          
          if (!imageUrlMapped) {
            console.log('\n🔧 TO FIX:');
            console.log('1. Rename your image column header to "image_url"');
            console.log('2. Or use manual mapping during import process');
            console.log('3. Make sure the header contains both "image" and "url"');
          }
          
          resolve();
        })
        .on('error', (error) => {
          console.error('❌ CSV parsing error:', error);
          reject(error);
        });
    });
    
  } catch (error) {
    console.error('Debug error:', error);
  }
}

// Usage instructions
console.log('=== CSV Debug Tool ===\n');
console.log('To debug your CSV file, run:');
console.log('node debug-your-csv.js your-file.csv\n');

// If a file path is provided as argument
const csvFile = process.argv[2];
if (csvFile) {
  debugYourCsv(csvFile);
} else {
  console.log('No CSV file provided. Please run:');
  console.log('node debug-your-csv.js your-csv-file.csv');
}
