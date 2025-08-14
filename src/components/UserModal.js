"use client"

import { useState, useEffect } from "react"
import { useToast } from "../context/ToastContext"
import "./UserModal.css"

const UserModal = ({ user, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    role: "shop_manager",
    permissions: {},
  })
  const [loading, setLoading] = useState(false)
  const { showToast } = useToast()

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || "",
        email: user.email || "",
        password: "",
        role: user.role || "shop_manager",
        permissions: user.permissions || {},
      })
    }
  }, [user])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handlePermissionChange = (permission, checked) => {
    setFormData((prev) => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [permission]: checked,
      },
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const token = localStorage.getItem("token")
      const url = user ? `/api/users/${user.id}` : "/api/users"
      const method = user ? "PUT" : "POST"

      const submitData = { ...formData }
      if (user && !submitData.password) {
        delete submitData.password // Don't update password if empty
      }

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(submitData),
      })

      if (response.ok) {
        showToast(user ? "User updated successfully" : "User created successfully", "success")
        onSave()
      } else {
        const error = await response.json()
        showToast(error.message || "Error saving user", "error")
      }
    } catch (error) {
      showToast("Error saving user", "error")
    } finally {
      setLoading(false)
    }
  }

  const availablePermissions = [
    { key: "products", label: "Products Management" },
    { key: "categories", label: "Categories Management" },
    { key: "vendors", label: "Vendors Management" },
    { key: "settings", label: "Settings Access" },
  ]

  return (
    <div className="modal-overlay">
      <div className="modal-content user-modal">
        <div className="modal-header">
          <h2>{user ? "Edit User" : "Add New User"}</h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="user-form">
          <div className="form-group">
            <label htmlFor="username">Username *</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email *</label>
            <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password {user ? "(leave empty to keep current)" : "*"}</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required={!user}
            />
          </div>

          <div className="form-group">
            <label htmlFor="role">Role *</label>
            <select id="role" name="role" value={formData.role} onChange={handleChange} required>
              <option value="shop_manager">Shop Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {formData.role === "shop_manager" && (
            <div className="form-group">
              <label>Permissions</label>
              <div className="permissions-list">
                {availablePermissions.map((permission) => (
                  <label key={permission.key} className="permission-item">
                    <input
                      type="checkbox"
                      checked={formData.permissions[permission.key] || false}
                      onChange={(e) => handlePermissionChange(permission.key, e.target.checked)}
                    />
                    <span>{permission.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Saving..." : user ? "Update User" : "Create User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default UserModal
