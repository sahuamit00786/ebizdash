const express = require("express")
const bcrypt = require("bcryptjs")
const { pool: db, executeWithRetry } = require("../config/database")
const { authenticateToken, requireAdmin } = require("../middleware/auth")

const router = express.Router()

// Get all users (admin only)
router.get("/", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [users] = await db.execute(
      "SELECT id, username, email, role, permissions, created_at FROM users ORDER BY created_at DESC",
    )
    res.json(users)
  } catch (error) {
    console.error("Get users error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Create user (admin only)
router.post("/", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { username, email, password, role, permissions } = req.body

    const hashedPassword = await bcrypt.hash(password, 10)

    const [result] = await db.execute(
      "INSERT INTO users (username, email, password, role, permissions) VALUES (?, ?, ?, ?, ?)",
      [username, email, hashedPassword, role, JSON.stringify(permissions || {})],
    )

    res.status(201).json({ id: result.insertId, message: "User created successfully" })
  } catch (error) {
    console.error("Create user error:", error)
    if (error.code === "ER_DUP_ENTRY") {
      res.status(400).json({ message: "Username or email already exists" })
    } else {
      res.status(500).json({ message: "Server error" })
    }
  }
})

// Update user (admin only)
router.put("/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const { username, email, password, role, permissions } = req.body

    let query = "UPDATE users SET username = ?, email = ?, role = ?, permissions = ?"
    const params = [username, email, role, JSON.stringify(permissions || {})]

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10)
      query += ", password = ?"
      params.push(hashedPassword)
    }

    query += " WHERE id = ?"
    params.push(id)

    await db.execute(query, params)
    res.json({ message: "User updated successfully" })
  } catch (error) {
    console.error("Update user error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Delete user (admin only)
router.delete("/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params

    if (Number.parseInt(id) === req.user.id) {
      return res.status(400).json({ message: "Cannot delete your own account" })
    }

    await db.execute("DELETE FROM users WHERE id = ?", [id])
    res.json({ message: "User deleted successfully" })
  } catch (error) {
    console.error("Delete user error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

module.exports = router
