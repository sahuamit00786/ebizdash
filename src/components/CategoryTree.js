import React, { useState, useEffect, useCallback, useMemo } from "react"
import { useAuth } from "../context/AuthContext"
import { useToast } from "../context/ToastContext"
import API_BASE_URL from "../config/api"
import "./CategoryTree.css"

const CategoryTree = () => {
  const [categories, setCategories] = useState([])
  const [flatCategories, setFlatCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedCategories, setExpandedCategories] = useState(new Set())
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [parentCategory, setParentCategory] = useState(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    parent_id: null
  })

  const { user } = useAuth()
  const { showToast } = useToast()

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("token")
      const response = await fetch(`${API_BASE_URL}/categories`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setCategories(data.categories || [])
        setFlatCategories(data.flatCategories || [])
      } else {
        showToast("Error loading categories", "error")
      }
    } catch (error) {
      showToast("Error loading categories", "error")
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  // Filter categories based on search term
  const filteredCategories = useMemo(() => {
    if (!searchTerm.trim()) return categories

    const searchLower = searchTerm.toLowerCase()
    const filterCategory = (category) => {
      const matchesSearch = category.name.toLowerCase().includes(searchLower) ||
                          category.description.toLowerCase().includes(searchLower)
      
      const matchingSubcategories = category.subcategories
        ? category.subcategories.filter(filterCategory)
        : []
      
      return matchesSearch || matchingSubcategories.length > 0
    }

    return categories.filter(filterCategory)
  }, [categories, searchTerm])

  // Toggle category expansion
  const handleToggleExpand = useCallback((categoryId) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId)
      } else {
        newSet.add(categoryId)
      }
      return newSet
    })
  }, [])

  // Handle add category
  const handleAddCategory = useCallback((parentCategory = null) => {
    setParentCategory(parentCategory)
    setEditingCategory(null)
    setFormData({
      name: "",
      description: "",
      parent_id: parentCategory ? parentCategory.id : null
    })
    setShowAddModal(true)
  }, [])

  // Handle edit category
  const handleEditCategory = useCallback((category) => {
    setEditingCategory(category)
    setParentCategory(null)
    setFormData({
      name: category.name,
      description: category.description,
      parent_id: category.parent_id
    })
    setShowAddModal(true)
  }, [])

  // Handle form submission
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault()
    
    try {
      const token = localStorage.getItem("token")
      const url = editingCategory 
        ? `${API_BASE_URL}/categories/${editingCategory.id}`
        : `${API_BASE_URL}/categories`
      
      const method = editingCategory ? "PUT" : "POST"
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        showToast(
          editingCategory 
            ? "Category updated successfully" 
            : "Category created successfully", 
          "success"
        )
        setShowAddModal(false)
        setEditingCategory(null)
        setFormData({ name: "", description: "", parent_id: null })
        fetchCategories()
      } else {
        const error = await response.json()
        showToast(error.message || "Error saving category", "error")
      }
    } catch (error) {
      showToast("Error saving category", "error")
    }
  }, [formData, editingCategory, showToast, fetchCategories])

  // Handle delete category
  const handleDeleteCategory = useCallback(async (category) => {
    if (!window.confirm(`Are you sure you want to delete "${category.name}" and all its subcategories?`)) {
      return
    }

    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`${API_BASE_URL}/categories/${category.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        showToast("Category deleted successfully", "success")
        fetchCategories()
      } else {
        const error = await response.json()
        showToast(error.message || "Error deleting category", "error")
      }
    } catch (error) {
      showToast("Error deleting category", "error")
    }
  }, [showToast, fetchCategories])

  // Render category tree recursively
  const renderCategoryTree = useCallback((categoryList, level = 0) => {
    return categoryList.map(category => {
      const hasSubcategories = category.subcategories && category.subcategories.length > 0
      const isExpanded = expandedCategories.has(category.id)
      const indent = level * 24

      return (
        <div key={category.id} className="category-tree-item">
          <div 
            className="category-tree-node" 
            style={{ paddingLeft: `${indent + 16}px` }}
          >
            <div className="category-tree-content">
              <div className="category-tree-left">
                {hasSubcategories && (
                  <button
                    className="expand-btn"
                    onClick={() => handleToggleExpand(category.id)}
                    title={isExpanded ? "Collapse" : "Expand"}
                  >
                    {isExpanded ? "▼" : "▶"}
                  </button>
                )}
                {!hasSubcategories && <span className="expand-placeholder">│</span>}
                
                <span className="folder-icon">
                  {hasSubcategories ? "📁" : "📄"}
                </span>
                
                <div className="category-info">
                  <span className="category-name">{category.name}</span>
                  <span className="category-description">[{category.description}]</span>
                  <span className="category-level">L{category.level}</span>
                  <span className="category-count">({category.product_count || 0} products)</span>
                </div>
              </div>
              
              <div className="category-actions">
                <button
                  className="action-btn add-btn"
                  onClick={() => handleAddCategory(category)}
                  title="Add subcategory"
                >
                  ➕
                </button>
                <button
                  className="action-btn edit-btn"
                  onClick={() => handleEditCategory(category)}
                  title="Edit category"
                >
                  ✏️
                </button>
                <button
                  className="action-btn delete-btn"
                  onClick={() => handleDeleteCategory(category)}
                  title="Delete category"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
          
          {hasSubcategories && isExpanded && (
            <div className="category-tree-children">
              {renderCategoryTree(category.subcategories, level + 1)}
            </div>
          )}
        </div>
      )
    })
  }, [expandedCategories, handleToggleExpand, handleAddCategory, handleEditCategory, handleDeleteCategory])

  if (loading) {
    return (
      <div className="loading-container">
        <div 
          className="loading-spinner"
          style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f4f6',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '16px',
            display: 'block',
            boxSizing: 'border-box'
          }}
        ></div>
        <div className="loading-text">Loading categories...</div>
      </div>
    )
  }

  return (
    <div className="category-tree-container">
      <div className="category-tree-header">
        <h1>Categories</h1>
        <div className="header-actions">
          <div className="search-container">
            <input
              type="text"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            {searchTerm && (
              <button
                className="clear-search-btn"
                onClick={() => setSearchTerm("")}
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>
          <button
            className="btn btn-primary"
            onClick={() => handleAddCategory()}
          >
            Add Root Category
          </button>
        </div>
      </div>

      <div className="category-tree-content">
        {filteredCategories.length === 0 ? (
          <div className="empty-state">
            {searchTerm ? (
              <>
                <div className="empty-icon">🔍</div>
                <h3>No categories found</h3>
                <p>Try adjusting your search terms</p>
                <button
                  className="btn btn-secondary"
                  onClick={() => setSearchTerm("")}
                >
                  Clear Search
                </button>
              </>
            ) : (
              <>
                <div className="empty-icon">📁</div>
                <h3>No categories yet</h3>
                <p>Create your first category to get started</p>
                <button
                  className="btn btn-primary"
                  onClick={() => handleAddCategory()}
                >
                  Add Category
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="category-tree">
            {renderCategoryTree(filteredCategories)}
          </div>
        )}
      </div>

      {/* Add/Edit Category Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {editingCategory ? "Edit Category" : "Add Category"}
                {parentCategory && !editingCategory && (
                  <span className="parent-info">
                    {" "}under "{parentCategory.name}"
                  </span>
                )}
              </h3>
              <button
                className="modal-close"
                onClick={() => setShowAddModal(false)}
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="category-form">
              <div className="form-group">
                <label htmlFor="name">Category Name *</label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter category name"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="description">Description</label>
                <select
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                >
                  <option value="store">Store</option>
                  <option value="vendor">Vendor</option>
                </select>
              </div>
              
              {!editingCategory && (
                <div className="form-group">
                  <label htmlFor="parent_id">Parent Category</label>
                  <select
                    id="parent_id"
                    value={formData.parent_id || ""}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      parent_id: e.target.value ? parseInt(e.target.value) : null 
                    }))}
                  >
                    <option value="">No Parent (Root Category)</option>
                    {flatCategories.map(category => (
                      <option key={category.id} value={category.id}>
                        {"  ".repeat(category.level - 1)}📁 {category.name} [{category.description}]
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingCategory ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default CategoryTree 