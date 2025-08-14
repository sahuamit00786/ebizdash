import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import Login from "./components/Login"
import Register from "./components/Register"
import Layout from "./components/Layout"
import Dashboard from "./components/Dashboard"
import Products from "./components/Products"
import ProductDetail from "./components/ProductDetail"
import Categories from "./components/Categories"
import CategoryTree from "./components/CategoryTree"
import Vendors from "./components/Vendors"
import Users from "./components/Users"
import Settings from "./components/Settings"
import { AuthProvider, useAuth } from "./context/AuthContext" // Import AuthProvider and useAuth
import { ToastProvider } from "./context/ToastContext" // Import ToastProvider
import "./App.css"

function AppContent() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="loading-screen">
        <div 
          className="loading-spinner"
          style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #007bff',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '20px',
            display: 'block',
            boxSizing: 'border-box'
          }}
        ></div>
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <Router>
      <Routes>
        {!user ? (
          <>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="*" element={<Navigate to="/login" />} />
          </>
        ) : (
          <Route path="/*" element={
            <Layout>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/products" element={<Products />} />
                <Route path="/product/:id" element={<ProductDetail />} />
                <Route path="/categories" element={<Categories />} />
                <Route path="/category-tree" element={<CategoryTree />} />
                <Route path="/vendors" element={<Vendors />} />
                <Route path="/users" element={<Users />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<Navigate to="/dashboard" />} />
              </Routes>
            </Layout>
          } />
        )}
      </Routes>
    </Router>
  )
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <div className="App">
          <AppContent />
        </div>
      </ToastProvider>
    </AuthProvider>
  )
}

export default App
