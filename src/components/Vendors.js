"use client"

import { useState, useEffect } from "react"
import { useToast } from "../context/ToastContext"
import { useAuth } from "../context/AuthContext"
import VendorModal from "./VendorModal"
import API_BASE_URL from "../config/api"
import "./Vendors.css"

const Vendors = () => {
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingVendor, setEditingVendor] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [viewMode, setViewMode] = useState("grid") // grid, list, table
  const [sortBy, setSortBy] = useState("name")
  const [sortOrder, setSortOrder] = useState("asc")
  const [inlineEditing, setInlineEditing] = useState(null)
  const { showToast } = useToast()
  const { user } = useAuth()

  useEffect(() => {
    fetchVendors()
  }, [])

  const fetchVendors = async () => {
    try {
      setLoading(true)
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
        showToast("Error loading vendors", "error")
        setVendors([])
      }
    } catch (error) {
      console.error("Error fetching vendors:", error)
      showToast("Error loading vendors", "error")
      setVendors([])
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (vendor) => {
    setEditingVendor(vendor)
    setShowModal(true)
  }

  const handleInlineEdit = (vendor) => {
    setInlineEditing({
      id: vendor.id,
      name: vendor.name,
      email: vendor.email || "",
      phone: vendor.phone || "",
      address: vendor.address || "",
      city: vendor.city || "",
      website: vendor.website || "",
      contact_person: vendor.contact_person || "",
      tax_id: vendor.tax_id || "",
      payment_terms: vendor.payment_terms || "",
      description: vendor.description || "",
      notes: vendor.notes || ""
    })
  }

  const handleInlineSave = async (vendorId, newData) => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`${API_BASE_URL}/vendors/${vendorId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newData),
      })

      if (response.ok) {
        showToast("Vendor updated successfully", "success")
        setInlineEditing(null)
        fetchVendors()
      } else {
        const error = await response.json()
        showToast(error.message || "Error updating vendor", "error")
      }
    } catch (error) {
      console.error("Error updating vendor:", error)
      showToast("Error updating vendor", "error")
    }
  }

  const handleInlineCancel = () => {
    setInlineEditing(null)
  }

  const handleDelete = async (vendorId) => {
    if (!window.confirm("Are you sure you want to delete this vendor? This will also delete all associated categories and products.")) {
      return
    }

    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`${API_BASE_URL}/vendors/${vendorId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        showToast("Vendor deleted successfully", "success")
        fetchVendors()
      } else {
        const error = await response.json()
        showToast(error.message || "Error deleting vendor", "error")
      }
    } catch (error) {
      showToast("Error deleting vendor", "error")
    }
  }

  const handleStatusChange = async (vendorId, newStatus) => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`${API_BASE_URL}/vendors/${vendorId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        showToast(`Vendor status updated to ${newStatus}`, "success")
        fetchVendors()
      } else {
        const error = await response.json()
        showToast(error.message || "Error updating vendor status", "error")
      }
    } catch (error) {
      showToast("Error updating vendor status", "error")
    }
  }

  const filteredAndSortedVendors = vendors
    .filter((vendor) => {
      const matchesSearch = vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (vendor.email && vendor.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (vendor.contact_person && vendor.contact_person.toLowerCase().includes(searchQuery.toLowerCase()))
      
      const matchesStatus = statusFilter === "all" || vendor.status === statusFilter
      
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      let aValue = a[sortBy]
      let bValue = b[sortBy]
      
      if (sortBy === "product_count" || sortBy === "in_stock_count" || sortBy === "out_of_stock_count") {
        aValue = aValue || 0
        bValue = bValue || 0
      } else {
        aValue = aValue || ""
        bValue = bValue || ""
      }
      
      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

  const getStatusColor = (status) => {
    switch (status) {
      case "active": return "success"
      case "inactive": return "danger"
      case "pending": return "warning"
      default: return "secondary"
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case "active": return "✓"
      case "inactive": return "✗"
      case "pending": return "⏳"
      default: return "?"
    }
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div 
          className="loading-spinner"
          style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f0f0f0',
            borderTop: '4px solid #667eea',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '16px',
            display: 'block',
            boxSizing: 'border-box'
          }}
        ></div>
        <p>Loading vendors...</p>
      </div>
    )
  }

  return (
    <div className="vendors-container">
      {/* Header Section */}
      <div className="vendors-header">
        <div className="header-left">
          <h1>Vendor Management</h1>
        </div>
        <div className="header-right">
          <button
            className="btn btn-primary btn-large"
            onClick={() => {
              setEditingVendor(null)
              setShowModal(true)
            }}
          >
            <span className="btn-icon">+</span>
            Add New Vendor
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon total">📊</div>
          <div className="stat-content">
            <h3>{vendors.length}</h3>
            <p>Total Vendors</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon active">✓</div>
          <div className="stat-content">
            <h3>{vendors.filter(v => v.status === 'active').length}</h3>
            <p>Active Vendors</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon products">📦</div>
          <div className="stat-content">
            <h3>{vendors.reduce((sum, v) => sum + (v.product_count || 0), 0)}</h3>
            <p>Total Products</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon categories">📁</div>
          <div className="stat-content">
            <h3>{vendors.reduce((sum, v) => sum + (v.category_count || 0), 0)}</h3>
            <p>Total Categories</p>
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="vendors-controls">
        <div className="controls-left">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search vendors by name, email, or contact person..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <span className="search-icon">🔍</span>
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="pending">Pending</option>
          </select>
        </div>

        <div className="controls-right">
          <div className="view-controls">
            <button
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid View"
            >
              ⊞
            </button>
            <button
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="List View"
            >
              ☰
            </button>
            <button
              className={`view-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
              title="Table View"
            >
              ⊟
            </button>
          </div>

          <div className="sort-controls">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="sort-select"
            >
              <option value="name">Name</option>
              <option value="product_count">Products</option>
              <option value="status">Status</option>
              <option value="created_at">Date Added</option>
            </select>
            <button
              className="sort-btn"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>
      </div>

      {/* Vendors Display */}
      <div className={`vendors-display ${viewMode}`}>
        {filteredAndSortedVendors.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏢</div>
            <h3>No vendors found</h3>
            <p>{searchQuery || statusFilter !== 'all' ? 'Try adjusting your search or filters' : 'Get started by adding your first vendor'}</p>
            {!searchQuery && statusFilter === 'all' && (
              <button
                className="btn btn-primary"
                onClick={() => {
                  setEditingVendor(null)
                  setShowModal(true)
                }}
              >
                Add Your First Vendor
              </button>
            )}
          </div>
        ) : (
          <>
            {viewMode === 'grid' && (
              <div className="vendors-grid">
                {(filteredAndSortedVendors || []).map((vendor) => (
                  <VendorCard
                    key={vendor.id}
                    vendor={vendor}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onStatusChange={handleStatusChange}
                    getStatusColor={getStatusColor}
                    getStatusIcon={getStatusIcon}
                    inlineEditing={inlineEditing}
                    onInlineEdit={handleInlineEdit}
                    onInlineSave={handleInlineSave}
                    onInlineCancel={handleInlineCancel}
                  />
                ))}
              </div>
            )}

            {viewMode === 'list' && (
              <div className="vendors-list">
                {(filteredAndSortedVendors || []).map((vendor) => (
                  <VendorListItem
                    key={vendor.id}
                    vendor={vendor}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onStatusChange={handleStatusChange}
                    getStatusColor={getStatusColor}
                    getStatusIcon={getStatusIcon}
                  />
                ))}
              </div>
            )}

            {viewMode === 'table' && (
              <VendorsTable
                vendors={filteredAndSortedVendors}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onStatusChange={handleStatusChange}
                getStatusColor={getStatusColor}
                getStatusIcon={getStatusIcon}
              />
            )}
          </>
        )}
      </div>

      {showModal && (
        <VendorModal
          vendor={editingVendor}
          onClose={() => {
            setShowModal(false)
            setEditingVendor(null)
          }}
          onSave={() => {
            fetchVendors()
            setShowModal(false)
            setEditingVendor(null)
          }}
        />
      )}
    </div>
  )
}

// Vendor Card Component
const VendorCard = ({ vendor, onEdit, onDelete, onStatusChange, getStatusColor, getStatusIcon, inlineEditing, onInlineEdit, onInlineSave, onInlineCancel }) => {
  const isEditing = inlineEditing?.id === vendor.id
  
  return (
    <div className="vendor-card">
      <div className="vendor-header">
        <div className="vendor-info">
          {isEditing ? (
            <input
              type="text"
              value={inlineEditing.name}
              onChange={(e) => onInlineEdit({
                ...inlineEditing,
                name: e.target.value
              })}
              className="inline-edit-input"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  onInlineSave(vendor.id, inlineEditing)
                } else if (e.key === 'Escape') {
                  onInlineCancel()
                }
              }}
              onBlur={() => {
                if (inlineEditing.name.trim() !== vendor.name) {
                  onInlineSave(vendor.id, inlineEditing)
                } else {
                  onInlineCancel()
                }
              }}
            />
          ) : (
            <h3 
              className="vendor-name"
              onDoubleClick={() => onInlineEdit(vendor)}
              title="Double-click to edit"
            >
              {vendor.name}
            </h3>
          )}
          <span className={`status-badge ${getStatusColor(vendor.status)}`}>
            <span className="status-icon">{getStatusIcon(vendor.status)}</span>
            {vendor.status}
          </span>
        </div>
        <div className="vendor-actions">
          <button className="btn btn-sm btn-secondary" onClick={() => onEdit(vendor)}>
            Edit
          </button>
          <button className="btn btn-sm btn-danger" onClick={() => onDelete(vendor.id)}>
            Delete
          </button>
        </div>
      </div>

      <div className="vendor-details">
        {vendor.email && (
          <div className="detail-item">
            <span className="detail-label">Email:</span>
            <span className="detail-value">{vendor.email}</span>
          </div>
        )}
        {vendor.phone && (
          <div className="detail-item">
            <span className="detail-label">Phone:</span>
            <span className="detail-value">{vendor.phone}</span>
          </div>
        )}
        {vendor.contact_person && (
          <div className="detail-item">
            <span className="detail-label">Contact:</span>
            <span className="detail-value">{vendor.contact_person}</span>
          </div>
        )}
        {vendor.website && (
          <div className="detail-item">
            <span className="detail-label">Website:</span>
            <a href={vendor.website} target="_blank" rel="noopener noreferrer" className="detail-link">
              {vendor.website}
            </a>
          </div>
        )}
      </div>

      <div className="vendor-stats">
        <div className="stat">
          <span className="stat-number">{vendor.product_count || 0}</span>
          <span className="stat-label">Products</span>
        </div>
        <div className="stat">
          <span className="stat-number">{vendor.in_stock_count || 0}</span>
          <span className="stat-label">In Stock</span>
        </div>
        <div className="stat">
          <span className="stat-number">{vendor.out_of_stock_count || 0}</span>
          <span className="stat-label">Out of Stock</span>
        </div>
      </div>

      <div className="vendor-footer">
        <div className="vendor-location">
          {vendor.city && vendor.state && (
            <span className="location-text">{vendor.city}, {vendor.state}</span>
          )}
        </div>
        <div className="vendor-date">
          Added {new Date(vendor.created_at).toLocaleDateString()}
        </div>
      </div>
    </div>
  )
}

// Vendor List Item Component
const VendorListItem = ({ vendor, onEdit, onDelete, onStatusChange, getStatusColor, getStatusIcon }) => {
  return (
    <div className="vendor-list-item">
      <div className="list-item-main">
        <div className="vendor-basic-info">
          <h3 className="vendor-name">{vendor.name}</h3>
          <span className={`status-badge ${getStatusColor(vendor.status)}`}>
            <span className="status-icon">{getStatusIcon(vendor.status)}</span>
            {vendor.status}
          </span>
        </div>
        
        <div className="vendor-contact">
          {vendor.email && <span className="contact-item">{vendor.email}</span>}
          {vendor.phone && <span className="contact-item">{vendor.phone}</span>}
          {vendor.contact_person && <span className="contact-item">{vendor.contact_person}</span>}
        </div>

        <div className="vendor-stats-inline">
          <span className="stat-inline">{vendor.product_count || 0} products</span>
          <span className="stat-inline">{vendor.in_stock_count || 0} in stock</span>
          {vendor.city && vendor.state && (
            <span className="location-inline">{vendor.city}, {vendor.state}</span>
          )}
        </div>
      </div>

      <div className="list-item-actions">
        <button className="btn btn-sm btn-secondary" onClick={() => onEdit(vendor)}>
          Edit
        </button>
        <button className="btn btn-sm btn-danger" onClick={() => onDelete(vendor.id)}>
          Delete
        </button>
      </div>
    </div>
  )
}

// Vendors Table Component
const VendorsTable = ({ vendors, onEdit, onDelete, onStatusChange, getStatusColor, getStatusIcon }) => {
  return (
    <div className="vendors-table-container">
      <table className="vendors-table">
        <thead>
          <tr>
            <th>Vendor</th>
            <th>Contact</th>
            <th>Location</th>
            <th>Products</th>
            <th>Status</th>
            <th>Added</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {vendors?.map((vendor) => (
            <tr key={vendor.id}>
              <td>
                <div className="vendor-cell">
                  <h4>{vendor.name}</h4>
                  {vendor.website && (
                    <a href={vendor.website} target="_blank" rel="noopener noreferrer" className="website-link">
                      {vendor.website}
                    </a>
                  )}
                </div>
              </td>
              <td>
                <div className="contact-cell">
                  {vendor.email && <div>{vendor.email}</div>}
                  {vendor.phone && <div>{vendor.phone}</div>}
                  {vendor.contact_person && <div className="contact-person">{vendor.contact_person}</div>}
                </div>
              </td>
              <td>
                {vendor.city && vendor.state ? (
                  <span>{vendor.city}, {vendor.state}</span>
                ) : (
                  <span className="no-location">-</span>
                )}
              </td>
              <td>
                <div className="products-cell">
                  <span className="product-count">{vendor.product_count || 0}</span>
                  <span className="stock-info">
                    {vendor.in_stock_count || 0} in stock
                  </span>
                </div>
              </td>
              <td>
                <span className={`status-badge ${getStatusColor(vendor.status)}`}>
                  <span className="status-icon">{getStatusIcon(vendor.status)}</span>
                  {vendor.status}
                </span>
              </td>
              <td>
                {new Date(vendor.created_at).toLocaleDateString()}
              </td>
              <td>
                <div className="table-actions">
                  <button className="btn btn-sm btn-secondary" onClick={() => onEdit(vendor)}>
                    Edit
                  </button>
                  <button className="btn btn-sm btn-danger" onClick={() => onDelete(vendor.id)}>
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default Vendors
