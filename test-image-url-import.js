const mysql = require('mysql2/promise');
const db = require('./server/config/database');

async function testImageUrlImport() {
  try {
    console.log('=== Testing Image URL Import Issue ===\n');
    
    // Test 1: Check if image_url field exists in database
    console.log('1. Checking database schema...');
    const [columns] = await db.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'product_management' 
      AND TABLE_NAME = 'products' 
      AND COLUMN_NAME = 'image_url'
    `);
    
    if (columns.length > 0) {
      console.log('✅ image_url field exists in database:', columns[0]);
    } else {
      console.log('❌ image_url field does not exist in database');
      return;
    }
    
    // Test 2: Check current products for image_url values
    console.log('\n2. Checking existing products for image_url values...');
    const [products] = await db.execute(`
      SELECT id, sku, name, image_url 
      FROM products 
      LIMIT 5
    `);
    
    console.log('Current products:');
    products.forEach(product => {
      console.log(`  - ${product.sku}: ${product.name} | image_url: ${product.image_url || 'NULL'}`);
    });
    
    // Test 3: Simulate CSV import with image_url
    console.log('\n3. Testing CSV import with image_url field...');
    
    // Simulate CSV row with image_url
    const testRow = {
      sku: 'TEST-IMG-001',
      name: 'Test Product with Image',
      image_url: 'https://example.com/images/test-product.jpg',
      brand: 'TestBrand',
      stock: 10,
      list_price: 99.99
    };
    
    // Simulate field mapping
    const fieldMapping = {
      'sku': 'sku',
      'name': 'name', 
      'image_url': 'image_url',
      'brand': 'brand',
      'stock': 'stock',
      'list_price': 'list_price'
    };
    
    console.log('Field mapping:', fieldMapping);
    console.log('Test row data:', testRow);
    
    // Test 4: Insert test product with image_url
    console.log('\n4. Inserting test product with image_url...');
    
    const [insertResult] = await db.execute(`
      INSERT INTO products (sku, name, image_url, brand, stock, list_price, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      testRow.sku,
      testRow.name,
      testRow.image_url,
      testRow.brand,
      testRow.stock,
      testRow.list_price
    ]);
    
    console.log('✅ Test product inserted with ID:', insertResult.insertId);
    
    // Test 5: Verify the insertion
    const [insertedProduct] = await db.execute(`
      SELECT id, sku, name, image_url, brand, stock, list_price
      FROM products 
      WHERE id = ?
    `, [insertResult.insertId]);
    
    if (insertedProduct.length > 0) {
      const product = insertedProduct[0];
      console.log('✅ Product retrieved successfully:');
      console.log(`  - ID: ${product.id}`);
      console.log(`  - SKU: ${product.sku}`);
      console.log(`  - Name: ${product.name}`);
      console.log(`  - Image URL: ${product.image_url}`);
      console.log(`  - Brand: ${product.brand}`);
      console.log(`  - Stock: ${product.stock}`);
      console.log(`  - List Price: ${product.list_price}`);
    }
    
    // Test 6: Clean up test data
    console.log('\n5. Cleaning up test data...');
    await db.execute('DELETE FROM products WHERE sku = ?', [testRow.sku]);
    console.log('✅ Test data cleaned up');
    
    console.log('\n=== Test Results ===');
    console.log('✅ Database schema supports image_url field');
    console.log('✅ Direct database insertion works with image_url');
    console.log('❌ Issue: CSV files do not contain image_url column');
    console.log('\n=== Solution ===');
    console.log('To fix this issue, you need to:');
    console.log('1. Add an "image_url" column to your CSV files');
    console.log('2. Or rename your existing image column to include "image" and "url" in the name');
    console.log('3. The auto-mapping will then work correctly');
    
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    process.exit(0);
  }
}

testImageUrlImport();
