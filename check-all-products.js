const mysql = require('mysql2/promise');
const db = require('./server/config/database');

async function checkAllProducts() {
  try {
    console.log('=== Checking All Products and Categories ===\n');
    
    // Check all products
    const [products] = await db.execute(`
      SELECT 
        p.id,
        p.name,
        p.sku,
        p.store_category_id,
        p.vendor_category_id,
        c1.name as store_category_name,
        c2.name as vendor_category_name
      FROM products p
      LEFT JOIN categories c1 ON p.store_category_id = c1.id
      LEFT JOIN categories c2 ON p.vendor_category_id = c2.id
      ORDER BY p.name
      LIMIT 20
    `);
    
    console.log(`1. Found ${products.length} products:`);
    products.forEach(product => {
      console.log(`   - ${product.name} (SKU: ${product.sku})`);
      if (product.store_category_id) {
        console.log(`     Store Category: ${product.store_category_name} (ID: ${product.store_category_id})`);
      }
      if (product.vendor_category_id) {
        console.log(`     Vendor Category: ${product.vendor_category_name} (ID: ${product.vendor_category_id})`);
      }
      if (!product.store_category_id && !product.vendor_category_id) {
        console.log(`     No categories assigned`);
      }
    });
    
    // Check products using specific category IDs
    const categoryIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
    
    const [productsUsingCategories] = await db.execute(`
      SELECT 
        p.id,
        p.name,
        p.sku,
        p.store_category_id,
        p.vendor_category_id
      FROM products p
      WHERE p.store_category_id IN (${categoryIds.map(() => '?').join(',')}) 
         OR p.vendor_category_id IN (${categoryIds.map(() => '?').join(',')})
      ORDER BY p.name
    `, [...categoryIds, ...categoryIds]);
    
    console.log(`\n2. Products using categories ${categoryIds.join(', ')}:`);
    if (productsUsingCategories.length === 0) {
      console.log('   ✅ No products found using these categories');
    } else {
      productsUsingCategories.forEach(product => {
        console.log(`   - ${product.name} (SKU: ${product.sku})`);
        console.log(`     Store Category ID: ${product.store_category_id}, Vendor Category ID: ${product.vendor_category_id}`);
      });
    }
    
    // Check total product count
    const [productCount] = await db.execute('SELECT COUNT(*) as count FROM products');
    console.log(`\n3. Total products in database: ${productCount[0].count}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

checkAllProducts();
