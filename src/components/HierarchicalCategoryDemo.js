import React, { useState, useEffect } from 'react'
import HierarchicalCategorySelect from './HierarchicalCategorySelect'
import API_BASE_URL from '../config/api'
import './HierarchicalCategoryDemo.css'

const HierarchicalCategoryDemo = () => {
  const [categories, setCategories] = useState([])
  const [selectedVendorCategory, setSelectedVendorCategory] = useState("")
  const [selectedStoreCategory, setSelectedStoreCategory] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
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
        setCategories(data.flatCategories || data.categories || [])
      } else {
        console.error("Failed to fetch categories")
      }
    } catch (error) {
      console.error("Error loading categories:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="demo-container">
        <div className="loading">Loading categories...</div>
      </div>
    )
  }

  return (
    <div className="demo-container">
      <h1>Hierarchical Category Selection Demo</h1>
      
      <div className="demo-section">
        <h2>Vendor Categories</h2>
        <p>Select a vendor category from the hierarchical structure:</p>
        <HierarchicalCategorySelect
          categories={categories}
          value={selectedVendorCategory}
          onChange={setSelectedVendorCategory}
          placeholder="Select Vendor Category"
          type="vendor"
        />
        {selectedVendorCategory && (
          <div className="selected-info">
            <strong>Selected Vendor Category ID:</strong> {selectedVendorCategory}
          </div>
        )}
      </div>

      <div className="demo-section">
        <h2>Store Categories</h2>
        <p>Select a store category from the hierarchical structure:</p>
        <HierarchicalCategorySelect
          categories={categories}
          value={selectedStoreCategory}
          onChange={setSelectedStoreCategory}
          placeholder="Select Store Category"
          type="store"
        />
        {selectedStoreCategory && (
          <div className="selected-info">
            <strong>Selected Store Category ID:</strong> {selectedStoreCategory}
          </div>
        )}
      </div>

      <div className="demo-section">
        <h2>Category Statistics</h2>
        <div className="stats-grid">
          <div className="stat-item">
            <h3>Total Categories</h3>
            <span className="stat-number">{categories.length}</span>
          </div>
          <div className="stat-item">
            <h3>Vendor Categories</h3>
            <span className="stat-number">
              {categories.filter(cat => cat.type === 'vendor').length}
            </span>
          </div>
          <div className="stat-item">
            <h3>Store Categories</h3>
            <span className="stat-number">
              {categories.filter(cat => cat.type === 'store').length}
            </span>
          </div>
          <div className="stat-item">
            <h3>Categories with Children</h3>
            <span className="stat-number">
              {categories.filter(cat => 
                categories.some(child => child.parent_id === cat.id)
              ).length}
            </span>
          </div>
        </div>
      </div>

      <div className="demo-section">
        <h2>Category Structure Preview</h2>
        <div className="structure-preview">
          <h3>Vendor Categories Hierarchy:</h3>
          <div className="hierarchy-tree">
            {renderHierarchy(categories.filter(cat => cat.type === 'vendor'))}
          </div>
          
          <h3>Store Categories Hierarchy:</h3>
          <div className="hierarchy-tree">
            {renderHierarchy(categories.filter(cat => cat.type === 'store'))}
          </div>
        </div>
      </div>
    </div>
  )
}

const renderHierarchy = (categories, parentId = null, level = 0) => {
  const children = categories.filter(cat => cat.parent_id === parentId)
  
  if (children.length === 0) return null
  
  return (
    <ul className={`hierarchy-level level-${level}`}>
      {children.map(category => (
        <li key={category.id} className="hierarchy-item">
          <span className="category-name">{category.name}</span>
          {category.product_count > 0 && (
            <span className="product-count">({category.product_count})</span>
          )}
          {renderHierarchy(categories, category.id, level + 1)}
        </li>
      ))}
    </ul>
  )
}

export default HierarchicalCategoryDemo
