"use client"

import { useState, useEffect } from "react"
import { useToast } from "../context/ToastContext"
import "./ProductModal.css"
import React from "react"

const ProductModal = ({ product, vendors, categories, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    sku: "",
    mfn: "",
    name: "",
    description: "",
    brand: "",
    stock: 0,
    list_price: "",
    market_price: "",
    vendor_cost: "",
    special_price: "",
    weight: "",
    length: "",
    width: "",
    height: "",
    vendor_id: "",
    vendor_category_id: "",
    store_category_id: "",
    google_category: "",
    published: true,
    featured: false,
    visibility: "public",
  })
  const [loading, setLoading] = useState(false)
  const [vendorCategorySearch, setVendorCategorySearch] = useState("")
  const [storeCategorySearch, setStoreCategorySearch] = useState("")
  const [showVendorDropdown, setShowVendorDropdown] = useState(false)
  const [showStoreDropdown, setShowStoreDropdown] = useState(false)
  const { showToast } = useToast()

  useEffect(() => {
    if (product) {
      setFormData({
        sku: product.sku || "",
        mfn: product.mfn || "",
        name: product.name || "",
        description: product.description || "",
        brand: product.brand || "",
        stock: product.stock || 0,
        list_price: product.list_price || "",
        market_price: product.market_price || "",
        vendor_cost: product.vendor_cost || "",
        special_price: product.special_price || "",
        weight: product.weight || "",
        length: product.length || "",
        width: product.width || "",
        height: product.height || "",
        vendor_id: product.vendor_id || "",
        vendor_category_id: product.vendor_category_id || "",
        store_category_id: product.store_category_id || "",
        google_category: product.google_category || "",
        published: product.published !== false,
        featured: product.featured === true,
        visibility: product.visibility || "public",
      })
    }
  }, [product])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    let processedValue = type === "checkbox" ? checked : value
    
    // Handle numeric fields - convert empty strings to null
    if (['list_price', 'market_price', 'vendor_cost', 'special_price', 'weight', 'length', 'width', 'height', 'stock', 'vendor_id', 'vendor_category_id', 'store_category_id'].includes(name)) {
      if (value === '' || value === null || value === undefined) {
        processedValue = null
      } else {
        processedValue = Number(value) || null
      }
    }
    // Handle boolean fields
    else if (['published', 'featured'].includes(name)) {
      processedValue = type === "checkbox" ? checked : (value === true || value === 'true' || value === 1)
    }
    
    setFormData((prev) => ({
      ...prev,
      [name]: processedValue,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const token = localStorage.getItem("token")
      const url = product ? `/api/products/${product.id}` : "/api/products"
      const method = product ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        showToast(product ? "Product updated successfully" : "Product created successfully", "success")
        onSave()
      } else {
        const error = await response.json()
        showToast(error.message || "Error saving product", "error")
      }
    } catch (error) {
      showToast("Error saving product", "error")
    } finally {
      setLoading(false)
    }
  }

  // Function to render hierarchical category options with proper filtering
  const renderHierarchicalCategoryOptions = (categories, type, searchTerm = "") => {
    const searchLower = searchTerm.toLowerCase()
    
    // Debug: Log categories to see their structure
    console.log(`Rendering ${type} categories:`, categories)
    
    const filterAndRender = (categoryList, level = 0) => {
      return categoryList
        .filter(cat => {
          // Check both type and description fields
          const matchesType = cat.type === type || cat.description === type
          console.log(`Category ${cat.name}: type=${cat.type}, description=${cat.description}, matchesType=${matchesType}`)
          return matchesType
        })
        .filter(cat => 
          searchTerm === "" || 
          cat.name.toLowerCase().includes(searchLower) ||
          (cat.description && cat.description.toLowerCase().includes(searchLower))
        )
        .map(cat => {
          const hasSubcategories = cat.subcategories && cat.subcategories.length > 0
          const matchingSubcategories = hasSubcategories ? 
            filterAndRender(cat.subcategories, level + 1) : []
          
          // Show category if it matches search or has matching subcategories
          const shouldShow = searchTerm === "" || 
            cat.name.toLowerCase().includes(searchLower) ||
            matchingSubcategories.length > 0
          
          if (!shouldShow) return null
          
          return (
            <div key={cat.id} className="hierarchical-category-option">
              <div
                className="dropdown-option hierarchical-option"
                style={{ 
                  paddingLeft: `${level * 20 + 16}px`,
                  position: 'relative'
                }}
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
              >
                {level > 0 && (
                  <div className="connection-line" style={{
                    position: 'absolute',
                    left: `${(level - 1) * 20 + 8}px`,
                    top: '50%',
                    width: '12px',
                    height: '1px',
                    backgroundColor: '#ddd',
                    transform: 'translateY(-50%)'
                  }}></div>
                )}
                <span className="category-icon">
                  {hasSubcategories ? "📁" : "📄"}
                </span>
                <span className="category-name">{cat.name}</span>
                <span className="category-level">L{cat.level}</span>
                <span className="category-type">[{cat.description}]</span>
              </div>
              {matchingSubcategories}
            </div>
          )
        })
        .filter(Boolean) // Remove null items
    }

    return filterAndRender(categories, 0)
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content product-modal">
        <div className="modal-header">
          <h2>{product ? "Edit Product" : "Add New Product"}</h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="product-form">
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="sku">SKU *</label>
              <input type="text" id="sku" name="sku" value={formData.sku} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label htmlFor="mfn">MFN</label>
              <input type="text" id="mfn" name="mfn" value={formData.mfn} onChange={handleChange} />
            </div>

            <div className="form-group full-width">
              <label htmlFor="name">Product Name *</label>
              <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required />
            </div>

            <div className="form-group full-width">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="3"
              />
            </div>

            <div className="form-group">
              <label htmlFor="brand">Brand</label>
              <input type="text" id="brand" name="brand" value={formData.brand} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label htmlFor="stock">Stock</label>
              <input type="number" id="stock" name="stock" value={formData.stock} onChange={handleChange} min="0" />
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
              />
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
              />
            </div>

            <div className="form-group">
              <label htmlFor="special_price">Special Price</label>
              <input
                type="number"
                id="special_price"
                name="special_price"
                value={formData.special_price}
                onChange={handleChange}
                step="0.01"
                min="0"
              />
            </div>

            <div className="form-group">
              <label htmlFor="weight">Weight (lbs)</label>
              <input
                type="number"
                id="weight"
                name="weight"
                value={formData.weight}
                onChange={handleChange}
                step="0.01"
                min="0"
              />
            </div>

            <div className="form-group">
              <label htmlFor="length">Length</label>
              <input
                type="number"
                id="length"
                name="length"
                value={formData.length}
                onChange={handleChange}
                step="0.01"
                min="0"
              />
            </div>

            <div className="form-group">
              <label htmlFor="width">Width</label>
              <input
                type="number"
                id="width"
                name="width"
                value={formData.width}
                onChange={handleChange}
                step="0.01"
                min="0"
              />
            </div>

            <div className="form-group">
              <label htmlFor="height">Height</label>
              <input
                type="number"
                id="height"
                name="height"
                value={formData.height}
                onChange={handleChange}
                step="0.01"
                min="0"
              />
            </div>

            <div className="form-group">
              <label htmlFor="vendor_id">Vendor</label>
              <select id="vendor_id" name="vendor_id" value={formData.vendor_id} onChange={handleChange}>
                <option value="">Select Vendor</option>
                {(vendors || []).map((vendor) => (
                  <option key={vendor.id} value={vendor.id}>
                    {vendor.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group category-field">
              <label htmlFor="vendor_category_id">Vendor Category</label>
              <div className="custom-dropdown-container">
                <button
                  type="button"
                  className="custom-dropdown-button"
                  onClick={() => setShowVendorDropdown(!showVendorDropdown)}
                >
                  {formData.vendor_category_id ? 
                    (() => {
                      const findCategoryById = (cats, id) => {
                        for (const cat of cats) {
                          if (cat.id === parseInt(id)) return cat.name
                          if (cat.subcategories) {
                            const found = findCategoryById(cat.subcategories, id)
                            if (found) return found
                          }
                        }
                        return null
                      }
                      return findCategoryById(categories, formData.vendor_category_id) || "Select Category"
                    })() :
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
                        Select Category
                      </div>
                      {renderHierarchicalCategoryOptions(categories, "vendor", vendorCategorySearch)}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="form-group category-field">
              <label htmlFor="store_category_id">Store Category</label>
              <div className="custom-dropdown-container">
                <button
                  type="button"
                  className="custom-dropdown-button"
                  onClick={() => setShowStoreDropdown(!showStoreDropdown)}
                >
                  {formData.store_category_id ? 
                    (() => {
                      const findCategoryById = (cats, id) => {
                        for (const cat of cats) {
                          if (cat.id === parseInt(id)) return cat.name
                          if (cat.subcategories) {
                            const found = findCategoryById(cat.subcategories, id)
                            if (found) return found
                          }
                        }
                        return null
                      }
                      return findCategoryById(categories, formData.store_category_id) || "Select Category"
                    })() :
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
                        Select Category
                      </div>
                      {renderHierarchicalCategoryOptions(categories, "store", storeCategorySearch)}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="google_category">Google Category</label>
              <input
                type="text"
                id="google_category"
                name="google_category"
                value={formData.google_category}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="visibility">Visibility</label>
              <select id="visibility" name="visibility" value={formData.visibility} onChange={handleChange}>
                <option value="public">Public</option>
                <option value="private">Private</option>
                <option value="hidden">Hidden</option>
              </select>
            </div>

            <div className="form-group checkbox-group">
              <label>
                <input type="checkbox" name="published" checked={formData.published} onChange={handleChange} />
                Published
              </label>
            </div>

            <div className="form-group checkbox-group">
              <label>
                <input type="checkbox" name="featured" checked={formData.featured} onChange={handleChange} />
                Featured
              </label>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Saving..." : product ? "Update Product" : "Create Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ProductModal
