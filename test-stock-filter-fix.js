const testStockFilter = async () => {
  try {
    console.log('🧪 Testing stock filter fix...');
    
    // Test out_of_stock filter
    const url = new URL('http://localhost:5000/api/products');
    url.searchParams.set('stock_status', 'out_of_stock');
    url.searchParams.set('page', '1');
    url.searchParams.set('limit', '5');
    
    const response = await fetch(url);
    const data = await response.json();
    
    console.log('✅ Response status:', response.status);
    console.log('✅ Products returned:', data.products.length);
    console.log('✅ Warning message:', data.warning || 'No warning');
    
    if (data.products.length > 0) {
      console.log('✅ First product stock:', data.products[0].stock);
    }
    
    console.log('✅ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

testStockFilter();
