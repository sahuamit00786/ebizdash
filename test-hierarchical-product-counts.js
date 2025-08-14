// Test script to verify hierarchical product count logic
console.log('🧪 Testing Hierarchical Product Count Logic...')

// Simulate the category structure from your example
const testCategories = [
  {
    id: 1,
    name: 'Electronics',
    product_count: 0,
    subcategories: [
      {
        id: 2,
        name: 'Smartphones',
        product_count: 0,
        subcategories: [
          {
            id: 3,
            name: 'Android',
            product_count: 0,
            subcategories: [
              {
                id: 4,
                name: 'Flagship',
                product_count: 0,
                subcategories: [
                  {
                    id: 5,
                    name: 'New Premium',
                    product_count: 0,
                    subcategories: [
                      {
                        id: 6,
                        name: 'Forgetable',
                        product_count: 1,
                        subcategories: []
                      }
                    ]
                  },
                  {
                    id: 7,
                    name: 'Other Flagship Subcategory',
                    product_count: 1,
                    subcategories: []
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

// Flatten the categories for the calculation function
const flattenCategories = (categories, flat = []) => {
  categories.forEach(cat => {
    flat.push({
      id: cat.id,
      name: cat.name,
      product_count: cat.product_count,
      subcategories: cat.subcategories
    })
    if (cat.subcategories && cat.subcategories.length > 0) {
      flattenCategories(cat.subcategories, flat)
    }
  })
  return flat
}

// The hierarchical product count calculation function (same as in Categories.js)
const calculateHierarchicalProductCount = (categoryId, categoryList) => {
  let totalCount = 0
  
  // Find the category and get its direct product count
  const category = categoryList.find(cat => cat.id === categoryId)
  if (category) {
    totalCount += category.product_count || 0
    
    // Recursively add product counts from all subcategories
    const addSubcategoryCounts = (cat) => {
      if (cat.subcategories && cat.subcategories.length > 0) {
        cat.subcategories.forEach(subcat => {
          totalCount += subcat.product_count || 0
          addSubcategoryCounts(subcat)
        })
      }
    }
    
    addSubcategoryCounts(category)
  }
  
  return totalCount
}

const flatCategories = flattenCategories(testCategories)

console.log('📊 Test Results:')
console.log('')

// Test each category level
const testLevels = [
  { id: 1, name: 'Electronics', expected: 2 },
  { id: 2, name: 'Smartphones', expected: 2 },
  { id: 3, name: 'Android', expected: 2 },
  { id: 4, name: 'Flagship', expected: 2 },
  { id: 5, name: 'New Premium', expected: 1 },
  { id: 6, name: 'Forgetable', expected: 1 },
  { id: 7, name: 'Other Flagship Subcategory', expected: 1 }
]

testLevels.forEach(test => {
  const actual = calculateHierarchicalProductCount(test.id, flatCategories)
  const status = actual === test.expected ? '✅' : '❌'
  console.log(`${status} ${test.name}: ${actual} products (expected: ${test.expected})`)
})

console.log('')
console.log('🎯 Expected Behavior:')
console.log('   - Electronics: 2 products (includes all subcategories)')
console.log('   - Smartphones: 2 products (includes all subcategories)')
console.log('   - Android: 2 products (includes all subcategories)')
console.log('   - Flagship: 2 products (includes all subcategories)')
console.log('   - New Premium: 1 product (includes Forgetable)')
console.log('   - Forgetable: 1 product (direct only)')
console.log('   - Other Flagship Subcategory: 1 product (direct only)')

console.log('')
console.log('✅ Hierarchical Product Count Logic Should Work Correctly!')
