"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../context/AuthContext"
import { useToast } from "../context/ToastContext"
import API_BASE_URL from "../config/api"
import CategoryModal from "./CategoryModal"
import CategoryMergeModal from "./CategoryMergeModal"
import "./Categories.css"

const Categories = () => {
  const [categories, setCategories] = useState([])
  const [flatCategories, setFlatCategories] = useState([])
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)

  const [expandedCategories, setExpandedCategories] = useState(new Set())
  const [selectedType, setSelectedType] = useState("all")
  const [selectedVendor, setSelectedVendor] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState("tree") // tree or table
  const [selectedCategories, setSelectedCategories] = useState(new Set())
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false)
  const [showMergeModal, setShowMergeModal] = useState(false)
  const [mergeCategories, setMergeCategories] = useState([])
  const { showToast } = useToast()
  const { checkAuthError, handleInvalidToken } = useAuth()

  // Calculate hierarchical product count for a category
  const calculateHierarchicalProductCount = (categoryId, categoryList) => {
    let totalCount = 0
    
    // Recursive function to find category and calculate hierarchical count
    const findAndCalculate = (categories) => {
      for (const cat of categories) {
        if (cat.id === categoryId) {
          // Found the category, add its direct count
          totalCount += cat.product_count || 0
          
          // Recursively add product counts from all subcategories
          const addSubcategoryCounts = (category) => {
            if (category.subcategories && category.subcategories.length > 0) {
              category.subcategories.forEach(subcat => {
                totalCount += subcat.product_count || 0
                addSubcategoryCounts(subcat)
              })
            }
          }
          
          addSubcategoryCounts(cat)
          return true // Found and processed
        }
        
        // Check subcategories
        if (cat.subcategories && cat.subcategories.length > 0) {
          if (findAndCalculate(cat.subcategories)) {
            return true // Found in subcategories
          }
        }
      }
      return false // Not found in this level
    }
    
    findAndCalculate(categoryList)
    return totalCount
  }

  // Get hierarchical product count for a category
  const getHierarchicalProductCount = (category) => {
    // Use the hierarchical categories structure instead of flatCategories
    return calculateHierarchicalProductCount(category.id, categories)
  }

  useEffect(() => {
    console.log('🚀 Initial load - fetching all categories and vendors')
    fetchCategories()
    fetchVendors()
  }, [])

  // Fetch categories when vendor or type selection changes
  useEffect(() => {
    console.log(`🔄 Vendor/Type changed - Vendor: ${selectedVendor}, Type: ${selectedType}`)
    if (vendors.length > 0) { // Only fetch if vendors are loaded
      fetchCategories(selectedVendor)
    }
  }, [selectedVendor, selectedType, vendors.length])

  const fetchVendors = async () => {
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
      } else {
        console.error("Failed to fetch vendors")
      }
    } catch (error) {
      console.error("Error fetching vendors:", error)
    }
  }

  const fetchCategories = async (vendorId = null) => {
    const maxRetries = 3
    let retryCount = 0

    while (retryCount < maxRetries) {
      try {
        setLoading(true)
        const token = localStorage.getItem("token")
        
        if (!token) {
          handleInvalidToken()
          return
        }

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

        // Build URL with query parameters
        let url = `${API_BASE_URL}/categories`
        const queryParams = new URLSearchParams()
        
        if (vendorId && vendorId !== "all") {
          url = `${API_BASE_URL}/categories/vendor/${vendorId}`
          // Add type filter if not "all"
          if (selectedType !== "all") {
            queryParams.append('type', selectedType)
          }
        }
        
        // Add query parameters to URL if any
        if (queryParams.toString()) {
          url += `?${queryParams.toString()}`
        }

        console.log(`🔍 Fetching categories from: ${url}`)
        console.log(`📊 Parameters - vendorId: ${vendorId}, selectedType: ${selectedType}`)

        const response = await fetch(url, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          cache: 'no-cache', // Force fresh data
          signal: controller.signal
        })

        clearTimeout(timeoutId)

        if (response.ok) {
          const data = await response.json()
          console.log("Fetched categories:", data) // Debug log
          console.log(`📊 Categories count: ${data.categories?.length || 0}`)
          console.log(`📊 Flat categories count: ${data.flatCategories?.length || 0}`)
          if (data.categories && data.categories.length > 0) {
            console.log(`🏷️  First category: ${data.categories[0].name} (ID: ${data.categories[0].id}, Vendor: ${data.categories[0].vendor_name})`)
          }
          
          // Debug: Log all categories to see if new one is there
          if (data.categories && data.categories.length > 0) {
            console.log(`📋 All categories:`, data.categories.map(c => ({ 
              id: c.id, 
              name: c.name, 
              vendor_name: c.vendor_name, 
              parent_id: c.parent_id,
              type: c.type 
            })))
          }
          
          setCategories(data.categories || [])
          setFlatCategories(data.flatCategories || [])
          setLoading(false)
          return // Success, exit retry loop
        } else if (checkAuthError(response)) {
          setLoading(false)
          return // Don't retry auth errors - checkAuthError handles logout
        } else {
          const errorData = await response.json().catch(() => ({}))
          showToast(errorData.message || `Error loading categories (${response.status})`, "error")
          setLoading(false)
          return // Don't retry server errors
        }
      } catch (error) {
        retryCount++
        console.error(`Error fetching categories (attempt ${retryCount}):`, error)
        
        if (error.name === 'AbortError') {
          showToast("Request timed out. Please check your connection.", "error")
          setLoading(false)
          return
        }
        
        if (retryCount < maxRetries) {
          showToast(`Connection failed. Retrying... (${retryCount}/${maxRetries})`, "warning")
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount)) // Exponential backoff
        } else {
          showToast("Failed to load categories after multiple attempts. Please check your connection and try again.", "error")
          setLoading(false)
        }
      }
    }
  }

  const handleCreateCategory = () => {
    setEditingCategory({
      id: null,
      name: "",
      type: "store",
      parent_id: null,
      status: "active"
    })
    setShowModal(true)
  }

  const handleAddSubcategory = (parentCategory) => {
    setEditingCategory({
      id: null,
      name: "",
      type: parentCategory.type || parentCategory.description || "store",
      parent_id: parentCategory.id,
      status: "active"
    })
    setShowModal(true)
  }

  const handleEditCategory = (category) => {
    setEditingCategory({
      id: category.id,
      name: category.name,
      type: category.type || category.description || "store",
      parent_id: category.parent_id,
      status: category.status || "active"
    })
    setShowModal(true)
  }



  const handleDeleteCategory = async (category) => {
    if (!confirm(`Are you sure you want to delete "${category.name}"? This will also delete all subcategories.`)) {
      return
    }

    try {
      const token = localStorage.getItem("token")
      if (!token) {
        handleInvalidToken()
        return
      }

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      const response = await fetch(`${API_BASE_URL}/categories/${category.id}`, {
        method: "DELETE",
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        const result = await response.json()
        showToast(result.message, "success")
        fetchCategories()
      } else if (checkAuthError(response)) {
        // checkAuthError handles logout
      } else {
        const errorData = await response.json().catch(() => ({}))
        showToast(errorData.message || "Error deleting category", "error")
      }
    } catch (error) {
      console.error("Error deleting category:", error)
      if (error.name === 'AbortError') {
        showToast("Request timed out. Please check your connection.", "error")
      } else {
        showToast("Error deleting category. Please try again.", "error")
      }
    }
  }

  const handleBulkDelete = async () => {
    if (selectedCategories.size === 0) {
      showToast("Please select categories to delete", "warning")
      return
    }

    const selectedCategoryNames = Array.from(selectedCategories).map(id => {
      const category = flatCategories.find(cat => cat.id === id)
      return category ? category.name : `Category ${id}`
    })

    if (!confirm(`Are you sure you want to delete ${selectedCategories.size} categories?\n\nSelected categories:\n${selectedCategoryNames.join('\n')}\n\nThis will also delete all subcategories.`)) {
      return
    }

    try {
      setLoading(true)
      const token = localStorage.getItem("token")
      
      if (!token) {
        handleInvalidToken()
        return
      }
      
      // Convert category IDs to integers
      const categoryIds = Array.from(selectedCategories).map(id => parseInt(id))
      console.log("Sending bulk delete request with category IDs:", categoryIds)
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 45000) // Extended timeout for bulk operations
      
      const response = await fetch(`${API_BASE_URL}/categories/bulk-delete`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          categoryIds: categoryIds
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        const result = await response.json()
        showToast(result.message, "success")
        setSelectedCategories(new Set())
        fetchCategories()
      } else if (checkAuthError(response)) {
        // checkAuthError handles logout
      } else {
        const errorData = await response.json().catch(() => ({}))
        showToast(errorData.message || "Error deleting categories", "error")
      }
    } catch (error) {
      console.error("Error bulk deleting categories:", error)
      if (error.name === 'AbortError') {
        showToast("Request timed out. Please check your connection.", "error")
      } else {
        showToast("Error deleting categories. Please try again.", "error")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSelectCategory = (categoryId, checked) => {
    console.log(`Selecting category ${categoryId} (${checked ? 'checked' : 'unchecked'})`)
    setSelectedCategories(prev => {
      const newSet = new Set(prev)
      if (checked) {
        newSet.add(categoryId)
      } else {
        newSet.delete(categoryId)
      }
      console.log("Current selected categories:", Array.from(newSet))
      return newSet
    })
  }

  const handleSelectAll = (checked) => {
    if (checked) {
      const allCategoryIds = new Set()
      const addCategoryIds = (cats) => {
        cats.forEach(cat => {
          allCategoryIds.add(cat.id)
          if (cat.subcategories && cat.subcategories.length > 0) {
            addCategoryIds(cat.subcategories)
          }
        })
      }
      addCategoryIds(filteredCategories)
      setSelectedCategories(allCategoryIds)
    } else {
      setSelectedCategories(new Set())
    }
  }

  const getSelectedCount = () => {
    return selectedCategories.size
  }

  const handleMergeCategories = () => {
    const selectedCategoryIds = Array.from(selectedCategories)
    if (selectedCategoryIds.length !== 2) {
      showToast("Please select exactly 2 categories to merge", "warning")
      return
    }

    const selectedCategoryObjects = flatCategories.filter(cat => 
      selectedCategoryIds.includes(cat.id)
    )

    if (selectedCategoryObjects.length !== 2) {
      showToast("Error: Could not find selected categories", "error")
      return
    }

    // Check if both categories are of the same type
    if (selectedCategoryObjects[0].type !== selectedCategoryObjects[1].type) {
      showToast("Cannot merge categories of different types", "error")
      return
    }

    setMergeCategories(selectedCategoryObjects)
    setShowMergeModal(true)
  }

  const handleMergeSuccess = () => {
    setShowMergeModal(false)
    setSelectedCategories(new Set())
    fetchCategories()
  }

  const handleSaveCategory = async (categoryData) => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        handleInvalidToken()
        return
      }

      const url = categoryData.id ? `${API_BASE_URL}/categories/${categoryData.id}` : `${API_BASE_URL}/categories`
      const method = categoryData.id ? "PUT" : "POST"

      // Ensure we send the correct field name
      const requestData = {
        name: categoryData.name,
        type: categoryData.type, // API expects 'type' field
        parent_id: categoryData.parent_id || null,
        status: categoryData.status || "active"
      }

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestData),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        showToast(categoryData.id ? "Category updated successfully" : "Category created successfully", "success")
        setShowModal(false)
        setEditingCategory(null)
        
        // Add debug logging
        console.log(`🔄 Refreshing categories after save - selectedVendor: ${selectedVendor}`)
        
        // Force refresh with current vendor selection
        await fetchCategories(selectedVendor)
        
        console.log(`✅ Categories refresh completed`)
      } else if (checkAuthError(response)) {
        // checkAuthError handles logout
      } else {
        const errorData = await response.json().catch(() => ({}))
        showToast(errorData.message || "Error saving category", "error")
        throw new Error(errorData.message || "Error saving category")
      }
    } catch (error) {
      console.error("Error saving category:", error)
      if (error.name === 'AbortError') {
        showToast("Request timed out. Please check your connection.", "error")
      } else {
        showToast("Error saving category. Please try again.", "error")
      }
      throw error // Re-throw so the modal can handle it
    }
  }

  const handleToggleExpand = (categoryId) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId)
      } else {
        newSet.add(categoryId)
      }
      return newSet
    })
  }

  const getFilteredCategories = () => {
    console.log(`🔍 getFilteredCategories - selectedVendor: ${selectedVendor}, selectedType: ${selectedType}`)
    console.log(`📊 Total categories from API: ${categories.length}`)
    console.log(`📋 Categories:`, categories.map(c => ({ id: c.id, name: c.name, vendor_name: c.vendor_name })))
    
    let filtered = categories

    if (selectedType !== "all") {
      filtered = filterCategoriesByType(filtered, selectedType)
      console.log(`📊 After type filtering: ${filtered.length} categories`)
    }

    // Note: Vendor filtering is now handled by the backend API
    // When a vendor is selected, we fetch categories specifically for that vendor
    // So no client-side vendor filtering is needed

    if (searchQuery) {
      filtered = filterCategoriesBySearch(filtered, searchQuery)
      console.log(`📊 After search filtering: ${filtered.length} categories`)
    }

    console.log(`📊 Final filtered categories: ${filtered.length}`)
    return filtered
  }

  const filterCategoriesByType = (categories, type) => {
    return categories.map(category => {
      const filteredSubcategories = category.subcategories 
        ? filterCategoriesByType(category.subcategories, type)
        : []
      
              if (category.type === type || filteredSubcategories.length > 0) {
        return {
          ...category,
          subcategories: filteredSubcategories
        }
      }
      return null
    }).filter(Boolean)
  }

  const filterCategoriesBySearch = (categories, query) => {
    return categories.map(category => {
      const filteredSubcategories = category.subcategories 
        ? filterCategoriesBySearch(category.subcategories, query)
        : []
      
      if (category.name.toLowerCase().includes(query.toLowerCase()) || filteredSubcategories.length > 0) {
        return {
          ...category,
          subcategories: filteredSubcategories
        }
      }
      return null
    }).filter(Boolean)
  }



  const renderCategoryTree = (categoryList, level = 0) => {
    return categoryList.map(category => {
      const hasSubcategories = category.subcategories && category.subcategories.length > 0
      const isExpanded = expandedCategories.has(category.id)
      const isSelected = selectedCategories.has(category.id)
      const indent = level * 24

      return (
        <div key={category.id} className="tree-item">
          <div className={`tree-node ${isSelected ? 'selected' : ''}`} style={{ paddingLeft: `${indent + 16}px` }}>
            <div className="tree-content">
              <div className="tree-left">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={(e) => handleSelectCategory(category.id, e.target.checked)}
                  className="category-checkbox"
                  onClick={(e) => e.stopPropagation()}
                />
                {hasSubcategories && (
                  <button
                    className="expand-btn"
                    onClick={() => handleToggleExpand(category.id)}
                  >
                    {isExpanded ? "▼" : "▶"}
                  </button>
                )}
                {!hasSubcategories && <span className="expand-placeholder">│</span>}
                <span className="folder-icon">
                  {hasSubcategories ? "📁" : "📄"}
                </span>
                <div className="category-info">
                  <span 
                    className="category-name"
                    style={{ cursor: 'pointer' }}
                    title="Click to edit category"
                  >
                    {category.name}
                  </span>
                  <div className="category-meta">
                    <span className="category-type">[{category.type}]</span>
                    <span className="category-level">Level {category.level}</span>
                    <span className="product-count" title="Includes products from all subcategories">
                      ({getHierarchicalProductCount(category)} products)
                    </span>
                    {category.vendor_name && (
                      <span className="vendorData">Vendor: {category.vendor_name}</span>
                    )}
                   
                  </div>
                </div>
              </div>
              
              <div className="tree-actions">
                {category.type === 'vendor' && category.vendor_name && (
                  <span className="vendor-label" title={`Vendor: ${category.vendor_name}`}>
                    {category.vendor_name}
                  </span>
                )}
                <button
                  className="btn btn-xs btn-secondary"
                  onClick={() => handleEditCategory(category)}
                  title="Edit Category"
                >
                  ✏️
                </button>
                <button
                  className="btn btn-xs btn-primary"
                  onClick={() => handleAddSubcategory(category)}
                  title="Add Subcategory"
                >
                  ➕
                </button>
                <button
                  className="btn btn-xs btn-danger"
                  onClick={() => handleDeleteCategory(category)}
                  title="Delete"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
          
          {hasSubcategories && isExpanded && (
            <div className="tree-children">
              {renderCategoryTree(category.subcategories, level + 1)}
            </div>
          )}
        </div>
      )
    })
  }

  const renderCategoryTable = (categoryList, level = 0) => {
    return categoryList.map(category => {
      const hasSubcategories = category.subcategories && category.subcategories.length > 0
      const isExpanded = expandedCategories.has(category.id)
      const isSelected = selectedCategories.has(category.id)
      const indent = level * 20

      return (
        <>
          <tr key={category.id} className={`category-row ${isSelected ? 'selected' : ''}`}>
            <td style={{ paddingLeft: `${indent + 16}px` }}>
              <div className="category-name-cell">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={(e) => handleSelectCategory(category.id, e.target.checked)}
                  className="category-checkbox"
                />
                {hasSubcategories && (
                  <button
                    className="expand-btn"
                    onClick={() => handleToggleExpand(category.id)}
                  >
                    {isExpanded ? "▼" : "▶"}
                  </button>
                )}

                  <span 
                    className="category-name"
                    onClick={() => handleEditCategory(category)}
                    style={{ cursor: 'pointer' }}
                    title="Click to edit name"
                  >
                    {category.name}
                  </span>
                )}
              </div>
            </td>
            <td>{category.type}</td>
            <td>{category.level}</td>
            <td title="Includes products from all subcategories">{getHierarchicalProductCount(category)}</td>
            <td>
              <span className={`status-badge ${category.status}`}>
                {category.status}
              </span>
            </td>
            <td>
              <div className="action-buttons">
                {category.type === 'vendor' && category.vendor_name && (
                  <span className="vendor-label" title={`Vendor: ${category.vendor_name}`}>
                    {category.vendor_name}
                  </span>
                )}
                <button
                  className="btn btn-xs btn-secondary"
                  onClick={() => handleEditCategory(category)}
                  title="Edit Category"
                >
                  ✏️
                </button>
                <button
                  className="btn btn-xs btn-primary"
                  onClick={() => handleAddSubcategory(category)}
                  title="Add Subcategory"
                >
                  ➕
                </button>
                <button
                  className="btn btn-xs btn-danger"
                  onClick={() => handleDeleteCategory(category)}
                  title="Delete"
                >
                  🗑️
                </button>
              </div>
            </td>
          </tr>
          {hasSubcategories && isExpanded && 
            renderCategoryTable(category.subcategories, level + 1)
          }
        </>
      )
    })
  }

  const filteredCategories = getFilteredCategories()
  
  // Debug log to see what's being rendered
  console.log("Rendering categories:", {
    allCategories: categories.length,
    flatCategories: flatCategories.length,
    filteredCategories: filteredCategories.length
  })

  if (loading) {
    return (
      <div className="loading-container">
        <div 
          className="loading-spinner"
          style={{
            width: '40px',
            height: '40px',
            border: '3px solid #f3f3f3',
            borderTop: '3px solid #007bff',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '16px',
            display: 'block',
            boxSizing: 'border-box'
          }}
        ></div>
        <p>Loading categories...</p>
      </div>
    )
  }

  return (
    <div className="categories-container">
      {/* Header */}
      <div className="categories-header">
        <div className="header-left">
          <h1>Category Management</h1>
       
        </div>
        <div className="header-right">
          <button
            className="btn btn-secondary"
            onClick={() => handleSelectAll(true)}
            title="Select all categories for bulk operations"
          >
            📋 Select All Categories
          </button>
          <button
            className="btn btn-primary"
            onClick={() => handleCreateCategory()}
          >
            + Add Category
          </button>
        </div>
      </div>

      {/* Bulk Actions */}
      {getSelectedCount() > 0 && (
        <div className="bulk-actions">
          <div className="bulk-info">
            <span className="selected-count">
              {getSelectedCount()} category{getSelectedCount() !== 1 ? 'ies' : 'y'} selected
            </span>
            <span className="bulk-warning">
              ⚠️ This will delete all selected categories and their subcategories permanently!
            </span>
            <div className="selected-categories-list">
              {Array.from(selectedCategories).slice(0, 5).map(id => {
                const category = flatCategories.find(cat => cat.id === id)
                return category ? (
                  <span key={id} className="selected-category-tag">
                    {category.name}
                  </span>
                ) : null
              })}
              {selectedCategories.size > 5 && (
                <span className="selected-category-tag">
                  +{selectedCategories.size - 5} more...
                </span>
              )}
            </div>
          </div>
              <div className="bulk-buttons">
      {selectedCategories.size === 2 && (
        <button
          className="btn btn-warning"
          onClick={handleMergeCategories}
          title="Merge selected categories"
        >
          🔄 Merge Categories
        </button>
      )}
            <button
              className="btn btn-secondary"
              onClick={() => setSelectedCategories(new Set())}
            >
              Clear Selection
            </button>
            <button
              className="btn btn-danger"
              onClick={handleBulkDelete}
              disabled={loading}
            >
              {loading ? "🗑️ Deleting..." : `🗑️ Delete ${getSelectedCount()} Categories`}
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-group">
          <label>Type:</label>
          <select
            value={selectedType}
            onChange={(e) => {
              const newType = e.target.value
              setSelectedType(newType)
            }}
          >
            <option value="all">All Types</option>
            <option value="store">Store Categories</option>
            <option value="vendor">Vendor Categories</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Vendor:</label>
          <select
            value={selectedVendor}
            onChange={(e) => {
              const vendorId = e.target.value
              console.log(`🎯 Vendor selection changed to: ${vendorId}`)
              setSelectedVendor(vendorId)
            }}
          >
            <option value="all">All Vendors</option>
            {vendors.map(vendor => (
              <option key={vendor.id} value={vendor.id}>
                {vendor.name} ({vendor.product_count || 0} products)
              </option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label>Search:</label>
          <input
            type="text"
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <label>View:</label>
          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value)}
          >
            <option value="tree">Tree View</option>
            <option value="table">Table View</option>
          </select>
        </div>
        <div className="filter-group">
          <button
            className="btn btn-secondary"
            onClick={() => handleSelectAll(true)}
            title="Select all visible categories"
          >
            Select All
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => setSelectedCategories(new Set())}
            title="Clear all selections"
          >
            Clear All
          </button>
          <button
            className="btn btn-primary"
            onClick={() => fetchCategories(selectedVendor)}
            title="Refresh categories data"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Content */}
      {viewMode === "tree" ? (
        <div className="tree-container">
          {filteredCategories.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📁</div>
              <h3>No categories found</h3>
              <p>Get started by adding your first category</p>
              <button
                className="btn btn-primary"
                onClick={() => handleCreateCategory()}
              >
                Add Your First Category
              </button>
            </div>
          ) : (
            <div className="tree-view">
              {renderCategoryTree(filteredCategories)}
            </div>
          )}
        </div>
      ) : (
        <div className="table-container">
          <table className="categories-table">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={getSelectedCount() === filteredCategories.length && filteredCategories.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="select-all-checkbox"
                  />
                </th>
                <th>Name</th>
                <th>Type</th>
                <th>Level</th>
                <th>Products</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {renderCategoryTable(filteredCategories)}
              {filteredCategories.length === 0 && (
                <tr>
                  <td colSpan="6" className="empty-state">
                    No categories found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Category Modal */}
      {showModal && (
        <CategoryModal
          category={editingCategory}
          categories={flatCategories}
          selectedVendor={selectedVendor}
          onClose={() => {
            setShowModal(false)
            setEditingCategory(null)
          }}
          onSave={handleSaveCategory}
        />
      )}

          {/* Merge Modal */}
          {showMergeModal && mergeCategories.length === 2 && (
            <CategoryMergeModal
              sourceCategory={mergeCategories[0]}
              targetCategory={mergeCategories[1]}
              onClose={() => setShowMergeModal(false)}
              onSuccess={handleMergeSuccess}
            />
          )}
        </div>
      )
    }

    export default Categories
