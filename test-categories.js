const mysql = require("mysql2")
const dotenv = require("dotenv")

dotenv.config()

const pool = mysql.createPool({
  host: "45.77.196.170",
  user: "ebizdash_products_react",
  password: "products_react",
  database: "ebizdash_products_react",
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
})

async function testCategories() {
  try {
    console.log("Testing categories and levels...")
    const connection = await pool.promise()
    
    // Check all categories with their levels
    const [categories] = await connection.execute(`
      SELECT id, name, type, parent_id, level, status, created_at
      FROM categories
      ORDER BY parent_id, level, name
    `)
    
    console.log("✅ All categories:", categories)
    
    // Check for any level inconsistencies
    const [levelIssues] = await connection.execute(`
      SELECT c1.id, c1.name, c1.level, c1.parent_id,
             c2.name as parent_name, c2.level as parent_level
      FROM categories c1
      LEFT JOIN categories c2 ON c1.parent_id = c2.id
      WHERE c1.parent_id IS NOT NULL AND c1.level != c2.level + 1
    `)
    
    if (levelIssues.length > 0) {
      console.log("❌ Level inconsistencies found:", levelIssues)
    } else {
      console.log("✅ All levels are correct")
    }
    
    // Test the categories API query
    const [apiResult] = await connection.execute(`
      SELECT 
        c.id, c.name, c.type as description, c.parent_id, c.level, 
        c.status, c.created_at,
        COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.store_category_id OR c.id = p.vendor_category_id
      GROUP BY c.id, c.name, c.type, c.parent_id, c.level, 
               c.status, c.created_at
      ORDER BY COALESCE(c.parent_id, c.id), c.level, c.name
    `)
    
    console.log("✅ API query result:", apiResult)
    
    await connection.end()
  } catch (error) {
    console.error("❌ Error:", error)
  }
}

testCategories() 