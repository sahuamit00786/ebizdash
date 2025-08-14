"use client"

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { useLocation } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { useToast } from "../context/ToastContext"
import API_BASE_URL from "../config/api"
import ProductModal from "./ProductModal"
import BulkEditModal from "./BulkEditModal"
import CsvImportModal from "./CsvImportModal"
import ExportModal from "./ExportModal"
import { Search, Filter, Plus, Upload, Download, Settings, X, ChevronDown, ChevronRight, Folder, File, MoreHorizontal, Edit, Eye, Trash2, Copy } from "lucide-react"

// Available table columns configuration - compact version
const AVAILABLE_COLUMNS = {
  id: { label: "ID", type: "number", width: "w-12" },
  sku: { label: "SKU", type: "text", width: "w-20" },
  name: { label: "Product Name", type: "text", width: "w-64" },
  short_description: { label: "Short Description", type: "text", width: "w-80" },
  description: { label: "Description", type: "text", width: "w-96" },
  brand: { label: "Brand", type: "text", width: "w-24" },
  mfn: { label: "MFN", type: "text", width: "w-28" },
  stock: { label: "Stock", type: "number", width: "w-16" },
  list_price: { label: "List Price", type: "currency", width: "w-24" },
  market_price: { label: "Market Price", type: "currency", width: "w-28" },
  vendor_cost: { label: "Cost", type: "currency", width: "w-24" },
  special_price: { label: "Special", type: "currency", width: "w-24" },
  weight: { label: "Weight", type: "number", width: "w-20" },
  dimensions: { label: "Dimensions", type: "dimensions", width: "w-32" },
  length: { label: "Length", type: "number", width: "w-20" },
  width: { label: "Width", type: "number", width: "w-20" },
  height: { label: "Height", type: "number", width: "w-20" },
  vendor_name: { label: "Vendor", type: "text", width: "w-32" },
  vendor_category_name: { label: "Vendor Cat", type: "text", width: "w-32" },
  store_category_name: { label: "Store Cat", type: "text", width: "w-32" },
  google_category: { label: "Google Cat", type: "text", width: "w-32" },
  published: { label: "Status", type: "boolean", width: "w-24" },
  featured: { label: "Featured", type: "boolean", width: "w-24" },
  visibility: { label: "Visibility", type: "text", width: "w-24" },
  created_at: { label: "Created", type: "date", width: "w-28" },
  updated_at: { label: "Updated", type: "date", width: "w-28" },
  categories_display: { label: "Categories", type: "text", width: "w-48" }
}

// Filter operators for different data types
const FILTER_OPERATORS = {
  text: [
    { value: "is", label: "is" },
    { value: "is_not", label: "is not" },
    { value: "equal_to", label: "equal to" },
    { value: "not_equal_to", label: "not equal to" },
    { value: "contains", label: "contains" },
    { value: "does_not_contain", label: "does not contain" },
    { value: "starts_with", label: "starts with" },
    { value: "ends_with", label: "ends with" },
    { value: "is_empty", label: "is empty" },
    { value: "is_not_empty", label: "is not empty" },
    { value: "is_set", label: "is set" },
    { value: "is_not_set", label: "is not set" }
  ],
  number: [
    { value: "is", label: "is" },
    { value: "is_not", label: "is not" },
    { value: "equal_to", label: "equal to" },
    { value: "not_equal_to", label: "not equal to" },
    { value: "greater_than", label: "is larger than" },
    { value: "less_than", label: "is smaller than" },
    { value: "greater_than_or_equal", label: "is larger or equal than" },
    { value: "less_than_or_equal", label: "is smaller or equal than" },
    { value: "between", label: "between" },
    { value: "not_between", label: "not between" },
    { value: "is_zero", label: "is zero" },
    { value: "is_not_zero", label: "is not zero" },
    { value: "is_positive", label: "is positive" },
    { value: "is_negative", label: "is negative" },
    { value: "is_set", label: "is set" },
    { value: "is_not_set", label: "is not set" }
  ],
  currency: [
    { value: "is", label: "is" },
    { value: "is_not", label: "is not" },
    { value: "equal_to", label: "equal to" },
    { value: "not_equal_to", label: "not equal to" },
    { value: "greater_than", label: "is larger than" },
    { value: "less_than", label: "is smaller than" },
    { value: "greater_than_or_equal", label: "is larger or equal than" },
    { value: "less_than_or_equal", label: "is smaller or equal than" },
    { value: "between", label: "between" },
    { value: "not_between", label: "not between" },
    { value: "is_zero", label: "is zero" },
    { value: "is_not_zero", label: "is not zero" },
    { value: "is_positive", label: "is positive" },
    { value: "is_negative", label: "is negative" },
    { value: "is_set", label: "is set" },
    { value: "is_not_set", label: "is not set" }
  ],
  boolean: [
    { value: "is", label: "is" },
    { value: "is_not", label: "is not" },
    { value: "equal_to", label: "equal to" },
    { value: "not_equal_to", label: "not equal to" },
    { value: "is_true", label: "is true" },
    { value: "is_false", label: "is false" },
    { value: "is_set", label: "is set" },
    { value: "is_not_set", label: "is not set" }
  ],
  date: [
    { value: "is", label: "is" },
    { value: "is_not", label: "is not" },
    { value: "equal_to", label: "equal to" },
    { value: "not_equal_to", label: "not equal to" },
    { value: "before", label: "before" },
    { value: "after", label: "after" },
    { value: "before_or_equal", label: "before or equal" },
    { value: "after_or_equal", label: "after or equal" },
    { value: "between", label: "between" },
    { value: "not_between", label: "not between" },
    { value: "is_today", label: "is today" },
    { value: "is_yesterday", label: "is yesterday" },
    { value: "is_this_week", label: "is this week" },
    { value: "is_this_month", label: "is this month" },
    { value: "is_this_year", label: "is this year" },
    { value: "is_set", label: "is set" },
    { value: "is_not_set", label: "is not set" }
  ]
}

// Searchable Operator Dropdown Component
const SearchableOperatorDropdown = ({ value, onChange, operators, placeholder = "Select Operator" }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const dropdownRef = useRef(null)

  // Filter operators based on search term
  const filteredOperators = operators.filter(operator =>
    operator.label.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
        setSearchTerm("")
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleOperatorSelect = (operator) => {
    onChange(operator.value)
    setIsOpen(false)
    setSearchTerm("")
  }

  const selectedOperator = operators.find(op => op.value === value)

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        className={`w-full px-3 py-2 text-left bg-white border border-gray-300 rounded-lg shadow-sm text-sm hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${isOpen ? 'ring-2 ring-blue-500 border-blue-500' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="block truncate">
          {selectedOperator ? selectedOperator.label : placeholder}
        </span>
        <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
      </button>
      
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg">
          <div className="p-2 border-b border-gray-100">
            <input
              type="text"
              placeholder="Search operators..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              autoFocus
            />
          </div>
          
          <div className="max-h-60 overflow-auto">
            {filteredOperators.length > 0 ? (
              filteredOperators.map((operator) => (
                <button
                  key={operator.value}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 ${
                    value === operator.value ? 'bg-blue-50 text-blue-700' : 'text-gray-900'
                  }`}
                  onClick={() => handleOperatorSelect(operator)}
                >
                  {operator.label}
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-gray-500">No operators found</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

const Products = () => {
  const searchParams = useLocation().search
  const [products, setProducts] = useState([])
  const [vendors, setVendors] = useState([])
  const [categories, setCategories] = useState([])
  const [flatCategories, setFlatCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedProducts, setSelectedProducts] = useState([])
  const [showProductModal, setShowProductModal] = useState(false)
  const [showBulkEditModal, setShowBulkEditModal] = useState(false)
  const [showCsvImportModal, setShowCsvImportModal] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [showColumnSelector, setShowColumnSelector] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [pagination, setPagination] = useState({})
  
  // Sorting state
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'asc'
  })
  
  // Initialize filters with URL search parameter
  const urlSearchQuery = searchParams ? new URLSearchParams(searchParams).get('search') || "" : ""
  const [filters, setFilters] = useState({
    search: urlSearchQuery,
    vendor_id: "",
    category_id: "",
    category_ids: [], // Multi-category selection
    vendor_category_ids: [], // Vendor category selection
    store_category_ids: [], // Store category selection
    stock_status: "",
    published: "",
  })
  
  // Advanced filters state
  const [advancedFilters, setAdvancedFilters] = useState([])
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [showFilterDropdown, setShowFilterDropdown] = useState(false)
  const [searchInput, setSearchInput] = useState(urlSearchQuery)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [hoveredProduct, setHoveredProduct] = useState(null)
  const [showCategorySelector, setShowCategorySelector] = useState(false)
  const [selectedCategories, setSelectedCategories] = useState([])
  const [expandedCategories, setExpandedCategories] = useState(new Set())
  
  // Separate category selectors for vendor and store
  const [showVendorCategorySelector, setShowVendorCategorySelector] = useState(false)
  const [showStoreCategorySelector, setShowStoreCategorySelector] = useState(false)
  const [selectedVendorCategories, setSelectedVendorCategories] = useState([])
  const [selectedStoreCategories, setSelectedStoreCategories] = useState([])
  const [categorySelectorType, setCategorySelectorType] = useState(null) // 'vendor' or 'store'
  
  // Column visibility state - start with compact default columns
  const [visibleColumns, setVisibleColumns] = useState({
    id: true,
    sku: true,
    name: true,
    short_description: false,
    description: false,
    brand: true,
    mfn: false,
    stock: true,
    list_price: true,
    market_price: false,
    vendor_cost: false,
    special_price: false,
    weight: false,
    dimensions: true,
    length: false,
    width: false,
    height: false,
    vendor_name: true,
    vendor_category_name: false,
    store_category_name: false,
    google_category: false,
    published: true,
    featured: false,
    visibility: false,
    created_at: false,
    updated_at: false,
    categories_display: false
  })

  const { user } = useAuth()
  const { showToast } = useToast()

  // Memoized fetch function to prevent unnecessary re-renders
  const fetchProducts = useCallback(async (customFilters = null, customAdvancedFilters = null, customPage = null, customPageSize = null) => {
    try {
      console.log("Fetching products...")
      setLoading(true)
      const token = localStorage.getItem("token")
      
      // Use custom filters if provided, otherwise use state filters
      const filtersToUse = customFilters || filters
      const advancedFiltersToUse = customAdvancedFilters || advancedFilters
      const pageToUse = customPage || currentPage
      const pageSizeToUse = customPageSize || pageSize
      
      // Build query parameters
      const queryParams = new URLSearchParams({
        page: pageToUse,
        limit: pageSizeToUse,
      })

      // Add filters
      if (filtersToUse.search) {
        console.log("Adding search filter:", filtersToUse.search)
        queryParams.append('search', filtersToUse.search)
      }
      if (filtersToUse.vendor_id) {
        console.log(`🔍 Adding vendor_id filter: ${filtersToUse.vendor_id}`)
        queryParams.append('vendor_id', filtersToUse.vendor_id)
      }
      if (filtersToUse.category_ids.length > 0) {
        filtersToUse.category_ids.forEach(id => queryParams.append('category_ids', id))
      }
      if (filtersToUse.vendor_category_ids.length > 0) {
        filtersToUse.vendor_category_ids.forEach(id => queryParams.append('vendor_category_ids', id))
      }
      if (filtersToUse.store_category_ids.length > 0) {
        filtersToUse.store_category_ids.forEach(id => queryParams.append('store_category_ids', id))
      }
      if (filtersToUse.stock_status) {
        console.log(`🔍 Adding stock_status filter: ${filtersToUse.stock_status}`)
        queryParams.append('stock_status', filtersToUse.stock_status)
      }
      if (filtersToUse.published !== '') {
        console.log(`🔍 Adding published filter: ${filtersToUse.published}`)
        queryParams.append('published', filtersToUse.published)
      }

      // Add advanced filters
      if (advancedFiltersToUse.length > 0) {
        const advancedFiltersData = advancedFiltersToUse.filter(filter => 
          filter.column && filter.operator
        )
        if (advancedFiltersData.length > 0) {
          console.log("Sending advanced filters to server:", advancedFiltersData)
          queryParams.append('advanced_filters', JSON.stringify(advancedFiltersData))
        }
      }

      console.log(`🔍 Final query parameters: ${queryParams.toString()}`)
      const response = await fetch(`${API_BASE_URL}/products?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        console.log("Products fetched:", data.products.length, "products")
        console.log("Response data:", data)
        console.log("Search results for:", filtersToUse.search, "found:", data.products.length, "products")
        if (data.products.length === 0 && filtersToUse.search) {
          console.log("No products found for search:", filtersToUse.search)
        }
        setProducts(data.products || [])
        setPagination(data.pagination || {})
      } else {
        console.error("Error response:", response.status, response.statusText)
        showToast("Error loading products", "error")
      }
    } catch (error) {
      console.error("Error fetching products:", error)
      showToast("Error loading products", "error")
    } finally {
      setLoading(false)
    }
  }, [currentPage, pageSize, showToast])

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
        setCategories(data.categories || [])
        setFlatCategories(data.flatCategories || [])
      }
    } catch (error) {
      console.error("Error loading categories:", error)
    }
  }, [])

  // Fetch vendor-specific categories
  const fetchVendorCategories = useCallback(async (vendorId) => {
    try {
      console.log(`🔍 Fetching categories for vendor: ${vendorId}`)
      const token = localStorage.getItem("token")
      const response = await fetch(`${API_BASE_URL}/categories/vendor/${vendorId}?type=vendor`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        console.log(`📊 Vendor categories fetched:`, data.categories?.length || 0, 'categories')
        // Update categories with vendor-specific ones
        setCategories(prev => {
          // Keep store categories, replace vendor categories with vendor-specific ones
          const storeCategories = prev.filter(cat => cat.type === 'store')
          const vendorCategories = data.categories || []
          return [...storeCategories, ...vendorCategories]
        })
      } else {
        console.error("Error fetching vendor categories:", response.status)
      }
    } catch (error) {
      console.error("Error loading vendor categories:", error)
    }
  }, [])

  useEffect(() => {
    fetchProducts()
    fetchVendors()
    fetchCategories()
  }, [fetchVendors, fetchCategories, fetchProducts])

  // Separate effect for page changes only
  useEffect(() => {
    fetchProducts()
  }, [currentPage, pageSize])

  // Refresh products when import modal closes (fallback mechanism)
  useEffect(() => {
    if (!showCsvImportModal) {
      // Small delay to ensure any import operations are complete
      const timer = setTimeout(() => {
        console.log("Import modal closed, refreshing products as fallback...")
        fetchProducts()
      }, 500)
      
      return () => clearTimeout(timer)
    }
  }, [showCsvImportModal, fetchProducts])

  // Handle URL parameter changes - only on initial load
  useEffect(() => {
    const urlParams = new URLSearchParams(searchParams)
    const searchQuery = urlParams.get('search') || ""
    
    // Only set initial search from URL, don't override user input
    if (searchQuery && !filters.search) {
      setFilters(prev => ({ ...prev, search: searchQuery }))
      setSearchInput(searchQuery)
      setCurrentPage(1)
    }
  }, [searchParams]) // Remove filters.search dependency to prevent loops

  // Memoized filter change handler - doesn't trigger API call immediately
  const handleFilterChange = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    
    // If vendor is changed, clear vendor categories and fetch vendor-specific categories
    if (key === 'vendor_id') {
      console.log(`🔄 Vendor changed to: ${value}`)
      // Clear vendor categories when vendor changes
      setFilters(prev => ({ 
        ...prev, 
        vendor_id: value,
        vendor_category_ids: [] 
      }))
      setSelectedVendorCategories([])
      
      // Fetch vendor-specific categories if a vendor is selected
      if (value && value !== '') {
        fetchVendorCategories(value)
      } else {
        // Reset to all categories when no vendor is selected
        fetchCategories()
      }
    }
  }, [fetchVendorCategories, fetchCategories])

  // Handle search button click
  const handleSearch = useCallback(() => {
    console.log("Search triggered with:", searchInput)
    const newFilters = { ...filters, search: searchInput }
    setFilters(newFilters)
    setCurrentPage(1)
    // Force a fresh fetch with the new search
    setTimeout(() => {
      fetchProducts(newFilters, advancedFilters, 1, pageSize)
    }, 100)
  }, [searchInput, filters, advancedFilters, pageSize, fetchProducts])

  // Apply basic filters
  const applyBasicFilters = useCallback(() => {
    console.log("Applying basic filters:", filters)
    setCurrentPage(1)
    // Force a fresh fetch with the current filters and reset to page 1
    setTimeout(() => {
      fetchProducts(filters, advancedFilters, 1, pageSize)
    }, 100)
  }, [filters, advancedFilters, pageSize, fetchProducts])

  // Handle search input change (not triggering search)
  const handleSearchInputChange = useCallback((value) => {
    setSearchInput(value)
  }, [])

  // Advanced filter functions
  const addAdvancedFilter = useCallback(() => {
    setAdvancedFilters(prev => [...prev, {
      id: Date.now(),
      column: '',
      operator: '',
      value: '',
      value2: '' // For between operations
    }])
    setShowFilterDropdown(false)
  }, [])

  const updateAdvancedFilter = useCallback((id, field, value) => {
    setAdvancedFilters(prev => prev.map(filter => 
      filter.id === id ? { ...filter, [field]: value } : filter
    ))
  }, [])

  const removeAdvancedFilter = useCallback((id) => {
    setAdvancedFilters(prev => prev.filter(filter => filter.id !== id))
  }, [])

  const clearAllAdvancedFilters = useCallback(() => {
    setAdvancedFilters([])
    setCurrentPage(1)
    // Apply the cleared filters immediately
    setTimeout(() => {
      fetchProducts(filters, [], 1, pageSize)
    }, 100)
  }, [fetchProducts, filters, pageSize])

  const applyAdvancedFilters = useCallback(() => {
    console.log("Applying advanced filters:", advancedFilters)
    setCurrentPage(1)
    // Explicitly call fetchProducts when Apply Filters button is clicked
    setTimeout(() => {
      fetchProducts(filters, advancedFilters, 1, pageSize)
    }, 100)
  }, [advancedFilters, filters, pageSize, fetchProducts])

  // New simplified filter functions
  const handleAddFilter = useCallback((columnKey) => {
    const columnConfig = AVAILABLE_COLUMNS[columnKey]
    if (!columnConfig) return
    
    const newFilter = {
      id: Date.now(),
      column: columnKey,
      operator: '',
      value: '',
      value2: ''
    }
    
    setAdvancedFilters(prev => [...prev, newFilter])
    setShowFilterDropdown(false)
  }, [])

  const handleSelectProduct = useCallback((productId) => {
    setSelectedProducts((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId],
    )
  }, [])

  const handleSelectAll = useCallback(() => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([])
    } else {
      setSelectedProducts(products.map((p) => p.id))
    }
  }, [selectedProducts.length, products])

  const handleEditProduct = useCallback((product) => {
    setEditingProduct(product)
    setShowProductModal(true)
  }, [])

  const handleQuickEdit = useCallback((product) => {
    // Quick edit functionality - opens the same modal but with a different title
    handleEditProduct(product)
  }, [handleEditProduct])

  const handleViewProduct = useCallback((product) => {
    // Navigate to product detail page
    window.open(`/product/${product.id}`, '_blank')
  }, [])

  const handleViewVariations = useCallback((product) => {
    // Navigate to product variations page
    window.open(`/product/${product.id}/variations`, '_blank')
  }, [])

  const handleDuplicateProduct = useCallback((product) => {
    // Duplicate product functionality
    const duplicatedProduct = {
      ...product,
      id: null,
      name: `${product.name} (Copy)`,
      sku: `${product.sku}_COPY`,
      short_description: product.short_description ? `${product.short_description} (Copy)` : null
    }
    setEditingProduct(duplicatedProduct)
    setShowProductModal(true)
  }, [])

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

  const handleCategorySelection = useCallback((categoryIds) => {
    setFilters(prev => ({ ...prev, category_ids: categoryIds }))
  }, [])

  const handleDeleteProduct = useCallback(async (productId) => {
    if (!window.confirm("Are you sure you want to delete this product?")) {
      return
    }

    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        showToast("Product deleted successfully", "success")
        fetchProducts()
      } else {
        const error = await response.json()
        showToast(error.message || "Error deleting product", "error")
      }
    } catch (error) {
      showToast("Error deleting product", "error")
    }
  }, [fetchProducts, showToast])

  const handleBulkDelete = useCallback(async () => {
    if (selectedProducts.length === 0) {
      showToast("Please select products to delete", "warning")
      return
    }

    if (!window.confirm(`Are you sure you want to delete ${selectedProducts.length} products?`)) {
      return
    }

    try {
      const token = localStorage.getItem("token")
      const promises = selectedProducts.map((id) =>
        fetch(`${API_BASE_URL}/products/${id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      )

      await Promise.all(promises)
      showToast(`${selectedProducts.length} products deleted successfully`, "success")
      setSelectedProducts([])
      fetchProducts()
    } catch (error) {
      showToast("Error deleting products", "error")
    }
  }, [selectedProducts, fetchProducts, showToast])

  const handleImportClick = useCallback(() => {
    setShowCsvImportModal(true)
  }, [])

  const handleImportComplete = useCallback(async () => {
    console.log("Import completed, refreshing products...")
    try {
      // Force a fresh fetch of products
      await fetchProducts()
      console.log("Products refreshed successfully")
    } catch (error) {
      console.error("Error refreshing products after import:", error)
    }
  }, [fetchProducts])

  const handleExport = useCallback(async (mode = "woocommerce") => {
    try {
      const token = localStorage.getItem("token")
      
      console.log("Export requested with mode:", mode)
      console.log("Current filters:", filters)
      console.log("Current advanced filters:", advancedFilters)
      
      // Build query parameters with current filters
      const queryParams = new URLSearchParams()
      queryParams.append('mode', mode)
      
      // Add basic filters
      if (filters.search) {
        queryParams.append('search', filters.search)
      }
      if (filters.vendor_id) {
        queryParams.append('vendor_id', filters.vendor_id)
      }
      if (filters.category_ids.length > 0) {
        filters.category_ids.forEach(id => queryParams.append('category_ids', id))
      }
      if (filters.stock_status) {
        if (filters.stock_status === 'in_stock') {
          queryParams.append('stock_min', '1')
        } else if (filters.stock_status === 'out_of_stock') {
          queryParams.append('stock_max', '0')
        }
      }
      if (filters.published !== '') {
        queryParams.append('published', filters.published)
      }
      
      // Add advanced filters
      if (advancedFilters.length > 0) {
        const advancedFiltersData = advancedFilters.filter(filter =>
          filter.column && filter.operator
        )
        if (advancedFiltersData.length > 0) {
          queryParams.append('advanced_filters', JSON.stringify(advancedFiltersData))
        }
      }
      
      const exportUrl = `${API_BASE_URL}/products/export?${queryParams.toString()}`
      console.log("Export URL:", exportUrl)
      
      const response = await fetch(exportUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `products_${mode}_${new Date().toISOString().split('T')[0]}.csv`
        a.click()
        window.URL.revokeObjectURL(url)
        showToast(`Products exported successfully (${mode} mode)`, "success")
      }
    } catch (error) {
      showToast("Error exporting products", "error")
    }
  }, [showToast, filters, advancedFilters])

  // Column visibility handlers
  const handleColumnToggle = useCallback((columnKey) => {
    setVisibleColumns(prev => ({
      ...prev,
      [columnKey]: !prev[columnKey]
    }))
  }, [])

  const handleSelectAllColumns = useCallback(() => {
    const allVisible = Object.keys(AVAILABLE_COLUMNS).every(key => visibleColumns[key])
    const newVisibility = {}
    Object.keys(AVAILABLE_COLUMNS).forEach(key => {
      newVisibility[key] = !allVisible
    })
    setVisibleColumns(newVisibility)
  }, [visibleColumns])

  // Memoized visible columns
  const activeColumns = useMemo(() => {
    return Object.entries(AVAILABLE_COLUMNS).filter(([key]) => visibleColumns[key])
  }, [visibleColumns])

  // Sorting functions
  const handleSort = useCallback((key) => {
    setSortConfig(prevConfig => {
      if (prevConfig.key === key) {
        // If clicking the same column, toggle direction
        return {
          key,
          direction: prevConfig.direction === 'asc' ? 'desc' : 'asc'
        }
      } else {
        // If clicking a new column, set to ascending
        return {
          key,
          direction: 'asc'
        }
      }
    })
  }, [])

  const getSortIcon = useCallback((columnKey) => {
    if (sortConfig.key !== columnKey) {
      return '↕️' // Neutral sort icon
    }
    return sortConfig.direction === 'asc' ? '↑' : '↓'
  }, [sortConfig])

  const isSortable = useCallback((columnKey) => {
    // Define which columns are sortable
    const sortableColumns = [
      'id', 'sku', 'name', 'brand', 'mfn', 'stock', 'list_price', 
      'market_price', 'vendor_cost', 'special_price', 'weight',
      'length', 'width', 'height', 'vendor_name', 'vendor_category_name',
      'store_category_name', 'google_category', 'published', 'featured',
      'visibility', 'created_at', 'updated_at'
    ]
    return sortableColumns.includes(columnKey)
  }, [])

  // Sorted products based on sortConfig
  const sortedProducts = useMemo(() => {
    if (!sortConfig.key) return products

    return [...products].sort((a, b) => {
      let aValue = a[sortConfig.key]
      let bValue = b[sortConfig.key]

      // Handle null/undefined values
      if (aValue === null || aValue === undefined) aValue = ''
      if (bValue === null || bValue === undefined) bValue = ''

      // Handle different data types
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue
      }

      if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue
      }

      // Handle dates
      if (sortConfig.key === 'created_at' || sortConfig.key === 'updated_at') {
        const aDate = new Date(aValue)
        const bDate = new Date(bValue)
        return sortConfig.direction === 'asc' ? aDate - bDate : bDate - aDate
      }

      // Handle currency values (remove $ and convert to number)
      if (sortConfig.key.includes('price') || sortConfig.key.includes('cost')) {
        const aNum = parseFloat(aValue) || 0
        const bNum = parseFloat(bValue) || 0
        return sortConfig.direction === 'asc' ? aNum - bNum : bNum - aNum
      }

      // Default string comparison
      const aStr = String(aValue).toLowerCase()
      const bStr = String(bValue).toLowerCase()
      
      if (sortConfig.direction === 'asc') {
        return aStr.localeCompare(bStr)
      } else {
        return bStr.localeCompare(aStr)
      }
    })
  }, [products, sortConfig])

  // Function to render hierarchical category options
  const renderCategoryOptions = (categoryList, level = 0) => {
    return categoryList.map(category => {
      const indent = "  ".repeat(level)
      const hasSubcategories = category.subcategories && category.subcategories.length > 0
      
      return (
        <React.Fragment key={category.id}>
          <option value={category.id}>
            {indent}📁 {category.name} [{category.description}]
          </option>
          {hasSubcategories && renderCategoryOptions(category.subcategories, level + 1)}
        </React.Fragment>
      )
    })
  }

  // CategorySelector Component
  const CategorySelector = ({ isOpen, onClose, onApply, type }) => {
    const [localSelectedCategories, setLocalSelectedCategories] = useState(
      type === 'vendor' ? selectedVendorCategories : selectedStoreCategories
    )

    const handleCategoryToggle = (categoryId) => {
      setLocalSelectedCategories(prev => 
        prev.includes(categoryId) 
          ? prev.filter(id => id !== categoryId)
          : [...prev, categoryId]
      )
    }

    const handleSelectAll = () => {
      const filteredCategories = flatCategories.filter(cat => cat.type === type)
      const allCategoryIds = filteredCategories.map(cat => cat.id)
      setLocalSelectedCategories(allCategoryIds)
    }

    const handleClearAll = () => {
      setLocalSelectedCategories([])
    }

    const renderCategoryTree = (categoryList, level = 0) => {
      return categoryList.map(category => {
        const hasSubcategories = category.subcategories && category.subcategories.length > 0
        const isExpanded = expandedCategories.has(category.id)
        const isSelected = localSelectedCategories.includes(category.id)
        const indent = level * 20

        return (
          <div key={category.id} className="space-y-1">
            <div className="flex items-center space-x-2 py-2 px-3 rounded-lg hover:bg-gray-50" style={{ paddingLeft: `${indent + 12}px` }}>
              {hasSubcategories ? (
                <button
                  className="p-1 hover:bg-gray-200 rounded"
                  onClick={() => handleToggleExpand(category.id)}
                >
                  {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
              ) : (
                <div className="w-6 h-6 flex items-center justify-center">
                  <div className="w-px h-4 bg-gray-300"></div>
                </div>
              )}
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => handleCategoryToggle(category.id)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              {hasSubcategories ? <Folder className="w-4 h-4 text-blue-500" /> : <File className="w-4 h-4 text-gray-400" />}
              <div className="flex-1">
                <span className="text-sm font-medium text-gray-900">{category.name}</span>
                <span className="ml-2 text-xs text-gray-500">({category.product_count || 0})</span>
              </div>
            </div>
            
            {hasSubcategories && isExpanded && (
              <div className="ml-4">
                {renderCategoryTree(category.subcategories, level + 1)}
              </div>
            )}
          </div>
        )
      })
    }

    return (
      <div className={`fixed inset-0 bg-black bg-opacity-50 z-50 ${isOpen ? 'block' : 'hidden'}`} onClick={onClose}>
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Select {type === 'vendor' ? 'Vendor' : 'Store'} Categories 
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    ({localSelectedCategories.length} selected)
                  </span>
                </h3>
                <div className="flex items-center space-x-2">
                  <button 
                    className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                    onClick={handleSelectAll}
                  >
                    Select All
                  </button>
                  <button 
                    className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                    onClick={handleClearAll}
                  >
                    Clear All
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex-1 overflow-auto p-6">
              <div className="space-y-2">
                {renderCategoryTree(categories.filter(cat => cat.type === type))}
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button 
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={onClose}
              >
                Cancel
              </button>
              <button 
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={() => {
                  if (type === 'vendor') {
                    setSelectedVendorCategories(localSelectedCategories)
                    setFilters(prev => ({ ...prev, vendor_category_ids: localSelectedCategories }))
                  } else {
                    setSelectedStoreCategories(localSelectedCategories)
                    setFilters(prev => ({ ...prev, store_category_ids: localSelectedCategories }))
                  }
                  onApply(localSelectedCategories)
                  onClose()
                }}
              >
                Apply ({localSelectedCategories.length})
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Format cell value based on column type
  const formatCellValue = useCallback((value, columnType) => {
    if (value === null || value === undefined) return "-"
    
    switch (columnType) {
      case "currency":
        return `$${Number(value).toFixed(2)}`
      case "number":
        return Number(value).toLocaleString()
      case "boolean":
        return value ? "Yes" : "No"
      case "date":
        return new Date(value).toLocaleDateString()
      default:
        return value
    }
  }, [])

  // Render cell content
  const renderCell = useCallback((product, columnKey, columnConfig) => {
    const value = product[columnKey]
    
    switch (columnKey) {
      case "published":
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            value ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
          }`}>
            {value ? "Published" : "Draft"}
          </span>
        )
      case "featured":
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            value ? "bg-yellow-100 text-yellow-800" : "bg-gray-100 text-gray-800"
          }`}>
            {value ? "Featured" : "Not Featured"}
          </span>
        )
      case "stock":
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            value > 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}>
            {value}
          </span>
        )
            case "name":
        return (
          <div className="flex items-center space-x-3 relative h-full">
            <div className="flex-shrink-0">
              <img
                src={product.image_url || "/placeholder.jpg"}
                alt={product.name}
                className="h-10 w-10 rounded-lg object-cover border border-gray-200"
                onError={(e) => {
                  e.target.src = "/placeholder.jpg"
                }}
              />
            </div>
                               <div className="min-w-0 flex-1 flex flex-col justify-center">
                     {/* Clickable product name */}
                     <div
                       className="text-sm font-medium text-gray-900 truncate cursor-pointer hover:text-blue-600 hover:underline"
                       onClick={() => handleViewProduct(product)}
                       title={`Click to view ${product.name}`}
                     >
                       {value}
                     </div>
                     {/* Brand name with action buttons on the right */}
                     {product.brand && (
                       <div className="flex items-center justify-between">
                         <div className="text-xs text-gray-500">{product.brand}</div>
                         {/* Action buttons on right when hovering */}
                         {hoveredProduct === product.id && (
                           <div className="flex items-center space-x-1 ml-2">
                             <button
                               className="inline-flex items-center px-1.5 py-0.5 text-xs font-medium text-blue-700 bg-blue-100 border border-blue-200 rounded hover:bg-blue-200 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                               onClick={(e) => {
                                 e.stopPropagation()
                                 handleQuickEdit(product)
                               }}
                               title="Quick Edit"
                             >
                               <Edit className="w-3 h-3" />
                             </button>
                             <button
                               className="inline-flex items-center px-1.5 py-0.5 text-xs font-medium text-green-700 bg-green-100 border border-green-200 rounded hover:bg-green-200 focus:outline-none focus:ring-1 focus:ring-green-500 transition-colors"
                               onClick={(e) => {
                                 e.stopPropagation()
                                 handleViewProduct(product)
                               }}
                               title="View Details"
                             >
                               <Eye className="w-3 h-3" />
                             </button>
                             <button
                               className="inline-flex items-center px-1.5 py-0.5 text-xs font-medium text-red-700 bg-red-100 border border-red-200 rounded hover:bg-red-200 focus:outline-none focus:ring-1 focus:ring-red-500 transition-colors"
                               onClick={(e) => {
                                 e.stopPropagation()
                                 handleDeleteProduct(product.id)
                               }}
                               title="Delete Product"
                             >
                               <Trash2 className="w-3 h-3" />
                             </button>
                           </div>
                         )}
                       </div>
                     )}
            </div>
          </div>
        )
      case "short_description":
        return (
          <div className="text-sm text-gray-900 max-w-xs" title={value}>
            {value && value.length > 80 ? `${value.substring(0, 80)}...` : value}
          </div>
        )
      case "description":
        return (
          <div className="text-sm text-gray-900 max-w-xs" title={value}>
            {value && value.length > 100 ? `${value.substring(0, 100)}...` : value}
          </div>
        )
      case "dimensions":
        const length = product.length || 0
        const width = product.width || 0
        const height = product.height || 0
        const hasDimensions = length > 0 || width > 0 || height > 0
        
        if (!hasDimensions) {
          return <span className="text-gray-400">-</span>
        }
        
        return (
          <div className="text-sm text-gray-900" title={`L: ${length} × W: ${width} × H: ${height}`}>
            {length} × {width} × {height}
          </div>
        )
      case "categories_display":
        const vendorCategory = flatCategories.find(cat => cat.id === product.vendor_category_id)
        const storeCategory = flatCategories.find(cat => cat.id === product.store_category_id)
        
        if (!vendorCategory && !storeCategory) {
          return <span className="text-gray-400">-</span>
        }
        
        return (
          <div className="space-y-1">
            {vendorCategory && (
              <div className="flex items-center space-x-1">
                <div className="flex items-center">
                  {Array.from({ length: vendorCategory.level - 1 }, (_, i) => (
                    <div key={i} className="w-2 border-l border-gray-300 ml-1"></div>
                  ))}
                  <Folder className="w-4 h-4 text-blue-500 ml-1" />
                  <span className="text-xs text-gray-900 ml-1">{vendorCategory.name}</span>
                  <span className="text-xs text-gray-500">L{vendorCategory.level}</span>
                </div>
              </div>
            )}
            {storeCategory && (
              <div className="flex items-center space-x-1">
                <div className="flex items-center">
                  {Array.from({ length: storeCategory.level - 1 }, (_, i) => (
                    <div key={i} className="w-2 border-l border-gray-300 ml-1"></div>
                  ))}
                  <Folder className="w-4 h-4 text-green-500 ml-1" />
                  <span className="text-xs text-gray-900 ml-1">{storeCategory.name}</span>
                  <span className="text-xs text-gray-500">L{storeCategory.level}</span>
                </div>
              </div>
            )}
          </div>
        )
      default:
        return <div className="text-sm text-gray-900">{formatCellValue(value, columnConfig.type)}</div>
    }
      }, [formatCellValue, hoveredProduct, handleEditProduct, handleQuickEdit, handleDeleteProduct, handleViewProduct, handleViewVariations, handleDuplicateProduct, flatCategories])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-lg font-medium text-gray-900">Loading products...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-[1800px]  min-h-screen bg-gray-50">
      <div>
        {/* Header */}
        <div className="  bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">Products</h1>
              <div className="flex items-center space-x-3">
                <button
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  onClick={() => setShowColumnSelector(!showColumnSelector)}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Columns
                </button>
                <button
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  onClick={() => {
                    setEditingProduct(null)
                    setShowProductModal(true)
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Product
                </button>
                <button 
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  onClick={handleImportClick}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Import CSV
                </button>
                <button 
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  onClick={() => setShowExportModal(true)}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Column Selector Modal */}
        {showColumnSelector && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={() => setShowColumnSelector(false)}>
            <div className="flex items-center justify-center min-h-screen p-4">
              <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Customize Table Columns</h3>
                    <button 
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                      onClick={handleSelectAllColumns}
                    >
                      {Object.keys(AVAILABLE_COLUMNS).every(key => visibleColumns[key]) ? "Deselect All" : "Select All"}
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-auto p-6">
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {Object.entries(AVAILABLE_COLUMNS).map(([key, config]) => (
                      <label key={key} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={visibleColumns[key]}
                          onChange={() => handleColumnToggle(key)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900">{config.label}</div>
                          <div className="text-xs text-gray-500">{config.type}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="px-6 py-4">
            {/* Sort indicator */}
            {sortConfig.key && (
              <div className="flex items-center justify-between mb-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-blue-700">
                    Sorted by: <span className="font-medium">{AVAILABLE_COLUMNS[sortConfig.key]?.label || sortConfig.key}</span>
                    <span className="ml-1">({sortConfig.direction === 'asc' ? 'Ascending' : 'Descending'})</span>
                  </span>
                </div>
                <button 
                  className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-md transition-colors"
                  onClick={() => setSortConfig({ key: null, direction: 'asc' })}
                >
                  Clear Sort
                </button>
              </div>
            )}
            
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="flex items-center space-x-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchInput}
                    onChange={(e) => handleSearchInputChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSearch()
                      }
                    }}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <button 
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  onClick={handleSearch}
                >
                  Search
                </button>
              </div>

              {/* Quick Filters */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  onClick={() => {
                    setShowAdvancedFilters(true);
                    const newFilter = {
                      id: Date.now(),
                      column: '',
                      operator: '',
                      value: '',
                      value2: ''
                    };
                    setAdvancedFilters(prev => [...prev, newFilter]);
                  }}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Add Filter
                </button>

                <select
                  value={filters.vendor_id}
                  onChange={(e) => handleFilterChange("vendor_id", e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Vendors</option>
                  {(vendors || []).map((vendor) => (
                    <option key={vendor.id} value={vendor.id}>
                      {vendor.name}
                    </option>
                  ))}
                </select>

                <button
                  className={`px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                    filters.vendor_id 
                      ? 'text-gray-700 bg-white hover:bg-gray-50' 
                      : 'text-gray-400 bg-gray-100 cursor-not-allowed'
                  }`}
                  onClick={() => {
                    if (filters.vendor_id) {
                      setCategorySelectorType('vendor')
                      setShowVendorCategorySelector(true)
                    }
                  }}
                  disabled={!filters.vendor_id}
                >
                  {filters.vendor_category_ids.length > 0 
                    ? `${filters.vendor_category_ids.length} Vendor Categories`
                    : filters.vendor_id 
                      ? "Select Vendor Categories"
                      : "Select Vendor First"
                  }
                </button>

                <button
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  onClick={() => {
                    setCategorySelectorType('store')
                    setShowStoreCategorySelector(true)
                  }}
                >
                  {filters.store_category_ids.length > 0 
                    ? `${filters.store_category_ids.length} Store Categories`
                    : "Select Store Categories"
                  }
                </button>

                <select
                  value={filters.stock_status}
                  onChange={(e) => handleFilterChange("stock_status", e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Stock Status</option>
                  <option value="in_stock">In Stock</option>
                  <option value="out_of_stock">Out of Stock</option>
                </select>

                <select
                  value={filters.published}
                  onChange={(e) => handleFilterChange("published", e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Status</option>
                  <option value="true">Published</option>
                  <option value="false">Draft</option>
                </select>

                <button
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  onClick={() => {
                    setFilters({
                      search: "",
                      vendor_id: "",
                      category_ids: [],
                      vendor_category_ids: [],
                      store_category_ids: [],
                      stock_status: "",
                      published: "",
                    })
                    setSearchInput("")
                    setSelectedVendorCategories([])
                    setSelectedStoreCategories([])
                    setCurrentPage(1)
                    // Reset to all categories
                    fetchCategories()
                  }}
                >
                  Clear Filters
                </button>

                <button 
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  onClick={applyBasicFilters}
                >
                  Apply Filters
                </button>

                <button 
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  onClick={() => {
                    const clearedFilters = {
                      search: "",
                      vendor_id: "",
                      category_id: "",
                      category_ids: [],
                      vendor_category_ids: [],
                      store_category_ids: [],
                      stock_status: "",
                      published: "",
                    }
                    setFilters(clearedFilters)
                    setSearchInput("")
                    setAdvancedFilters([])
                    setCurrentPage(1)
                    setTimeout(() => {
                      fetchProducts(clearedFilters, [], 1, pageSize)
                    }, 100)
                  }}
                  title="Clear All Filters"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
            <div className="px-6 py-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <h3 className="text-lg font-semibold text-gray-900">Advanced Filters</h3>
                  {advancedFilters.length > 0 && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {advancedFilters.length} active
                    </span>
                  )}
                </div>
                
                <div className="flex items-center space-x-3">
                  <button
                    className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    onClick={() => {
                      const newFilter = {
                        id: Date.now(),
                        column: '',
                        operator: '',
                        value: '',
                        value2: ''
                      }
                      setAdvancedFilters(prev => [...prev, newFilter])
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Filter
                  </button>
                  <button
                    className="px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-700"
                    onClick={() => setShowAdvancedFilters(false)}
                  >
                    Close
                  </button>
                  {advancedFilters.length > 0 && (
                    <>
                      <button
                        className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        onClick={applyAdvancedFilters}
                      >
                        Apply Filters
                      </button>
                      <button
                        className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        onClick={clearAllAdvancedFilters}
                      >
                        Clear All
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Advanced Filters List */}
              {advancedFilters.length > 0 && (
                <div className="space-y-4">
                  {advancedFilters.map((filter) => {
                    const columnConfig = AVAILABLE_COLUMNS[filter.column] || {}
                    const operators = FILTER_OPERATORS[columnConfig.type] || FILTER_OPERATORS.text
                    const needsValue = !['is_set', 'is_not_set', 'is_empty', 'is_not_empty', 'is_zero', 'is_not_zero', 'is_positive', 'is_negative', 'is_true', 'is_false', 'is_today', 'is_yesterday', 'is_this_week', 'is_this_month', 'is_this_year'].includes(filter.operator)
                    const needsSecondValue = filter.operator === 'between' || filter.operator === 'not_between'
                    
                    return (
                      <div key={filter.id} className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-medium text-gray-900">
                            {columnConfig.label || 'Select Column'}
                          </h4>
                          <button
                            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-100 rounded"
                            onClick={() => removeAdvancedFilter(filter.id)}
                            title="Remove filter"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <select
                            value={filter.column}
                            onChange={(e) => updateAdvancedFilter(filter.id, 'column', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Select Column</option>
                            {Object.entries(AVAILABLE_COLUMNS).map(([key, config]) => (
                              <option key={key} value={key}>
                                {config.label}
                              </option>
                            ))}
                          </select>

                          <SearchableOperatorDropdown
                            value={filter.operator}
                            onChange={(value) => updateAdvancedFilter(filter.id, 'operator', value)}
                            operators={operators}
                            placeholder="Select Operator"
                          />

                          {needsValue && (
                            <div className={`${needsSecondValue ? 'md:col-span-2 flex space-x-2' : ''}`}>
                              <input
                                type={columnConfig.type === 'number' ? 'number' : 'text'}
                                placeholder="Value"
                                value={filter.value}
                                onChange={(e) => updateAdvancedFilter(filter.id, 'value', e.target.value)}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                              
                              {needsSecondValue && (
                                <input
                                  type={columnConfig.type === 'number' ? 'number' : 'text'}
                                  placeholder="Second Value"
                                  value={filter.value2}
                                  onChange={(e) => updateAdvancedFilter(filter.id, 'value2', e.target.value)}
                                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Selected Categories */}
        {filters.category_ids.length > 0 && (
          <div className="bg-blue-50 rounded-xl border border-blue-200 mb-6 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-blue-900">Selected Categories:</span>
                <div className="flex flex-wrap gap-2">
                  {filters.category_ids.map(categoryId => {
                    const category = flatCategories.find(cat => cat.id === categoryId)
                    return category ? (
                      <span key={categoryId} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                        {category.name} [{category.description}] L{category.level}
                      </span>
                    ) : null
                  })}
                </div>
              </div>
              <button 
                className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-md transition-colors"
                onClick={() => handleCategorySelection([])}
              >
                Clear All
              </button>
            </div>
          </div>
        )}

        {/* Bulk Actions */}
        {selectedProducts.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
            <div className="px-6 py-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">
                  {selectedProducts.length} products selected
                </span>
                <div className="flex items-center space-x-3">
                  <button 
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    onClick={() => setShowBulkEditModal(true)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Bulk Edit
                  </button>
                  {user?.role === "admin" && (
                    <button 
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      onClick={handleBulkDelete}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Selected
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Products Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {loading ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
              <div className="text-lg font-medium text-gray-900">Loading products...</div>
            </div>
          ) : products.length === 0 && filters.search ? (
            <div className="p-8 text-center">
              <div className="text-gray-400 mb-4">
                <Search className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No products found for "{filters.search}"</h3>
              <p className="text-gray-500 mb-4">Try searching with different keywords or check your spelling.</p>
              <button 
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500" 
                onClick={() => {
                  setFilters(prev => ({ ...prev, search: "" }))
                  setSearchInput("")
                  setCurrentPage(1)
                }}
              >
                Clear Search
              </button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 table-fixed">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="w-12 px-6 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedProducts.length === products.length && products.length > 0}
                          onChange={handleSelectAll}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </th>
                      {activeColumns.map(([key, config]) => {
                        // Special handling for dimensions columns
                        if (key === 'length' || key === 'width' || key === 'height') {
                          return null;
                        }
                        if (key === 'dimensions') {
                          return (
                            <th key={key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" colSpan={3}>
                              {config.label}
                            </th>
                          );
                        }
                        if (key === 'categories_display') {
                          return (
                            <th key={key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              {config.label}
                            </th>
                          );
                        }
                        return (
                          <th 
                            key={key} 
                            className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                              isSortable(key) ? 'cursor-pointer hover:bg-gray-100' : ''
                            } ${sortConfig.key === key ? 'bg-blue-50' : ''}`}
                            onClick={isSortable(key) ? () => handleSort(key) : undefined}
                          >
                            <div className="flex items-center space-x-1">
                              <span>{config.label}</span>
                              {isSortable(key) && (
                                <span className="text-gray-400">{getSortIcon(key)}</span>
                              )}
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                    <tr className="bg-gray-50">
                      <th className="px-6 py-2"></th>
                      {activeColumns.map(([key, config]) => {
                        // Show sub-headers for dimensions
                        if (key === 'length' || key === 'width' || key === 'height') {
                          return (
                            <React.Fragment key={`dimensions-sub-${key}`}>
                              <th className="px-3 py-2 text-xs font-medium text-gray-500 uppercase">L</th>
                              <th className="px-3 py-2 text-xs font-medium text-gray-500 uppercase">W</th>
                              <th className="px-3 py-2 text-xs font-medium text-gray-500 uppercase">H</th>
                            </React.Fragment>
                          );
                        }
                        if (key === 'categories_display') {
                          return (
                            <React.Fragment key={`categories-sub-${key}`}>
                              <th className="px-3 py-2 text-xs font-medium text-gray-500 uppercase">Vendor Cat</th>
                              <th className="px-3 py-2 text-xs font-medium text-gray-500 uppercase">Store Cat</th>
                            </React.Fragment>
                          );
                        }
                        return <th key={key} className="px-6 py-2"></th>;
                      })}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sortedProducts.map((product) => (
                      <tr 
                        key={product.id} 
                        className={`hover:bg-gray-50 ${hoveredProduct === product.id ? 'bg-blue-50' : ''}`}
                        onMouseEnter={() => setHoveredProduct(product.id)}
                        onMouseLeave={() => setHoveredProduct(null)}
                      >
                        <td className="w-12 px-6 py-4 h-16">
                          <input
                            type="checkbox"
                            checked={selectedProducts.includes(product.id)}
                            onChange={() => handleSelectProduct(product.id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                        {activeColumns.map(([key, config]) => {
                          // Special handling for dimensions columns
                          if (key === 'length' || key === 'width' || key === 'height') {
                            return null;
                          }
                          if (key === 'dimensions') {
                            return (
                              <React.Fragment key={`dimensions-cells-${key}`}>
                                                              <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 h-16">
                                {formatCellValue(product.length, 'number')}
                              </td>
                              <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 h-16">
                                {formatCellValue(product.width, 'number')}
                              </td>
                              <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 h-16">
                                {formatCellValue(product.height, 'number')}
                              </td>
                              </React.Fragment>
                            );
                          }
                          if (key === 'categories_display') {
                            return (
                              <React.Fragment key={`categories-cells-${key}`}>
                                                              <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 h-16">
                                {formatCellValue(product.vendor_category_name, 'text')}
                              </td>
                              <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 h-16">
                                {formatCellValue(product.store_category_name, 'text')}
                              </td>
                              </React.Fragment>
                            );
                          }
                                                  return (
                          <td key={key} className="px-6 py-4 whitespace-nowrap h-16">
                            {renderCell(product, key, config)}
                          </td>
                        );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="px-6 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> to{" "}
                    <span className="font-medium">{Math.min(currentPage * pageSize, pagination.total)}</span> of{" "}
                    <span className="font-medium">{pagination.total}</span> products
                  </div>
                  <div className="flex items-center space-x-4">
                    <select 
                      value={pageSize} 
                      onChange={(e) => setPageSize(Number(e.target.value))} 
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value={20}>20 per page</option>
                      <option value={50}>50 per page</option>
                      <option value={100}>100 per page</option>
                      <option value={200}>200 per page</option>
                      <option value={500}>500 per page</option>
                    </select>

                    <div className="flex items-center space-x-2">
                      <button 
                        disabled={currentPage === 1} 
                        onClick={() => setCurrentPage(currentPage - 1)}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <span className="px-3 py-2 text-sm text-gray-700">
                        Page <span className="font-medium">{currentPage}</span> of{" "}
                        <span className="font-medium">{pagination.pages}</span>
                      </span>
                      <button 
                        disabled={currentPage === pagination.pages} 
                        onClick={() => setCurrentPage(currentPage + 1)}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modals */}
        {showProductModal && (
          <ProductModal
            product={editingProduct}
            vendors={vendors}
            categories={categories}
            onClose={() => {
              setShowProductModal(false)
              setEditingProduct(null)
            }}
            onSave={() => {
              fetchProducts()
              setShowProductModal(false)
              setEditingProduct(null)
            }}
          />
        )}

        {showBulkEditModal && (
          <BulkEditModal
            selectedProducts={selectedProducts}
            vendors={vendors}
            categories={categories}
            onClose={() => setShowBulkEditModal(false)}
            onSave={() => {
              fetchProducts()
              setShowBulkEditModal(false)
              setSelectedProducts([])
            }}
          />
        )}

        {showCsvImportModal && (
          <CsvImportModal
            isOpen={showCsvImportModal}
            onClose={() => setShowCsvImportModal(false)}
            onImportComplete={handleImportComplete}
          />
        )}

        {showExportModal && (
          <ExportModal
            isOpen={showExportModal}
            onClose={() => setShowExportModal(false)}
            onExport={handleExport}
          />
        )}

        {showVendorCategorySelector && (
          <CategorySelector
            isOpen={showVendorCategorySelector}
            onClose={() => setShowVendorCategorySelector(false)}
            onApply={handleCategorySelection}
            type="vendor"
          />
        )}

        {showStoreCategorySelector && (
          <CategorySelector
            isOpen={showStoreCategorySelector}
            onClose={() => setShowStoreCategorySelector(false)}
            onApply={handleCategorySelection}
            type="store"
          />
        )}
      </div>
    </div>
  )
}

export default Products