"use client"

import { useState, useRef, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { useToast } from "../context/ToastContext"
import "./Header.css"

const Header = ({ onToggleSidebar }) => {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [showResults, setShowResults] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const { user, logout, API_BASE_URL } = useAuth()
  const { showToast } = useToast()
  const searchRef = useRef(null)
  const userMenuRef = useRef(null)
  const navigate = useNavigate()

  // Global search functionality
  const handleSearch = async (query) => {
    if (query.length < 2) {
      setSearchResults([])
      setShowResults(false)
      // Remove blur effect when search is cleared
      document.body.classList.remove('search-active')
      return
    }

    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`${API_BASE_URL}/products?search=${encodeURIComponent(query)}&limit=10`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setSearchResults(data.products)
        setShowResults(true)
        // Add blur effect when search results are shown, but exclude search container
        document.body.classList.add('search-active')
      }
    } catch (error) {
      console.error("Search error:", error)
    }
  }

  const handleSearchChange = (e) => {
    const query = e.target.value
    setSearchQuery(query)
    handleSearch(query)
  }

  const handleSeeAllResults = () => {
    if (searchQuery.trim()) {
      // Navigate to products page with search query
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`)
      // Clear search and close results
      setSearchQuery("")
      setSearchResults([])
      setShowResults(false)
      document.body.classList.remove('search-active')
    }
  }

  const handleProductClick = (product) => {
    // Navigate to product details page
    navigate(`/product/${product.id}`)
    // Clear search and close results
    setSearchQuery("")
    setSearchResults([])
    setShowResults(false)
    document.body.classList.remove('search-active')
  }

  const handleLogout = () => {
    logout()
    showToast("Logged out successfully", "success")
  }

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false)
        // Remove blur effect when clicking outside
        document.body.classList.remove('search-active')
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <header className="header">
      <div className="header-left">
        <button className="sidebar-toggle" onClick={onToggleSidebar}>
          ☰
        </button>

        <div className="search-container" ref={searchRef}>
          <div className="search-input-wrapper">
            <input
              type="text"
              className="search-input"
              placeholder="Search all product fields, SKUs, vendors, categories..."
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => searchResults.length > 0 && setShowResults(true)}
            />
            <span className="search-icon">🔍</span>
          </div>

          {showResults && searchResults.length > 0 && (
            <div className="search-results">
              {searchResults.map((product) => (
                <div key={product.id} className="search-result-item" onClick={() => handleProductClick(product)}>
                  <div className="result-image">
                    <img
                      src={product.images?.[0] || "/placeholder.svg?height=40&width=40&query=product"}
                      alt={product.name}
                    />
                  </div>
                  <div className="result-info">
                    <div className="result-name hover:text-blue-600 hover:underline transition-all duration-200">{product.name}</div>
                    <div className="result-details">
                      SKU: {product.sku} | ${product.list_price}
                    </div>
                  </div>
                </div>
              ))}
              {searchResults.length === 10 && (
                <div className="search-see-all">
                  <button onClick={handleSeeAllResults}>See all results</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="header-right">
        <div className="user-menu" ref={userMenuRef}>
          <button className="user-menu-trigger" onClick={() => setUserMenuOpen(!userMenuOpen)}>
            <div className="user-avatar">{user?.username?.charAt(0).toUpperCase()}</div>
            <span className="user-name">{user?.username}</span>
            <span className="dropdown-arrow">▼</span>
          </button>

          {userMenuOpen && (
            <div className="user-menu-dropdown">
              <div className="user-info">
                <div className="user-name">{user?.username}</div>
                <div className="user-role">{user?.role}</div>
              </div>
              <hr />
              <button className="menu-item">Profile</button>
              <button className="menu-item">Preferences</button>
              <hr />
              <button className="menu-item logout" onClick={handleLogout}>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
