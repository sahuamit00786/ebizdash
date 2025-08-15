"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { useToast } from "../context/ToastContext"
import API_BASE_URL from "../config/api"
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import HierarchicalCategorySelect from './HierarchicalCategorySelect'
import HierarchicalCategoryTree from './HierarchicalCategoryTree'
import CategoryTreeSelector from './CategoryTreeSelector'
import "./ProductDetail.css"

const ProductDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [vendors, setVendors] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({})
  const [activeTab, setActiveTab] = useState('general')
  const [descriptionMode, setDescriptionMode] = useState('visual') // 'visual' or 'code'
  const [fullDescriptionMode, setFullDescriptionMode] = useState('visual')
  
  const { user } = useAuth()
  const { showToast } = useToast()



  const quillFormats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet', 'indent',
    'link', 'image', 'video',
    'color', 'background',
    'align', 'direction',
    'code-block', 'script'
  ]

  // Fetch product data
  const fetchProduct = useCallback(async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("token")
      const response = await fetch(`${API_BASE_URL}/products/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const productData = await response.json()
        setProduct(productData)
        setFormData(productData)
      } else {
        showToast("Product not found", "error")
        navigate("/products")
      }
    } catch (error) {
      showToast("Error loading product", "error")
      navigate("/products")
    } finally {
      setLoading(false)
    }
  }, [id, navigate, showToast])

  // Fetch vendors and categories
  const fetchVendors = useCallback(async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`${API_BASE_URL}/vendors`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setVendors(data.vendors || [])
      }
    } catch (error) {
      console.error("Error loading vendors:", error)
      setVendors([])
    }
  }, [])

  const fetchCategories = useCallback(async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`${API_BASE_URL}/categories`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        // Use flatCategories for the hierarchical component as it contains all category data
        const categoriesData = data.flatCategories || data.categories || []
        console.log('Loaded categories:', categoriesData)
        setCategories(categoriesData)
      }
    } catch (error) {
      console.error("Error loading categories:", error)
    }
  }, [])

  useEffect(() => {
    fetchProduct()
    fetchVendors()
    fetchCategories()
  }, [fetchProduct, fetchVendors, fetchCategories])

  // Reset editor modes when editing starts
  useEffect(() => {
    if (editing) {
      setDescriptionMode('visual')
      setFullDescriptionMode('visual')
    }
  }, [editing])

  const handleInputChange = (field, value) => {
    let processedValue = value
    
    // Handle numeric fields - convert empty strings to null
    if (['list_price', 'market_price', 'vendor_cost', 'special_price', 'weight', 'length', 'width', 'height', 'stock', 'vendor_id'].includes(field)) {
      if (value === '' || value === null || value === undefined) {
        processedValue = null
      } else {
        processedValue = Number(value) || null
      }
    }
    // Handle category fields - keep as is but ensure proper type
    else if (['vendor_category_id', 'store_category_id'].includes(field)) {
      if (value === '' || value === null || value === undefined) {
        processedValue = null
      } else {
        processedValue = Number(value) || null
      }
    }
    // Handle boolean fields
    else if (['published', 'featured'].includes(field)) {
      processedValue = value === true || value === 'true' || value === 1
    }
    
    setFormData(prev => ({
      ...prev,
      [field]: processedValue
    }))
  }

  // Enhanced Quill modules with better initialization
  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'script': 'sub'}, { 'script': 'super' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'direction': 'rtl' }],
      [{ 'size': ['small', false, 'large', 'huge'] }],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'font': [] }],
      [{ 'align': [] }],
      ['blockquote', 'code-block'],
      ['link', 'image', 'video'],
      ['clean']
    ],
    clipboard: {
      matchVisual: false,
    },
    history: {
      delay: 2000,
      maxStack: 500,
      userOnly: true
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const token = localStorage.getItem("token")
      
      // Validate form data before sending
      if (!formData.name || !formData.sku) {
        showToast("Name and SKU are required", "error")
        return
      }
      
      // Filter out system fields that should not be updated
      const systemFields = ['id', 'created_at', 'updated_at', 'vendor_name', 'vendor_category_name', 'store_category_name']
      const updateData = { ...formData }
      systemFields.forEach(field => {
        delete updateData[field]
      })
      
      const response = await fetch(`${API_BASE_URL}/products/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      })

      if (response.ok) {
        showToast("Product updated successfully", "success")
        setEditing(false)
        fetchProduct() // Refresh data
      } else {
        const error = await response.json()
        showToast(error.message || "Error updating product", "error")
      }
    } catch (error) {
      showToast("Error updating product", "error")
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setFormData(product)
    setEditing(false)
  }

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this product?")) {
      return
    }

    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`${API_BASE_URL}/products/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        showToast("Product deleted successfully", "success")
        navigate("/products")
      } else {
        const error = await response.json()
        showToast(error.message || "Error deleting product", "error")
      }
    } catch (error) {
      showToast("Error deleting product", "error")
    }
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <div className="loading-text">Loading product details...</div>
      </div>
    )
  }

  if (!product) {
    return <div>Product not found</div>
  }

  const currentData = editing ? formData : product

  const renderDescriptionEditor = (field, mode, setMode, value, onChange) => {
    if (!editing) {
      return (
        <div className="rich-text-editor-container view-mode">
          <div className="editor-toolbar view-mode">
            <div className="editor-mode-tabs">
              <span className="mode-tab active">
                📖 View Mode
              </span>
            </div>
            <div className="editor-info">
              <span className="editor-tip">
                Rich text content display
              </span>
            </div>
          </div>
          <ReactQuill
            value={value || ''}
            onChange={() => {}} // Read-only
            modules={{
              toolbar: false, // Hide toolbar in view mode
              clipboard: {
                matchVisual: false,
              }
            }}
            formats={quillFormats}
            className="rich-text-editor view-mode"
            theme="snow"
            preserveWhitespace={true}
            readOnly={true}
          />
        </div>
      )
    }

    return (
      <div className="rich-text-editor-container">
        <div className="editor-toolbar">
          <div className="editor-mode-tabs">
            <button
              type="button"
              className={`mode-tab ${mode === 'visual' ? 'active' : ''}`}
              onClick={() => setMode('visual')}
            >
              ✏️ Visual Editor
            </button>
            <button
              type="button"
              className={`mode-tab ${mode === 'code' ? 'active' : ''}`}
              onClick={() => setMode('code')}
            >
              💻 HTML Code
            </button>
          </div>
          <div className="editor-info">
            <span className="editor-tip">
              {mode === 'visual' ? 'Use the toolbar above to format your content' : 'Edit HTML directly for advanced formatting'}
            </span>
          </div>
        </div>
        
        {mode === 'visual' ? (
          <ReactQuill
            key={`${field}-${editing}-${mode}`} // Force re-render when editing starts
            value={value || ''}
            onChange={onChange}
            modules={quillModules}
            formats={quillFormats}
            placeholder={field === 'short_description' ? "Enter a brief product description..." : "Enter detailed product description..."}
            className="rich-text-editor"
            theme="snow"
            preserveWhitespace={true}
          />
        ) : (
          <textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="code-editor"
            placeholder={field === 'short_description' ? "Enter HTML for short description..." : "Enter HTML for full description..."}
            rows="12"
            spellCheck="false"
          />
        )}
      </div>
    )
  }

  return (
    <div className="product-detail">
      {/* Header */}
      <div className="product-detail-header">
        <div className="header-left">
          <button className="btn btn-secondary" onClick={() => navigate("/products")}>
            ← Back to Products
          </button>
          <div className="product-header-info">
            <div className="product-image">
              <img 
                src={currentData.image_url || "/placeholder.jpg"} 
                alt={currentData.name}
                className="product-main-image"
                onError={(e) => {
                  e.target.src = "/placeholder.jpg"
                }}
              />
            </div>
            <div className="product-header-text">
              <h1>{currentData.name}</h1>
              <div className="product-meta">
                <span className="product-id">ID: {currentData.id}</span>
                <span className="product-sku">SKU: {currentData.sku}</span>
                <span className={`status-badge ${currentData.published ? "published" : "draft"}`}>
                  {currentData.published ? "Published" : "Draft"}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="header-actions">
          {!editing ? (
            <div className="action-buttons-group">
              <button className="btn btn-primary" onClick={() => setEditing(true)}>
                Edit Product
              </button>
              <button className="btn btn-danger" onClick={handleDelete}>
                Delete Product
              </button>
            </div>
          ) : (
            <>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </button>
              <button className="btn btn-secondary" onClick={handleCancel}>
                Cancel
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="product-tabs">
        <button 
          className={`tab-button ${activeTab === 'general' ? 'active' : ''}`}
          onClick={() => setActiveTab('general')}
        >
          General
        </button>
        <button 
          className={`tab-button ${activeTab === 'pricing' ? 'active' : ''}`}
          onClick={() => setActiveTab('pricing')}
        >
          Pricing
        </button>
        <button 
          className={`tab-button ${activeTab === 'inventory' ? 'active' : ''}`}
          onClick={() => setActiveTab('inventory')}
        >
          Inventory
        </button>
        <button 
          className={`tab-button ${activeTab === 'shipping' ? 'active' : ''}`}
          onClick={() => setActiveTab('shipping')}
        >
          Shipping
        </button>
        <button 
          className={`tab-button ${activeTab === 'categories' ? 'active' : ''}`}
          onClick={() => setActiveTab('categories')}
        >
          Categories
        </button>
        <button 
          className={`tab-button ${activeTab === 'seo' ? 'active' : ''}`}
          onClick={() => setActiveTab('seo')}
        >
          SEO
        </button>
        <button 
          className={`tab-button ${activeTab === 'advanced' ? 'active' : ''}`}
          onClick={() => setActiveTab('advanced')}
        >
          Advanced
        </button>
      </div>

      {/* Tab Content */}
      <div className="product-detail-content">
        {activeTab === 'general' && (
          <div className="tab-content">
            <div className="product-section">
              <h2>Basic Information</h2>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>Product Name *</label>
                  {editing ? (
                    <input
                      type="text"
                      value={currentData.name || ""}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      className="form-input"
                      placeholder="Enter product name..."
                    />
                  ) : (
                    <div className="form-display">{currentData.name}</div>
                  )}
                </div>

                <div className="form-group">
                  <label>SKU *</label>
                  {editing ? (
                    <input
                      type="text"
                      value={currentData.sku || ""}
                      onChange={(e) => handleInputChange("sku", e.target.value)}
                      className="form-input"
                      placeholder="Enter SKU..."
                    />
                  ) : (
                    <div className="form-display">{currentData.sku}</div>
                  )}
                </div>

                <div className="form-group">
                  <label>MFN</label>
                  {editing ? (
                    <input
                      type="text"
                      value={currentData.mfn || ""}
                      onChange={(e) => handleInputChange("mfn", e.target.value)}
                      className="form-input"
                      placeholder="Enter MFN..."
                    />
                  ) : (
                    <div className="form-display">{currentData.mfn || "-"}</div>
                  )}
                </div>

                <div className="form-group">
                  <label>Brand</label>
                  {editing ? (
                    <input
                      type="text"
                      value={currentData.brand || ""}
                      onChange={(e) => handleInputChange("brand", e.target.value)}
                      className="form-input"
                      placeholder="Enter brand..."
                    />
                  ) : (
                    <div className="form-display">{currentData.brand || "-"}</div>
                  )}
                </div>

                <div className="form-group full-width">
                  <label>Image URL</label>
                  {editing ? (
                    <input
                      type="url"
                      value={currentData.image_url || ""}
                      onChange={(e) => handleInputChange("image_url", e.target.value)}
                      className="form-input"
                      placeholder="https://example.com/image.jpg"
                    />
                  ) : (
                    <div className="form-display">
                      {currentData.image_url ? (
                        <a href={currentData.image_url} target="_blank" rel="noopener noreferrer">
                          {currentData.image_url}
                        </a>
                      ) : (
                        "-"
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="product-section">
              <h2>Product Descriptions</h2>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>Short Description</label>
                  {renderDescriptionEditor(
                    'short_description',
                    descriptionMode,
                    setDescriptionMode,
                    currentData.short_description || "",
                    (value) => handleInputChange("short_description", value)
                  )}
                </div>

                <div className="form-group full-width">
                  <label>Full Description</label>
                  {renderDescriptionEditor(
                    'description',
                    fullDescriptionMode,
                    setFullDescriptionMode,
                    currentData.description || "",
                    (value) => handleInputChange("description", value)
                  )}
                </div>
              </div>
            </div>

            <div className="product-section">
              <h2>Product Status</h2>
              <div className="form-grid">
                <div className="form-group">
                  <label>Published</label>
                  {editing ? (
                    <select
                      value={currentData.published ? "true" : "false"}
                      onChange={(e) => handleInputChange("published", e.target.value === "true")}
                      className="form-select"
                    >
                      <option value="true">Published</option>
                      <option value="false">Draft</option>
                    </select>
                  ) : (
                    <div className="form-display">
                      <span className={`status-badge ${currentData.published ? "published" : "draft"}`}>
                        {currentData.published ? "Published" : "Draft"}
                      </span>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label>Featured</label>
                  {editing ? (
                    <select
                      value={currentData.featured ? "true" : "false"}
                      onChange={(e) => handleInputChange("featured", e.target.value === "true")}
                      className="form-select"
                    >
                      <option value="true">Featured</option>
                      <option value="false">Not Featured</option>
                    </select>
                  ) : (
                    <div className="form-display">
                      <span className={`featured-badge ${currentData.featured ? "featured" : "not-featured"}`}>
                        {currentData.featured ? "Featured" : "Not Featured"}
                      </span>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label>Visibility</label>
                  {editing ? (
                    <select
                      value={currentData.visibility || "public"}
                      onChange={(e) => handleInputChange("visibility", e.target.value)}
                      className="form-select"
                    >
                      <option value="public">Public</option>
                      <option value="private">Private</option>
                      <option value="hidden">Hidden</option>
                    </select>
                  ) : (
                    <div className="form-display">{currentData.visibility || "public"}</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'pricing' && (
          <div className="tab-content">
            <div className="product-section">
              <h2>Pricing Information</h2>
              <div className="form-grid">
                <div className="form-group">
                  <label>List Price</label>
                  {editing ? (
                    <input
                      type="number"
                      step="0.01"
                      value={currentData.list_price || ""}
                      onChange={(e) => handleInputChange("list_price", e.target.value)}
                      className="form-input"
                      placeholder="0.00"
                    />
                  ) : (
                    <div className="form-display">${currentData.list_price || "0.00"}</div>
                  )}
                </div>

                <div className="form-group">
                  <label>Market Price</label>
                  {editing ? (
                    <input
                      type="number"
                      step="0.01"
                      value={currentData.market_price || ""}
                      onChange={(e) => handleInputChange("market_price", e.target.value)}
                      className="form-input"
                      placeholder="0.00"
                    />
                  ) : (
                    <div className="form-display">${currentData.market_price || "0.00"}</div>
                  )}
                </div>

                <div className="form-group">
                  <label>Vendor Cost</label>
                  {editing ? (
                    <input
                      type="number"
                      step="0.01"
                      value={currentData.vendor_cost || ""}
                      onChange={(e) => handleInputChange("vendor_cost", e.target.value)}
                      className="form-input"
                      placeholder="0.00"
                    />
                  ) : (
                    <div className="form-display">${currentData.vendor_cost || "0.00"}</div>
                  )}
                </div>

                <div className="form-group">
                  <label>Special Price</label>
                  {editing ? (
                    <input
                      type="number"
                      step="0.01"
                      value={currentData.special_price || ""}
                      onChange={(e) => handleInputChange("special_price", e.target.value)}
                      className="form-input"
                      placeholder="0.00"
                    />
                  ) : (
                    <div className="form-display">${currentData.special_price || "0.00"}</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="tab-content">
            <div className="product-section">
              <h2>Inventory Management</h2>
              <div className="form-grid">
                <div className="form-group">
                  <label>Stock Quantity</label>
                  {editing ? (
                    <input
                      type="number"
                      value={currentData.stock || ""}
                      onChange={(e) => handleInputChange("stock", e.target.value)}
                      className="form-input"
                      placeholder="0"
                    />
                  ) : (
                    <div className="form-display">
                      <span className={`stock-badge ${currentData.stock > 0 ? "in-stock" : "out-of-stock"}`}>
                        {currentData.stock}
                      </span>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label>Vendor</label>
                  {editing ? (
                    <select
                      value={currentData.vendor_id || ""}
                      onChange={(e) => handleInputChange("vendor_id", e.target.value)}
                      className="form-select"
                    >
                      <option value="">Select Vendor</option>
                      {(vendors || []).map(vendor => (
                        <option key={vendor.id} value={vendor.id}>
                          {vendor.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="form-display">{currentData.vendor_name || "-"}</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'shipping' && (
          <div className="tab-content">
            <div className="product-section">
              <h2>Shipping & Dimensions</h2>
              <div className="form-grid">
                <div className="form-group">
                  <label>Weight (kg)</label>
                  {editing ? (
                    <input
                      type="number"
                      step="0.01"
                      value={currentData.weight || ""}
                      onChange={(e) => handleInputChange("weight", parseFloat(e.target.value))}
                      className="form-input"
                      placeholder="0.00"
                    />
                  ) : (
                    <div className="form-display">{currentData.weight || "0"} kg</div>
                  )}
                </div>

                <div className="form-group">
                  <label>Length (cm)</label>
                  {editing ? (
                    <input
                      type="number"
                      step="0.01"
                      value={currentData.length || ""}
                      onChange={(e) => handleInputChange("length", parseFloat(e.target.value))}
                      className="form-input"
                      placeholder="0.00"
                    />
                  ) : (
                    <div className="form-display">{currentData.length || "0"} cm</div>
                  )}
                </div>

                <div className="form-group">
                  <label>Width (cm)</label>
                  {editing ? (
                    <input
                      type="number"
                      step="0.01"
                      value={currentData.width || ""}
                      onChange={(e) => handleInputChange("width", parseFloat(e.target.value))}
                      className="form-input"
                      placeholder="0.00"
                    />
                  ) : (
                    <div className="form-display">{currentData.width || "0"} cm</div>
                  )}
                </div>

                <div className="form-group">
                  <label>Height (cm)</label>
                  {editing ? (
                    <input
                      type="number"
                      step="0.01"
                      value={currentData.height || ""}
                      onChange={(e) => handleInputChange("height", parseFloat(e.target.value))}
                      className="form-input"
                      placeholder="0.00"
                    />
                  ) : (
                    <div className="form-display">{currentData.height || "0"} cm</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="tab-content">
            <div className="product-section">
              <h2>Product Categories</h2>
              <div className="form-grid">
                <div className="form-group">
                  <label>Vendor Category</label>
                  {editing ? (
                    <CategoryTreeSelector
                      categories={categories}
                      selectedCategories={currentData.vendor_category_id ? [currentData.vendor_category_id] : []}
                      onSelectionChange={(selectedIds) => {
                        console.log('Vendor categories selected:', selectedIds)
                        const selectedId = selectedIds.length > 0 ? selectedIds[0] : null
                        handleInputChange("vendor_category_id", selectedId)
                      }}
                      type="vendor"
                      vendorId={currentData.vendor_id}
                      placeholder="Select Vendor Category"
                    />
                  ) : (
                    <div className="form-display">{currentData.vendor_category_name || "-"}</div>
                  )}
                </div>

                <div className="form-group">
                  <label>Store Category</label>
                  {editing ? (
                    <CategoryTreeSelector
                      categories={categories}
                      selectedCategories={currentData.store_category_id ? [currentData.store_category_id] : []}
                      onSelectionChange={(selectedIds) => {
                        console.log('Store categories selected:', selectedIds)
                        const selectedId = selectedIds.length > 0 ? selectedIds[0] : null
                        handleInputChange("store_category_id", selectedId)
                      }}
                      type="store"
                      placeholder="Select Store Category"
                    />
                  ) : (
                    <div className="form-display">{currentData.store_category_name || "-"}</div>
                  )}
                </div>

                <div className="form-group">
                  <label>Google Category</label>
                  {editing ? (
                    <input
                      type="text"
                      value={currentData.google_category || ""}
                      onChange={(e) => handleInputChange("google_category", e.target.value)}
                      className="form-input"
                      placeholder="Enter Google category..."
                    />
                  ) : (
                    <div className="form-display">{currentData.google_category || "-"}</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'seo' && (
          <div className="tab-content">
            <div className="product-section">
              <h2>SEO Settings</h2>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>Meta Title</label>
                  {editing ? (
                    <input
                      type="text"
                      value={currentData.meta_title || ""}
                      onChange={(e) => handleInputChange("meta_title", e.target.value)}
                      className="form-input"
                      placeholder="Enter meta title..."
                    />
                  ) : (
                    <div className="form-display">{currentData.meta_title || "-"}</div>
                  )}
                </div>

                <div className="form-group full-width">
                  <label>Meta Description</label>
                  {editing ? (
                    <textarea
                      value={currentData.meta_description || ""}
                      onChange={(e) => handleInputChange("meta_description", e.target.value)}
                      className="form-textarea"
                      rows="3"
                      placeholder="Enter meta description..."
                    />
                  ) : (
                    <div className="form-display">{currentData.meta_description || "-"}</div>
                  )}
                </div>

                <div className="form-group full-width">
                  <label>Meta Keywords</label>
                  {editing ? (
                    <input
                      type="text"
                      value={currentData.meta_keywords || ""}
                      onChange={(e) => handleInputChange("meta_keywords", e.target.value)}
                      className="form-input"
                      placeholder="Enter meta keywords..."
                    />
                  ) : (
                    <div className="form-display">{currentData.meta_keywords || "-"}</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'advanced' && (
          <div className="tab-content">
            <div className="product-section">
              <h2>System Information</h2>
              <div className="form-grid">
                <div className="form-group">
                  <label>Created At</label>
                  <div className="form-display">
                    {new Date(currentData.created_at).toLocaleString()}
                  </div>
                </div>

                <div className="form-group">
                  <label>Updated At</label>
                  <div className="form-display">
                    {new Date(currentData.updated_at).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProductDetail 