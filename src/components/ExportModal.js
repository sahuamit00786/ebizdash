import React, { useState } from 'react'
import './ExportModal.css'

const ExportModal = ({ isOpen, onClose, onExport }) => {
  const [exportMode, setExportMode] = useState('woocommerce')

  const handleExport = () => {
    onExport(exportMode)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay">
      <div className="modal-content export-modal">
        <div className="modal-header">
          <h2>Export Products</h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>
        
        <div className="modal-body">
          <p>Choose your export format:</p>
          
          <div className="export-options">
            <div className="export-option">
              <input
                type="radio"
                id="woocommerce"
                name="exportMode"
                value="woocommerce"
                checked={exportMode === 'woocommerce'}
                onChange={(e) => setExportMode(e.target.value)}
              />
              <label htmlFor="woocommerce">
                <strong>WooCommerce Mode</strong>
                <p>Creates a single "Category Path" column with categories joined by " > "</p>
                <p>Example: Electronic > Laptops > Asus Laptops</p>
              </label>
            </div>
            
            <div className="export-option">
              <input
                type="radio"
                id="direct"
                name="exportMode"
                value="direct"
                checked={exportMode === 'direct'}
                onChange={(e) => setExportMode(e.target.value)}
              />
              <label htmlFor="direct">
                <strong>Direct Mode</strong>
                <p>Creates separate columns: ParentCategory, Subcategory1, Subcategory2, etc.</p>
                <p>Example: ParentCategory=Electronic, Subcategory1=Laptops, Subcategory2=Asus Laptops</p>
              </label>
            </div>
          </div>
        </div>
        
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleExport}>
            Export CSV
          </button>
        </div>
      </div>
    </div>
  )
}

export default ExportModal
