"use client"

import { useState, useEffect } from "react"
import { useToast } from "../context/ToastContext"
import "./Settings.css"

const Settings = () => {
  const [settings, setSettings] = useState({
    company_name: "",
    logo_url: "",
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { showToast } = useToast()

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/settings", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setSettings(data)
      }
    } catch (error) {
      showToast("Error loading settings", "error")
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setSettings((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      })

      if (response.ok) {
        showToast("Settings updated successfully", "success")
      } else {
        const error = await response.json()
        showToast(error.message || "Error updating settings", "error")
      }
    } catch (error) {
      showToast("Error updating settings", "error")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="loading">Loading settings...</div>
  }

  return (
    <div className="settings">
      <div className="settings-header">
        <h1>Settings</h1>
        <p>Manage your application settings</p>
      </div>

      <div className="settings-content">
        <div className="settings-section">
          <h2>Company Information</h2>
          <form onSubmit={handleSubmit} className="settings-form">
            <div className="form-group">
              <label htmlFor="company_name">Company Name</label>
              <input
                type="text"
                id="company_name"
                name="company_name"
                value={settings.company_name}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="logo_url">Logo URL</label>
              <input
                type="url"
                id="logo_url"
                name="logo_url"
                value={settings.logo_url}
                onChange={handleChange}
                placeholder="https://example.com/logo.png"
              />
            </div>

            {settings.logo_url && (
              <div className="logo-preview">
                <label>Logo Preview:</label>
                <img
                  src={settings.logo_url || "/placeholder.svg"}
                  alt="Company Logo"
                  className="logo-preview-image"
                  onError={(e) => {
                    e.target.style.display = "none"
                  }}
                />
              </div>
            )}

            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </form>
        </div>

        <div className="settings-section">
          <h2>System Information</h2>
          <div className="system-info">
            <div className="info-item">
              <span className="label">Version:</span>
              <span>1.0.0</span>
            </div>
            <div className="info-item">
              <span className="label">Last Updated:</span>
              <span>{new Date().toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings
