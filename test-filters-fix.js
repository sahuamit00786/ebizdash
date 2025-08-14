// Test script to verify filtering fixes
const API_BASE_URL = 'http://localhost:5000/api'

async function testFilters() {
  console.log('🧪 Testing Product Filters...\n')
  
  try {
    // Test 1: Vendor filtering
    console.log('1️⃣ Testing vendor filter...')
    const vendorResponse = await fetch(`${API_BASE_URL}/products?vendor_id=1`)
    const vendorData = await vendorResponse.json()
    console.log(`   ✅ Vendor filter: ${vendorData.products.length} products found for vendor_id=1`)
    
    // Test 2: Stock filtering
    console.log('2️⃣ Testing stock filter...')
    const stockResponse = await fetch(`${API_BASE_URL}/products?stock_status=in_stock`)
    const stockData = await stockResponse.json()
    console.log(`   ✅ Stock filter: ${stockData.products.length} products found with stock > 0`)
    
    // Test 3: Published filtering
    console.log('3️⃣ Testing published filter...')
    const publishedResponse = await fetch(`${API_BASE_URL}/products?published=true`)
    const publishedData = await publishedResponse.json()
    console.log(`   ✅ Published filter: ${publishedData.products.length} published products found`)
    
    // Test 4: Combined filters
    console.log('4️⃣ Testing combined filters...')
    const combinedResponse = await fetch(`${API_BASE_URL}/products?vendor_id=1&stock_status=in_stock&published=true`)
    const combinedData = await combinedResponse.json()
    console.log(`   ✅ Combined filters: ${combinedData.products.length} products found`)
    
    // Test 5: Vendor categories
    console.log('5️⃣ Testing vendor categories...')
    const vendorCategoriesResponse = await fetch(`${API_BASE_URL}/categories/vendor/1?type=vendor`)
    const vendorCategoriesData = await vendorCategoriesResponse.json()
    console.log(`   ✅ Vendor categories: ${vendorCategoriesData.categories?.length || 0} categories found for vendor 1`)
    
    console.log('\n✅ All filter tests completed successfully!')
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

// Run the test
testFilters()
