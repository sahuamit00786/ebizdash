import React, { useState } from "react"
import CategoryTree from "./CategoryTree"
import "./CategoryTreeDemo.css"

const CategoryTreeDemo = () => {
  const [showDemo, setShowDemo] = useState(false)

  // Sample data matching the user's structure
  const sampleData = {
    "categories": [
      {
        "id": 1,
        "name": "Electronics",
        "description": "store",
        "parent_id": null,
        "level": 1,
        "status": "active",
        "created_at": "2025-08-03T11:38:22.000Z",
        "product_count": 0,
        "subcategories": [
          {
            "id": 7,
            "name": "Laptops",
            "description": "store",
            "parent_id": 1,
            "level": 1,
            "status": "active",
            "created_at": "2025-08-07T12:47:02.000Z",
            "product_count": 0,
            "subcategories": []
          },
          {
            "id": 6,
            "name": "Laptops",
            "description": "store",
            "parent_id": 1,
            "level": 1,
            "status": "active",
            "created_at": "2025-08-07T12:38:56.000Z",
            "product_count": 0,
            "subcategories": []
          },
          {
            "id": 2,
            "name": "Computers",
            "description": "store",
            "parent_id": 1,
            "level": 2,
            "status": "active",
            "created_at": "2025-08-03T11:38:22.000Z",
            "product_count": 0,
            "subcategories": [
              {
                "id": 3,
                "name": "Laptops",
                "description": "store",
                "parent_id": 2,
                "level": 3,
                "status": "active",
                "created_at": "2025-08-03T11:38:22.000Z",
                "product_count": 0,
                "subcategories": []
              }
            ]
          },
          {
            "id": 11,
            "name": "Laaaaaaptap",
            "description": "store",
            "parent_id": 1,
            "level": 2,
            "status": "active",
            "created_at": "2025-08-07T14:28:48.000Z",
            "product_count": 0,
            "subcategories": []
          },
          {
            "id": 8,
            "name": "Laptops",
            "description": "store",
            "parent_id": 1,
            "level": 2,
            "status": "active",
            "created_at": "2025-08-07T14:18:45.000Z",
            "product_count": 0,
            "subcategories": []
          },
          {
            "id": 9,
            "name": "Laptops",
            "description": "vendor",
            "parent_id": 1,
            "level": 2,
            "status": "active",
            "created_at": "2025-08-07T14:19:28.000Z",
            "product_count": 0,
            "subcategories": []
          },
          {
            "id": 10,
            "name": "Laptops new",
            "description": "store",
            "parent_id": 1,
            "level": 2,
            "status": "active",
            "created_at": "2025-08-07T14:23:24.000Z",
            "product_count": 0,
            "subcategories": []
          }
        ]
      },
      {
        "id": 4,
        "name": "Accessories",
        "description": "vendor",
        "parent_id": null,
        "level": 1,
        "status": "active",
        "created_at": "2025-08-03T11:38:22.000Z",
        "product_count": 0,
        "subcategories": [
          {
            "id": 5,
            "name": "Cables",
            "description": "vendor",
            "parent_id": 4,
            "level": 2,
            "status": "active",
            "created_at": "2025-08-03T11:38:22.000Z",
            "product_count": 0,
            "subcategories": []
          }
        ]
      }
    ],
    "flatCategories": [
      {
        "id": 1,
        "name": "Electronics",
        "description": "store",
        "parent_id": null,
        "level": 1,
        "status": "active",
        "created_at": "2025-08-03T11:38:22.000Z",
        "product_count": 0
      },
      {
        "id": 7,
        "name": "Laptops",
        "description": "store",
        "parent_id": 1,
        "level": 1,
        "status": "active",
        "created_at": "2025-08-07T12:47:02.000Z",
        "product_count": 0
      },
      {
        "id": 6,
        "name": "Laptops",
        "description": "store",
        "parent_id": 1,
        "level": 1,
        "status": "active",
        "created_at": "2025-08-07T12:38:56.000Z",
        "product_count": 0
      },
      {
        "id": 2,
        "name": "Computers",
        "description": "store",
        "parent_id": 1,
        "level": 2,
        "status": "active",
        "created_at": "2025-08-03T11:38:22.000Z",
        "product_count": 0
      },
      {
        "id": 11,
        "name": "Laaaaaaptap",
        "description": "store",
        "parent_id": 1,
        "level": 2,
        "status": "active",
        "created_at": "2025-08-07T14:28:48.000Z",
        "product_count": 0
      },
      {
        "id": 8,
        "name": "Laptops",
        "description": "store",
        "parent_id": 1,
        "level": 2,
        "status": "active",
        "created_at": "2025-08-07T14:18:45.000Z",
        "product_count": 0
      },
      {
        "id": 9,
        "name": "Laptops",
        "description": "vendor",
        "parent_id": 1,
        "level": 2,
        "status": "active",
        "created_at": "2025-08-07T14:19:28.000Z",
        "product_count": 0
      },
      {
        "id": 10,
        "name": "Laptops new",
        "description": "store",
        "parent_id": 1,
        "level": 2,
        "status": "active",
        "created_at": "2025-08-07T14:23:24.000Z",
        "product_count": 0
      },
      {
        "id": 3,
        "name": "Laptops",
        "description": "store",
        "parent_id": 2,
        "level": 3,
        "status": "active",
        "created_at": "2025-08-03T11:38:22.000Z",
        "product_count": 0
      },
      {
        "id": 4,
        "name": "Accessories",
        "description": "vendor",
        "parent_id": null,
        "level": 1,
        "status": "active",
        "created_at": "2025-08-03T11:38:22.000Z",
        "product_count": 0
      },
      {
        "id": 5,
        "name": "Cables",
        "description": "vendor",
        "parent_id": 4,
        "level": 2,
        "status": "active",
        "created_at": "2025-08-03T11:38:22.000Z",
        "product_count": 0
      }
    ]
  }

  return (
    <div className="category-tree-demo">
      <div className="demo-header">
        <h1>Category Tree Demo</h1>
        <p>This demonstrates the hierarchical category display with search and CRUD functionality</p>
        
        <div className="demo-controls">
          <button 
            className="btn btn-primary"
            onClick={() => setShowDemo(!showDemo)}
          >
            {showDemo ? "Hide Demo" : "Show Demo"}
          </button>
        </div>
      </div>

      {showDemo && (
        <div className="demo-content">
          <div className="data-preview">
            <h3>Sample Data Structure</h3>
            <div className="data-info">
              <p><strong>Categories:</strong> {sampleData.categories.length} root categories</p>
              <p><strong>Total Categories:</strong> {sampleData.flatCategories.length} categories</p>
              <p><strong>Structure:</strong> Hierarchical with parent-child relationships</p>
            </div>
          </div>
          
          <div className="tree-demo">
            <h3>Category Tree Component</h3>
            <div className="demo-note">
              <p>This component provides:</p>
              <ul>
                <li>✅ Hierarchical tree display</li>
                <li>✅ Search functionality</li>
                <li>✅ Add/Edit/Delete categories</li>
                <li>✅ Expand/Collapse subcategories</li>
                <li>✅ Visual indicators for levels</li>
                <li>✅ Product count display</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CategoryTreeDemo 