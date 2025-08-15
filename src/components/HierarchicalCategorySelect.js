import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import './HierarchicalCategorySelect.css'

const HierarchicalCategorySelect = ({ 
  categories, 
  value, 
  onChange, 
  placeholder = "Select Category",
  type = "store" // "store" or "vendor"
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredCategories, setFilteredCategories] = useState([])
  const dropdownRef = useRef(null)
  const triggerRef = useRef(null)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 })

  // Filter categories by type and build hierarchical structure
  const buildHierarchicalCategories = (cats) => {
    if (!cats || !Array.isArray(cats)) return []
    
    const typeCategories = cats.filter(cat => cat.type === type)
    
    const buildTree = (items, parentId = null) => {
      return items
        .filter(item => item.parent_id === parentId)
        .map(item => ({
          ...item,
          children: buildTree(items, item.id)
        }))
        .sort((a, b) => a.name.localeCompare(b.name))
    }
    
    return buildTree(typeCategories)
  }

  // Get selected category name for display
  const getSelectedCategoryName = () => {
    if (!value || !categories || !Array.isArray(categories)) return ""
    
    // Convert value to number for comparison
    const numericValue = typeof value === 'string' ? parseInt(value) : value
    
    // First try to find in the flat categories array
    const flatCategory = categories.find(cat => cat.id === numericValue)
    if (flatCategory) return flatCategory.name
    
    // If not found in flat array, search in hierarchical structure
    const findCategory = (cats, id) => {
      for (const cat of cats) {
        if (cat.id === id) return cat
        if (cat.children) {
          const found = findCategory(cat.children, id)
          if (found) return found
        }
      }
      return null
    }
    
    const selected = findCategory(categories, numericValue)
    return selected ? selected.name : ""
  }

  // Filter categories based on search term
  useEffect(() => {
    if (!categories || !Array.isArray(categories)) {
      setFilteredCategories([])
      return
    }
    
    if (!searchTerm.trim()) {
      setFilteredCategories(buildHierarchicalCategories(categories))
    } else {
      // Search through all categories and subcategories
      const searchResults = []
      const searchTermLower = searchTerm.toLowerCase()
      
      const searchInCategories = (cats, parentPath = '') => {
        cats.forEach(cat => {
          if (cat.type === type) {
            const currentPath = parentPath ? `${parentPath} → ${cat.name}` : cat.name
            
            // Check if current category matches search
            if (cat.name.toLowerCase().includes(searchTermLower)) {
              searchResults.push({
                ...cat,
                fullPath: currentPath,
                searchMatch: true
              })
            }
            
            // Also search in children
            const children = categories.filter(child => child.parent_id === cat.id)
            if (children.length > 0) {
              searchInCategories(children, currentPath)
            }
          }
        })
      }
      
      // Start search from root categories (parent_id is null)
      const rootCategories = categories.filter(cat => cat.parent_id === null && cat.type === type)
      searchInCategories(rootCategories)
      
      // Also search in categories that might not be root but match the search
      categories.forEach(cat => {
        if (cat.type === type && cat.parent_id !== null) {
          const parent = categories.find(p => p.id === cat.parent_id)
          if (parent) {
            const fullPath = `${parent.name} → ${cat.name}`
            if (cat.name.toLowerCase().includes(searchTermLower) && 
                !searchResults.find(r => r.id === cat.id)) {
              searchResults.push({
                ...cat,
                fullPath: fullPath,
                searchMatch: true
              })
            }
          }
        }
      })
      
      setFilteredCategories(searchResults)
    }
  }, [categories, searchTerm, type])

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) && 
          triggerRef.current && !triggerRef.current.contains(event.target)) {
        setIsOpen(false)
        setSearchTerm("")
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Calculate dropdown position when opening
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width
      })
    }
  }, [isOpen])

  // Render category option with proper indentation
  const renderCategoryOption = (category, level = 0) => {
    const indent = level * 12 // Reduced indentation to minimize line stretching
    
    return (
      <div key={category.id}>
        <div 
          className={`category-option ${value == category.id ? 'selected' : ''}`}
          style={{ paddingLeft: `${indent + 6}px` }}
          onClick={() => {
            console.log('Category clicked:', category.id, category.name, 'Type:', type)
            onChange(category.id)
            setIsOpen(false)
            setSearchTerm("")
          }}
        >
          <div className="category-content">
            <span className="category-name">
              {category.name}
            </span>
            {category.product_count > 0 && (
              <span className="product-count">({category.product_count})</span>
            )}
          </div>
          {/* Show full path in search results */}
          {searchTerm && category.fullPath && category.fullPath !== category.name && (
            <div className="category-path">
              {category.fullPath}
            </div>
          )}
        </div>
        {category.children && category.children.map(child => 
          renderCategoryOption(child, level + 1)
        )}
      </div>
    )
  }

  return (
    <div className="hierarchical-category-select">
      <div 
        ref={triggerRef}
        className={`select-trigger ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="selected-value">
          {getSelectedCategoryName() || placeholder}
        </span>
                 <span className="select-arrow">⌄</span>
      </div>
      
      {isOpen && createPortal(
        <div 
          ref={dropdownRef}
          className="select-dropdown"
          style={{
            position: 'absolute',
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            width: `${dropdownPosition.width}px`,
            zIndex: 99999
          }}
        >
          <div className="search-container">
            <input
              type="text"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          
          <div className="options-container">
            {filteredCategories.length > 0 ? (
              filteredCategories.map(category => renderCategoryOption(category))
            ) : (
              <div className="no-options">
                {searchTerm ? "No categories found" : "No categories available"}
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

export default HierarchicalCategorySelect
