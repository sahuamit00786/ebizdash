"use client"

import { useState, useEffect } from "react"
import { useToast } from "../context/ToastContext"
import API_BASE_URL from "../config/api"
import "./VendorModal.css"

const VendorModal = ({ vendor, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    country: "",
    postal_code: "",
    website: "",
    contact_person: "",
    tax_id: "",
    payment_terms: "",
    status: "active",
    logo_url: "",
    description: "",
    notes: ""
  })
  const [loading, setLoading] = useState(false)
  const { showToast } = useToast()

  useEffect(() => {
    if (vendor) {
      setFormData({
        name: vendor.name || "",
        email: vendor.email || "",
        phone: vendor.phone || "",
        address: vendor.address || "",
        city: vendor.city || "",
        state: vendor.state || "",
        country: vendor.country || "",
        postal_code: vendor.postal_code || "",
        website: vendor.website || "",
        contact_person: vendor.contact_person || "",
        tax_id: vendor.tax_id || "",
        payment_terms: vendor.payment_terms || "",
        status: vendor.status || "active",
        logo_url: vendor.logo_url || "",
        description: vendor.description || "",
        notes: vendor.notes || ""
      })
    }
  }, [vendor])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      showToast("Vendor name is required", "error")
      return
    }

    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      const url = vendor?.id 
        ? `${API_BASE_URL}/vendors/${vendor.id}`
        : `${API_BASE_URL}/vendors`
      
      const response = await fetch(url, {
        method: vendor?.id ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const data = await response.json()
        showToast(data.message, "success")
        onSave()
      } else {
        const error = await response.json()
        showToast(error.message || "Error saving vendor", "error")
      }
    } catch (error) {
      console.error("Error saving vendor:", error)
      showToast("Error saving vendor", "error")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <div className="modal-overlay">
      <div className="vendor-modal">
        <div className="modal-header">
          <h2>{vendor?.id ? "Edit Vendor" : "Add New Vendor"}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-sections">
            {/* Basic Information */}
            <div className="form-section">
              <h3 className="section-title">Basic Information</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Vendor Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Enter vendor name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Contact Person</label>
                  <input
                    type="text"
                    value={formData.contact_person}
                    onChange={(e) => handleInputChange("contact_person", e.target.value)}
                    placeholder="Primary contact person"
                  />
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="vendor@example.com"
                  />
                </div>

                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div className="form-group">
                  <label>Website</label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => handleInputChange("website", e.target.value)}
                    placeholder="https://www.vendor.com"
                  />
                </div>

                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleInputChange("status", e.target.value)}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div className="form-section">
              <h3 className="section-title">Address Information</h3>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>Street Address</label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    placeholder="Enter full street address"
                    rows="3"
                  />
                </div>

                <div className="form-group">
                  <label>City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                    placeholder="City"
                  />
                </div>

                <div className="form-group">
                  <label>State/Province</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => handleInputChange("state", e.target.value)}
                    placeholder="State or Province"
                  />
                </div>

                <div className="form-group">
                  <label>Country</label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => handleInputChange("country", e.target.value)}
                    placeholder="Country"
                  />
                </div>

                <div className="form-group">
                  <label>Postal Code</label>
                  <input
                    type="text"
                    value={formData.postal_code}
                    onChange={(e) => handleInputChange("postal_code", e.target.value)}
                    placeholder="ZIP/Postal Code"
                  />
                </div>
              </div>
            </div>

            {/* Business Information */}
            <div className="form-section">
              <h3 className="section-title">Business Information</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Tax ID</label>
                  <input
                    type="text"
                    value={formData.tax_id}
                    onChange={(e) => handleInputChange("tax_id", e.target.value)}
                    placeholder="Tax identification number"
                  />
                </div>

                <div className="form-group">
                  <label>Payment Terms</label>
                  <input
                    type="text"
                    value={formData.payment_terms}
                    onChange={(e) => handleInputChange("payment_terms", e.target.value)}
                    placeholder="e.g., Net 30, COD"
                  />
                </div>

                <div className="form-group">
                  <label>Logo URL</label>
                  <input
                    type="url"
                    value={formData.logo_url}
                    onChange={(e) => handleInputChange("logo_url", e.target.value)}
                    placeholder="https://example.com/logo.png"
                  />
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="form-section">
              <h3 className="section-title">Additional Information</h3>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="Brief description of the vendor"
                    rows="3"
                  />
                </div>

                <div className="form-group full-width">
                  <label>Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    placeholder="Additional notes or comments"
                    rows="3"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Saving..." : (vendor?.id ? "Update Vendor" : "Create Vendor")}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default VendorModal
