const mysql = require('mysql2/promise');

async function testVendorProductCounts() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '123456',
      database: 'product_management'
    });

    console.log('=== Testing Vendor Product Counts ===\n');

    // Get vendors with product counts
    const [vendors] = await connection.execute(`
      SELECT v.*, 
             COUNT(DISTINCT p.id) as product_count,
             SUM(CASE WHEN p.stock > 0 THEN 1 ELSE 0 END) as in_stock_count,
             SUM(CASE WHEN p.stock <= 0 THEN 1 ELSE 0 END) as out_of_stock_count
      FROM vendors v 
      LEFT JOIN products p ON v.id = p.vendor_id 
      GROUP BY v.id 
      ORDER BY v.name
    `);

    console.log('Vendor Product Counts:');
    vendors.forEach(v => {
      console.log(`${v.name}: ${v.product_count} products (${v.in_stock_count} in stock, ${v.out_of_stock_count} out of stock)`);
    });

    // Get total products
    const [totalProducts] = await connection.execute('SELECT COUNT(*) as total FROM products');
    console.log(`\nTotal products in database: ${totalProducts[0].total}`);

    // Get products without vendor
    const [productsWithoutVendor] = await connection.execute('SELECT COUNT(*) as count FROM products WHERE vendor_id IS NULL');
    console.log(`Products without vendor: ${productsWithoutVendor[0].count}`);

    // Get products with invalid vendor_id
    const [productsWithInvalidVendor] = await connection.execute(`
      SELECT COUNT(*) as count 
      FROM products p 
      LEFT JOIN vendors v ON p.vendor_id = v.id 
      WHERE p.vendor_id IS NOT NULL AND v.id IS NULL
    `);
    console.log(`Products with invalid vendor_id: ${productsWithInvalidVendor[0].count}`);

    // Calculate expected total
    const vendorProductSum = vendors.reduce((sum, v) => sum + (v.product_count || 0), 0);
    const productsWithoutVendorCount = productsWithoutVendor[0].count;
    const expectedTotal = vendorProductSum + productsWithoutVendorCount;
    
    console.log(`\nExpected total: ${expectedTotal} (vendor products: ${vendorProductSum} + without vendor: ${productsWithoutVendorCount})`);
    console.log(`Actual total: ${totalProducts[0].total}`);
    console.log(`Difference: ${totalProducts[0].total - expectedTotal}`);

    // Show some sample products without vendor
    if (productsWithoutVendor[0].count > 0) {
      const [sampleProducts] = await connection.execute(`
        SELECT id, name, sku, vendor_id 
        FROM products 
        WHERE vendor_id IS NULL 
        LIMIT 5
      `);
      console.log('\nSample products without vendor:');
      sampleProducts.forEach(p => {
        console.log(`- ${p.name} (SKU: ${p.sku}, ID: ${p.id})`);
      });
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testVendorProductCounts();
