const express = require("express")
const { pool: db, executeWithRetry } = require("../config/database")
const { authenticateToken } = require("../middleware/auth")

const router = express.Router()

// Get all vendors with enhanced statistics
router.get("/", authenticateToken, async (req, res) => {
  try {
    const [vendors] = await db.execute(`
      SELECT v.*, 
             COUNT(DISTINCT p.id) as product_count,
             SUM(CASE WHEN p.stock > 0 THEN 1 ELSE 0 END) as in_stock_count,
             SUM(CASE WHEN p.stock <= 0 THEN 1 ELSE 0 END) as out_of_stock_count
      FROM vendors v 
      LEFT JOIN products p ON v.id = p.vendor_id 
      GROUP BY v.id 
      ORDER BY v.name
    `)

    res.json({ vendors })
  } catch (error) {
    console.error("Get vendors error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Get single vendor with detailed information
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params

    const [vendors] = await db.execute(`
      SELECT v.*, 
             COUNT(DISTINCT p.id) as product_count,
             SUM(CASE WHEN p.stock > 0 THEN 1 ELSE 0 END) as in_stock_count,
             SUM(CASE WHEN p.stock <= 0 THEN 1 ELSE 0 END) as out_of_stock_count
      FROM vendors v 
      LEFT JOIN products p ON v.id = p.vendor_id 
      WHERE v.id = ?
      GROUP BY v.id
    `, [id])

    if (vendors.length === 0) {
      return res.status(404).json({ message: "Vendor not found" })
    }

    // Get vendor's categories (vendor type categories)
    const [categories] = await db.execute(`
      SELECT id, name, type as description, level, status
      FROM categories 
      WHERE type = 'vendor'
      ORDER BY level, name
    `)

    // Get vendor's products
    const [products] = await db.execute(`
      SELECT id, name, sku, stock, list_price, vendor_category_id, store_category_id
      FROM products 
      WHERE vendor_id = ?
      ORDER BY name
    `, [id])

    const vendor = vendors[0]
    vendor.categories = categories
    vendor.products = products

    res.json(vendor)
  } catch (error) {
    console.error("Get vendor error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Create vendor
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { 
      name, 
      email, 
      phone, 
      address, 
      city, 
      state, 
      country, 
      postal_code, 
      website, 
      contact_person, 
      tax_id, 
      payment_terms, 
      status, 
      logo_url, 
      description, 
      notes 
    } = req.body

    if (!name) {
      return res.status(400).json({ message: "Vendor name is required" })
    }

    const [result] = await db.execute(`
      INSERT INTO vendors (
        name, email, phone, address, status
      ) VALUES (?, ?, ?, ?, ?)
    `, [
      name, email || null, phone || null, address || null, status || 'active'
    ])

    res.status(201).json({ 
      id: result.insertId, 
      message: "Vendor created successfully" 
    })
  } catch (error) {
    console.error("Create vendor error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Update vendor
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const { 
      name, 
      email, 
      phone, 
      address, 
      city, 
      state, 
      country, 
      postal_code, 
      website, 
      contact_person, 
      tax_id, 
      payment_terms, 
      status, 
      logo_url, 
      description, 
      notes 
    } = req.body

    if (!name) {
      return res.status(400).json({ message: "Vendor name is required" })
    }

    // Check if vendor exists
    const [existingVendor] = await db.execute(
      "SELECT id FROM vendors WHERE id = ?",
      [id]
    )
    if (existingVendor.length === 0) {
      return res.status(404).json({ message: "Vendor not found" })
    }

    await db.execute(`
      UPDATE vendors SET 
        name = ?, email = ?, phone = ?, address = ?, status = ?
      WHERE id = ?
    `, [
      name, email || null, phone || null, address || null, status || 'active', id
    ])

    res.json({ message: "Vendor updated successfully" })
  } catch (error) {
    console.error("Update vendor error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Delete vendor
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params

    // Check if vendor exists
    const [existingVendor] = await db.execute(
      "SELECT id FROM vendors WHERE id = ?",
      [id]
    )
    if (existingVendor.length === 0) {
      return res.status(404).json({ message: "Vendor not found" })
    }

    // Check if vendor has products
    const [products] = await db.execute(
      "SELECT id FROM products WHERE vendor_id = ?",
      [id]
    )
    if (products.length > 0) {
      return res.status(400).json({ 
        message: "Cannot delete vendor with products. Please reassign or delete products first." 
      })
    }

    await db.execute("DELETE FROM vendors WHERE id = ?", [id])

    res.json({ message: "Vendor deleted successfully" })
  } catch (error) {
    console.error("Delete vendor error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Bulk operations
router.post("/bulk", authenticateToken, async (req, res) => {
  try {
    const { operation, vendorIds, updateData } = req.body

    if (!operation || !vendorIds || !Array.isArray(vendorIds)) {
      return res.status(400).json({ message: "Invalid request" })
    }

    switch (operation) {
      case "delete":
        // Check for products
        for (const vendorId of vendorIds) {
          const [products] = await db.execute(
            "SELECT id FROM products WHERE vendor_id = ?",
            [vendorId]
          )
          if (products.length > 0) {
            return res.status(400).json({ 
              message: `Vendor ${vendorId} has products and cannot be deleted` 
            })
          }
        }

        await db.execute(
          "DELETE FROM vendors WHERE id IN (" + vendorIds.map(() => "?").join(",") + ")",
          vendorIds
        )
        break

      case "update":
        if (!updateData) {
          return res.status(400).json({ message: "Update data is required" })
        }

        const fields = Object.keys(updateData)
          .map(key => `${key} = ?`)
          .join(", ")
        const values = Object.values(updateData)
        
        for (const vendorId of vendorIds) {
          await db.execute(
            `UPDATE vendors SET ${fields}, updated_at = NOW() WHERE id = ?`,
            [...values, vendorId]
          )
        }
        break

      default:
        return res.status(400).json({ message: "Invalid operation" })
    }

    res.json({ 
      message: `${operation} completed successfully for ${vendorIds.length} vendors` 
    })
  } catch (error) {
    console.error("Bulk operation error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

module.exports = router
