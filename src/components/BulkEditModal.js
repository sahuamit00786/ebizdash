"use client"

import { useState } from "react"
import { useToast } from "../context/ToastContext"
import API_BASE_URL from "../config/api"
import "./BulkEditModal.css"
import React from "react" // Added missing import for React

const BulkEditModal = ({ selectedProducts, vendors, categories, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    brand: "",
    vendor_id: "",
    vendor_category_id: "", // Changed back to single selection
    store_category_id: "", // Changed back to single selection
    published: "",
    featured: "",
    visibility: "",
    list_price: "",
    market_price: "",
    vendor_cost: "",
  })
  const [loading, setLoading] = useState(false)
  const [vendorCategorySearch, setVendorCategorySearch] = useState("")
  const [storeCategorySearch, setStoreCategorySearch] = useState("")
  const [showVendorDropdown, setShowVendorDropdown] = useState(false)
  const [showStoreDropdown, setShowStoreDropdown] = useState(false)
  const [expandedVendorCategories, setExpandedVendorCategories] = useState(new Set())
  const [expandedStoreCategories, setExpandedStoreCategories] = useState(new Set())
  const { showToast } = useToast()

  // Function to toggle category expansion
  const toggleCategoryExpansion = (categoryId, type) => {
    if (type === "vendor") {
      setExpandedVendorCategories(prev => {
        const newSet = new Set(prev)
        if (newSet.has(categoryId)) {
          newSet.delete(categoryId)
        } else {
          newSet.add(categoryId)
        }
        return newSet
      })
    } else {
      setExpandedStoreCategories(prev => {
        const newSet = new Set(prev)
        if (newSet.has(categoryId)) {
          newSet.delete(categoryId)
        } else {
          newSet.add(categoryId)
        }
        return newSet
      })
    }
  }

  // Function to render hierarchical category options with expandable functionality
  const renderHierarchicalCategoryOptions = (categories, type, searchTerm = "") => {
    const searchLower = searchTerm.toLowerCase()
    const expandedCategories = type === "vendor" ? expandedVendorCategories : expandedStoreCategories
    
    const filterAndRender = (categoryList, level = 0) => {
      return categoryList
        .filter(cat => cat.description === type)
        .filter(cat => {
          // Show category if it matches search
          const matchesSearch = searchTerm === "" || 
            cat.name.toLowerCase().includes(searchLower) ||
            cat.description.toLowerCase().includes(searchLower)
          
          // If searching, show all matching categories and their parents
          if (searchTerm !== "") {
            return matchesSearch
          }
          
          // If not searching, only show if parent is expanded or it's a root category
          if (level === 0) return true
          return expandedCategories.has(cat.parent_id)
        })
        .map(cat => {
          const hasSubcategories = cat.subcategories && cat.subcategories.length > 0
          const isExpanded = expandedCategories.has(cat.id)
          const matchingSubcategories = hasSubcategories && isExpanded ? 
            filterAndRender(cat.subcategories, level + 1) : []
          
          return (
            <div key={cat.id} className="hierarchical-category-option">
              <div
                className="dropdown-option hierarchical-option"
                style={{ 
                  paddingLeft: `${level * 20 + 16}px`,
                  position: 'relative',
                  cursor: 'pointer',
                  backgroundColor: level > 0 ? '#f8f9fa' : 'transparent'
                }}
              >
                {hasSubcategories && (
                  <button
                    type="button"
                    className="expand-button"
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleCategoryExpansion(cat.id, type)
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '2px',
                      marginRight: '4px',
                      fontSize: '12px',
                      color: '#666',
                      transition: 'transform 0.2s'
                    }}
                  >
                    {isExpanded ? '▼' : '▶'}
                  </button>
                )}
                
                <span className="category-icon">
                  {hasSubcategories ? "📁" : "📄"}
                </span>
                <span 
                  className="category-name"
                  onClick={() => {
                    const fieldName = type === "vendor" ? "vendor_category_id" : "store_category_id"
                    setFormData(prev => ({ ...prev, [fieldName]: cat.id }))
                    if (type === "vendor") {
                      setShowVendorDropdown(false)
                      setVendorCategorySearch("")
                    } else {
                      setShowStoreDropdown(false)
                      setStoreCategorySearch("")
                    }
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  {cat.name}
                </span>
                <span className="product-count">
                  ({cat.product_count || 0} products)
                </span>
                {hasSubcategories && (
                  <span className="subcategory-count">({cat.subcategories.length} sub)</span>
                )}
              </div>
              {matchingSubcategories}
            </div>
          )
        })
        .filter(Boolean) // Remove null items
    }

    return filterAndRender(categories, 0)
  }

  // Helper function to get category name by ID
  const getCategoryName = (categoryId, categories) => {
    const findCategory = (cats, id) => {
      for (const cat of cats) {
        if (cat.id === parseInt(id)) {
          return cat.name
        }
        if (cat.subcategories) {
          const found = findCategory(cat.subcategories, id)
          if (found) return found
        }
      }
      return null
    }
    return findCategory(categories, categoryId)
  }

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

    // Filter out empty values
    const updateData = {}
    Object.keys(formData).forEach((key) => {
      if (formData[key] !== "" && formData[key] !== null && formData[key] !== undefined) {
        if (key === "published" || key === "featured") {
          updateData[key] = formData[key] === "true"
        } else {
          updateData[key] = formData[key]
        }
      }
    })

    if (Object.keys(updateData).length === 0) {
      showToast("Please select at least one field to update", "warning")
      setLoading(false)
      return
    }

    console.log("Bulk update data:", { ids: selectedProducts, updateData })

    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`${API_BASE_URL}/products/bulk/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ids: selectedProducts,
          updateData,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        showToast(result.message, "success")
        onSave()
      } else {
        const error = await response.json()
        showToast(error.message || "Error updating products", "error")
      }
    } catch (error) {
      showToast("Error updating products", "error")
    } finally {
      setLoading(false)
    }
  }


  return (
    <div className="modal-overlay">
      <div className="modal-content bulk-edit-modal">
        <div className="modal-header">
          <h2>Bulk Edit Products ({selectedProducts.length} selected)</h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="bulk-edit-notice">
          <p>Only fields with values will be updated. Empty fields will be ignored.</p>
        </div>

        <form onSubmit={handleSubmit} className="bulk-edit-form">
          <div className="form-grid">
            <div className="form-column">
              <div className="form-group">
                <label htmlFor="brand">Brand</label>
                <input
                  type="text"
                  id="brand"
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  placeholder="Leave empty to keep current values"
                />
              </div>

              <div className="form-group">
                <label htmlFor="vendor_id">Vendor</label>
                <select id="vendor_id" name="vendor_id" value={formData.vendor_id} onChange={handleChange}>
                  <option value="">Don't change</option>
                  {(vendors || []).map((vendor) => (
                    <option key={vendor.id} value={vendor.id}>
                      {vendor.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="vendor_category_id">Vendor Category</label>
                <div className="custom-dropdown-container">
                  <button
                    type="button"
                    className="custom-dropdown-button"
                    onClick={() => setShowVendorDropdown(!showVendorDropdown)}
                  >
                    {formData.vendor_category_id ? 
                      getCategoryName(formData.vendor_category_id, categories) || "Select Category" :
                      "Select Vendor Category"
                    }
                    <span className="dropdown-arrow">▼</span>
                  </button>
                  
                  {showVendorDropdown && (
                    <div className="custom-dropdown-menu">
                      <div className="dropdown-search-container">
                        <input
                          type="text"
                          placeholder="Search vendor categories..."
                          value={vendorCategorySearch}
                          onChange={(e) => setVendorCategorySearch(e.target.value)}
                          className="dropdown-search-input"
                          autoFocus
                        />
                      </div>
                      <div className="dropdown-options">
                        <div 
                          className="dropdown-option"
                          onClick={() => {
                            setFormData(prev => ({ ...prev, vendor_category_id: "" }))
                            setShowVendorDropdown(false)
                            setVendorCategorySearch("")
                          }}
                        >
                          Don't change
                        </div>
                        {renderHierarchicalCategoryOptions(categories, "vendor", vendorCategorySearch)}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="published">Published Status</label>
                <select id="published" name="published" value={formData.published} onChange={handleChange}>
                  <option value="">Don't change</option>
                  <option value="true">Published</option>
                  <option value="false">Draft</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="featured">Featured Status</label>
                <select id="featured" name="featured" value={formData.featured} onChange={handleChange}>
                  <option value="">Don't change</option>
                  <option value="true">Featured</option>
                  <option value="false">Not Featured</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="list_price">List Price</label>
                <input
                  type="number"
                  id="list_price"
                  name="list_price"
                  value={formData.list_price}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  placeholder="Leave empty to keep current values"
                />
              </div>
            </div>

            <div className="form-column">
              <div className="form-group">
                <label htmlFor="store_category_id">Store Category</label>
                <div className="custom-dropdown-container">
                  <button
                    type="button"
                    className="custom-dropdown-button"
                    onClick={() => setShowStoreDropdown(!showStoreDropdown)}
                  >
                    {formData.store_category_id ? 
                      getCategoryName(formData.store_category_id, categories) || "Select Category" :
                      "Select Store Category"
                    }
                    <span className="dropdown-arrow">▼</span>
                  </button>
                  
                  {showStoreDropdown && (
                    <div className="custom-dropdown-menu">
                      <div className="dropdown-search-container">
                        <input
                          type="text"
                          placeholder="Search store categories..."
                          value={storeCategorySearch}
                          onChange={(e) => setStoreCategorySearch(e.target.value)}
                          className="dropdown-search-input"
                          autoFocus
                        />
                      </div>
                      <div className="dropdown-options">
                        <div 
                          className="dropdown-option"
                          onClick={() => {
                            setFormData(prev => ({ ...prev, store_category_id: "" }))
                            setShowStoreDropdown(false)
                            setStoreCategorySearch("")
                          }}
                        >
                          Don't change
                        </div>
                        {renderHierarchicalCategoryOptions(categories, "store", storeCategorySearch)}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="visibility">Visibility</label>
                <select id="visibility" name="visibility" value={formData.visibility} onChange={handleChange}>
                  <option value="">Don't change</option>
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                  <option value="hidden">Hidden</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="market_price">Market Price</label>
                <input
                  type="number"
                  id="market_price"
                  name="market_price"
                  value={formData.market_price}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  placeholder="Leave empty to keep current values"
                />
              </div>

              <div className="form-group">
                <label htmlFor="vendor_cost">Vendor Cost</label>
                <input
                  type="number"
                  id="vendor_cost"
                  name="vendor_cost"
                  value={formData.vendor_cost}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  placeholder="Leave empty to keep current values"
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Updating..." : `Update ${selectedProducts.length} Products`}
            </button>
          </div>
        </form>
      </div>


    </div>
  )
}

export default BulkEditModal
