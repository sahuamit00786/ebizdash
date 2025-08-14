const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

const API_BASE_URL = 'http://localhost:5000/api';

async function testCSVImport() {
  console.log('🔍 Testing CSV Import with Category Creation...\n');

  try {
    // First, login to get a token
    const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      })
    });

    if (!loginResponse.ok) {
      throw new Error('Login failed');
    }

    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✅ Login successful');

    // Create test CSV file
    const testData = `sku,name,description,brand,stock,list_price,category_hierarchy
PROD001,Sample Product 1,This is a sample product,Brand A,100,199.99,"Electronics > Mobile Devices > Smartphones > Premium"
PROD002,Sample Product 2,Another sample product,Brand B,50,299.99,"Computers > Laptops > Gaming > High-End"
PROD003,Sample Product 3,Third sample product,Brand C,75,149.99,"Home & Garden > Kitchen > Appliances > Small Appliances"`;

    const testFilePath = path.join(__dirname, 'test-csv-import-debug.csv');
    fs.writeFileSync(testFilePath, testData);
    console.log('✅ Created test CSV file');

    // Test 1: Check current categories before import
    console.log('\n📝 Test 1: Checking current categories...');
    const categoriesBeforeResponse = await fetch(`${API_BASE_URL}/categories`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!categoriesBeforeResponse.ok) {
      throw new Error('Failed to fetch categories');
    }

    const categoriesBefore = await categoriesBeforeResponse.json();
    console.log(`✅ Found ${categoriesBefore.categories.length} existing categories`);

    // Test 2: Get import fields
    console.log('\n📝 Test 2: Getting import fields...');
    const fieldsResponse = await fetch(`${API_BASE_URL}/products/import/fields`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!fieldsResponse.ok) {
      throw new Error('Failed to get import fields');
    }

    const fieldsData = await fieldsResponse.json();
    console.log('✅ Import fields retrieved');

    // Test 3: Create FormData for CSV import
    console.log('\n📝 Test 3: Preparing CSV import...');
    const formData = new FormData();
    formData.append('csvFile', fs.createReadStream(testFilePath));
    
    // Create field mapping
    const fieldMapping = {
      'sku': 'sku',
      'name': 'name',
      'description': 'description',
      'brand': 'brand',
      'stock': 'stock',
      'list_price': 'list_price',
      'category_hierarchy': 'category_hierarchy'
    };
    
    formData.append('fieldMapping', JSON.stringify(fieldMapping));
    formData.append('updateMode', 'false');
    formData.append('selectedVendor', '');

    console.log('📋 Field mapping:', fieldMapping);

    // Test 4: Import CSV
    console.log('\n📝 Test 4: Importing CSV...');
    const importResponse = await fetch(`${API_BASE_URL}/products/import`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        ...formData.getHeaders()
      },
      body: formData
    });

    if (!importResponse.ok) {
      const errorText = await importResponse.text();
      console.error('❌ Import failed:', errorText);
      throw new Error(`Import failed: ${importResponse.status} ${importResponse.statusText}`);
    }

    console.log('✅ Import request sent successfully');

    // Test 5: Check categories after import
    console.log('\n📝 Test 5: Checking categories after import...');
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for import to complete

    const categoriesAfterResponse = await fetch(`${API_BASE_URL}/categories`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!categoriesAfterResponse.ok) {
      throw new Error('Failed to fetch categories after import');
    }

    const categoriesAfter = await categoriesAfterResponse.json();
    console.log(`✅ Found ${categoriesAfter.categories.length} categories after import`);

    // Test 6: Check products
    console.log('\n📝 Test 6: Checking imported products...');
    const productsResponse = await fetch(`${API_BASE_URL}/products`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!productsResponse.ok) {
      throw new Error('Failed to fetch products');
    }

    const productsData = await productsResponse.json();
    console.log(`✅ Found ${productsData.products.length} products`);

    // Display results
    console.log('\n📊 RESULTS:');
    console.log(`Categories before: ${categoriesBefore.categories.length}`);
    console.log(`Categories after: ${categoriesAfter.categories.length}`);
    console.log(`Products: ${productsData.products.length}`);

    // Check for specific categories
    const newCategories = categoriesAfter.categories.filter(cat => 
      !categoriesBefore.categories.some(beforeCat => beforeCat.id === cat.id)
    );

    console.log(`\n🆕 New categories created: ${newCategories.length}`);
    if (newCategories.length > 0) {
      console.log('New categories:');
      newCategories.forEach(cat => {
        console.log(`  - ${cat.name} (ID: ${cat.id}, Level: ${cat.level}, Type: ${cat.type})`);
      });
    }

    // Check for products with categories
    const productsWithCategories = productsData.products.filter(prod => 
      prod.vendor_category_id || prod.store_category_id
    );

    console.log(`\n📦 Products with categories: ${productsWithCategories.length}`);
    if (productsWithCategories.length > 0) {
      console.log('Products with categories:');
      productsWithCategories.forEach(prod => {
        console.log(`  - ${prod.name} (SKU: ${prod.sku})`);
        console.log(`    Vendor Category ID: ${prod.vendor_category_id}`);
        console.log(`    Store Category ID: ${prod.store_category_id}`);
      });
    }

    console.log('\n🎉 CSV import test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testCSVImport();
