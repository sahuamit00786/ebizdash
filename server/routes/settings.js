const express = require("express")
const { pool: db, executeWithRetry } = require("../config/database")
const { authenticateToken } = require("../middleware/auth")

const router = express.Router()

// Get settings
router.get("/", authenticateToken, async (req, res) => {
  try {
    const [settings] = await db.execute("SELECT setting_key, setting_value FROM settings")

    const settingsObj = {}
    settings.forEach((setting) => {
      settingsObj[setting.setting_key] = setting.setting_value
    })

    res.json(settingsObj)
  } catch (error) {
    console.error("Get settings error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Update settings
router.put("/", authenticateToken, async (req, res) => {
  try {
    const settings = req.body

    for (const [key, value] of Object.entries(settings)) {
      await db.execute(
        "INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?",
        [key, value, value],
      )
    }

    res.json({ message: "Settings updated successfully" })
  } catch (error) {
    console.error("Update settings error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

module.exports = router
