const express = require("express")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const { pool: db, executeWithRetry } = require("../config/database")
const dotenv = require("dotenv")

// Load environment variables
dotenv.config()

const router = express.Router()

// Login
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body

    const [users] = await db.execute("SELECT * FROM users WHERE username = ? OR email = ?", [username, username])

    if (users.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" })
    }

    const user = users[0]
    const isValidPassword = await bcrypt.compare(password, user.password)

    if (!isValidPassword) {
      return res.status(401).json({ message: "Invalid credentials" })
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, '32oweqho32ydfswj32udfklsandoy', { expiresIn: "24h" })

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    
    // Handle specific database connection errors
    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return res.status(503).json({ 
        message: "Database connection failed. Please try again later.",
        error: "Database connection timeout"
      })
    }
    
    res.status(500).json({ message: "Server error" })
  }
})

// Register
router.post("/register", async (req, res) => {
  console.log("Register endpoint hit with body:", req.body)
  try {
    const { username, email, password, role = 'shop_manager' } = req.body

    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields are required" })
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" })
    }

    // Check if user already exists
    const [existingUsers] = await db.execute(
      "SELECT * FROM users WHERE username = ? OR email = ?",
      [username, email]
    )

    if (existingUsers.length > 0) {
      return res.status(400).json({ message: "Username or email already exists" })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const [result] = await db.execute(
      "INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)",
      [username, email, hashedPassword, role]
    )

    // Get the created user
    const [newUser] = await db.execute("SELECT * FROM users WHERE id = ?", [result.insertId])

    const token = jwt.sign(
      { userId: newUser[0].id, role: newUser[0].role },
      '32oweqho32ydfswj32udfklsandoy',
      { expiresIn: "24h" }
    )

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: newUser[0].id,
        username: newUser[0].username,
        email: newUser[0].email,
        role: newUser[0].role,
        permissions: newUser[0].permissions,
      },
    })
  } catch (error) {
    console.error("Registration error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

module.exports = router
