import { createContext, useContext, useState, useEffect } from "react"

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // API base URL - change this to point to your backend
  const API_BASE_URL = process.env.NODE_ENV === "production" ? "/api" : "http://localhost:5000/api"

  // Centralized function to handle invalid tokens
  const handleInvalidToken = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    setUser(null)
    // Use window.location.href since AuthProvider is outside Router context
    window.location.href = "/login"
  }

  // Utility function to check for authentication errors in API responses
  const checkAuthError = (response) => {
    if (response.status === 401 || response.status === 403) {
      handleInvalidToken()
      return true
    }
    return false
  }

  useEffect(() => {
    const token = localStorage.getItem("token")
    const userData = localStorage.getItem("user")

    if (token && userData) {
      try {
        setUser(JSON.parse(userData))
      } catch (error) {
        localStorage.removeItem("token")
        localStorage.removeItem("user")
      }
    }

    setLoading(false)
  }, [])

  const login = async (credentials) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Login failed")
      }

      const data = await response.json()

      localStorage.setItem("token", data.token)
      localStorage.setItem("user", JSON.stringify(data.user))
      setUser(data.user)

      return data
    } catch (error) {
      throw error
    }
  }

  const logout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    setUser(null)
    // Use window.location.href since AuthProvider is outside Router context
    window.location.href = "/login"
  }

  const value = {
    user,
    login,
    logout,
    loading,
    API_BASE_URL,
    handleInvalidToken,
    checkAuthError,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
