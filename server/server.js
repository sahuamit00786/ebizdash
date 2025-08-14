const express = require("express")
const cors = require("cors")
const dotenv = require("dotenv")
const path = require("path")

// Load environment variables
dotenv.config()

const app = express()
const PORT = 5000

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Static files
app.use("/uploads", express.static("uploads"))

// Routes
app.use("/api/auth", require("./routes/auth"))
app.use("/api/dashboard", require("./routes/dashboard"))
app.use("/api/products", require("./routes/products"))
app.use("/api/categories", require("./routes/categories"))
app.use("/api/vendors", require("./routes/vendors"))
app.use("/api/users", require("./routes/users"))
app.use("/api/settings", require("./routes/settings"))

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ message: "Something went wrong!" })
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
