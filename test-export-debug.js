const mysql = require('mysql2/promise')

// Database configuration
const dbConfig = {
  host: '45.77.196.170',
  user: 'ebizdash_products_react',
  password: 'products_react',
  database: 'ebizdash_products_react',
  charset: 'utf8mb4'
}

async function testExport() {
  let connection
  
  try {
    // Connect to database
    connection = await mysql.createConnection(dbConfig)
    console.log('Connected to database')
    
    // Test 1: Check total products
    const [totalProducts] = await connection.execute('SELECT COUNT(*) as count FROM products')
    console.log(`Total products in database: ${totalProducts[0].count}`)
    
    // Test 2: Check products with a specific filter (e.g., search)
    const searchTerm = 'test'
    const [filteredProducts] = await connection.execute(`
      SELECT COUNT(*) as count 
      FROM products p
      WHERE (p.name LIKE ? OR p.sku LIKE ? OR p.description LIKE ? OR p.brand LIKE ?)
    `, [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`])
    console.log(`Products matching search '${searchTerm}': ${filteredProducts[0].count}`)
    
    // Test 3: Check products with vendor filter
    const [vendorProducts] = await connection.execute(`
      SELECT COUNT(*) as count 
      FROM products p
      WHERE p.vendor_id = ?
    `, [1])
    console.log(`Products with vendor_id = 1: ${vendorProducts[0].count}`)
    
    // Test 4: Check products with stock filter
    const [stockProducts] = await connection.execute(`
      SELECT COUNT(*) as count 
      FROM products p
      WHERE p.stock >= ?
    `, [1])
    console.log(`Products with stock >= 1: ${stockProducts[0].count}`)
    
    // Test 5: Check products with published filter
    const [publishedProducts] = await connection.execute(`
      SELECT COUNT(*) as count 
      FROM products p
      WHERE p.published = ?
    `, [1])
    console.log(`Products with published = 1: ${publishedProducts[0].count}`)
    
    // Test 6: Check products with category filter
    const [categoryProducts] = await connection.execute(`
      SELECT COUNT(*) as count 
      FROM products p
      WHERE (p.store_category_id IN (?) OR p.vendor_category_id IN (?))
    `, [1, 1])
    console.log(`Products with category_id = 1: ${categoryProducts[0].count}`)
    
    // Test 7: Check products with multiple filters
    const [multiFilterProducts] = await connection.execute(`
      SELECT COUNT(*) as count 
      FROM products p
      WHERE p.published = ? AND p.stock >= ?
    `, [1, 1])
    console.log(`Products with published = 1 AND stock >= 1: ${multiFilterProducts[0].count}`)
    
    // Test 8: Check the actual export query structure
    const whereConditions = ['p.published = ?', 'p.stock >= ?']
    const queryParams = [1, 1]
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''
    
    const [exportProducts] = await connection.execute(`
      SELECT 
        p.*,
        v.name as vendor_name,
        vc.name as vendor_category_name,
        sc.name as store_category_name,
        sc.id as store_category_id
      FROM products p
      LEFT JOIN vendors v ON p.vendor_id = v.id
      LEFT JOIN categories vc ON p.vendor_category_id = vc.id
      LEFT JOIN categories sc ON p.store_category_id = sc.id
      ${whereClause}
      ORDER BY p.id
      LIMIT 5
    `, queryParams)
    
    console.log(`Export query with filters returned ${exportProducts.length} products (showing first 5):`)
    exportProducts.forEach((product, index) => {
      console.log(`${index + 1}. ID: ${product.id}, Name: ${product.name}, Published: ${product.published}, Stock: ${product.stock}`)
    })
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    if (connection) {
      await connection.end()
      console.log('Database connection closed')
    }
  }
}

testExport()
