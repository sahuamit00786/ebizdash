const mysql = require('mysql2/promise')

// Database configuration - using the same config as the server
const dbConfig = {
  host: '45.77.196.170',
  user: 'ebizdash_products_react',
  password: 'products_react',
  database: 'ebizdash_products_react',
  charset: 'utf8mb4'
}

// Helper function to get all subcategory IDs recursively
async function getAllSubcategoryIds(categoryId) {
  const allIds = new Set([categoryId])
  
  const connection = await mysql.createConnection(dbConfig)
  
  try {
    const [subcategories] = await connection.execute(
      "SELECT id FROM categories WHERE parent_id = ?",
      [categoryId]
    )
    
    for (const subcategory of subcategories) {
      const nestedIds = await getAllSubcategoryIds(subcategory.id)
      nestedIds.forEach(id => allIds.add(id))
    }
    
    return Array.from(allIds)
  } finally {
    await connection.end()
  }
}

// Helper function to calculate hierarchical product count
async function getHierarchicalProductCount(categoryId) {
  const connection = await mysql.createConnection(dbConfig)
  
  try {
    const allCategoryIds = await getAllSubcategoryIds(categoryId)
    
    console.log(`Category ${categoryId} - All subcategory IDs:`, allCategoryIds)
    
    if (allCategoryIds.length === 0) {
      return 0
    }
    
    const [result] = await connection.execute(`
      SELECT COUNT(DISTINCT p.id) as total_count
      FROM products p
      WHERE p.store_category_id IN (${allCategoryIds.map(() => '?').join(',')}) 
         OR p.vendor_category_id IN (${allCategoryIds.map(() => '?').join(',')})
    `, [...allCategoryIds, ...allCategoryIds])
    
    return result[0].total_count || 0
  } catch (error) {
    console.error('Error calculating hierarchical product count:', error)
    return 0
  } finally {
    await connection.end()
  }
}

async function debugHierarchicalCounts() {
  try {
    console.log('🔍 Debugging hierarchical product counts...\n')
    
    // Test with the Electronics category (ID: 719)
    console.log('Testing Electronics category (ID: 719):')
    const electronicsCount = await getHierarchicalProductCount(719)
    console.log(`Electronics hierarchical count: ${electronicsCount}\n`)
    
    // Test with Smartphones category (ID: 723)
    console.log('Testing Smartphones category (ID: 723):')
    const smartphonesCount = await getHierarchicalProductCount(723)
    console.log(`Smartphones hierarchical count: ${smartphonesCount}\n`)
    
    // Test with Android category (ID: 724)
    console.log('Testing Android category (ID: 724):')
    const androidCount = await getHierarchicalProductCount(724)
    console.log(`Android hierarchical count: ${androidCount}\n`)
    
    // Test with Premium category (ID: 727) - should have 1 product
    console.log('Testing Premium category (ID: 727):')
    const premiumCount = await getHierarchicalProductCount(727)
    console.log(`Premium hierarchical count: ${premiumCount}\n`)
    
    // Let's also check what products exist
    const connection = await mysql.createConnection(dbConfig)
    const [products] = await connection.execute(`
      SELECT id, name, vendor_category_id, store_category_id 
      FROM products 
      WHERE vendor_category_id = 727 OR store_category_id = 727
    `)
    console.log('Products in Premium category (ID: 727):', products)
    await connection.end()
    
  } catch (error) {
    console.error('❌ Error debugging hierarchical counts:', error)
  }
}

// Run the debug
debugHierarchicalCounts()
