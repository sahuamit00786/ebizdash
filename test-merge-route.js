const http = require('http')

async function testMergeRoute() {
  try {
    console.log('🧪 Testing merge route accessibility...')
    
    // Test 1: Check if the route exists (should return 401 for unauthorized)
    console.log('\n1. Testing route existence...')
    
    const postData = JSON.stringify({
      sourceCategoryId: 1,
      targetCategoryId: 2,
      categoryType: 'both'
    })
    
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/categories/merge',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }
    
    const req = http.request(options, (res) => {
      console.log(`Response status: ${res.statusCode}`)
      
      if (res.statusCode === 401) {
        console.log('✅ Route exists! (401 Unauthorized is expected without token)')
      } else if (res.statusCode === 404) {
        console.log('❌ Route not found (404)')
      } else {
        console.log(`⚠️  Unexpected status: ${res.statusCode}`)
      }
      
      // Test 2: Check if categories route is working
      console.log('\n2. Testing categories route...')
      
      const getOptions = {
        hostname: 'localhost',
        port: 5000,
        path: '/api/categories',
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      }
      
      const getReq = http.request(getOptions, (getRes) => {
        console.log(`Categories route status: ${getRes.statusCode}`)
        
        if (getRes.statusCode === 401) {
          console.log('✅ Categories route exists! (401 Unauthorized is expected without token)')
        } else if (getRes.statusCode === 404) {
          console.log('❌ Categories route not found (404)')
        } else {
          console.log(`⚠️  Unexpected status: ${getRes.statusCode}`)
        }
        
        // Test 3: Check server status
        console.log('\n3. Testing server connectivity...')
        
        const authOptions = {
          hostname: 'localhost',
          port: 5000,
          path: '/api/auth/login',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(JSON.stringify({
              username: 'test',
              password: 'test'
            }))
          }
        }
        
        const authReq = http.request(authOptions, (authRes) => {
          console.log(`Server response status: ${authRes.statusCode}`)
          console.log('✅ Server is running and responding')
          
          console.log('\n📋 Summary:')
          console.log('If you see 401 errors, the routes exist and are working correctly.')
          console.log('If you see 404 errors, there might be a routing issue.')
          console.log('\n💡 To test with authentication:')
          console.log('1. Login to get a token')
          console.log('2. Use the token in the Authorization header')
          console.log('3. Test the merge functionality in the UI')
        })
        
        authReq.on('error', (error) => {
          console.log('❌ Server connection failed:', error.message)
        })
        
        authReq.write(JSON.stringify({
          username: 'test',
          password: 'test'
        }))
        authReq.end()
      })
      
      getReq.on('error', (error) => {
        console.log('❌ Categories route test failed:', error.message)
      })
      
      getReq.end()
    })
    
    req.on('error', (error) => {
      console.log('❌ Merge route test failed:', error.message)
    })
    
    req.write(postData)
    req.end()
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

// Run the test
testMergeRoute()
