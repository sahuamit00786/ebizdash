const express = require("express")
const { pool: db, executeWithRetry } = require("../config/database")
const { authenticateToken } = require("../middleware/auth")

const router = express.Router()

// Get dashboard statistics
router.get("/stats", authenticateToken, async (req, res) => {
  try {
    // Total products
    const [totalProducts] = await db.execute("SELECT COUNT(*) as count FROM products")

    // Total vendors
    const [totalVendors] = await db.execute('SELECT COUNT(*) as count FROM vendors WHERE status = "active"')

    // Out of stock products
    const [outOfStock] = await db.execute("SELECT COUNT(*) as count FROM products WHERE stock <= 0")

    // Featured products
    const [featuredProducts] = await db.execute("SELECT COUNT(*) as count FROM products WHERE featured = true")

    // Top vendors by product count
    const [topVendors] = await db.execute(`
            SELECT v.name, COUNT(p.id) as product_count 
            FROM vendors v 
            LEFT JOIN products p ON v.id = p.vendor_id 
            GROUP BY v.id, v.name 
            ORDER BY product_count DESC 
            LIMIT 5
        `)

    // Recent products
    const [recentProducts] = await db.execute(`
            SELECT p.*, v.name as vendor_name 
            FROM products p 
            LEFT JOIN vendors v ON p.vendor_id = v.id 
            ORDER BY p.created_at DESC 
            LIMIT 10
        `)

    res.json({
      stats: {
        totalProducts: totalProducts[0].count,
        totalVendors: totalVendors[0].count,
        outOfStock: outOfStock[0].count,
        featuredProducts: featuredProducts[0].count,
      },
      topVendors,
      recentProducts,
    })
  } catch (error) {
    console.error("Dashboard stats error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

module.exports = router
