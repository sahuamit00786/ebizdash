import React, { useState, useEffect } from 'react'
import HierarchicalCategoryTree from './HierarchicalCategoryTree'

const CategoryTreeSelector = ({ 
  categories, 
  selectedCategories = [], 
  onSelectionChange,
  type = "store",
  vendorId = null, // Add vendor ID for filtering
  placeholder = "Select Category",
  className = ""
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Get selected category info for display
  const getSelectedCategoryInfo = () => {
    if (selectedCategories.length === 0) return null
    
    const selectedId = selectedCategories[0]
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
    
    // Build hierarchical structure to search
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
    return findCategoryWithPath(hierarchicalCategories, selectedId)
  }

  const selectedCategoryInfo = getSelectedCategoryInfo()

  // Render trigger button
  const renderTriggerButton = () => {
    return (
      <button 
        className={`category-trigger-button ${className}`}
        onClick={() => setIsModalOpen(true)}
        type="button"
      >
        <div className="category-trigger-content">
          {selectedCategoryInfo ? (
            <>
              <div className="category-trigger-name">
                {selectedCategoryInfo.category.name}
              </div>
              <div className="category-trigger-path">
                {selectedCategoryInfo.path.join(' > ')}
              </div>
            </>
          ) : (
            <div className="category-trigger-placeholder">
              {placeholder}
            </div>
          )}
        </div>
        <div className="category-trigger-arrow">⌄</div>
      </button>
    )
  }

  return (
    <HierarchicalCategoryTree
      categories={categories}
      selectedCategories={selectedCategories}
      onSelectionChange={onSelectionChange}
      type={type}
      vendorId={vendorId}
      isOpen={isModalOpen}
      onClose={() => setIsModalOpen(false)}
      triggerElement={renderTriggerButton()}
    />
  )
}

export default CategoryTreeSelector
