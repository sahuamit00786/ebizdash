const API_BASE_URL = 'http://localhost:5000/api'

// Test advanced filters functionality
async function testAdvancedFilters() {
  try {
    // First, get a token (you'll need to login first)
    const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@example.com', // Replace with actual admin credentials
        password: 'admin123'
      })
    })

    if (!loginResponse.ok) {
      console.error('Login failed:', await loginResponse.text())
      return
    }

    const loginData = await loginResponse.json()
    const token = loginData.token

    console.log('✅ Login successful')

    // Test 1: Basic products fetch
    console.log('\n🧪 Test 1: Basic products fetch')
    const basicResponse = await fetch(`${API_BASE_URL}/products?page=1&limit=5`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    
    if (basicResponse.ok) {
      const basicData = await basicResponse.json()
      console.log(`✅ Basic fetch successful: ${basicData.products.length} products`)
    } else {
      console.error('❌ Basic fetch failed:', await basicResponse.text())
    }

    // Test 2: Advanced filter - name contains
    console.log('\n🧪 Test 2: Advanced filter - name contains')
    const advancedFilter1 = [{
      column: 'name',
      operator: 'contains',
      value: 'test'
    }]
    
    const advancedResponse1 = await fetch(`${API_BASE_URL}/products?page=1&limit=5&advanced_filters=${encodeURIComponent(JSON.stringify(advancedFilter1))}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    
    if (advancedResponse1.ok) {
      const advancedData1 = await advancedResponse1.json()
      console.log(`✅ Advanced filter 1 successful: ${advancedData1.products.length} products found`)
    } else {
      console.error('❌ Advanced filter 1 failed:', await advancedResponse1.text())
    }

    // Test 3: Advanced filter - stock greater than
    console.log('\n🧪 Test 3: Advanced filter - stock greater than')
    const advancedFilter2 = [{
      column: 'stock',
      operator: 'greater_than',
      value: '0'
    }]
    
    const advancedResponse2 = await fetch(`${API_BASE_URL}/products?page=1&limit=5&advanced_filters=${encodeURIComponent(JSON.stringify(advancedFilter2))}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    
    if (advancedResponse2.ok) {
      const advancedData2 = await advancedResponse2.json()
      console.log(`✅ Advanced filter 2 successful: ${advancedData2.products.length} products found`)
    } else {
      console.error('❌ Advanced filter 2 failed:', await advancedResponse2.text())
    }

    // Test 4: Multiple advanced filters
    console.log('\n🧪 Test 4: Multiple advanced filters')
    const advancedFilter3 = [
      {
        column: 'published',
        operator: 'is',
        value: 'true'
      },
      {
        column: 'stock',
        operator: 'greater_than',
        value: '0'
      }
    ]
    
    const advancedResponse3 = await fetch(`${API_BASE_URL}/products?page=1&limit=5&advanced_filters=${encodeURIComponent(JSON.stringify(advancedFilter3))}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    
    if (advancedResponse3.ok) {
      const advancedData3 = await advancedResponse3.json()
      console.log(`✅ Multiple advanced filters successful: ${advancedData3.products.length} products found`)
    } else {
      console.error('❌ Multiple advanced filters failed:', await advancedResponse3.text())
    }

    // Test 5: Category IDs filter
    console.log('\n🧪 Test 5: Category IDs filter')
    const categoryResponse = await fetch(`${API_BASE_URL}/products?page=1&limit=5&category_ids=1&category_ids=2`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    
    if (categoryResponse.ok) {
      const categoryData = await categoryResponse.json()
      console.log(`✅ Category IDs filter successful: ${categoryData.products.length} products found`)
    } else {
      console.error('❌ Category IDs filter failed:', await categoryResponse.text())
    }

    console.log('\n🎉 All tests completed!')

  } catch (error) {
    console.error('❌ Test failed with error:', error)
  }
}

// Run the test
testAdvancedFilters()
