const jwt = require("jsonwebtoken")
const { pool: db, executeWithRetry } = require("../config/database")

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"]
  const token = authHeader && authHeader.split(" ")[1]

  if (!token) {
    return res.status(401).json({ message: "Access token required" })
  }

  try {
    const decoded = jwt.verify(token, '32oweqho32ydfswj32udfklsandoy')
    const [users] = await db.execute("SELECT * FROM users WHERE id = ?", [decoded.userId])

    if (users.length === 0) {
      return res.status(403).json({ message: "Invalid token" })
    }

    req.user = users[0]
    next()
  } catch (error) {
    return res.status(403).json({ message: "Invalid token" })
  }
}

const requireAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" })
  }
  next()
}

module.exports = { authenticateToken, requireAdmin }
