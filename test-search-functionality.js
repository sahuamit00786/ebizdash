const API_BASE_URL = 'http://localhost:5000/api'

async function testSearchFunctionality() {
  console.log('🔍 Testing search functionality...')
  
  try {
    // Test 1: Real-time search endpoint
    console.log('\n1. Testing real-time search endpoint...')
    const realtimeResponse = await fetch(`${API_BASE_URL}/products/search/realtime?q=test&limit=5`)
    
    if (realtimeResponse.ok) {
      const realtimeData = await realtimeResponse.json()
      console.log('✅ Real-time search working:', realtimeData.length, 'results')
      if (realtimeData.length > 0) {
        console.log('Sample result:', realtimeData[0])
      }
    } else {
      console.log('❌ Real-time search failed:', realtimeResponse.status)
    }
    
    // Test 2: Main products endpoint with search
    console.log('\n2. Testing main products endpoint with search...')
    const mainResponse = await fetch(`${API_BASE_URL}/products?search=test&page=1&limit=5`)
    
    if (mainResponse.ok) {
      const mainData = await mainResponse.json()
      console.log('✅ Main search working:', mainData.products.length, 'results')
      console.log('Total products:', mainData.pagination.total)
      if (mainData.products.length > 0) {
        console.log('Sample result:', mainData.products[0])
      }
    } else {
      console.log('❌ Main search failed:', mainResponse.status)
    }
    
    // Test 3: Search by SKU
    console.log('\n3. Testing search by SKU...')
    const skuResponse = await fetch(`${API_BASE_URL}/products?search=SKU&page=1&limit=5`)
    
    if (skuResponse.ok) {
      const skuData = await skuResponse.json()
      console.log('✅ SKU search working:', skuData.products.length, 'results')
    } else {
      console.log('❌ SKU search failed:', skuResponse.status)
    }
    
    // Test 4: Search by brand
    console.log('\n4. Testing search by brand...')
    const brandResponse = await fetch(`${API_BASE_URL}/products?search=brand&page=1&limit=5`)
    
    if (brandResponse.ok) {
      const brandData = await brandResponse.json()
      console.log('✅ Brand search working:', brandData.products.length, 'results')
    } else {
      console.log('❌ Brand search failed:', brandResponse.status)
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

// Run the test
testSearchFunctionality()
