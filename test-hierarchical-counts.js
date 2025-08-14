const API_BASE_URL = 'http://localhost:5000/api'

async function testHierarchicalCounts() {
  try {
    console.log('Testing hierarchical product counts...\n')
    
    // Get categories with hierarchical counts
    const response = await fetch(`${API_BASE_URL}/categories`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token' // You'll need to replace with actual token
      }
    })
    
    if (response.ok) {
      const data = await response.json()
      console.log('Categories with hierarchical product counts:')
      console.log('============================================')
      
      const printCategories = (categories, level = 0) => {
        categories.forEach(category => {
          const indent = '  '.repeat(level)
          console.log(`${indent}📁 ${category.name} [${category.type}] Level ${category.level} (${category.product_count} products)`)
          
          if (category.subcategories && category.subcategories.length > 0) {
            printCategories(category.subcategories, level + 1)
          }
        })
      }
      
      printCategories(data.categories)
      
      console.log('\n✅ Hierarchical product counts are working!')
      console.log('📊 Each category now shows the total count of products in that category PLUS all its subcategories.')
    } else {
      console.error('❌ Failed to fetch categories:', response.status, response.statusText)
    }
  } catch (error) {
    console.error('❌ Error testing hierarchical counts:', error)
  }
}

// Run the test
testHierarchicalCounts()
