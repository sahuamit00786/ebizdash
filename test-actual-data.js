// Test script with actual data structure
console.log('🧪 Testing Hierarchical Product Count with Actual Data...')

// Your actual data structure
const actualCategories = [
  {
    "id": 1749,
    "name": "Electronics",
    "type": "vendor",
    "parent_id": null,
    "level": 1,
    "status": "active",
    "created_at": "2025-08-13 18:35:19",
    "parent_name": null,
    "vendor_name": "CWR",
    "vendor_id": 6,
    "product_count": 0,
    "description": "vendor",
    "subcategories": [
      {
        "id": 1750,
        "name": "Smartphones",
        "type": "vendor",
        "parent_id": 1749,
        "level": 2,
        "status": "active",
        "created_at": "2025-08-13 13:05:21",
        "parent_name": "Electronics",
        "vendor_name": "CWR",
        "vendor_id": 6,
        "product_count": 0,
        "description": "vendor",
        "subcategories": [
          {
            "id": 1751,
            "name": "Android",
            "type": "vendor",
            "parent_id": 1750,
            "level": 3,
            "status": "active",
            "created_at": "2025-08-13 13:05:22",
            "parent_name": "Smartphones",
            "vendor_name": "CWR",
            "vendor_id": 6,
            "product_count": 0,
            "description": "vendor",
            "subcategories": [
              {
                "id": 1752,
                "name": "Flagship",
                "type": "vendor",
                "parent_id": 1751,
                "level": 4,
                "status": "active",
                "created_at": "2025-08-13 13:05:23",
                "parent_name": "Android",
                "vendor_name": "CWR",
                "vendor_id": 6,
                "product_count": 0,
                "description": "vendor",
                "subcategories": [
                  {
                    "id": 1753,
                    "name": "New Premium",
                    "type": "vendor",
                    "parent_id": 1752,
                    "level": 5,
                    "status": "active",
                    "created_at": "2025-08-13 13:05:25",
                    "parent_name": "Flagship",
                    "vendor_name": "CWR",
                    "vendor_id": 6,
                    "product_count": 1,
                    "description": "vendor",
                    "subcategories": [
                      {
                        "id": 1754,
                        "name": "Forgetable",
                        "type": "vendor",
                        "parent_id": 1753,
                        "level": 6,
                        "status": "active",
                        "created_at": "2025-08-13 13:05:26",
                        "parent_name": "New Premium",
                        "vendor_name": "CWR",
                        "vendor_id": 6,
                        "product_count": 1,
                        "description": "vendor",
                        "subcategories": []
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
]

// The updated calculation function (same as in Categories.js)
const calculateHierarchicalProductCount = (categoryId, categoryList) => {
  let totalCount = 0
  
  // Recursive function to find category and calculate hierarchical count
  const findAndCalculate = (categories) => {
    for (const cat of categories) {
      if (cat.id === categoryId) {
        // Found the category, add its direct count
        totalCount += cat.product_count || 0
        
        // Recursively add product counts from all subcategories
        const addSubcategoryCounts = (category) => {
          if (category.subcategories && category.subcategories.length > 0) {
            category.subcategories.forEach(subcat => {
              totalCount += subcat.product_count || 0
              addSubcategoryCounts(subcat)
            })
          }
        }
        
        addSubcategoryCounts(cat)
        return true // Found and processed
      }
      
      // Check subcategories
      if (cat.subcategories && cat.subcategories.length > 0) {
        if (findAndCalculate(cat.subcategories)) {
          return true // Found in subcategories
        }
      }
    }
    return false // Not found in this level
  }
  
  findAndCalculate(categoryList)
  return totalCount
}

console.log('📊 Test Results with Actual Data:')
console.log('')

// Test each category level
const testLevels = [
  { id: 1749, name: 'Electronics', expected: 2 },
  { id: 1750, name: 'Smartphones', expected: 2 },
  { id: 1751, name: 'Android', expected: 2 },
  { id: 1752, name: 'Flagship', expected: 2 },
  { id: 1753, name: 'New Premium', expected: 2 },
  { id: 1754, name: 'Forgetable', expected: 1 }
]

testLevels.forEach(test => {
  const actual = calculateHierarchicalProductCount(test.id, actualCategories)
  const status = actual === test.expected ? '✅' : '❌'
  console.log(`${status} ${test.name}: ${actual} products (expected: ${test.expected})`)
})

console.log('')
console.log('🎯 Expected Behavior:')
console.log('   - Electronics: 2 products (0 direct + 2 from subcategories)')
console.log('   - Smartphones: 2 products (0 direct + 2 from subcategories)')
console.log('   - Android: 2 products (0 direct + 2 from subcategories)')
console.log('   - Flagship: 2 products (0 direct + 2 from subcategories)')
console.log('   - New Premium: 2 products (1 direct + 1 from Forgetable)')
console.log('   - Forgetable: 1 product (1 direct)')

console.log('')
console.log('✅ Hierarchical Product Count Should Now Work with Your Data!')
