"use client"
import { useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import "./Sidebar.css"

const Sidebar = ({ collapsed, onToggle }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: "📊", path: "/dashboard" },
    { id: "products", label: "Products", icon: "📦", path: "/products" },
    { id: "categories", label: "Categories", icon: "📂", path: "/categories" },
    { id: "vendors", label: "Vendors", icon: "🏢", path: "/vendors" },
    { id: "users", label: "Users", icon: "👥", path: "/users", adminOnly: true },
    { id: "settings", label: "Settings", icon: "⚙️", path: "/settings" },
  ]

  const handleMenuClick = (path) => {
    navigate(path)
  }

  return (
    <div className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="sidebar-header">
        <div >
          <img width="120px" src="https://ebizdash.com/wp-content/uploads/2024/12/Screenshot_2024-12-06_143352-removebg-preview-180x63.png" alt="Logo" />
        </div>
      </div>

      <nav className="sidebar-nav">
        <ul className="nav-list">
          {menuItems.map((item) => {
            // Hide admin-only items for non-admin users
            if (item.adminOnly && user?.role !== "admin") {
              return null
            }

            const isActive = location.pathname === item.path

            return (
              <li key={item.id} className={`nav-item ${isActive ? "active" : ""}`}>
                <button
                  className="nav-link"
                  onClick={() => handleMenuClick(item.path)}
                  title={collapsed ? item.label : ""}
                >
                  <span className="nav-icon">{item.icon}</span>
                  {!collapsed && <span className="nav-label">{item.label}</span>}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}

export default Sidebar
