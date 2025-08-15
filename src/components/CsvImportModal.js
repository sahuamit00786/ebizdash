import { useState, useEffect, useRef } from "react"
import { useToast } from "../context/ToastContext"
import API_BASE_URL from "../config/api"
import "./CsvImportModal.css"

const CsvImportModal = ({ isOpen, onClose, onImportComplete }) => {
  const [step, setStep] = useState(1) // 1: Upload, 2: Map Fields, 3: Preview, 4: Import, 5: Results
  const [selectedFile, setSelectedFile] = useState(null)
  const [csvHeaders, setCsvHeaders] = useState([])
  const [fieldMapping, setFieldMapping] = useState({})
  const [previewData, setPreviewData] = useState([])
  const [totalRows, setTotalRows] = useState(0)
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importResults, setImportResults] = useState(null)
  const [databaseFields, setDatabaseFields] = useState([])
  const [error, setError] = useState(null)
  const [vendors, setVendors] = useState([])
  const [selectedVendor, setSelectedVendor] = useState("")
  const [updateMode, setUpdateMode] = useState(false)
  const [showVendorModal, setShowVendorModal] = useState(false)
  const [newVendorName, setNewVendorName] = useState("")
  const [creatingVendor, setCreatingVendor] = useState(false)
  const [importMode, setImportMode] = useState("ultra-fast") // ultra-fast, lightning, standard
  const [importProgress, setImportProgress] = useState({
    current: 0,
    total: 0,
    imported: 0,
    skipped: 0,
    errors: 0,
    startTime: null,
    processingRate: 0,
    currentProduct: null
  })
  const fileInputRef = useRef(null)
  const importStartTimeRef = useRef(null)
  const { showToast } = useToast()

  useEffect(() => {
    if (isOpen) {
      fetchDatabaseFields()
      fetchVendors()
    }
  }, [isOpen])

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

  const createVendor = async (vendorName) => {
    try {
      setCreatingVendor(true)
      const token = localStorage.getItem("token")
      
      const response = await fetch(`${API_BASE_URL}/vendors`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: vendorName,
          email: "",
          phone: "",
          address: "",
          status: "active"
        }),
      })

      if (response.ok) {
        const result = await response.json()
        showToast(`Vendor "${vendorName}" created successfully`, "success")
        
        // Refresh vendors list
        await fetchVendors()
        
        // Set the newly created vendor as selected
        setSelectedVendor(result.vendor.id)
        
        // Don't close modal - keep it open for user to see the result
        // setShowVendorModal(false)
        // setNewVendorName("")
        
        return result.vendor
      } else {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to create vendor")
      }
    } catch (error) {
      console.error("Error creating vendor:", error)
      showToast(`Error creating vendor: ${error.message}`, "error")
      throw error
    } finally {
      setCreatingVendor(false)
    }
  }

  const handleCreateVendor = async () => {
    if (!newVendorName.trim()) {
      showToast("Please enter a vendor name", "warning")
      return
    }

    try {
      await createVendor(newVendorName.trim())
    } catch (error) {
      // Error already handled in createVendor function
    }
  }

  const fetchDatabaseFields = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`${API_BASE_URL}/products/import/fields`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        // Flatten the fields from all categories
        const allFields = []
        Object.values(data.fields).forEach(category => {
          allFields.push(...category.fields)
        })
        setDatabaseFields(allFields)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to fetch database fields')
      }
    } catch (error) {
      console.error("Error fetching database fields:", error)
      showToast(`Error loading database fields: ${error.message}`, "error")
      setError(error.message)
    }
  }

  const handleFileSelect = (event) => {
    const file = event.target.files[0]
    if (!file) return

    if (file.type !== "text/csv" && !file.name.endsWith('.csv')) {
      showToast("Please select a valid CSV file", "error")
      return
    }

    setSelectedFile(file)
    parseCSVHeaders(file)
  }

  const parseCSVHeaders = (file) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const csv = e.target.result
        const lines = csv.split('\n')
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
        setCsvHeaders(headers)
        
        // Auto-map based on common patterns
        const mapping = {}
        headers.forEach(header => {
          const lowerHeader = header.toLowerCase()
          
          // Auto-mapping logic
          if (lowerHeader.includes('sku')) mapping[header] = "sku"
          else if (lowerHeader.includes('name') && !lowerHeader.includes('category')) mapping[header] = "name"
          else if (lowerHeader.includes('image') && (lowerHeader.includes('url') || lowerHeader.includes('link'))) mapping[header] = "image_url"
          else if (lowerHeader.includes('description')) mapping[header] = "description"
          else if (lowerHeader.includes('brand')) mapping[header] = "brand"
          else if (lowerHeader.includes('mfn')) mapping[header] = "mfn"
          else if (lowerHeader.includes('stock')) mapping[header] = "stock"
          else if (lowerHeader.includes('price') && lowerHeader.includes('list')) mapping[header] = "list_price"
          else if (lowerHeader.includes('price') && lowerHeader.includes('market')) mapping[header] = "market_price"
          else if (lowerHeader.includes('cost')) mapping[header] = "vendor_cost"
          else if (lowerHeader.includes('special')) mapping[header] = "special_price"
          else if (lowerHeader.includes('weight')) mapping[header] = "weight"
          else if (lowerHeader.includes('length')) mapping[header] = "length"
          else if (lowerHeader.includes('width')) mapping[header] = "width"
          else if (lowerHeader.includes('height')) mapping[header] = "height"
          else if (lowerHeader.includes('google')) mapping[header] = "google_category"
          else if (lowerHeader.includes('published')) mapping[header] = "published"
          else if (lowerHeader.includes('featured')) mapping[header] = "featured"
          else if (lowerHeader.includes('visibility')) mapping[header] = "visibility"
          else if (lowerHeader.includes('vendor') && lowerHeader.includes('category')) mapping[header] = "vendor_category"
          else if (lowerHeader.includes('store') && lowerHeader.includes('category')) mapping[header] = "store_category"
          // Auto-map vendor subcategory fields
          else if (lowerHeader.includes('vendor') && (lowerHeader.includes('subcategory') || lowerHeader.includes('sub_category'))) {
            // Extract number from vendor subcategory field (e.g., "Vendor Subcategory 1" -> "vendor_subcategory_1")
            const match = lowerHeader.match(/(\d+)/)
            if (match) {
              const number = match[1]
              if (number >= 1 && number <= 5) {
                mapping[header] = `vendor_subcategory_${number}`
              }
            }
          }
          // Auto-map store subcategory fields
          else if (lowerHeader.includes('store') && (lowerHeader.includes('subcategory') || lowerHeader.includes('sub_category'))) {
            // Extract number from store subcategory field (e.g., "Store Subcategory 1" -> "store_subcategory_1")
            const match = lowerHeader.match(/(\d+)/)
            if (match) {
              const number = match[1]
              if (number >= 1 && number <= 5) {
                mapping[header] = `store_subcategory_${number}`
              }
            }
          }
          // Auto-map NEW hierarchical category field
          else if (lowerHeader.includes('category') && lowerHeader.includes('hierarchy')) {
            mapping[header] = "category_hierarchy"
          }
        })
        
        setFieldMapping(mapping)
        setStep(2)
      } catch (error) {
        showToast("Error parsing CSV file", "error")
        setError(error.message)
      }
    }
    reader.readAsText(file)
  }

  const handleFieldMappingChange = (csvHeader, dbField) => {
    setFieldMapping(prev => ({
      ...prev,
      [csvHeader]: dbField
    }))
  }

  const getAvailableDatabaseFields = (currentCsvHeader) => {
    const usedFields = Object.values(fieldMapping)
    return databaseFields.filter(field => 
      !usedFields.includes(field.key) || fieldMapping[currentCsvHeader] === field.key
    )
  }

  const handlePreview = async () => {
    if (!selectedFile) return

    setLoading(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append("csvFile", selectedFile)
      formData.append("fieldMapping", JSON.stringify(fieldMapping))

      const token = localStorage.getItem("token")
      const response = await fetch(`${API_BASE_URL}/products/import/preview`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        setPreviewData(data.previewRows)
        setTotalRows(data.totalRows)
        setStep(3)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
      }
    } catch (error) {
      console.error("Preview error:", error)
      const errorMessage = error.message || "Error previewing data"
      showToast(errorMessage, "error")
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async () => {
    if (!selectedFile) return

    // Validate vendor selection
    if (!selectedVendor) {
      showToast("Please select a vendor for the imported products", "error")
      return
    }

    // Calculate estimated time based on import mode and file size
    const estimatedTime = calculateEstimatedTime()
    console.log(`🚀 STARTING IMPORT - ${importMode.toUpperCase()}`)
    console.log(`📊 File: ${selectedFile.name} (${(selectedFile.size / 1024 / 1024).toFixed(2)} MB)`)
    console.log(`📈 Estimated time: ${estimatedTime}`)
    console.log(`⚡ Expected performance: ${getExpectedPerformance()}`)
    console.log(`🏪 Vendor ID: ${selectedVendor}`)
    console.log(`🔄 Update mode: ${updateMode ? 'Update existing' : 'Create new'}`)
    console.log(`📋 Total rows to process: ${totalRows}`)
    console.log(`⏰ Import started at: ${new Date().toLocaleTimeString()}`)
    console.log('─'.repeat(80))

    setImporting(true)
    setError(null)
    const startTime = Date.now()
    importStartTimeRef.current = startTime
    setImportProgress({
      current: 0,
      total: 0,
      imported: 0,
      updated: 0,
      skipped: 0,
      errors: 0,
      startTime: startTime,
      processingRate: 0,
      currentProduct: null
    })

    try {
      const formData = new FormData()
      formData.append("csvFile", selectedFile)
      formData.append("fieldMapping", JSON.stringify(fieldMapping))
      formData.append("updateMode", updateMode.toString())
      formData.append("selectedVendor", selectedVendor)

      const token = localStorage.getItem("token")
      const response = await fetch(`${API_BASE_URL}/products/import/${importMode}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      if (response.ok) {
        const reader = response.body.getReader()
        const decoder = new TextDecoder()

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6))
                
                if (data.type === 'progress') {
                  // Log progress to console
                  const progressPercentage = Math.round((data.current / data.total) * 100)
                  const elapsedTime = Math.round((Date.now() - importStartTimeRef.current) / 1000)
                  const estimatedTotalTime = data.processingRate > 0 ? Math.round(data.total / data.processingRate) : elapsedTime
                  const remainingTime = Math.max(0, estimatedTotalTime - elapsedTime)
                  
                  console.log(`📊 Progress: ${data.current}/${data.total} (${progressPercentage}%) | Rate: ${data.processingRate} products/sec | Elapsed: ${elapsedTime}s | Remaining: ~${remainingTime}s`)
                  
                  if (data.currentProduct) {
                    console.log(`🔄 Current: ${data.currentProduct}`)
                  }
                  
                  setImportProgress(prev => ({
                    ...prev,
                    current: data.current,
                    total: data.total,
                    imported: data.imported,
                    updated: data.updated,
                    skipped: data.skipped,
                    errors: data.errors,
                    processingRate: data.processingRate,
                    currentProduct: data.currentProduct
                  }))
                } else if (data.type === 'complete') {
                  const totalTime = Math.round((Date.now() - importStartTimeRef.current) / 1000)
                  const actualRate = totalTime > 0 ? Math.round(data.total / totalTime) : data.total
                  
                  console.log('─'.repeat(80))
                  console.log(`✅ IMPORT COMPLETED SUCCESSFULLY!`)
                  console.log(`📊 Final Results:`)
                  console.log(`   • Total processed: ${data.total}`)
                  console.log(`   • Imported: ${data.imported}`)
                  console.log(`   • Updated: ${data.updated}`)
                  console.log(`   • Skipped: ${data.skipped}`)
                  console.log(`   • Errors: ${data.errors.length}`)
                  console.log(`   • Total time: ${totalTime} seconds`)
                  console.log(`   • Average rate: ${actualRate} products/sec`)
                  console.log(`   • Mode used: ${importMode}`)
                  console.log(`⏰ Completed at: ${new Date().toLocaleTimeString()}`)
                  console.log('─'.repeat(80))
                  
                  setImportResults(data)
                  setStep(5)
                  showToast(data.message, "success")
                  if (onImportComplete) {
                    onImportComplete()
                  }
                } else if (data.type === 'error') {
                  console.error(`❌ IMPORT ERROR: ${data.message}`)
                  throw new Error(data.message)
                }
              } catch (parseError) {
                console.error("Error parsing progress data:", parseError)
              }
            }
          }
        }
      } else {
        const errorData = await response.json()
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
      }
    } catch (error) {
      console.error("Import error:", error)
      const errorMessage = error.message || "Error importing data"
      showToast(errorMessage, "error")
      setError(errorMessage)
    } finally {
      setImporting(false)
    }
  }

  const handleDownloadTemplate = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`${API_BASE_URL}/products/import/template`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = "products_template.csv"
        a.click()
        window.URL.revokeObjectURL(url)
        showToast("Template downloaded successfully", "success")
      } else {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to download template")
      }
    } catch (error) {
      console.error("Template download error:", error)
      showToast(`Error downloading template: ${error.message}`, "error")
    }
  }

  const resetModal = () => {
    setStep(1)
    setSelectedFile(null)
    setCsvHeaders([])
    setFieldMapping({})
    setPreviewData([])
    setTotalRows(0)
    setImportResults(null)
    setError(null)
    setSelectedVendor("")
    setUpdateMode(false)
    setShowVendorModal(false)
    setNewVendorName("")
    setCreatingVendor(false)
    setImportProgress({
      current: 0,
      total: 0,
      imported: 0,
      skipped: 0,
      errors: 0,
      startTime: null,
      processingRate: 0,
      currentProduct: null
    })
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleClose = () => {
    // If we're on the results step and import was successful, ensure we call onImportComplete
    if (step === 5 && importResults) {
      console.log("Closing modal after successful import, ensuring products are refreshed...")
      onImportComplete()
    }
    resetModal()
    onClose()
  }

  const getProgressPercentage = () => {
    if (importProgress.total === 0) return 0
    return Math.round((importProgress.current / importProgress.total) * 100)
  }

  const calculateEstimatedTime = () => {
    if (!totalRows) return "Unknown"
    
    let productsPerSecond = 0
    let estimatedSeconds = 0
    
    switch (importMode) {
      case 'ultra-fast':
        productsPerSecond = 1000 // Ultra-fast: 1000+ products/sec
        estimatedSeconds = Math.ceil(totalRows / productsPerSecond)
        break
      case 'lightning':
        productsPerSecond = 200 // Lightning: 200 products/sec
        estimatedSeconds = Math.ceil(totalRows / productsPerSecond)
        break
      case 'standard':
        productsPerSecond = 50 // Standard: 50 products/sec
        estimatedSeconds = Math.ceil(totalRows / productsPerSecond)
        break
      default:
        productsPerSecond = 50
        estimatedSeconds = Math.ceil(totalRows / productsPerSecond)
    }
    
    if (estimatedSeconds < 60) {
      return `${estimatedSeconds} seconds`
    } else if (estimatedSeconds < 3600) {
      const minutes = Math.ceil(estimatedSeconds / 60)
      return `${minutes} minute${minutes > 1 ? 's' : ''}`
    } else {
      const hours = Math.ceil(estimatedSeconds / 3600)
      return `${hours} hour${hours > 1 ? 's' : ''}`
    }
  }

  const getExpectedPerformance = () => {
    switch (importMode) {
      case 'ultra-fast':
        return "1000+ products/sec • 10,000+ products in <60 seconds"
      case 'lightning':
        return "200 products/sec • 1,000-10,000 products in 5-50 seconds"
      case 'standard':
        return "50 products/sec • Best for small datasets <1,000 products"
      default:
        return "Standard performance"
    }
  }

  const getProgressMessage = () => {
    if (importProgress.total === 0) return "Preparing import..."
    
    const { current, total, imported, updated, skipped, errors, processingRate, currentProduct } = importProgress
    
    let message = `Processing ${current} of ${total} products`
    
    if (imported > 0) message += ` • ${imported} imported`
    if (updated > 0) message += ` • ${updated} updated`
    if (skipped > 0) message += ` • ${skipped} skipped`
    if (errors > 0) message += ` • ${errors} errors`
    
    if (processingRate > 0) {
      message += ` • ${processingRate} products/sec`
    }
    
    if (currentProduct) {
      message += ` • Current: ${currentProduct}`
    }
    
    return message
  }

  if (!isOpen) return null

  return (
    <div className="csv-import-modal-overlay">
      <div className="csv-import-modal">
        <div className="modal-header">
          <h2>Import Products from CSV</h2>
          <button className="close-btn" onClick={handleClose}>×</button>
        </div>

        <div className="modal-body">
          {error && (
            <div className="error-banner">
              <strong>Error:</strong> {error}
              <button className="error-close" onClick={() => setError(null)}>×</button>
            </div>
          )}

          {step === 1 && (
            <div className="upload-step">
              <h3>Step 1: Upload CSV File</h3>
              <p>Select a CSV file to import your products</p>
              <div className="template-download">
                <button 
                  type="button" 
                  className="btn btn-outline" 
                  onClick={handleDownloadTemplate}
                >
                  Download Template
                </button>
                <p className="template-info">Download a template to see the expected CSV format</p>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept=".csv"
                className="file-input"
              />
            </div>
          )}

          {step === 2 && (
            <div className="mapping-step">
              <h3>Step 2: Map CSV Headers to Database Fields</h3>
              <p>Map each CSV column to the corresponding database field</p>
              
              <div className="field-mapping-container">
                {csvHeaders.map((header, index) => (
                  <div key={index} className="field-mapping-row">
                    <div className="csv-header">
                      <strong>CSV Header:</strong> {header}
                    </div>
                    <div className="mapping-arrow">→</div>
                    <select
                      value={fieldMapping[header] || ""}
                      onChange={(e) => handleFieldMappingChange(header, e.target.value)}
                      className="db-field-select"
                    >
                      <option value="">-- Select Database Field --</option>
                      {getAvailableDatabaseFields(header).map(field => (
                        <option key={field.key} value={field.key}>
                          {field.label} {field.required && "(Required)"}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              <div className="mapping-summary">
                <h4>Mapping Summary:</h4>
                <div className="summary-grid">
                  {Object.entries(fieldMapping).map(([csvHeader, dbField]) => {
                    const field = databaseFields.find(f => f.key === dbField)
                    
                    // Group category fields
                    if (dbField === 'vendor_category' || dbField === 'store_category' || 
                        dbField.startsWith('vendor_subcategory_') || dbField.startsWith('store_subcategory_')) {
                      return (
                        <div key={csvHeader} className="summary-item category-field">
                          <span className="csv-col">{csvHeader}</span>
                          <span className="arrow">→</span>
                          <span className="db-field category-field-name">
                            {dbField === 'vendor_category' ? 'Vendor Category' :
                             dbField === 'store_category' ? 'Store Category' :
                             dbField.startsWith('vendor_subcategory_') ? `Vendor Subcategory ${dbField.split('_')[2]}` :
                             `Store Subcategory ${dbField.split('_')[2]}`}
                          </span>
                        </div>
                      )
                    } else {
                      return (
                        <div key={csvHeader} className="summary-item">
                          <span className="csv-col">{csvHeader}</span>
                          <span className="arrow">→</span>
                          <span className="db-field">{field?.label || dbField}</span>
                        </div>
                      )
                    }
                  })}
                </div>
              </div>

              <div className="step-actions">
                <button className="btn btn-secondary" onClick={() => setStep(1)}>
                  Back
                </button>
                <button 
                  className="btn btn-primary" 
                  onClick={handlePreview}
                  disabled={loading || Object.keys(fieldMapping).length === 0}
                >
                  {loading ? "Loading Preview..." : "Preview Data"}
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="preview-step">
              <h3>Step 3: Preview Data</h3>
              <p>Review the first 5 rows of mapped data</p>
              
              {/* Import Options */}
              <div className="import-options">
                <h4>Import Options</h4>
                
                {/* Update Mode */}
                <div className="option-group">
                  <label className="option-label">
                    <input
                      type="checkbox"
                      checked={updateMode}
                      onChange={(e) => setUpdateMode(e.target.checked)}
                      className="option-checkbox"
                    />
                    <span className="option-text">Update Mode (Only update existing products by SKU)</span>
                  </label>
                  <p className="option-description">
                    When checked, only products with matching SKUs will be updated. New products will be skipped.
                  </p>
                </div>

                {/* Vendor Selection */}
                <div className="option-group">
                  <label className="option-label">
                    <span className="option-text required">Assign to Vendor: *</span>
                    <div className="vendor-select-container">
                      <select
                        value={selectedVendor}
                        onChange={(e) => setSelectedVendor(e.target.value)}
                        className={`vendor-select ${!selectedVendor ? 'error' : ''}`}
                        required
                      >
                        <option value="">-- Select Vendor (Required) --</option>
                        {(vendors || []).map(vendor => (
                          <option key={vendor.id} value={vendor.id}>
                            {vendor.name}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="add-vendor-btn"
                        onClick={() => setShowVendorModal(true)}
                        title="Add New Vendor"
                      >
                        +
                      </button>
                    </div>
                  </label>
                  <p className="option-description">
                    All imported products will be assigned to the selected vendor. <strong>Vendor selection is required.</strong>
                  </p>
                  {!selectedVendor && (
                    <p className="error-message">
                      ⚠️ Please select a vendor to continue with the import.
                    </p>
                  )}
                </div>
              </div>

              <div className="preview-info">
                <p><strong>Total Rows:</strong> {totalRows}</p>
                <p><strong>Mapped Fields:</strong> {Object.keys(fieldMapping).length}</p>
              </div>

              <div className="preview-table">
                <table>
                  <thead>
                    <tr>
                      <th>Row</th>
                      {Object.keys(fieldMapping).map(field => {
                        const fieldInfo = databaseFields.find(f => f.key === field)
                        return <th key={field}>{fieldInfo?.label || field}</th>
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((row, index) => (
                      <tr key={index}>
                        <td>{row.rowNumber}</td>
                        {Object.keys(fieldMapping).map(field => {
                          const value = row.mapped[field] || ''
                          
                          // Special display for category fields
                          if (field === 'vendor_category' && row.mapped.vendor_category_path) {
                            return <td key={field} className="category-cell">
                              <div className="category-path">
                                <strong>Vendor:</strong> {row.mapped.vendor_category_path}
                              </div>
                            </td>
                          } else if (field === 'store_category' && row.mapped.store_category_path) {
                            return <td key={field} className="category-cell">
                              <div className="category-path">
                                <strong>Store:</strong> {row.mapped.store_category_path}
                              </div>
                            </td>
                          } else if (field.startsWith('vendor_subcategory_') || field.startsWith('store_subcategory_')) {
                            // Don't show individual subcategory fields if we have the path
                            return <td key={field} className="subcategory-cell">
                              {value}
                            </td>
                          } else {
                            return <td key={field}>{value}</td>
                          }
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="import-mode-selection">
                <h4>Import Mode</h4>
                <div className="import-mode-options">
                  <label className="import-mode-option">
                    <input
                      type="radio"
                      name="importMode"
                      value="ultra-fast"
                      checked={importMode === "ultra-fast"}
                      onChange={(e) => setImportMode(e.target.value)}
                    />
                    <div className="mode-content">
                      <div className="mode-title">🚀 Ultra-Fast Import</div>
                      <div className="mode-description">
                        Optimized for 10,000+ products. Processes 1000+ products/sec with vendor-wise categories.
                      </div>
                    </div>
                  </label>
                  
                  <label className="import-mode-option">
                    <input
                      type="radio"
                      name="importMode"
                      value="lightning"
                      checked={importMode === "lightning"}
                      onChange={(e) => setImportMode(e.target.value)}
                    />
                    <div className="mode-content">
                      <div className="mode-title">⚡ Lightning Import</div>
                      <div className="mode-description">
                        Fast import with real-time progress. Good for 1,000-10,000 products.
                      </div>
                    </div>
                  </label>
                  
                  <label className="import-mode-option">
                    <input
                      type="radio"
                      name="importMode"
                      value="standard"
                      checked={importMode === "standard"}
                      onChange={(e) => setImportMode(e.target.value)}
                    />
                    <div className="mode-content">
                      <div className="mode-title">📊 Standard Import</div>
                      <div className="mode-description">
                        Standard import with detailed validation. Best for small datasets.
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="import-estimate">
                <div className="estimate-card">
                  <div className="estimate-icon">⏱️</div>
                  <div className="estimate-content">
                    <div className="estimate-title">Estimated Time</div>
                    <div className="estimate-time">{calculateEstimatedTime()}</div>
                    <div className="estimate-performance">{getExpectedPerformance()}</div>
                  </div>
                </div>
                
                {totalRows > 1000 && importMode === 'standard' && (
                  <div className="performance-warning">
                    <div className="warning-icon">⚠️</div>
                    <div className="warning-content">
                      <div className="warning-title">Performance Warning</div>
                      <div className="warning-message">
                        You're using Standard Import for {totalRows} products. Consider switching to 
                        <strong> Ultra-Fast Import</strong> for much better performance (10x faster).
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="step-actions">
                <button className="btn btn-secondary" onClick={() => setStep(2)}>
                  Back to Mapping
                </button>
                <button 
                  className="btn btn-primary" 
                  onClick={handleImport}
                  disabled={importing || !selectedVendor}
                >
                  {importing ? "Importing..." : "Import Data"}
                </button>
              </div>
            </div>
          )}

          {step === 5 && importResults && (
            <div className="results-step">
              <h3>✅ Import Complete</h3>
              
              <div className="import-results">
                <div className="results-summary">
                  <div className="result-card success">
                    <div className="result-icon">✅</div>
                    <div className="result-content">
                      <div className="result-number">{importResults.imported}</div>
                      <div className="result-label">Products Imported</div>
                    </div>
                  </div>
                  
                  <div className="result-card warning">
                    <div className="result-icon">⚠️</div>
                    <div className="result-content">
                      <div className="result-number">{importResults.skipped}</div>
                      <div className="result-label">Rows Skipped</div>
                    </div>
                  </div>
                  
                  {importResults.errors && importResults.errors.length > 0 && (
                    <div className="result-card error">
                      <div className="result-icon">❌</div>
                      <div className="result-content">
                        <div className="result-number">{importResults.errors.length}</div>
                        <div className="result-label">Errors</div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="results-details">
                  <h4>Import Summary</h4>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="detail-label">Total Rows Processed:</span>
                      <span className="detail-value">{importResults.total}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Success Rate:</span>
                      <span className="detail-value success">
                        {Math.round((importResults.imported / importResults.total) * 100)}%
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Processing Time:</span>
                      <span className="detail-value">
                        {importProgress.processingTime || 
                          (importStartTimeRef.current ? 
                            `${Math.round((Date.now() - importStartTimeRef.current) / 1000)}s` : 
                            'N/A'
                          )
                        }
                      </span>
                    </div>
                    {importProgress.processingRate > 0 && (
                      <div className="detail-item">
                        <span className="detail-label">Average Speed:</span>
                        <span className="detail-value info">
                          {importProgress.processingRate} rows/sec
                        </span>
                      </div>
                    )}
                    {importResults.totalProducts && (
                      <div className="detail-item">
                        <span className="detail-label">Total Products in Database:</span>
                        <span className="detail-value success">
                          {importResults.totalProducts}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {importResults.errors && importResults.errors.length > 0 && (
                  <div className="error-details">
                    <h4>❌ Import Errors</h4>
                    <div className="error-list">
                      {importResults.errors.map((error, index) => (
                        <div key={index} className="error-item">
                          <span className="error-icon">⚠️</span>
                          <span className="error-text">{error}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="success-message">
                  <p>🎉 Import completed successfully! Your products have been added to the database.</p>
                  <p>You can now view and manage your imported products in the Products section.</p>
                </div>
              </div>

              <div className="step-actions">
                <button className="btn btn-primary" onClick={handleClose}>
                  Close & Refresh
                </button>
              </div>
            </div>
          )}

          {/* Import Progress Overlay */}
          {importing && (
            <div className="import-progress-overlay">
              <div className="import-progress-modal">
                <h3>Importing Products...</h3>
                
                <div className="progress-container">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${getProgressPercentage()}%` }}
                    ></div>
                  </div>
                  <div className="progress-text">
                    {getProgressPercentage()}% Complete
                  </div>
                </div>

                <div className="progress-stats">
                  <div className="stat-item">
                    <span className="stat-label">Total Rows:</span>
                    <span className="stat-value">{importProgress.total}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Current Row:</span>
                    <span className="stat-value">{importProgress.current}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Imported:</span>
                    <span className="stat-value success">{importProgress.imported}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Skipped:</span>
                    <span className="stat-value warning">{importProgress.skipped}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Errors:</span>
                    <span className="stat-value error">{importProgress.errors}</span>
                  </div>
                  {importProgress.processingRate > 0 && (
                    <div className="stat-item">
                      <span className="stat-label">Speed:</span>
                      <span className="stat-value info">{importProgress.processingRate} rows/sec</span>
                    </div>
                  )}
                </div>

                {importProgress.currentProduct && (
                  <div className="current-product">
                    <span className="current-product-label">Currently Processing:</span>
                    <span className="current-product-name">{importProgress.currentProduct}</span>
                  </div>
                )}

                <div className="progress-message">
                  {getProgressMessage()}
                </div>
              </div>
            </div>
          )}

          {/* Vendor Creation Modal */}
          {showVendorModal && (
            <div className="vendor-modal-overlay">
              <div className="vendor-modal">
                <div className="vendor-modal-header">
                  <h3>Create New Vendor</h3>
                  <button 
                    className="vendor-modal-close" 
                    onClick={() => {
                      setShowVendorModal(false)
                      setNewVendorName("")
                    }}
                  >
                    ×
                  </button>
                </div>
                <div className="vendor-modal-body">
                  <div className="form-group">
                    <label htmlFor="vendorName">Vendor Name *</label>
                    <input
                      type="text"
                      id="vendorName"
                      value={newVendorName}
                      onChange={(e) => setNewVendorName(e.target.value)}
                      placeholder="Enter vendor name"
                      className="vendor-name-input"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleCreateVendor()
                        }
                      }}
                      autoFocus
                    />
                    <p className="form-help">
                      Enter the name of the vendor. Other details can be updated later in the Vendors section.
                    </p>
                  </div>
                  <div className="vendor-modal-actions">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        setShowVendorModal(false)
                        setNewVendorName("")
                      }}
                      disabled={creatingVendor}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleCreateVendor}
                      disabled={creatingVendor || !newVendorName.trim()}
                    >
                      {creatingVendor ? "Creating..." : "Create Vendor"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CsvImportModal 