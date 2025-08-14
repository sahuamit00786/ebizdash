import { useState } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { useToast } from "../context/ToastContext"
import "./Login.css"

const Register = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "shop_manager"
  })
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const { showToast } = useToast()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      showToast("Passwords do not match", "error")
      setLoading(false)
      return
    }

    // Validate password length
    if (formData.password.length < 6) {
      showToast("Password must be at least 6 characters long", "error")
      setLoading(false)
      return
    }

    try {
      const API_BASE_URL = process.env.NODE_ENV === "production" ? "/api" : "http://localhost:5000/api"
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          role: formData.role
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Registration failed")
      }

      const data = await response.json()
      
      // Auto-login after successful registration
      await login({
        username: formData.username,
        password: formData.password
      })
      
      showToast("Registration successful! You are now logged in.", "success")
    } catch (error) {
      showToast(error.message || "Registration failed", "error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <img src="/placeholder.svg?height=60&width=60" alt="Logo" />
          <h1>Product Management System</h1>
          <p>Create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={loading}
              minLength={6}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="role">Role</label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              disabled={loading}
            >
              <option value="shop_manager">Shop Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <div className="login-footer">
          <p>Already have an account? <Link to="/login" style={{ color: '#007bff', textDecoration: 'none' }}>Sign in here</Link></p>
        </div>
      </div>
    </div>
  )
}

export default Register 