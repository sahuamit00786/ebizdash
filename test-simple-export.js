const http = require('http')

// Test the export route directly
const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/products/export?mode=woocommerce&published=true&stock_min=1',
  method: 'GET'
}

console.log('Testing export route...')
console.log('URL:', `http://${options.hostname}:${options.port}${options.path}`)

const req = http.request(options, (res) => {
  console.log('Status:', res.statusCode)
  console.log('Headers:', res.headers)
  
  let data = ''
  res.on('data', (chunk) => {
    data += chunk
  })
  
  res.on('end', () => {
    console.log('Response length:', data.length)
    if (data.length > 0) {
      // Count the number of lines (products)
      const lines = data.split('\n')
      console.log('Number of lines:', lines.length)
      console.log('Number of products (excluding header):', lines.length - 1)
      
      // Show first few lines
      console.log('\nFirst 3 lines:')
      lines.slice(0, 3).forEach((line, index) => {
        console.log(`${index + 1}: ${line}`)
      })
      
      // Check if we have the expected number of products (should be around 100 based on our earlier test)
      const productCount = lines.length - 1
      if (productCount > 0) {
        console.log(`\n✅ Export working! Found ${productCount} products`)
      } else {
        console.log('\n❌ No products found in export')
      }
    }
  })
})

req.on('error', (error) => {
  console.error('Request error:', error)
})

req.end()
