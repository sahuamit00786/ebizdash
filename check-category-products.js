const mysql = require('mysql2/promise');
const db = require('./server/config/database');

async function checkCategoryProducts() {
  try {
    console.log('=== Checking Products Using Categories ===\n');
    
    // Check products using specific categories
    const categoryIds = [1, 2]; // Electronic and Computers categories
    
    console.log('1. Products using categories:', categoryIds);
    
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
      WHERE p.store_category_id IN (${categoryIds.map(() => '?').join(',')}) 
         OR p.vendor_category_id IN (${categoryIds.map(() => '?').join(',')})
      ORDER BY p.name
    `, [...categoryIds, ...categoryIds]);
    
    if (products.length === 0) {
      console.log('  ✅ No products found using these categories');
    } else {
      console.log(`  ⚠️  Found ${products.length} products using these categories:`);
      products.forEach(product => {
        console.log(`    - ${product.name} (SKU: ${product.sku})`);
        if (product.store_category_id) {
          console.log(`      Store Category: ${product.store_category_name} (ID: ${product.store_category_id})`);
        }
        if (product.vendor_category_id) {
          console.log(`      Vendor Category: ${product.vendor_category_name} (ID: ${product.vendor_category_id})`);
        }
      });
    }
    
    console.log('\n2. To delete these categories, you need to:');
    console.log('   a) Reassign the products to different categories, OR');
    console.log('   b) Delete the products first, OR');
    console.log('   c) Set the category_id to NULL for these products');
    
    console.log('\n3. Quick fix - Reassign products to a different category:');
    console.log('   You can update the products to use a different category or set category_id to NULL');
    
    // Show available alternative categories
    const [alternativeCategories] = await db.execute(`
      SELECT id, name, type, level
      FROM categories 
      WHERE id NOT IN (${categoryIds.map(() => '?').join(',')})
      ORDER BY type, level, name
      LIMIT 10
    `, categoryIds);
    
    console.log('\n4. Available alternative categories:');
    alternativeCategories.forEach(cat => {
      console.log(`   - ${cat.name} (ID: ${cat.id}, Type: ${cat.type}, Level: ${cat.level})`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

checkCategoryProducts();
