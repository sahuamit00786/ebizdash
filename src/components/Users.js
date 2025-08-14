"use client"

import { useState, useEffect } from "react"
import { useToast } from "../context/ToastContext"
import { useAuth } from "../context/AuthContext"
import UserModal from "./UserModal"
import "./Users.css"

const Users = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const { showToast } = useToast()
  const { user: currentUser } = useAuth()

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/users", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (error) {
      showToast("Error loading users", "error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  // Only admin can access this component
  if (currentUser?.role !== "admin") {
    return (
      <div className="access-denied">
        <h2>Access Denied</h2>
        <p>You don't have permission to access this page.</p>
      </div>
    )
  }

  const handleEdit = (user) => {
    setEditingUser(user)
    setShowModal(true)
  }

  const handleDelete = async (userId) => {
    if (userId === currentUser.id) {
      showToast("You cannot delete your own account", "warning")
      return
    }

    if (!window.confirm("Are you sure you want to delete this user?")) {
      return
    }

    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        showToast("User deleted successfully", "success")
        fetchUsers()
      } else {
        const error = await response.json()
        showToast(error.message || "Error deleting user", "error")
      }
    } catch (error) {
      showToast("Error deleting user", "error")
    }
  }

  if (loading) {
    return <div className="loading">Loading users...</div>
  }

  return (
    <div className="users">
      <div className="users-header">
        <h1>User Management</h1>
        <button
          className="btn btn-primary"
          onClick={() => {
            setEditingUser(null)
            setShowModal(true)
          }}
        >
          Add User
        </button>
      </div>

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Email</th>
              <th>Role</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>
                  <div className="user-info">
                    <div className="user-avatar">{user.username.charAt(0).toUpperCase()}</div>
                    <span>{user.username}</span>
                  </div>
                </td>
                <td>{user.email}</td>
                <td>
                  <span className={`role-badge ${user.role}`}>{user.role}</span>
                </td>
                <td>{new Date(user.created_at).toLocaleDateString()}</td>
                <td>
                  <div className="action-buttons">
                    <button className="btn btn-sm btn-secondary" onClick={() => handleEdit(user)}>
                      Edit
                    </button>
                    {user.id !== currentUser.id && (
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(user.id)}>
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {users.length === 0 && (
        <div className="empty-state">
          <p>No users found</p>
        </div>
      )}

      {showModal && (
        <UserModal
          user={editingUser}
          onClose={() => {
            setShowModal(false)
            setEditingUser(null)
          }}
          onSave={() => {
            fetchUsers()
            setShowModal(false)
            setEditingUser(null)
          }}
        />
      )}
    </div>
  )
}

export default Users
