"use client"

import { useState } from "react"
import { useToast } from "../context/ToastContext"
import API_BASE_URL from "../config/api"
import "./CategoryMergeModal.css"

const CategoryMergeModal = ({ sourceCategory, targetCategory, onClose, onSuccess }) => {
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [loading, setLoading] = useState(false)
  const { showToast } = useToast()

  const handleMerge = async () => {
         if (!selectedCategory) {
       showToast("Please select which category to keep", "warning")
       return
     }

    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      // The selected category should be the TARGET (receives products), the unselected should be the SOURCE (loses products)
      // If user selects 'source' radio button, then sourceCategory becomes the target (receives products)
      // If user selects 'target' radio button, then targetCategory becomes the target (receives products)
      const targetId = selectedCategory === 'source' ? sourceCategory.id : targetCategory.id
      const sourceId = selectedCategory === 'source' ? targetCategory.id : sourceCategory.id

      const response = await fetch(`${API_BASE_URL}/categories/merge`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
                 body: JSON.stringify({
           sourceCategoryId: sourceId,
           targetCategoryId: targetId,
           categoryType: 'both' // Merge both vendor and store categories
         })
      })

      if (response.ok) {
        const result = await response.json()
        showToast(result.message, "success")
        onSuccess()
      } else {
        const error = await response.json()
        showToast(error.message || "Error merging categories", "error")
      }
    } catch (error) {
      console.error("Merge error:", error)
      showToast("Error merging categories", "error")
    } finally {
      setLoading(false)
    }
  }

  const getCategoryInfo = (category) => {
    return {
      name: category.name,
      type: category.type,
      level: category.level,
      productCount: category.product_count || 0,
      path: category.parent_id ? `${category.parent_name || 'Unknown'} > ${category.name}` : category.name
    }
  }

  const sourceInfo = getCategoryInfo(sourceCategory)
  const targetInfo = getCategoryInfo(targetCategory)

  return (
    <div className="modal-overlay">
      <div className="merge-modal">
                 <div className="modal-header">
           <h2>Merge Categories</h2>
           <button className="close-btn" onClick={onClose}>×</button>
         </div>

        <div className="modal-body">
                     <div className="merge-description">
             <p>Select which category to move products to. All products from the other category will be moved to the selected one. Both categories will remain, but the source category will be empty.</p>
           </div>

          <div className="category-selection">
            <div className="category-option">
              <input
                type="radio"
                id="source-category"
                name="selectedCategory"
                value="source"
                checked={selectedCategory === 'source'}
                onChange={(e) => setSelectedCategory(e.target.value)}
              />
              <label htmlFor="source-category" className="category-card">
                <div className="category-header">
                  <span className="category-name">{sourceInfo.name}</span>
                  <span className="category-type">[{sourceInfo.type}]</span>
                </div>
                <div className="category-details">
                  <span className="category-path">{sourceInfo.path}</span>
                  <span className="category-products">{sourceInfo.productCount} products</span>
                </div>
                                 {selectedCategory === 'source' && (
                   <div className="selected-indicator">✓ Keep this category</div>
                 )}
              </label>
            </div>

            <div className="merge-arrow">→</div>

            <div className="category-option">
              <input
                type="radio"
                id="target-category"
                name="selectedCategory"
                value="target"
                checked={selectedCategory === 'target'}
                onChange={(e) => setSelectedCategory(e.target.value)}
              />
              <label htmlFor="target-category" className="category-card">
                <div className="category-header">
                  <span className="category-name">{targetInfo.name}</span>
                  <span className="category-type">[{targetInfo.type}]</span>
                </div>
                <div className="category-details">
                  <span className="category-path">{targetInfo.path}</span>
                  <span className="category-products">{targetInfo.productCount} products</span>
                </div>
                                 {selectedCategory === 'target' && (
                   <div className="selected-indicator">✓ Keep this category</div>
                 )}
              </label>
            </div>
          </div>

                     <div className="merge-summary">
             <h4>What will happen:</h4>
             <ul>
               <li>All products from the unselected category will be moved to the selected category</li>
               <li>Both categories will remain, but the source category will be empty</li>
               <li>This action cannot be undone</li>
             </ul>
           </div>
        </div>

        <div className="modal-actions">
          <button 
            className="btn btn-secondary" 
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
                     <button 
             className="btn btn-danger" 
             onClick={handleMerge}
             disabled={loading || !selectedCategory}
           >
             {loading ? "Merging..." : "Merge Categories"}
           </button>
        </div>
      </div>
    </div>
  )
}

export default CategoryMergeModal
