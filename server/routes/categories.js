const express = require("express")
const router = express.Router()
const { pool: db, executeWithRetry } = require("../config/database")
const { authenticateToken } = require("../middleware/auth")

// Optimized helper function to get all subcategory IDs using a single query
async function getAllSubcategoryIds(categoryId) {
  try {
    // Use a single query with recursive CTE to get all subcategory IDs with depth limiting
    const [result] = await db.execute(`
      WITH RECURSIVE category_tree AS (
        SELECT id, parent_id, 0 as level, CAST(id AS CHAR(1000)) as path
        FROM categories 
        WHERE id = ?
        
        UNION ALL
        
        SELECT c.id, c.parent_id, ct.level + 1, CONCAT(ct.path, ',', c.id)
        FROM categories c
        INNER JOIN category_tree ct ON c.parent_id = ct.id
        WHERE ct.level < 10 AND FIND_IN_SET(c.id, ct.path) = 0
      )
      SELECT id FROM category_tree
    `, [categoryId])
    
    return result.map(row => row.id)
  } catch (error) {
    console.error('Error getting subcategory IDs:', error)
    // Fallback to original method if CTE is not supported
    return await getAllSubcategoryIdsFallback(categoryId)
  }
}

// Helper function to get vendor information for categories with products in subcategories
async function getVendorInfoForCategories(categoryIds) {
  try {
    if (categoryIds.length === 0) {
      return {}
    }
    
    // Get vendor information for categories that have products directly or in subcategories
    const [result] = await db.execute(`
      SELECT DISTINCT 
        c.id as category_id,
        v.name as vendor_name,
        v.id as vendor_id
      FROM categories c
      JOIN categories sub ON sub.parent_id = c.id OR sub.parent_id IN (
        SELECT id FROM categories WHERE parent_id = c.id
      ) OR sub.parent_id IN (
        SELECT id FROM categories WHERE parent_id IN (
          SELECT id FROM categories WHERE parent_id = c.id
        )
      ) OR sub.parent_id IN (
        SELECT id FROM categories WHERE parent_id IN (
          SELECT id FROM categories WHERE parent_id IN (
            SELECT id FROM categories WHERE parent_id = c.id
          )
        )
      ) OR sub.parent_id IN (
        SELECT id FROM categories WHERE parent_id IN (
          SELECT id FROM categories WHERE parent_id IN (
            SELECT id FROM categories WHERE parent_id IN (
              SELECT id FROM categories WHERE parent_id = c.id
            )
          )
        )
      )
      JOIN products p ON sub.id = p.vendor_category_id
      JOIN vendors v ON p.vendor_id = v.id
      WHERE c.id IN (${categoryIds.map(() => '?').join(',')}) AND c.type = 'vendor'
    `, categoryIds)
    
    const vendorMap = {}
    result.forEach(row => {
      vendorMap[row.category_id] = {
        vendor_name: row.vendor_name,
        vendor_id: row.vendor_id
      }
    })
    
    return vendorMap
  } catch (error) {
    console.error('Error getting vendor info for categories:', error)
    return {}
  }
}

// Fallback method for databases that don't support CTE
async function getAllSubcategoryIdsFallback(categoryId) {
  const allIds = new Set([categoryId])
  
  const [subcategories] = await db.execute(
    "SELECT id FROM categories WHERE parent_id = ?",
    [categoryId]
  )
  
  for (const subcategory of subcategories) {
    const nestedIds = await getAllSubcategoryIdsFallback(subcategory.id)
    nestedIds.forEach(id => allIds.add(id))
  }
  
  return Array.from(allIds)
}

// Optimized helper function to calculate hierarchical product count
async function getHierarchicalProductCount(categoryId) {
  try {
    const allCategoryIds = await getAllSubcategoryIds(categoryId)
    
    if (allCategoryIds.length === 0) {
      return 0
    }
    
    const [result] = await db.execute(`
      SELECT COUNT(DISTINCT p.id) as total_count
      FROM products p
      WHERE p.store_category_id IN (${allCategoryIds.map(() => '?').join(',')}) 
         OR p.vendor_category_id IN (${allCategoryIds.map(() => '?').join(',')})
    `, [...allCategoryIds, ...allCategoryIds])
    
    return parseInt(result[0].total_count) || 0
  } catch (error) {
    console.error('Error calculating hierarchical product count:', error)
    return 0
  }
}

// Batch function to get hierarchical counts for multiple categories efficiently
async function getBatchHierarchicalProductCounts(categoryIds) {
  try {
    if (categoryIds.length === 0) {
      return {}
    }
    
    // Get all subcategory relationships in one query with depth limiting
    const [allRelationships] = await db.execute(`
      WITH RECURSIVE category_tree AS (
        SELECT id, parent_id, 0 as level, CAST(id AS CHAR(1000)) as path
        FROM categories 
        WHERE id IN (${categoryIds.map(() => '?').join(',')})
        
        UNION ALL
        
        SELECT c.id, c.parent_id, ct.level + 1, CONCAT(ct.path, ',', c.id)
        FROM categories c
        INNER JOIN category_tree ct ON c.parent_id = ct.id
        WHERE ct.level < 10 AND FIND_IN_SET(c.id, ct.path) = 0
      )
      SELECT id, parent_id FROM category_tree
    `, categoryIds)
    
    // Build a map of category to all its subcategories
    const categoryToSubcategories = new Map()
    
    // Initialize with the original categories
    categoryIds.forEach(id => {
      categoryToSubcategories.set(id, new Set([id]))
    })
    
    // Add subcategories to their parent categories
    allRelationships.forEach(rel => {
      if (rel.parent_id && categoryIds.includes(rel.parent_id)) {
        categoryToSubcategories.get(rel.parent_id).add(rel.id)
      }
    })
    
    // Get all unique category IDs that need to be checked
    const allUniqueIds = new Set()
    categoryToSubcategories.forEach(subcategories => {
      subcategories.forEach(id => allUniqueIds.add(id))
    })
    
    if (allUniqueIds.size === 0) {
      return Object.fromEntries(categoryIds.map(id => [id, 0]))
    }
    
    // Get product counts for all categories in one query - FIXED LOGIC
    // Count products that belong to each category directly (not through subcategories)
    const [productCounts] = await db.execute(`
      SELECT 
        COALESCE(store_category_id, vendor_category_id) as category_id,
        COUNT(DISTINCT id) as count
      FROM products 
      WHERE store_category_id IN (${Array.from(allUniqueIds).map(() => '?').join(',')})
         OR vendor_category_id IN (${Array.from(allUniqueIds).map(() => '?').join(',')})
      GROUP BY COALESCE(store_category_id, vendor_category_id)
    `, [...Array.from(allUniqueIds), ...Array.from(allUniqueIds)])
    
    // Build a map of category_id to product count
    const categoryProductCounts = new Map()
    productCounts.forEach(row => {
      categoryProductCounts.set(row.category_id, parseInt(row.count))
    })
    
    // Calculate hierarchical counts for each original category
    const result = {}
    categoryIds.forEach(categoryId => {
      let totalCount = 0
      categoryToSubcategories.get(categoryId).forEach(subcategoryId => {
        totalCount += categoryProductCounts.get(subcategoryId) || 0
      })
      result[categoryId] = totalCount
    })
    
    return result
  } catch (error) {
    console.error('Error calculating batch hierarchical product counts:', error)
    // Fallback to individual calculations
    const result = {}
    for (const categoryId of categoryIds) {
      result[categoryId] = await getHierarchicalProductCount(categoryId)
    }
    return result
  }
}

// Vendor-specific hierarchical product count function
async function getVendorHierarchicalProductCounts(categoryIds, vendorId) {
  try {
    if (categoryIds.length === 0) {
      return {}
    }
    
    // Get all subcategory relationships in one query with depth limiting
    const [allRelationships] = await db.execute(`
      WITH RECURSIVE category_tree AS (
        SELECT id, parent_id, 0 as level, CAST(id AS CHAR(1000)) as path
        FROM categories 
        WHERE id IN (${categoryIds.map(() => '?').join(',')})
        
        UNION ALL
        
        SELECT c.id, c.parent_id, ct.level + 1, CONCAT(ct.path, ',', c.id)
        FROM categories c
        INNER JOIN category_tree ct ON c.parent_id = ct.id
        WHERE ct.level < 10 AND FIND_IN_SET(c.id, ct.path) = 0
      )
      SELECT id, parent_id FROM category_tree
    `, categoryIds)
    
    // Build a map of category to all its subcategories
    const categoryToSubcategories = new Map()
    
    // Initialize with the original categories
    categoryIds.forEach(id => {
      categoryToSubcategories.set(id, new Set())
    })
    
    // Build the hierarchy map
    allRelationships.forEach(rel => {
      if (rel.parent_id && categoryToSubcategories.has(rel.parent_id)) {
        categoryToSubcategories.get(rel.parent_id).add(rel.id)
      }
    })
    
    // Get product counts for all categories in the hierarchy
    const allCategoryIds = allRelationships.map(rel => rel.id)
    const [productCounts] = await db.execute(`
      SELECT vendor_category_id, COUNT(DISTINCT id) as count
      FROM products 
      WHERE vendor_category_id IN (${allCategoryIds.map(() => '?').join(',')}) 
        AND vendor_id = ?
      GROUP BY vendor_category_id
    `, [...allCategoryIds, vendorId])
    
    // Create a map of category ID to product count
    const categoryProductCounts = new Map()
    productCounts.forEach(row => {
      categoryProductCounts.set(row.vendor_category_id, parseInt(row.count))
    })
    
    // Calculate hierarchical counts
    const result = {}
    categoryIds.forEach(categoryId => {
      let totalCount = 0
      
      // Add products from the category itself
      const directCount = categoryProductCounts.get(categoryId) || 0
      totalCount += directCount
      
      // Add products from all subcategories
      const subcategoryIds = Array.from(categoryToSubcategories.get(categoryId))
      let subcategoryCount = 0
      subcategoryIds.forEach(subcategoryId => {
        const subCount = categoryProductCounts.get(subcategoryId) || 0
        subcategoryCount += subCount
      })
      totalCount += subcategoryCount
      

      
      result[categoryId] = totalCount
    })
    
    return result
  } catch (error) {
    console.error('Error calculating vendor hierarchical product counts:', error)
    // Fallback to individual calculations
    const result = {}
    for (const categoryId of categoryIds) {
      result[categoryId] = await getVendorHierarchicalProductCount(categoryId, vendorId)
    }
    return result
  }
}

// Helper function for vendor-specific hierarchical product count
async function getVendorHierarchicalProductCount(categoryId, vendorId) {
  try {
    const allCategoryIds = await getAllSubcategoryIds(categoryId)
    
    if (allCategoryIds.length === 0) {
      return 0
    }
    
    const [result] = await db.execute(`
      SELECT COUNT(DISTINCT p.id) as total_count
      FROM products p
      WHERE p.vendor_category_id IN (${allCategoryIds.map(() => '?').join(',')}) 
        AND p.vendor_id = ?
    `, [...allCategoryIds, vendorId])
    
    return parseInt(result[0].total_count) || 0
  } catch (error) {
    console.error('Error calculating vendor hierarchical product count:', error)
    return 0
  }
}

// Store-specific hierarchical product count function
async function getStoreHierarchicalProductCounts(categoryIds, vendorId) {
  try {
    if (categoryIds.length === 0) {
      return {}
    }
    
    // Get all subcategory relationships in one query with depth limiting
    const [allRelationships] = await db.execute(`
      WITH RECURSIVE category_tree AS (
        SELECT id, parent_id, 0 as level, CAST(id AS CHAR(1000)) as path
        FROM categories 
        WHERE id IN (${categoryIds.map(() => '?').join(',')})
        
        UNION ALL
        
        SELECT c.id, c.parent_id, ct.level + 1, CONCAT(ct.path, ',', c.id)
        FROM categories c
        INNER JOIN category_tree ct ON c.parent_id = ct.id
        WHERE ct.level < 10 AND FIND_IN_SET(c.id, ct.path) = 0
      )
      SELECT id, parent_id FROM category_tree
    `, categoryIds)
    
    // Build a map of category to all its subcategories
    const categoryToSubcategories = new Map()
    
    // Initialize with the original categories
    categoryIds.forEach(id => {
      categoryToSubcategories.set(id, new Set())
    })
    
    // Build the hierarchy map
    allRelationships.forEach(rel => {
      if (rel.parent_id && categoryToSubcategories.has(rel.parent_id)) {
        categoryToSubcategories.get(rel.parent_id).add(rel.id)
      }
    })
    
    // Get product counts for all categories in the hierarchy
    const allCategoryIds = allRelationships.map(rel => rel.id)
    const [productCounts] = await db.execute(`
      SELECT store_category_id, COUNT(DISTINCT id) as count
      FROM products 
      WHERE store_category_id IN (${allCategoryIds.map(() => '?').join(',')}) 
        AND vendor_id = ?
      GROUP BY store_category_id
    `, [...allCategoryIds, vendorId])
    
    // Create a map of category ID to product count
    const categoryProductCounts = new Map()
    productCounts.forEach(row => {
      categoryProductCounts.set(row.store_category_id, parseInt(row.count))
    })
    
    // Calculate hierarchical counts
    const result = {}
    categoryIds.forEach(categoryId => {
      let totalCount = 0
      
      // Add products from the category itself
      totalCount += categoryProductCounts.get(categoryId) || 0
      
      // Add products from all subcategories
      categoryToSubcategories.get(categoryId).forEach(subcategoryId => {
        totalCount += categoryProductCounts.get(subcategoryId) || 0
      })
      
      result[categoryId] = totalCount
    })
    
    return result
  } catch (error) {
    console.error('Error calculating store hierarchical product counts:', error)
    // Fallback to individual calculations
    const result = {}
    for (const categoryId of categoryIds) {
      result[categoryId] = await getStoreHierarchicalProductCount(categoryId, vendorId)
    }
    return result
  }
}

// Helper function for store-specific hierarchical product count
async function getStoreHierarchicalProductCount(categoryId, vendorId) {
  try {
    const allCategoryIds = await getAllSubcategoryIds(categoryId)
    
    if (allCategoryIds.length === 0) {
      return 0
    }
    
    const [result] = await db.execute(`
      SELECT COUNT(DISTINCT p.id) as total_count
      FROM products p
      WHERE p.store_category_id IN (${allCategoryIds.map(() => '?').join(',')}) 
        AND p.vendor_id = ?
    `, [...allCategoryIds, vendorId])
    
    return parseInt(result[0].total_count) || 0
  } catch (error) {
    console.error('Error calculating store hierarchical product count:', error)
    return 0
  }
}

// Helper function to update subcategory levels recursively
async function updateSubcategoryLevels(parentId, parentLevel) {
  try {
    // Get all direct subcategories
    const [subcategories] = await db.execute(
      "SELECT id FROM categories WHERE parent_id = ?",
      [parentId]
    )
    
    for (const subcategory of subcategories) {
      const newLevel = parentLevel + 1
      
      // Update this subcategory's level
      await db.execute(
        "UPDATE categories SET level = ? WHERE id = ?",
        [newLevel, subcategory.id]
      )
      
      // Recursively update its subcategories
      await updateSubcategoryLevels(subcategory.id, newLevel)
    }
  } catch (error) {
    console.error('Error updating subcategory levels:', error)
  }
}

// Simple cache for categories (5 minutes)
let categoriesCache = null
let categoriesCacheTime = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

// Function to invalidate categories cache
function invalidateCategoriesCache() {
  categoriesCache = null
  categoriesCacheTime = 0
}

// Get all categories with nested structure and hierarchical product counts
router.get("/", authenticateToken, async (req, res) => {
  try {
    // Check cache first
    const now = Date.now()
    if (categoriesCache && (now - categoriesCacheTime) < CACHE_DURATION) {
      return res.json(categoriesCache)
    }

    // Get all categories with basic information including vendor_id and product counts
    const [categories] = await db.execute(`
      SELECT 
        c.id, c.name, c.type, c.parent_id, c.level, 
        c.status, c.created_at, c.vendor_id,
        p.name as parent_name,
        v.name as vendor_name,
        COALESCE(
          (SELECT COUNT(DISTINCT p2.id) 
           FROM products p2 
           WHERE p2.store_category_id = c.id OR p2.vendor_category_id = c.id), 0
        ) as direct_product_count
      FROM categories c
      LEFT JOIN categories p ON c.parent_id = p.id
      LEFT JOIN vendors v ON c.vendor_id = v.id
      ORDER BY COALESCE(c.parent_id, c.id), c.level, c.name
    `)

    // Add product count and vendor info to categories
    const categoriesWithCounts = categories.map(category => ({
      ...category,
      product_count: parseInt(category.direct_product_count) || 0,
      vendor_name: category.vendor_name || null,
      vendor_id: category.vendor_id || null
    }))

    // Build nested structure
    const buildCategoryTree = (items, parentId = null) => {
      return items
        .filter(item => item.parent_id === parentId)
        .map(item => ({
          ...item,
          description: item.type, // Map type to description for compatibility
          subcategories: buildCategoryTree(items, item.id)
        }))
    }

    const categoryTree = buildCategoryTree(categoriesWithCounts)

    const result = {
      categories: categoryTree,
      flatCategories: categoriesWithCounts
    }

    // Update cache
    categoriesCache = result
    categoriesCacheTime = now

    res.json(result)
  } catch (error) {
    console.error("Get categories error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Get categories by type (vendor or store) with optimized performance
router.get("/type/:type", authenticateToken, async (req, res) => {
  try {
    const { type } = req.params
    
    if (!['vendor', 'store'].includes(type)) {
      return res.status(400).json({ message: "Invalid category type. Must be 'vendor' or 'store'" })
    }
    
    // Get all categories of the specified type with product counts
    const [categories] = await db.execute(`
      SELECT 
        c.id, c.name, c.type, c.parent_id, c.level, 
        c.status, c.created_at, c.vendor_id,
        p.name as parent_name,
        v.name as vendor_name,
        COALESCE(
          (SELECT COUNT(DISTINCT p2.id) 
           FROM products p2 
           WHERE (c.type = 'vendor' AND p2.vendor_category_id = c.id) 
              OR (c.type = 'store' AND p2.store_category_id = c.id)), 0
        ) as direct_product_count
      FROM categories c
      LEFT JOIN categories p ON c.parent_id = p.id
      LEFT JOIN vendors v ON c.vendor_id = v.id
      WHERE c.type = ?
      ORDER BY COALESCE(c.parent_id, c.id), c.level, c.name
    `, [type])

    // Add product count and vendor info to categories
    const categoriesWithCounts = categories.map(category => ({
      ...category,
      product_count: parseInt(category.direct_product_count) || 0,
      vendor_name: category.vendor_name || null,
      vendor_id: category.vendor_id || null
    }))

    // Build nested structure
    const buildCategoryTree = (items, parentId = null) => {
      return items
        .filter(item => item.parent_id === parentId)
        .map(item => ({
          ...item,
          description: item.type, // Map type to description for compatibility
          subcategories: buildCategoryTree(items, item.id)
        }))
    }

    const categoryTree = buildCategoryTree(categoriesWithCounts)

    res.json({
      categories: categoryTree,
      flatCategories: categoriesWithCounts
    })
  } catch (error) {
    console.error("Get categories by type error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// router.get("/vendor/:vendorId", authenticateToken, async (req, res) => {
//   try {
//     const { vendorId } = req.params
//     const { type } = req.query // Optional type filter: 'vendor', 'store', or 'all'
    
//     // Build the query based on type filter
//     let typeFilter = ""
//     if (type === 'vendor') {
//       typeFilter = "AND c.type = 'vendor'"
//     } else if (type === 'store') {
//       typeFilter = "AND c.type = 'store'"
//     }
//     // If type is 'all' or not specified, include both types
    
//     // Get categories for the vendor with proper filtering
//     let categories = []
    
//     if (!typeFilter || typeFilter.includes("vendor")) {
//       // Get vendor categories and their parent hierarchy
//       const [vendorCategories] = await db.execute(`
//         WITH RECURSIVE category_hierarchy AS (
//           -- Start with categories directly assigned to this vendor
//           SELECT 
//             c.id, c.name, c.type, c.parent_id, c.level, 
//             c.status, c.created_at, c.vendor_id,
//             0 as depth
//           FROM categories c
//           WHERE c.type = 'vendor' AND c.vendor_id = ?
          
//           UNION ALL
          
//           -- Add parent categories recursively
//           SELECT 
//             p.id, p.name, p.type, p.parent_id, p.level, 
//             p.status, p.created_at, p.vendor_id,
//             ch.depth + 1
//           FROM categories p
//           INNER JOIN category_hierarchy ch ON p.id = ch.parent_id
//           WHERE ch.depth < 10 -- Prevent infinite recursion
//         )
//         SELECT DISTINCT
//           ch.id, ch.name, ch.type, ch.parent_id, ch.level, 
//           ch.status, ch.created_at,
//           p.name as parent_name,
//           v.name as vendor_name,
//           v.id as vendor_id
//         FROM category_hierarchy ch
//         LEFT JOIN categories p ON ch.parent_id = p.id
//         LEFT JOIN vendors v ON ch.vendor_id = v.id
//         ORDER BY COALESCE(ch.parent_id, ch.id), ch.level, ch.name
//       `, [vendorId])
      
//       categories = [...categories, ...vendorCategories]
//     }
    
//     if (!typeFilter || typeFilter.includes("store")) {
//       // Get store categories that have products from this vendor
//       const [storeCategories] = await db.execute(`
//         SELECT DISTINCT
//           c.id, c.name, c.type, c.parent_id, c.level, 
//           c.status, c.created_at,
//           p.name as parent_name,
//           v.name as vendor_name,
//           v.id as vendor_id
//         FROM categories c
//         LEFT JOIN categories p ON c.parent_id = p.id
//         LEFT JOIN products prod ON c.id = prod.store_category_id
//         LEFT JOIN vendors v ON v.id = ?
//         WHERE c.type = 'store' AND prod.vendor_id = ?
//         ORDER BY COALESCE(c.parent_id, c.id), c.level, c.name
//       `, [vendorId, vendorId])
      
//       categories = [...categories, ...storeCategories]
//     }
    
//     if (categories.length === 0) {
//       return res.json({
//         categories: [],
//         flatCategories: []
//       })
//     }

//     // Debug: Log what categories we found
//     console.log(`🔍 Found ${categories.length} categories for vendor ${vendorId}`)
//     console.log(`📋 Categories:`, categories.map(c => ({ id: c.id, name: c.name, parent_id: c.parent_id, level: c.level })))
    
//     // Get hierarchical product counts for all categories
//     const categoryIds = categories.map(cat => cat.id)

    
//     // Get direct product counts for all categories
//     const allCategoryIds = categories.map(cat => cat.id)
//     const [directProductCounts] = await db.execute(`
//       SELECT vendor_category_id, COUNT(DISTINCT id) as count
//       FROM products 
//       WHERE vendor_category_id IN (${allCategoryIds.map(() => '?').join(',')}) 
//         AND vendor_id = ?
//       GROUP BY vendor_category_id
//     `, [...allCategoryIds, vendorId])
    
//     // Create a map of category ID to direct product count
//     const directProductCountMap = new Map()
//     directProductCounts.forEach(row => {
//       directProductCountMap.set(row.vendor_category_id, parseInt(row.count))
//     })

//     // Add direct product counts to categories, but hide counts for parents with subcategories that have products
//     const categoriesWithDirectCounts = categories.map(category => {
//       const directCount = directProductCountMap.get(category.id) || 0
      
//       // Check if this category has subcategories with products
//       const subcategoriesWithProducts = categories.filter(subcat => 
//         subcat.parent_id === category.id && (directProductCountMap.get(subcat.id) || 0) > 0
//       )
      
//       const hasSubcategoriesWithProducts = subcategoriesWithProducts.length > 0
      
//       // If category has subcategories with products, show 0 instead of its own count
//       const finalCount = hasSubcategoriesWithProducts ? 0 : directCount
      
//       // Debug logging for "New Premium" category
//       if (category.id === 1768) {
//         console.log(`🔍 Debug for New Premium (${category.id}):`)
//         console.log(`  - Direct count: ${directCount}`)
//         console.log(`  - All subcategories:`, categories.filter(sc => sc.parent_id === category.id).map(sc => ({ id: sc.id, name: sc.name, count: directProductCountMap.get(sc.id) || 0 })))
//         console.log(`  - Subcategories with products:`, subcategoriesWithProducts.map(sc => ({ id: sc.id, name: sc.name, count: directProductCountMap.get(sc.id) || 0 })))
//         console.log(`  - Has subcategories with products: ${hasSubcategoriesWithProducts}`)
//         console.log(`  - Final count: ${finalCount}`)
//         console.log(`  - Direct product count map:`, Object.fromEntries(directProductCountMap))
//       }
      
//       return {
//         ...category,
//         product_count: finalCount
//       }
//     })

//     // Build nested structure
//     const buildCategoryTree = (items, parentId = null) => {
//       const filtered = items.filter(item => item.parent_id === parentId)
//       console.log(`🌳 Building tree for parent ${parentId}: ${filtered.length} items`)
      
//       return filtered.map(item => {
//         const subcategories = buildCategoryTree(items, item.id)
//         console.log(`📁 Category ${item.name} (${item.id}) has ${subcategories.length} subcategories`)
//         return {
//           ...item,
//           description: item.type, // Map type to description for compatibility
//           subcategories: subcategories
//         }
//       })
//     }

//     const categoryTree = buildCategoryTree(categoriesWithDirectCounts)
//     console.log(`🌲 Final tree has ${categoryTree.length} root categories`)

//     res.json({
//       categories: categoryTree,
//       flatCategories: categoriesWithDirectCounts
//     })
//   } catch (error) {
//     console.error("Get categories by vendor error:", error)
//     res.status(500).json({ message: "Server error" })
//   }
// })

// Merge categories - move products from source to target and delete source

router.get("/vendor/:vendorId", authenticateToken, async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { type } = req.query; // Optional type filter: 'vendor', 'store', or 'all'

    // Build the query based on type filter
    let typeFilter = "";
    if (type === 'vendor') {
      typeFilter = "AND c.type = 'vendor'";
    } else if (type === 'store') {
      typeFilter = "AND c.type = 'store'";
    }

    // Get categories for the vendor with proper filtering
    let categories = [];

    if (!typeFilter || typeFilter.includes("vendor")) {
      // Get vendor categories and their parent hierarchy
      const [vendorCategories] = await db.execute(`
        WITH RECURSIVE category_hierarchy AS (
          -- Start with categories directly assigned to this vendor
          SELECT 
            c.id, c.name, c.type, c.parent_id, c.level, 
            c.status, c.created_at, c.vendor_id,
            0 as depth
          FROM categories c
          WHERE c.type = 'vendor' AND c.vendor_id = ?
          
          UNION ALL
          
          -- Add parent categories recursively
          SELECT 
            p.id, p.name, p.type, p.parent_id, p.level, 
            p.status, p.created_at, p.vendor_id,
            ch.depth + 1
          FROM categories p
          INNER JOIN category_hierarchy ch ON p.id = ch.parent_id
          WHERE ch.depth < 10 -- Prevent infinite recursion
        )
        SELECT DISTINCT
          ch.id, ch.name, ch.type, ch.parent_id, ch.level, 
          ch.status, ch.created_at,
          p.name as parent_name,
          v.name as vendor_name,
          v.id as vendor_id
        FROM category_hierarchy ch
        LEFT JOIN categories p ON ch.parent_id = p.id
        LEFT JOIN vendors v ON ch.vendor_id = v.id
        ORDER BY COALESCE(ch.parent_id, ch.id), ch.level, ch.name
      `, [vendorId]);
      
      categories = [...categories, ...vendorCategories];
    }

    if (!typeFilter || typeFilter.includes("store")) {
      // Get store categories that have products from this vendor
      const [storeCategories] = await db.execute(`
        SELECT DISTINCT
          c.id, c.name, c.type, c.parent_id, c.level, 
          c.status, c.created_at,
          p.name as parent_name,
          v.name as vendor_name,
          v.id as vendor_id
        FROM categories c
        LEFT JOIN categories p ON c.parent_id = p.id
        LEFT JOIN products prod ON c.id = prod.store_category_id
        LEFT JOIN vendors v ON v.id = ?
        WHERE c.type = 'store' AND prod.vendor_id = ?
        ORDER BY COALESCE(c.parent_id, c.id), c.level, c.name
      `, [vendorId, vendorId]);
      
      categories = [...categories, ...storeCategories];
    }

    if (categories.length === 0) {
      return res.json({
        categories: [],
        flatCategories: []
      });
    }

    // Get ALL products for this vendor in one query
    const [allProducts] = await db.execute(`
      SELECT id, vendor_category_id 
      FROM products 
      WHERE vendor_id = ?
    `, [vendorId]);

    // Create a map of category ID to array of product IDs
    const categoryProductsMap = new Map();
    allProducts.forEach(product => {
      const categoryId = product.vendor_category_id;
      if (!categoryProductsMap.has(categoryId)) {
        categoryProductsMap.set(categoryId, []);
      }
      categoryProductsMap.get(categoryId).push(product.id);
    });

    // Create a set of all category IDs that have products
    const categoriesWithProducts = new Set(categoryProductsMap.keys());

    // Calculate correct product counts for each category
    const categoriesWithCorrectCounts = categories.map(category => {
      // Get direct product IDs for this category
      const directProductIds = categoryProductsMap.get(category.id) || [];

      // Check if this category has any subcategories with products
      const hasSubcategoriesWithProducts = categories.some(
        subcat => subcat.parent_id === category.id && categoriesWithProducts.has(subcat.id)
      );

      // For categories with subcategories that have products, we show 0
      // For leaf categories or parents without product-bearing subcategories, we show direct count
      const product_count = hasSubcategoriesWithProducts ? 0 : directProductIds.length;

      return {
        ...category,
        product_count
      };
    });

    // Build nested structure
    const buildCategoryTree = (items, parentId = null) => {
      return items
        .filter(item => item.parent_id === parentId)
        .map(item => ({
          ...item,
          description: item.type, // Map type to description for compatibility
          subcategories: buildCategoryTree(items, item.id)
        }));
    };

    const categoryTree = buildCategoryTree(categoriesWithCorrectCounts);

    res.json({
      categories: categoryTree,
      flatCategories: categoriesWithCorrectCounts
    });
  } catch (error) {
    console.error("Get categories by vendor error:", error);
    res.status(500).json({ message: "Server error" });
  }
});


router.post("/merge", authenticateToken, async (req, res) => {
  try {
    const { sourceCategoryId, targetCategoryId, categoryType } = req.body

    if (!sourceCategoryId || !targetCategoryId) {
      return res.status(400).json({ message: "Source and target category IDs are required" })
    }

    if (sourceCategoryId === targetCategoryId) {
      return res.status(400).json({ message: "Source and target categories cannot be the same" })
    }

    // Get category details for validation
    const [categories] = await db.execute(`
      SELECT c.id, c.name, c.type, c.parent_id, c.level, 
             COUNT(DISTINCT p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.store_category_id OR c.id = p.vendor_category_id
      WHERE c.id IN (?, ?)
      GROUP BY c.id, c.name, c.type, c.parent_id, c.level
    `, [sourceCategoryId, targetCategoryId])

    if (categories.length !== 2) {
      return res.status(404).json({ message: "One or both categories not found" })
    }

    const sourceCategory = categories.find(c => c.id == sourceCategoryId)
    const targetCategory = categories.find(c => c.id == targetCategoryId)

    if (!sourceCategory || !targetCategory) {
      return res.status(404).json({ message: "Category not found" })
    }

    // Validate that both categories are of the same type
    if (sourceCategory.type !== targetCategory.type) {
      return res.status(400).json({ message: "Cannot merge categories of different types" })
    }

    // Check if source category has subcategories
    const [subcategories] = await db.execute(
      "SELECT id, name FROM categories WHERE parent_id = ?",
      [sourceCategoryId]
    )

    if (subcategories.length > 0) {
      return res.status(400).json({ 
        message: `Cannot merge category '${sourceCategory.name}' because it has ${subcategories.length} subcategories. Please move or delete subcategories first.`,
        subcategories: subcategories
      })
    }

    // Start transaction
    const connection = await db.getConnection()
    await connection.beginTransaction()

    try {
      // Move products from source to target category
      let movedProducts = 0
      
      if (categoryType === 'vendor' || categoryType === 'both') {
        const [vendorResult] = await connection.execute(
          "UPDATE products SET vendor_category_id = ? WHERE vendor_category_id = ?",
          [targetCategoryId, sourceCategoryId]
        )
        movedProducts += vendorResult.affectedRows
      }
      
      if (categoryType === 'store' || categoryType === 'both') {
        const [storeResult] = await connection.execute(
          "UPDATE products SET store_category_id = ? WHERE store_category_id = ?",
          [targetCategoryId, sourceCategoryId]
        )
        movedProducts += storeResult.affectedRows
      }

      // Note: We're not deleting the source category anymore - just moving products
      // The source category will remain empty but still exist

      await connection.commit()
      connection.release()

      res.json({
        message: `Successfully moved ${movedProducts} products from '${sourceCategory.name}' to '${targetCategory.name}'!`,
        details: {
          sourceCategory: sourceCategory.name,
          targetCategory: targetCategory.name,
          productsMoved: movedProducts,
          sourceCategoryKept: true
        }
      })

    } catch (error) {
      await connection.rollback()
      connection.release()
      throw error
    }

  } catch (error) {
    console.error("Merge categories error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    
    const [categories] = await db.execute(`
      SELECT 
        c.id, c.name, c.type, c.parent_id, c.level, 
        c.status, c.created_at
      FROM categories c
      WHERE c.id = ? OR c.parent_id = ?
      ORDER BY COALESCE(c.parent_id, c.id), c.level, c.name
    `, [id, id])

    if (categories.length === 0) {
      return res.status(404).json({ message: "Category not found" })
    }

    const category = categories.find(c => c.id == id)
    const subcategories = categories.filter(c => c.parent_id == id)

    // Calculate hierarchical product count for the main category
    const hierarchicalCount = await getHierarchicalProductCount(category.id)

    res.json({
      ...category,
      description: category.type, // Map type to description for compatibility
      product_count: hierarchicalCount, // Use hierarchical count
      subcategories
    })
  } catch (error) {
    console.error("Get category error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Create category
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { name, description, type, parent_id, status } = req.body

    console.log("Category creation request:", { name, description, type, parent_id, status })

    if (!name) {
      return res.status(400).json({ message: "Category name is required" })
    }

    // Use type if provided, otherwise use description, default to 'store'
    const categoryType = type || description || 'store'
    
    console.log("Resolved category type:", categoryType)
    
    if (!categoryType || !['vendor', 'store'].includes(categoryType)) {
      return res.status(400).json({ 
        message: "Category type is required and must be 'vendor' or 'store'",
        received: { type, description, resolved: categoryType }
      })
    }

    // Check if parent category exists
    if (parent_id && parent_id !== "" && parent_id !== null && parent_id !== undefined) {
      console.log("Creating subcategory with parent_id:", parent_id, "Type:", typeof parent_id)
      
      // Ensure parent_id is a number
      const numericParentId = parseInt(parent_id)
      if (isNaN(numericParentId)) {
        return res.status(400).json({ message: "Invalid parent_id format" })
      }
      
      const [parentCategory] = await db.execute(
        "SELECT id, level, vendor_id FROM categories WHERE id = ?",
        [numericParentId]
      )
      if (parentCategory.length === 0) {
        return res.status(400).json({ message: "Parent category not found" })
      }
      
      // Get vendor_id from parent category
      const parentVendorId = parentCategory[0].vendor_id
      console.log("Parent vendor_id:", parentVendorId)
      
      // Calculate new level
      const newLevel = parentCategory[0].level + 1
      console.log("Parent level:", parentCategory[0].level, "New level:", newLevel)
      
      const [result] = await db.execute(`
        INSERT INTO categories (name, type, parent_id, vendor_id, level, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, NOW())
      `, [name, categoryType, numericParentId, parentVendorId, newLevel, status || 'active'])
      
      const categoryId = result.insertId

      // Get the created category with vendor information
      const [newCategory] = await db.execute(`
        SELECT c.*, v.name as vendor_name 
        FROM categories c
        LEFT JOIN vendors v ON c.vendor_id = v.id
        WHERE c.id = ?
      `, [categoryId])

      // Invalidate cache
      invalidateCategoriesCache()
      
      res.status(201).json({
        message: "Category created successfully",
        category: newCategory[0]
      })
    } else {
      // Root category
      console.log("Creating root category with level 1")
      const [result] = await db.execute(`
        INSERT INTO categories (name, type, parent_id, vendor_id, level, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, NOW())
      `, [name, categoryType, null, null, 1, status || 'active'])
      
      const categoryId = result.insertId

      // Get the created category with vendor information
      const [newCategory] = await db.execute(`
        SELECT c.*, v.name as vendor_name 
        FROM categories c
        LEFT JOIN vendors v ON c.vendor_id = v.id
        WHERE c.id = ?
      `, [categoryId])

      // Invalidate cache
      invalidateCategoriesCache()
      
      res.status(201).json({
        message: "Category created successfully",
        category: newCategory[0]
      })
    }
  } catch (error) {
    console.error("Create category error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Update category
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const { name, description, type, parent_id, status } = req.body

    if (!name) {
      return res.status(400).json({ message: "Category name is required" })
    }

    // Use type if provided, otherwise use description, default to 'store'
    const categoryType = type || description || 'store'

    // Check if category exists and get its current data
    const [existingCategory] = await db.execute(
      "SELECT id, parent_id, level FROM categories WHERE id = ?",
      [id]
    )
    if (existingCategory.length === 0) {
      return res.status(404).json({ message: "Category not found" })
    }

    const currentCategory = existingCategory[0]
    console.log("Updating category:", { id, currentParent: currentCategory.parent_id, newParent: parent_id })

    // Check if parent category exists
    if (parent_id && parent_id !== "" && parent_id !== null && parent_id !== undefined) {
      console.log("Updating category with parent_id:", parent_id, "Type:", typeof parent_id)
      
      // Ensure parent_id is a number
      const numericParentId = parseInt(parent_id)
      if (isNaN(numericParentId)) {
        return res.status(400).json({ message: "Invalid parent_id format" })
      }
      
      const [parentCategory] = await db.execute(
        "SELECT id, level FROM categories WHERE id = ?",
        [numericParentId]
      )
      if (parentCategory.length === 0) {
        return res.status(400).json({ message: "Parent category not found" })
      }

      // Prevent circular reference
      if (numericParentId == id) {
        return res.status(400).json({ message: "Category cannot be its own parent" })
      }

      // Check if the new parent would create a circular reference
      const [descendants] = await db.execute(`
        WITH RECURSIVE category_tree AS (
          SELECT id, parent_id, 0 as level
          FROM categories 
          WHERE id = ?
          
          UNION ALL
          
          SELECT c.id, c.parent_id, ct.level + 1
          FROM categories c
          INNER JOIN category_tree ct ON c.parent_id = ct.id
          WHERE ct.level < 10
        )
        SELECT id FROM category_tree
      `, [id])
      
      const descendantIds = descendants.map(d => d.id)
      if (descendantIds.includes(numericParentId)) {
        return res.status(400).json({ message: "Cannot move category to its own descendant" })
      }

      // Calculate new level
      const newLevel = parentCategory[0].level + 1

      // Update the category
      await db.execute(`
        UPDATE categories 
        SET name = ?, type = ?, parent_id = ?, level = ?, status = ?
        WHERE id = ?
      `, [name, categoryType, numericParentId, newLevel, status || 'active', id])

      // Update levels of all subcategories recursively
      await updateSubcategoryLevels(id, newLevel)
    } else {
      // Root category
      await db.execute(`
        UPDATE categories 
        SET name = ?, type = ?, parent_id = ?, level = ?, status = ?
        WHERE id = ?
      `, [name, categoryType, null, 1, status || 'active', id])
    }

    // Get updated category
    const [updatedCategory] = await db.execute(`
      SELECT * FROM categories WHERE id = ?
    `, [id])

    // Invalidate cache
    invalidateCategoriesCache()
    
    res.json({
      message: "Category updated successfully",
      category: updatedCategory[0]
    })
  } catch (error) {
    console.error("Update category error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Bulk delete categories with cascading delete (must come before /:id route)
router.delete("/bulk-delete", authenticateToken, async (req, res) => {
  // Set a timeout for the entire operation
  const timeout = setTimeout(() => {
    console.log("=== BULK DELETE TIMEOUT ===");
    if (!res.headersSent) {
      res.status(408).json({ message: "Request timeout - operation took too long" });
    }
  }, 30000); // 30 second timeout

  try {
    console.log("=== BULK DELETE REQUEST START ===");
    console.log("Request method:", req.method);
    console.log("Request URL:", req.url);
    console.log("Request headers:", req.headers);
    console.log("Request body:", req.body);
    
    const { categoryIds } = req.body

    console.log("Bulk delete request received:", { categoryIds })

    if (!categoryIds || !Array.isArray(categoryIds) || categoryIds.length === 0) {
      return res.status(400).json({ message: "Category IDs array is required" })
    }

    // Validate that all requested categories exist
    const [existingCategories] = await db.execute(
      "SELECT id, name FROM categories WHERE id IN (" + categoryIds.map(() => "?").join(",") + ")",
      categoryIds
    )

    if (existingCategories.length !== categoryIds.length) {
      const existingIds = existingCategories.map(cat => cat.id)
      const missingIds = categoryIds.filter(id => !existingIds.includes(id))
      return res.status(404).json({ 
        message: `Categories not found: ${missingIds.join(', ')}` 
      })
    }

    console.log("Found categories:", existingCategories.map(cat => `${cat.name} (ID: ${cat.id})`))

    // Get all category IDs including subcategories (hierarchical delete)
    console.log("Getting all category IDs including subcategories...")
    let allCategoryIds = [...categoryIds]
    
    try {
      // Use Common Table Expression for hierarchical query
      const [hierarchicalResults] = await db.execute(`
        WITH RECURSIVE category_tree AS (
          SELECT id, parent_id, 0 as level
          FROM categories 
          WHERE id IN (${categoryIds.map(() => '?').join(',')})
          
          UNION ALL
          
          SELECT c.id, c.parent_id, ct.level + 1
          FROM categories c
          INNER JOIN category_tree ct ON c.parent_id = ct.id
          WHERE ct.level < 10  -- Prevent infinite loops
        )
        SELECT DISTINCT id FROM category_tree
      `, categoryIds)
      
      allCategoryIds = hierarchicalResults.map(row => row.id)
      console.log(`Found ${allCategoryIds.length} total categories to delete (including subcategories)`)
      
    } catch (error) {
      console.log("CTE not supported, using iterative approach")
      // Fallback: iterative approach to get all subcategories
      const getAllSubcategoryIds = async (parentIds) => {
        const allIds = new Set(parentIds)
        const queue = [...parentIds]
        
        while (queue.length > 0) {
          const currentId = queue.shift()
          
          const [subcategories] = await db.execute(
            "SELECT id FROM categories WHERE parent_id = ?",
            [currentId]
          )
          
          subcategories.forEach(cat => {
            if (!allIds.has(cat.id)) {
              allIds.add(cat.id)
              queue.push(cat.id)
            }
          })
        }
        
        return Array.from(allIds)
      }
      
      allCategoryIds = await getAllSubcategoryIds(categoryIds)
      console.log(`Found ${allCategoryIds.length} total categories to delete (iterative approach)`)
    }
    console.log("All categories to be deleted:", allCategoryIds)
    
    // Get Uncategorized category IDs for moving products
    console.log("Getting Uncategorized category IDs...")
    const [uncategorizedCategories] = await db.execute(
      "SELECT id, type FROM categories WHERE name = 'Uncategorized'"
    );
    
    const uncategorizedStoreId = uncategorizedCategories.find(cat => cat.type === 'store')?.id;
    const uncategorizedVendorId = uncategorizedCategories.find(cat => cat.type === 'vendor')?.id;
    
    // Check if any categories are used by products
    console.log("Checking for affected products...")
    const [products] = await db.execute(
      "SELECT id, name, store_category_id, vendor_category_id FROM products WHERE store_category_id IN (" + 
      allCategoryIds.map(() => "?").join(",") + 
      ") OR vendor_category_id IN (" + 
      allCategoryIds.map(() => "?").join(",") + ")",
      [...allCategoryIds, ...allCategoryIds]
    )
    
    let movedProductsCount = 0;
    if (products.length > 0) {
      console.log(`Moving ${products.length} products to Uncategorized categories`);
      
      // Move products to Uncategorized categories
      for (const product of products) {
        const updates = [];
        const values = [];
        
        if (product.store_category_id && allCategoryIds.includes(product.store_category_id)) {
          if (uncategorizedStoreId) {
            updates.push('store_category_id = ?');
            values.push(uncategorizedStoreId);
            movedProductsCount++;
          }
        }
        
        if (product.vendor_category_id && allCategoryIds.includes(product.vendor_category_id)) {
          if (uncategorizedVendorId) {
            updates.push('vendor_category_id = ?');
            values.push(uncategorizedVendorId);
            movedProductsCount++;
          }
        }
        
        if (updates.length > 0) {
          values.push(product.id);
          await db.execute(
            `UPDATE products SET ${updates.join(', ')} WHERE id = ?`,
            values
          );
        }
      }
    }

    if (movedProductsCount > 0) {
      console.log(`Successfully moved ${movedProductsCount} products to Uncategorized categories`);
    }

    // Delete all categories (cascading delete) with timeout
    console.log("Deleting categories from database...")
    const deleteStartTime = Date.now()
    
    await db.execute(
      "DELETE FROM categories WHERE id IN (" + allCategoryIds.map(() => "?").join(",") + ")",
      allCategoryIds
    )
    
    const deleteTime = Date.now() - deleteStartTime
    console.log(`Categories deleted in ${deleteTime}ms`)

    let message = `Successfully deleted ${allCategoryIds.length} categories (including all subcategories)`;
    if (movedProductsCount > 0) {
      message += ` and moved ${movedProductsCount} products to Uncategorized`;
    }
    
    console.log("=== BULK DELETE RESPONSE ===");
    console.log("Response message:", message);
    console.log("Deleted count:", allCategoryIds.length);
    console.log("Affected products:", products.length);
    
    res.json({ 
      message: message,
      deletedCount: allCategoryIds.length,
      movedProductsCount: movedProductsCount
    })
    
    // Clear timeout since operation completed successfully
    clearTimeout(timeout);
  } catch (error) {
    console.error("=== BULK DELETE ERROR ===");
    console.error("Bulk delete error:", error)
    console.error("Error stack:", error.stack)
    
    // Clear timeout
    clearTimeout(timeout);
    
    if (!res.headersSent) {
      res.status(500).json({ message: "Server error" })
    }
  }
})

// ULTRA FAST bulk delete - no validations, maximum speed
router.delete("/bulk-delete-fast", authenticateToken, async (req, res) => {
  const timeout = setTimeout(() => {
    console.log("=== ULTRA FAST BULK DELETE TIMEOUT ===");
    if (!res.headersSent) {
      res.status(408).json({ message: "Request timeout" });
    }
  }, 10000); // 10 second timeout

  try {
    console.log("=== ULTRA FAST BULK DELETE START ===");
    const { categoryIds } = req.body

    if (!categoryIds || !Array.isArray(categoryIds) || categoryIds.length === 0) {
      clearTimeout(timeout);
      return res.status(400).json({ message: "Category IDs array is required" })
    }

    console.log("Ultra fast delete for categories:", categoryIds);

    // ULTRA FAST: Direct delete without any checks
    const deleteStartTime = Date.now()
    
    await db.execute(
      "DELETE FROM categories WHERE id IN (" + categoryIds.map(() => "?").join(",") + ")",
      categoryIds
    )
    
    const deleteTime = Date.now() - deleteStartTime
    console.log(`Ultra fast delete completed in ${deleteTime}ms`)

    const message = `Successfully deleted ${categoryIds.length} categories (ultra fast mode)`;
    
    clearTimeout(timeout);
    res.json({ 
      message: message,
      deletedCount: categoryIds.length,
      deleteTime: deleteTime
    })
    
  } catch (error) {
    console.error("=== ULTRA FAST BULK DELETE ERROR ===");
    console.error("Error:", error)
    clearTimeout(timeout);
    
    if (!res.headersSent) {
      res.status(500).json({ message: "Server error" })
    }
  }
})

// Delete category
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params

    // Check if category exists
    const [existingCategory] = await db.execute(
      "SELECT id FROM categories WHERE id = ?",
      [id]
    )
    if (existingCategory.length === 0) {
      return res.status(404).json({ message: "Category not found" })
    }

    // Get all category IDs that need to be deleted (including subcategories)
    const getAllCategoryIds = async (parentId) => {
      const allIds = new Set([parentId])
      
      const [subcategories] = await db.execute(
        "SELECT id FROM categories WHERE parent_id = ?",
        [parentId]
      )
      
      for (const subcategory of subcategories) {
        const nestedIds = await getAllCategoryIds(subcategory.id)
        nestedIds.forEach(id => allIds.add(id))
      }
      
      return Array.from(allIds)
    }

    const allCategoryIds = await getAllCategoryIds(id)

    // Get Uncategorized category IDs
    const [uncategorizedCategories] = await db.execute(
      "SELECT id, type FROM categories WHERE name = 'Uncategorized'"
    );
    
    const uncategorizedStoreId = uncategorizedCategories.find(cat => cat.type === 'store')?.id;
    const uncategorizedVendorId = uncategorizedCategories.find(cat => cat.type === 'vendor')?.id;
    
    // Check if any of the categories to be deleted are used by products
    const [products] = await db.execute(
      "SELECT id, name, store_category_id, vendor_category_id FROM products WHERE store_category_id IN (" + 
      allCategoryIds.map(() => "?").join(",") + 
      ") OR vendor_category_id IN (" + 
      allCategoryIds.map(() => "?").join(",") + ")",
      [...allCategoryIds, ...allCategoryIds]
    )
    
    let movedProductsCount = 0;
    if (products.length > 0) {
      console.log(`Moving ${products.length} products to Uncategorized categories`);
      
      // Move products to Uncategorized categories
      for (const product of products) {
        const updates = [];
        const values = [];
        
        if (product.store_category_id && allCategoryIds.includes(product.store_category_id)) {
          if (uncategorizedStoreId) {
            updates.push('store_category_id = ?');
            values.push(uncategorizedStoreId);
            movedProductsCount++;
          }
        }
        
        if (product.vendor_category_id && allCategoryIds.includes(product.vendor_category_id)) {
          if (uncategorizedVendorId) {
            updates.push('vendor_category_id = ?');
            values.push(uncategorizedVendorId);
            movedProductsCount++;
          }
        }
        
        if (updates.length > 0) {
          values.push(product.id);
          await db.execute(
            `UPDATE products SET ${updates.join(', ')} WHERE id = ?`,
            values
          );
        }
      }
    }

    // Delete all categories (cascading delete)
    await db.execute(
      "DELETE FROM categories WHERE id IN (" + allCategoryIds.map(() => "?").join(",") + ")",
      allCategoryIds
    )

    let message = `Successfully deleted ${allCategoryIds.length} categories`;
    if (movedProductsCount > 0) {
      message += ` and moved ${movedProductsCount} products to Uncategorized`;
    }
    
    // Invalidate cache
    invalidateCategoriesCache()
    
    res.json({ 
      message: message,
      deletedCount: allCategoryIds.length,
      movedProductsCount: movedProductsCount
    })
  } catch (error) {
    console.error("Delete category error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Get category path (full hierarchy)
router.get("/:id/path", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    
    const path = []
    let currentId = id

    while (currentId) {
      const [category] = await db.execute(`
        SELECT c.id, c.name, c.parent_id, c.type
        FROM categories c
        WHERE c.id = ?
      `, [currentId])
      
      if (category.length === 0) break
      
      path.unshift(category[0])
      currentId = category[0].parent_id
    }

    res.json({ path })
  } catch (error) {
    console.error("Get category path error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Get category statistics with hierarchical product counts
router.get("/stats/overview", authenticateToken, async (req, res) => {
  try {
    const [stats] = await db.execute(`
      SELECT 
        COUNT(*) as total_categories,
        COUNT(CASE WHEN type = 'vendor' THEN 1 END) as vendor_categories,
        COUNT(CASE WHEN type = 'store' THEN 1 END) as store_categories,
        COUNT(CASE WHEN parent_id IS NULL THEN 1 END) as root_categories,
        MAX(level) as max_depth,
        COUNT(CASE WHEN id NOT IN (SELECT DISTINCT parent_id FROM categories WHERE parent_id IS NOT NULL) THEN 1 END) as leaf_categories
      FROM categories
    `)

    // Get categories with direct products
    const [directProductStats] = await db.execute(`
      SELECT 
        COUNT(DISTINCT c.id) as categories_with_direct_products,
        COUNT(DISTINCT c.id) - COUNT(DISTINCT CASE WHEN p.id IS NOT NULL THEN c.id END) as categories_without_direct_products
      FROM categories c
      LEFT JOIN products p ON c.id = p.store_category_id OR c.id = p.vendor_category_id
    `)

    res.json({
      ...stats[0],
      ...directProductStats[0]
    })
  } catch (error) {
    console.error("Get category stats error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Bulk operations
router.post("/bulk", authenticateToken, async (req, res) => {
  try {
    const { operation, categoryIds, updateData } = req.body

    if (!operation || !categoryIds || !Array.isArray(categoryIds)) {
      return res.status(400).json({ message: "Invalid request" })
    }

    switch (operation) {
      case "delete":
        // Get all category IDs that need to be deleted (including subcategories)
        const getAllCategoryIdsForBulk = async (parentId) => {
          const allIds = new Set([parentId])
          
          const [subcategories] = await db.execute(
            "SELECT id FROM categories WHERE parent_id = ?",
            [parentId]
          )
          
          for (const subcategory of subcategories) {
            const nestedIds = await getAllCategoryIdsForBulk(subcategory.id)
            nestedIds.forEach(id => allIds.add(id))
          }
          
          return Array.from(allIds)
        }

        const allCategoryIdsToDelete = new Set()
        
        // Get all subcategories for each category to be deleted
        for (const categoryId of categoryIds) {
          const categoryIdsWithSubs = await getAllCategoryIdsForBulk(categoryId)
          categoryIdsWithSubs.forEach(id => allCategoryIdsToDelete.add(id))
        }

        const finalCategoryIds = Array.from(allCategoryIdsToDelete)

        // Get Uncategorized category IDs
        const [uncategorizedCategories] = await db.execute(
          "SELECT id, type FROM categories WHERE name = 'Uncategorized'"
        );
        
        const uncategorizedStoreId = uncategorizedCategories.find(cat => cat.type === 'store')?.id;
        const uncategorizedVendorId = uncategorizedCategories.find(cat => cat.type === 'vendor')?.id;
        
        // Check if any of the categories to be deleted are used by products
        const [products] = await db.execute(
          "SELECT id, name, store_category_id, vendor_category_id FROM products WHERE store_category_id IN (" + 
          finalCategoryIds.map(() => "?").join(",") + 
          ") OR vendor_category_id IN (" + 
          finalCategoryIds.map(() => "?").join(",") + ")",
          [...finalCategoryIds, ...finalCategoryIds]
        )
        
        let movedProductsCount = 0;
        if (products.length > 0) {
          console.log(`Moving ${products.length} products to Uncategorized categories`);
          
          // Move products to Uncategorized categories
          for (const product of products) {
            const updates = [];
            const values = [];
            
            if (product.store_category_id && finalCategoryIds.includes(product.store_category_id)) {
              if (uncategorizedStoreId) {
                updates.push('store_category_id = ?');
                values.push(uncategorizedStoreId);
                movedProductsCount++;
              }
            }
            
            if (product.vendor_category_id && finalCategoryIds.includes(product.vendor_category_id)) {
              if (uncategorizedVendorId) {
                updates.push('vendor_category_id = ?');
                values.push(uncategorizedVendorId);
                movedProductsCount++;
              }
            }
            
            if (updates.length > 0) {
              values.push(product.id);
              await db.execute(
                `UPDATE products SET ${updates.join(', ')} WHERE id = ?`,
                values
              );
            }
          }
        }

        // Delete all categories (cascading delete)
        await db.execute(
          "DELETE FROM categories WHERE id IN (" + finalCategoryIds.map(() => "?").join(",") + ")",
          finalCategoryIds
        )
        break

      case "update":
        if (!updateData) {
          return res.status(400).json({ message: "Update data is required" })
        }

        const fields = Object.keys(updateData)
          .map(key => `${key} = ?`)
          .join(", ")
        const values = Object.values(updateData)
        
        for (const categoryId of categoryIds) {
          await db.execute(
            `UPDATE categories SET ${fields} WHERE id = ?`,
            [...values, categoryId]
          )
        }
        break

      default:
        return res.status(400).json({ message: "Invalid operation" })
    }

    let message = `${operation} completed successfully`;
    if (operation === "delete") {
      message = `Successfully deleted ${finalCategoryIds.length} categories (including all subcategories)`;
      if (movedProductsCount > 0) {
        message += ` and moved ${movedProductsCount} products to Uncategorized`;
      }
    }
    
    res.json({ 
      message: message,
      deletedCount: operation === "delete" ? finalCategoryIds.length : categoryIds.length,
      movedProductsCount: operation === "delete" ? movedProductsCount : 0
    })
  } catch (error) {
    console.error("Bulk operation error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

module.exports = router
