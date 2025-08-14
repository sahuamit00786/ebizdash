"use client"

import { useState } from "react"
import Sidebar from "./Sidebar"
import Header from "./Header"
import "./Layout.css"

const Layout = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className="layout">
      <Sidebar collapsed={sidebarCollapsed} onToggle={setSidebarCollapsed} />
      <div className={`main-content ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
        <Header onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} />
        <div className="content">{children}</div>
      </div>
    </div>
  )
}

export default Layout
