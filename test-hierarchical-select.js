const API_BASE_URL = 'http://localhost:5000/api'

async function testHierarchicalCategorySelect() {
  try {
    console.log('Testing Hierarchical Category Selection...\n')
    
    // Test 1: Fetch categories from API
    console.log('=== Test 1: Fetching Categories from API ===')
    const response = await fetch(`${API_BASE_URL}/categories`, {
      headers: {
        'Authorization': 'Bearer test-token' // You'll need to replace with actual token
      }
    })
    
    if (!response.ok) {
      console.log(`✗ API request failed: ${response.status} ${response.statusText}`)
      return
    }
    
    const data = await response.json()
    console.log('✓ API request successful')
    console.log(`Found ${data.flatCategories?.length || 0} flat categories`)
    console.log(`Found ${data.categories?.length || 0} hierarchical categories`)
    
    // Test 2: Check hierarchical structure
    console.log('\n=== Test 2: Hierarchical Structure ===')
    if (data.categories && data.categories.length > 0) {
      console.log('Hierarchical categories structure:')
      const printHierarchy = (categories, level = 0) => {
        categories.forEach(cat => {
          const indent = '  '.repeat(level)
          console.log(`${indent}${cat.name} (ID: ${cat.id}, Type: ${cat.type}, Level: ${cat.level})`)
          if (cat.subcategories && cat.subcategories.length > 0) {
            printHierarchy(cat.subcategories, level + 1)
          }
        })
      }
      printHierarchy(data.categories)
    } else {
      console.log('No hierarchical categories found')
    }
    
    // Test 3: Check vendor categories
    console.log('\n=== Test 3: Vendor Categories ===')
    const vendorCategories = data.flatCategories?.filter(cat => cat.type === 'vendor') || []
    console.log(`Found ${vendorCategories.length} vendor categories:`)
    vendorCategories.forEach(cat => {
      const indent = '  '.repeat(cat.level || 0)
      console.log(`${indent}${cat.name} (ID: ${cat.id}, Level: ${cat.level || 0}, Parent: ${cat.parent_id || 'root'})`)
    })
    
    // Test 4: Check store categories
    console.log('\n=== Test 4: Store Categories ===')
    const storeCategories = data.flatCategories?.filter(cat => cat.type === 'store') || []
    console.log(`Found ${storeCategories.length} store categories:`)
    storeCategories.forEach(cat => {
      const indent = '  '.repeat(cat.level || 0)
      console.log(`${indent}${cat.name} (ID: ${cat.id}, Level: ${cat.level || 0}, Parent: ${cat.parent_id || 'root'})`)
    })
    
    // Test 5: Simulate hierarchical component logic
    console.log('\n=== Test 5: Simulating Hierarchical Component Logic ===')
    
    const buildHierarchicalCategories = (cats, type) => {
      const typeCategories = cats.filter(cat => cat.type === type)
      
      const buildTree = (items, parentId = null) => {
        return items
          .filter(item => item.parent_id === parentId)
          .map(item => ({
            ...item,
            children: buildTree(items, item.id)
          }))
          .sort((a, b) => a.name.localeCompare(b.name))
      }
      
      return buildTree(typeCategories)
    }
    
    const vendorHierarchy = buildHierarchicalCategories(data.flatCategories || [], 'vendor')
    const storeHierarchy = buildHierarchicalCategories(data.flatCategories || [], 'store')
    
    console.log(`Vendor hierarchy has ${vendorHierarchy.length} root categories`)
    console.log(`Store hierarchy has ${storeHierarchy.length} root categories`)
    
    // Test 6: Check if categories have proper parent-child relationships
    console.log('\n=== Test 6: Parent-Child Relationships ===')
    const categoriesWithChildren = data.flatCategories?.filter(cat => 
      data.flatCategories.some(child => child.parent_id === cat.id)
    ) || []
    
    console.log(`Categories with children: ${categoriesWithChildren.length}`)
    categoriesWithChildren.forEach(cat => {
      const children = data.flatCategories.filter(child => child.parent_id === cat.id)
      console.log(`  ${cat.name} (${cat.type}) has ${children.length} children`)
    })
    
    console.log('\n✓ Hierarchical category selection test completed successfully!')
    
  } catch (error) {
    console.error('✗ Test failed:', error.message)
  }
}

// Run the test
testHierarchicalCategorySelect()
