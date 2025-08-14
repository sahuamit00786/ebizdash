const API_BASE_URL = 'http://localhost:5000/api'

async function testAPIHierarchicalCounts() {
  try {
    console.log('🧪 Testing API hierarchical product counts...\n')
    
    // Get categories with hierarchical counts from API
    const response = await fetch(`${API_BASE_URL}/categories`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token' // You'll need to replace with actual token
      }
    })
    
    if (response.ok) {
      const data = await response.json()
      console.log('✅ API Response received!')
      console.log('📊 Categories with hierarchical product counts:')
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
      
      console.log('\n🎯 Expected Results:')
      console.log('- Electronics (vendor) should show 1 product (from Premium)')
      console.log('- Smartphones should show 1 product (from Premium)')
      console.log('- Android should show 1 product (from Premium)')
      console.log('- Premium should show 1 product (direct)')
      
    } else {
      console.error('❌ Failed to fetch categories:', response.status, response.statusText)
      const errorText = await response.text()
      console.error('Error details:', errorText)
    }
  } catch (error) {
    console.error('❌ Error testing API hierarchical counts:', error)
  }
}

// Run the test
testAPIHierarchicalCounts()

