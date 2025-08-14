import React, { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { useToast } from "../context/ToastContext"
import { useAuth } from "../context/AuthContext"
import API_BASE_URL from "../config/api"
import "./Dashboard.css"

// Memoized stat card component for better performance
const StatCard = React.memo(({ icon, title, value, color, gradient }) => (
  <div className="stat-card" style={{ '--card-gradient': gradient }}>
    <div className="stat-icon" style={{ background: color }}>
      {icon}
    </div>
    <div className="stat-content">
      <span>{title}</span>
      <div className="stat-number">{value}</div>
    </div>
  </div>
))

// Memoized vendor item component
const VendorItem = React.memo(({ vendor, rank }) => (
  <div className="vendor-item">
    <div className="vendor-rank">#{rank}</div>
    <div className="vendor-info">
      <div className="vendor-name">{vendor.name}</div>
      <div className="vendor-count">{vendor.product_count} products</div>
    </div>
    <div className="vendor-progress">
      <div className="progress-bar">
        <div 
          className="progress-fill" 
          style={{ width: `${Math.min((vendor.product_count / 100) * 100, 100)}%` }}
        />
      </div>
    </div>
  </div>
))

// Memoized product item component
const ProductItem = React.memo(({ product }) => (
  <div className="product-item">
    <div className="product-image">
      <img
        src={product.image_url || "/placeholder.jpg"}
        alt={product.name}
        loading="lazy"
        onError={(e) => {
          e.target.src = "/placeholder.jpg"
        }}
      />
    </div>
    <div className="product-info">
      <div 
        className="product-name cursor-pointer hover:text-blue-600 hover:underline transition-all duration-200"
        onClick={() => {
          // Navigate to product detail page
          window.location.href = `/products/${product.id}`;
        }}
        title="Click to view product details"
      >
        {product.name}
      </div>
      <div className="product-meta">
        <span className="product-sku">{product.sku}</span>
        <span className="product-vendor">{product.vendor_name || "Unknown"}</span>
      </div>
      <div className="product-price">${parseFloat(product.list_price).toFixed(2)}</div>
    </div>
    <div className="product-status">
      <span className={`status-badge ${product.stock > 0 ? "in-stock" : "out-of-stock"}`}>
        {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
      </span>
    </div>
  </div>
))

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    stats: null,
    topVendors: [],
    recentProducts: []
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { showToast } = useToast()
  const { user, loading: authLoading } = useAuth()
  const isInitialized = useRef(false)

  // Memoized fetch function
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const token = localStorage.getItem("token")
      const response = await fetch(`${API_BASE_URL}/dashboard/stats`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      setDashboardData({
        stats: data.stats,
        topVendors: data.topVendors || [],
        recentProducts: data.recentProducts || []
      })
    } catch (error) {
      console.error("Dashboard error:", error)
      setError(error.message)
      showToast("Failed to load dashboard data", "error")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isInitialized.current) {
      isInitialized.current = true
      fetchDashboardData()
    }
  }, [fetchDashboardData])

  // Memoized stat cards data
  const statCards = useMemo(() => [
    {
      icon: "📦",
      title: "Total Products",
      value: dashboardData.stats?.totalProducts || 0,
      color: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
    },
    {
      icon: "🏢",
      title: "Active Vendors",
      value: dashboardData.stats?.totalVendors || 0,
      color: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
      gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
    },
    {
      icon: "⚠️",
      title: "Out of Stock",
      value: dashboardData.stats?.outOfStock || 0,
      color: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
      gradient: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)"
    },
    {
      icon: "⭐",
      title: "Featured",
      value: dashboardData.stats?.featuredProducts || 0,
      color: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
      gradient: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)"
    }
  ], [dashboardData.stats])

  if (authLoading || loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>{authLoading ? "Loading..." : "Loading dashboard..."}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <div className="error-content">
          <div className="error-icon">⚠️</div>
          <h3>Failed to load dashboard</h3>
          <p>{error}</p>
          <button onClick={fetchDashboardData} className="retry-btn">
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <div className="welcome-section">
            <h1>Welcome back, {user?.username || 'User'}!</h1>
            <p>Here's what's happening with your products today</p>
          </div>
          <div className="header-actions">
            <button onClick={fetchDashboardData} className="refresh-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 4v6h-6M1 20v-6h6M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
              </svg>
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="stats-grid">
        {statCards.map((card, index) => (
          <StatCard key={index} {...card} />
        ))}
      </div>

      <div className="dashboard-content">
        <div className="dashboard-section vendors-section">
          <div className="section-header">
            <h2>Top Vendors</h2>
            <span className="section-count">{dashboardData.topVendors.length} vendors</span>
          </div>
          <div className="vendors-list">
            {dashboardData.topVendors.slice(0, 5).map((vendor, index) => (
              <VendorItem key={vendor.name} vendor={vendor} rank={index + 1} />
            ))}
          </div>
        </div>

        <div className="dashboard-section products-section">
          <div className="section-header">
            <h2>Recent Products</h2>
            <span className="section-count">{dashboardData.recentProducts.length} products</span>
          </div>
          <div className="recent-products">
            {dashboardData.recentProducts.slice(0, 5).map((product) => (
              <ProductItem key={product.id} product={product} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
