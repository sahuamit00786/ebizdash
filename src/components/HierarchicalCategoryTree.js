import React, { useState, useEffect } from 'react'
import './HierarchicalCategoryTree.css'

const HierarchicalCategoryTree = ({ 
  categories, 
  selectedCategories = [], 
  onSelectionChange,
  type = "store", // "store" or "vendor"
  vendorId = nu3l, // Filter by vendor ID
  maxHeight = "500px",
  isOpen = false,
  onClose = () => {},
  triggerElement = null // The trigger button/input element
}) => {
  const [expandedCategories, setExpandedCategories] = useState(new Set())
  const [localSelectedCategories, setLocalSelectedCategories] = useState(selectedCategories)
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredCategories, setFilteredCategories] = useState([])

  // Filter categories by type and vendor, then build hierarchical structure
  const buildHierarchicalCategories = (cats) => {
    if (!cats || !Array.isArray(cats)) return []
    
    let filteredCategories = cats.filter(cat => cat.type === type)
    
    // Filter by vendor ID if provided
    if (vendorId && type === "vendor") {
      filteredCategories = filteredCategories.filter(cat => 
        cat.vendor_id === vendorId || cat.vendor_id === null || cat.vendor_id === undefined
      )
    }
    
    const buildTree = (items, parentId = null) => {
      return items
        .filter(item => item.parent_id === parentId)
        .map(item => ({
          ...item,
          children: buildTree(items, item.id)
        }))
        .sort((a, b) => a.name.localeCompare(b.name))
    }
    
    return buildTree(filteredCategories)
  }

  const hierarchicalCategories = buildHierarchicalCategories(categories)

  // Get selected category name and path
  const getSelectedCategoryInfo = () => {
    if (localSelectedCategories.length === 0) return null
    
    const selectedId = localSelectedCategories[0]
    const findCategoryWithPath = (cats, targetId, path = []) => {
      for (const cat of cats) {
        const currentPath = [...path, cat.name]
        if (cat.id === targetId) {
          return { category: cat, path: currentPath }
        }
        if (cat.children && cat.children.length > 0) {
          const found = findCategoryWithPath(cat.children, targetId, currentPath)
          if (found) return found
        }
      }
      return null
    }
    
    return findCategoryWithPath(hierarchicalCategories, selectedId)
  }

  const selectedCategoryInfo = getSelectedCategoryInfo()

  // Filter categories based on search
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredCategories(hierarchicalCategories)
      return
    }

    const searchResults = []
    const searchTermLower = searchTerm.toLowerCase()
    
    const searchInCategories = (cats, parentPath = []) => {
      cats.forEach(cat => {
        const currentPath = [...parentPath, cat.name]
        const fullPath = currentPath.join(' > ')
        
        // Check if current category matches search
        if (cat.name.toLowerCase().includes(searchTermLower) || 
            fullPath.toLowerCase().includes(searchTermLower)) {
          searchResults.push({
            ...cat,
            fullPath: fullPath,
            searchMatch: true,
            children: cat.children || []
          })
        }
        
        // Also search in children
        if (cat.children && cat.children.length > 0) {
          searchInCategories(cat.children, currentPath)
        }
      })
    }
    
    searchInCategories(hierarchicalCategories)
    setFilteredCategories(searchResults)
  }, [searchTerm, hierarchicalCategories])

  // Toggle category expansion
  const toggleExpansion = (categoryId) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId)
    } else {
      newExpanded.add(categoryId)
    }
    setExpandedCategories(newExpanded)
  }

  // Handle checkbox selection
  const handleCategorySelection = (categoryId, checked) => {
    let newSelection = [...localSelectedCategories]
    
    if (checked) {
      if (!newSelection.includes(categoryId)) {
        newSelection = [categoryId] // Single selection
      }
    } else {
      newSelection = newSelection.filter(id => id !== categoryId)
    }
    
    setLocalSelectedCategories(newSelection)
    if (onSelectionChange) {
      onSelectionChange(newSelection)
    }
  }

  // Check if category is selected
  const isCategorySelected = (categoryId) => {
    return localSelectedCategories.includes(categoryId)
  }

  // Check if category is expanded
  const isCategoryExpanded = (categoryId) => {
    return expandedCategories.has(categoryId)
  }

  // Get product count for category
  const getProductCount = (category) => {
    return category.product_count || 0
  }

  // Get subcategory count
  const getSubcategoryCount = (category) => {
    return category.children ? category.children.length : 0
  }

  // Render category icon
  const renderCategoryIcon = (category) => {
    if (category.children && category.children.length > 0) {
      return (
        <div className="category-icon folder">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
          </svg>
        </div>
      )
    } else {
      return (
        <div className="category-icon document">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zM16 18H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
          </svg>
        </div>
      )
    }
  }

  // Render chevron icon
  const renderChevron = (category) => {
    if (!category.children || category.children.length === 0) {
      return null
    }

    return (
      <div 
        className={`chevron ${isCategoryExpanded(category.id) ? 'expanded' : ''}`}
        onClick={(e) => {
          e.stopPropagation()
          toggleExpansion(category.id)
        }}
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
          <path d="M7 10l5 5 5-5z"/>
        </svg>
      </div>
    )
  }

  // Render category item
  const renderCategoryItem = (category, level = 0) => {
    const hasChildren = category.children && category.children.length > 0
    const isExpanded = isCategoryExpanded(category.id)
    const isSelected = isCategorySelected(category.id)
    const productCount = getProductCount(category)
    const subcategoryCount = getSubcategoryCount(category)

    return (
      <div key={category.id} className="category-tree-item">
        <div 
          className={`category-row ${isSelected ? 'selected' : ''}`}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
        >
          {renderChevron(category)}
          
          <div className="category-checkbox">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => handleCategorySelection(category.id, e.target.checked)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          <div className="category-content" onClick={() => toggleExpansion(category.id)}>
            {renderCategoryIcon(category)}
            
            <div className="category-info">
              <div className="category-name">{category.name}</div>
              <div className="category-stats">
                <span className="product-count">{productCount}</span>
                {hasChildren && (
                  <span className="subcategory-count">{subcategoryCount}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Show full path in search results */}
        {searchTerm && category.fullPath && category.fullPath !== category.name && (
          <div className="category-path">
            {category.fullPath}
          </div>
        )}

        {hasChildren && isExpanded && (
          <div className="category-children">
            {category.children.map(child => renderCategoryItem(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  // If not open, just render the trigger element
  if (!isOpen) {
    return triggerElement
  }

  return (
    <div className="category-tree-modal-overlay" onClick={onClose}>
      <div className="category-tree-modal" onClick={(e) => e.stopPropagation()}>
        <div className="hierarchical-category-tree" style={{ maxHeight }}>
          <div className="tree-header">
            <h3 className="tree-title">
              {type === 'vendor' ? 'Vendor Categories' : 'Store Categories'}
            </h3>
            <div className="tree-actions">
              <button 
                className="expand-all-btn"
                onClick={() => {
                  const allIds = getAllCategoryIds(hierarchicalCategories)
                  setExpandedCategories(new Set(allIds))
                }}
              >
                Expand
              </button>
              <button 
                className="collapse-all-btn"
                onClick={() => setExpandedCategories(new Set())}
              >
                Collapse
              </button>
              <button 
                className="close-modal-btn"
                onClick={onClose}
              >
                ×
              </button>
            </div>
          </div>

          {/* Current Selection Display */}
          {selectedCategoryInfo && (
            <div className="current-selection">
              <div className="current-selection-label">Current:</div>
              <div className="current-selection-content">
                <div className="current-category-name">{selectedCategoryInfo.category.name}</div>
                <div className="current-category-path">{selectedCategoryInfo.path.join(' > ')}</div>
              </div>
              <button 
                className="clear-selection-btn"
                onClick={() => {
                  setLocalSelectedCategories([])
                  if (onSelectionChange) {
                    onSelectionChange([])
                  }
                }}
              >
                ×
              </button>
            </div>
          )}

          {/* Search Input */}
          <div className="search-container">
            <input
              type="text"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="tree-container">
            {filteredCategories.length > 0 ? (
              filteredCategories.map(category => renderCategoryItem(category))
            ) : (
              <div className="no-categories">
                <div className="no-categories-text">
                  {searchTerm ? "No categories found" : "No categories available"}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper function to get all category IDs recursively
const getAllCategoryIds = (categories) => {
  const ids = []
  const collectIds = (cats) => {
    cats.forEach(cat => {
      ids.push(cat.id)
      if (cat.children && cat.children.length > 0) {
        collectIds(cat.children)
      }
    })
  }
  collectIds(categories)
  return ids
}

export default HierarchicalCategoryTree
