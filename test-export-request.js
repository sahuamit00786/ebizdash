// Test export request
async function testExportRequest() {
  try {
    // Simulate the frontend export request
    const queryParams = new URLSearchParams()
    queryParams.append('mode', 'woocommerce')
    queryParams.append('published', 'true')
    queryParams.append('stock_min', '1')
    
    const exportUrl = `http://localhost:5000/api/products/export?${queryParams.toString()}`
    console.log("Testing export URL:", exportUrl)
    
    // Use built-in fetch if available (Node.js 18+)
    if (typeof fetch !== 'undefined') {
      const response = await fetch(exportUrl, {
        headers: {
          'Authorization': 'Bearer test-token',
        },
      })
      
      console.log("Response status:", response.status)
      
      if (response.ok) {
        const text = await response.text()
        console.log("Response length:", text.length)
        console.log("First 500 characters:", text.substring(0, 500))
      } else {
        const errorText = await response.text()
        console.log("Error response:", errorText)
      }
    } else {
      console.log("Fetch not available, using http module")
      const http = require('http')
      const url = require('url')
      
      const parsedUrl = url.parse(exportUrl)
      const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port,
        path: parsedUrl.path,
        method: 'GET',
        headers: {
          'Authorization': 'Bearer test-token',
        }
      }
      
      const req = http.request(options, (res) => {
        console.log("Response status:", res.statusCode)
        console.log("Response headers:", res.headers)
        
        let data = ''
        res.on('data', (chunk) => {
          data += chunk
        })
        
        res.on('end', () => {
          console.log("Response length:", data.length)
          console.log("First 500 characters:", data.substring(0, 500))
        })
      })
      
      req.on('error', (error) => {
        console.error("Request error:", error)
      })
      
      req.end()
    }
    
  } catch (error) {
    console.error("Error testing export:", error)
  }
}

testExportRequest()
