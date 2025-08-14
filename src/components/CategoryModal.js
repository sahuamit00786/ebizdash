"use client"

import { useState, useEffect } from "react"
import { useToast } from "../context/ToastContext"
import API_BASE_URL from "../config/api"
import "./CategoryModal.css"

const CategoryModal = ({ category, categories, onClose, onSave, selectedVendor = null }) => {
  const [formData, setFormData] = useState({
    name: "",
    type: "vendor",
    parent_id: "",
  })
  const [loading, setLoading] = useState(false)
  const { showToast } = useToast()

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || "",
        type: category.type || category.description || "vendor",
        parent_id: category.parent_id || "",
      })
    } else {
      // Reset form when creating new category
      setFormData({
        name: "",
        type: "vendor",
        parent_id: "",
      })
    }
  }, [category])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    // Validate required fields
    if (!formData.name.trim()) {
      showToast("Category name is required", "error")
      setLoading(false)
      return
    }

    // Validate parent selection to prevent circular references
    if (category && formData.parent_id && parseInt(formData.parent_id) === category.id) {
      showToast("A category cannot be its own parent", "error")
      setLoading(false)
      return
    }

    // Validate category type
    if (!['vendor', 'store'].includes(formData.type)) {
      showToast("Category type must be 'vendor' or 'store'", "error")
      setLoading(false)
      return
    }

    // Prepare data for submission - convert empty parent_id to null and ensure proper types
    const submitData = {
      id: category?.id || null,
      name: formData.name.trim(),
      type: formData.type,
      parent_id: formData.parent_id === "" ? null : (formData.parent_id ? parseInt(formData.parent_id) : null),
      status: "active"
    }

    console.log("Submitting category data:", submitData)

    try {
      // Call the parent's onSave function instead of making API call here
      await onSave(submitData)
      setLoading(false)
    } catch (error) {
      console.error("Category save error:", error)
      showToast("Error saving category", "error")
      setLoading(false)
    }
  }

  // Get available parent categories with hierarchical display
  const getAvailableParents = () => {
    const filtered = categories.filter(
      (cat) => cat.type === formData.type && cat.level < 5 && cat.id !== (category?.id || null),
    )
    
    // Build hierarchical options
    const buildHierarchicalOptions = (cats, level = 0) => {
      return cats.map(cat => {
        const indent = "  ".repeat(level)
        const hasSubcategories = cats.some(sub => sub.parent_id === cat.id)
        const displayName = `${indent}${cat.name} (Level ${cat.level})${hasSubcategories ? ' 📁' : ''}`
        
        return {
          id: cat.id,
          name: displayName,
          level: cat.level,
          parent_id: cat.parent_id
        }
      })
    }
    
    return buildHierarchicalOptions(filtered)
  }

  const availableParents = getAvailableParents()

  return (
    <div className="modal-overlay">
      <div className="modal-content category-modal">
        <div className="modal-header">
          <h2>
            {category && category.id ? "Edit Category" : formData.parent_id ? "Add Subcategory" : "Add New Category"}
          </h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="category-form">
          <div className="form-group">
            <label htmlFor="name">Category Name *</label>
            <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required />
            {selectedVendor && selectedVendor !== "all" && (
              <small className="form-help">
                Creating category for vendor: {selectedVendor}
              </small>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="type">Type *</label>
            <select id="type" name="type" value={formData.type} onChange={handleChange} required>
              <option value="vendor">Vendor Category</option>
              <option value="store">Store Category</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="parent_id">Parent Category</label>
            <select id="parent_id" name="parent_id" value={formData.parent_id} onChange={handleChange}>
              <option value="">No Parent (Root Category)</option>
              {availableParents.map((parent) => (
                <option key={parent.id} value={parent.id}>
                  {parent.name}
                </option>
              ))}
            </select>
            <small className="form-help">
              Select a parent category to create a subcategory, or leave empty for a root category
            </small>
            {category && category.id && category.subcategories && category.subcategories.length > 0 && 
             formData.parent_id !== (category.parent_id || "") && (
              <div className="subcategory-warning">
                <small style={{ color: '#856404', backgroundColor: '#fff3cd', padding: '8px', borderRadius: '4px', display: 'block', marginTop: '8px' }}>
                  ⚠️ This category has {category.subcategories.length} subcategory(ies). 
                  Changing the parent will also update all subcategory levels.
                </small>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Saving..." : (category && category.id) ? "Update Category" : "Create Category"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CategoryModal
