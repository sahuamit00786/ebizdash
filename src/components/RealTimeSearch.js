import React, { useState, useEffect, useRef } from 'react'
import { Search, X } from 'lucide-react'
import API_BASE_URL from '../config/api'

const RealTimeSearch = ({ onProductSelect, placeholder = "Search products..." }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [results, setResults] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const searchRef = useRef(null)
  const dropdownRef = useRef(null)
  const timeoutRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target) &&
          dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
        setSelectedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    if (searchTerm.trim().length < 2) {
      setResults([])
      setShowDropdown(false)
      return
    }

    setIsLoading(true)
    timeoutRef.current = setTimeout(async () => {
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`${API_BASE_URL}/products/search/realtime?q=${encodeURIComponent(searchTerm)}&limit=8`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          setResults(data)
          setShowDropdown(data.length > 0)
          setSelectedIndex(-1)
        } else {
          setResults([])
          setShowDropdown(false)
        }
      } catch (error) {
        console.error('Search error:', error)
        setResults([])
        setShowDropdown(false)
      } finally {
        setIsLoading(false)
      }
    }, 300)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [searchTerm])

  const handleKeyDown = (e) => {
    if (!showDropdown) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < results.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && results[selectedIndex]) {
          handleProductSelect(results[selectedIndex])
        }
        break
      case 'Escape':
        setShowDropdown(false)
        setSelectedIndex(-1)
        break
    }
  }

  const handleProductSelect = (product) => {
    onProductSelect(product)
    setSearchTerm('')
    setShowDropdown(false)
    setSelectedIndex(-1)
    setResults([])
  }

  const formatPrice = (price) => {
    if (!price) return 'N/A'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price)
  }

  const getDisplayPrice = (product) => {
    if (product.special_price && product.special_price > 0) {
      return formatPrice(product.special_price)
    }
    if (product.market_price && product.market_price > 0) {
      return formatPrice(product.market_price)
    }
    if (product.list_price && product.list_price > 0) {
      return formatPrice(product.list_price)
    }
    return 'N/A'
  }

  return (
    <div className="relative" ref={searchRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (results.length > 0) setShowDropdown(true)
          }}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        {searchTerm && (
          <button
            onClick={() => {
              setSearchTerm('')
              setResults([])
              setShowDropdown(false)
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {showDropdown && (
        <div 
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto"
        >
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2">Searching...</p>
            </div>
          ) : results.length > 0 ? (
            <div className="py-2">
              {results.map((product, index) => (
                <div
                  key={product.id}
                  onClick={() => handleProductSelect(product)}
                  className={`px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-center space-x-3 ${
                    index === selectedIndex ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                  }`}
                >
                  <div className="flex-shrink-0">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-12 h-12 object-cover rounded-lg border border-gray-200"
                        onError={(e) => {
                          e.target.src = '/placeholder.jpg'
                        }}
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                        <span className="text-gray-400 text-xs">No img</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {product.name}
                      </h4>
                      <span className="text-sm font-semibold text-green-600 ml-2">
                        {getDisplayPrice(product)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-gray-500 truncate">
                        SKU: {product.sku}
                      </p>
                      <p className="text-xs text-gray-500">
                        Stock: {product.stock || 0}
                      </p>
                    </div>
                    
                    {product.vendor_name && (
                      <p className="text-xs text-blue-600 mt-1 truncate">
                        Vendor: {product.vendor_name}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : searchTerm.trim().length >= 2 ? (
            <div className="p-4 text-center text-gray-500">
              No products found
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}

export default RealTimeSearch
