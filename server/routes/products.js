const express = require("express")
const router = express.Router()
const { pool: db, executeWithRetry } = require("../config/database")
const { authenticateToken } = require("../middleware/auth")
const multer = require("multer")
const csv = require("csv-parser")
const fs = require("fs")
const path = require("path")

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../uploads/"))
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname)
  },
})

const upload = multer({ storage: storage })



// // Helper function to find a category by name and parent
// async function findCategoryByNameAndParent(name, parentId, type, connection = null) {
//   try {
//     // Validate parameters
//     if (!name || typeof name !== 'string') {
//       console.log("Warning: Invalid name parameter:", name)
//       return null
//     }
    
//     if (!type || typeof type !== 'string') {
//       console.log("Warning: Invalid type parameter:", type)
//       return null
//     }
    
//     // Handle null parentId properly
//     const query = parentId === null || parentId === undefined
//       ? "SELECT id, name, parent_id, type, level FROM categories WHERE name = ? AND parent_id IS NULL AND type = ?"
//       : "SELECT id, name, parent_id, type, level FROM categories WHERE name = ? AND parent_id = ? AND type = ?"
    
//     const params = parentId === null || parentId === undefined
//       ? [name.trim(), type]
//       : [name.trim(), parentId, type]
    
//     const [categories] = await (connection || db).execute(query, params)
    
//     if (categories.length > 0) {
//       return categories[0]
//     }
//     return null
//   } catch (error) {
//     console.error("Error finding category by name and parent:", error)
//     return null
//   }
// }

// // Helper function to create or get a category with proper locking and retry logic
// async function createOrGetCategory(name, parentId, type, connection = null, vendorId = null) {
//   const maxRetries = 3;
//   let retryCount = 0;
  
//   while (retryCount < maxRetries) {
//     const dbConnection = connection || await db.getConnection();
    
//     try {
//       if (!connection) {
//         await dbConnection.beginTransaction();
//       }
      
//       // For root categories (parent_id = NULL), check if a category with the same name exists at root level for this vendor
//       if (parentId === null) {
//         const [existingRootCategory] = await dbConnection.execute(
//           "SELECT id FROM categories WHERE name = ? AND parent_id IS NULL AND type = ? AND vendor_id = ?",
//           [name.trim(), type, vendorId]
//         )
        
//         if (existingRootCategory.length > 0) {
//           if (!connection) {
//             await dbConnection.commit();
//             dbConnection.release();
//           }
//           return existingRootCategory[0].id
//         }
//       } else {
//         // For subcategories, check with specific parent
//         const [existingCategory] = await dbConnection.execute(
//           "SELECT id FROM categories WHERE name = ? AND parent_id = ? AND type = ? AND vendor_id = ?",
//           [name.trim(), parentId, type, vendorId]
//         )

//         if (existingCategory.length > 0) {
//           if (!connection) {
//             await dbConnection.commit();
//             dbConnection.release();
//           }
//           return existingCategory[0].id
//         }
//       }

//       // Calculate level based on parent_id
//       let level = 1
//       if (parentId) {
//         // Get the parent's level and add 1
//         const [parentResult] = await dbConnection.execute(
//           "SELECT level FROM categories WHERE id = ?",
//           [parentId]
//         )
//         if (parentResult.length > 0) {
//           level = parentResult[0].level + 1
//         } else {
//           level = 1 // Fallback if parent not found
//         }
//       }
      
//       // If this is a subcategory and vendorId is not provided, get it from parent
//       let finalVendorId = vendorId
//       if (parentId && !vendorId) {
//         const [parentCategory] = await dbConnection.execute(
//           "SELECT vendor_id FROM categories WHERE id = ?",
//           [parentId]
//         )
//         if (parentCategory.length > 0) {
//           finalVendorId = parentCategory[0].vendor_id
//         }
//       }

//       const [result] = await dbConnection.execute(
//         "INSERT INTO categories (name, parent_id, type, vendor_id, level, created_at) VALUES (?, ?, ?, ?, ?, NOW())",
//         [name.trim(), parentId, type, finalVendorId, level]
//       )
      
//       if (!connection) {
//         await dbConnection.commit();
//         dbConnection.release();
//       }
//       return result.insertId
      
//     } catch (error) {
//       if (!connection) {
//         await dbConnection.rollback();
//         dbConnection.release();
//       }
      
//       // If it's a lock timeout error, retry
//       if (error.code === 'ER_LOCK_WAIT_TIMEOUT' && retryCount < maxRetries - 1) {
//         retryCount++;
//         console.log(`Lock timeout, retrying category creation (attempt ${retryCount + 1}/${maxRetries}): ${name}`);
//         await new Promise(resolve => setTimeout(resolve, 100 * retryCount)); // Exponential backoff
//         continue;
//       }
      
//       throw error;
//     }
//   }
// }

// // NEW: Helper function to find the deepest category in a hierarchy
// async function findDeepestCategoryInHierarchy(row, mapping, type, rootCategoryId, categoryCache) {
//   try {
//     let currentParentId = rootCategoryId
//     let deepestCategoryId = rootCategoryId
    
//     // Process subcategories in order (level 1 to 5)
//     for (let i = 1; i <= 5; i++) {
//       let subcategoryName = null
      
//       if (type === 'vendor') {
//         const subcategoryKey = `vendor_subcategory_${i}`
//         const altSubcategoryKey = `suk_vendor_${i}`
        
//         if (mapping[subcategoryKey] && row[mapping[subcategoryKey]]) {
//           subcategoryName = row[mapping[subcategoryKey]].trim()
//         } else if (mapping[altSubcategoryKey] && row[mapping[altSubcategoryKey]]) {
//           subcategoryName = row[mapping[altSubcategoryKey]].trim()
//         }
//       } else if (type === 'store') {
//         const subcategoryKey = `store_subcategory_${i}`
//         const altSubcategoryKey = `subc_store_${i}`
        
//         if (mapping[subcategoryKey] && row[mapping[subcategoryKey]]) {
//           subcategoryName = row[mapping[subcategoryKey]].trim()
//         } else if (mapping[altSubcategoryKey] && row[mapping[altSubcategoryKey]]) {
//           subcategoryName = row[mapping[altSubcategoryKey]].trim()
//         }
//       } else if (type === 'store') {
//         const subcategoryKey = `store_subcategory_${i}`
//         const altSubcategoryKey = `subc_store_${i}`
        
//         if (mapping[subcategoryKey] && row[mapping[subcategoryKey]]) {
//           subcategoryName = row[mapping[subcategoryKey]].trim()
//         } else if (mapping[altSubcategoryKey] && row[mapping[altSubcategoryKey]]) {
//           subcategoryName = row[mapping[altSubcategoryKey]].trim()
//         }
//       }
      
//       if (subcategoryName && subcategoryName !== '') {
//         // Check cache first
//         const cacheKey = `${type}:${subcategoryName}:${currentParentId}`
//         if (categoryCache.has(cacheKey)) {
//           deepestCategoryId = categoryCache.get(cacheKey)
//           currentParentId = deepestCategoryId
//         } else {
//           // Check database
//           const existingCategory = await findCategoryByNameAndParent(subcategoryName, currentParentId, type)
//           if (existingCategory) {
//             deepestCategoryId = existingCategory.id
//             currentParentId = existingCategory.id
//             // Update cache
//             categoryCache.set(cacheKey, existingCategory.id)
//           } else {
//             // No more subcategories in this hierarchy
//             break
//           }
//         }
//       } else {
//         // No more subcategories in this hierarchy
//         break
//       }
//     }
    
//     return deepestCategoryId
    
//   } catch (error) {
//     console.error(`Error finding deepest category in ${type} hierarchy:`, error)
//     return rootCategoryId // Fallback to root category
//   }
// }

// // IMPROVED: Helper function to process category hierarchy from CSV data and return the deepest category
// async function processCategoryHierarchy(row, mapping, type, categoryCache, connection = null, vendorId = null) {
//   try {
//     // Get the main category (parent)
//     let mainCategoryName = null
//     let mainCategoryId = null
    
//     if (type === 'vendor') {
//       if (mapping.vendor_category && row[mapping.vendor_category]) {
//         mainCategoryName = row[mapping.vendor_category].trim()
//       } else if (mapping.vendor_ && row[mapping.vendor_]) {
//         mainCategoryName = row[mapping.vendor_].trim()
//       }
//     } else if (type === 'store') {
//       if (mapping.store_category && row[mapping.store_category]) {
//         mainCategoryName = row[mapping.store_category].trim()
//       } else if (mapping.category && row[mapping.category]) {
//         mainCategoryName = row[mapping.category].trim()
//       }
//     }
    
//     if (!mainCategoryName) {
//       return null
//     }
    
//     // Get or create main category
//     const cacheKey = `${type}:${mainCategoryName}:null`
//     if (categoryCache.has(cacheKey)) {
//       mainCategoryId = categoryCache.get(cacheKey)
//     } else {
//       mainCategoryId = await createOrGetCategory(mainCategoryName, null, type, connection, vendorId)
//       categoryCache.set(cacheKey, mainCategoryId)
//     }
    
//     // Collect subcategories
//     const subcategories = []
//     const maxLevels = 5
    
//     for (let i = 1; i <= maxLevels; i++) {
//       let subcategoryName = null
      
//       if (type === 'vendor') {
//         const subcategoryKey = `vendor_subcategory_${i}`
//         const altSubcategoryKey = `suk_vendor_${i}`
        
//         if (mapping[subcategoryKey] && row[mapping[subcategoryKey]]) {
//           subcategoryName = row[mapping[subcategoryKey]].trim()
//         } else if (mapping[altSubcategoryKey] && row[mapping[altSubcategoryKey]]) {
//           subcategoryName = row[mapping[altSubcategoryKey]].trim()
//         }
//       } else if (type === 'store') {
//         const subcategoryKey = `store_subcategory_${i}`
//         const altSubcategoryKey = `subc_store_${i}`
        
//         if (mapping[subcategoryKey] && row[mapping[subcategoryKey]]) {
//           subcategoryName = row[mapping[subcategoryKey]].trim()
//         } else if (mapping[altSubcategoryKey] && row[mapping[altSubcategoryKey]]) {
//           subcategoryName = row[mapping[altSubcategoryKey]].trim()
//         }
//       }
      
//       if (subcategoryName && subcategoryName !== '') {
//         subcategories.push({ level: i, name: subcategoryName })
//       }
//     }
    
//     // Build hierarchy chain
//     let currentParentId = mainCategoryId
//     let finalCategoryId = mainCategoryId
    
//     for (const subcategory of subcategories) {
//       // Create cache key for this subcategory level - use parent ID to ensure correct hierarchy
//       const subcategoryCacheKey = `${type}:${subcategory.name}:${currentParentId}`
      
//       // Check cache first
//       if (categoryCache.has(subcategoryCacheKey)) {
//         currentParentId = categoryCache.get(subcategoryCacheKey)
//         finalCategoryId = currentParentId
//         console.log(`Found cached ${type} subcategory: ${subcategory.name} (ID: ${currentParentId}) under parent ${currentParentId}`)
//       } else {
//         // Check if subcategory already exists under current parent
//         const existingCategory = await findCategoryByNameAndParent(subcategory.name, currentParentId, type, connection)
        
//         if (existingCategory) {
//           // Use existing category
//           currentParentId = existingCategory.id
//           finalCategoryId = existingCategory.id
//           // Cache the found category
//           categoryCache.set(subcategoryCacheKey, existingCategory.id)
//           console.log(`Found existing ${type} subcategory: ${subcategory.name} (ID: ${existingCategory.id}) under parent ${currentParentId}`)
//         } else {
//           // Create new subcategory
//           const newCategoryId = await createOrGetCategory(subcategory.name, currentParentId, type, connection, vendorId)
//           currentParentId = newCategoryId
//           finalCategoryId = newCategoryId
//           // Cache the newly created category
//           categoryCache.set(subcategoryCacheKey, newCategoryId)
//           console.log(`Created new ${type} subcategory: ${subcategory.name} (ID: ${newCategoryId}) under parent ${currentParentId}`)
//         }
//       }
//     }
    
//     // Return the deepest category (last subcategory or main category if no subcategories)
//     console.log(`Returning deepest ${type} category: ${finalCategoryId} for hierarchy: ${mainCategoryName} -> ${subcategories.map(s => s.name).join(' -> ')}`)
//     return finalCategoryId
    
//   } catch (error) {
//     console.error(`Error processing ${type} category hierarchy:`, error)
//     return null
//   }
// }

// // Generic function to create or get category hierarchy from any path format
// async function createCategoryHierarchyFromPath(categoryPath, type, categoryCache, connection = null) {
//   try {
//     if (!categoryPath || typeof categoryPath !== 'string') {
//       return null
//     }

//     // Split the path by common separators and clean up
//     const separators = ['>', '>>', '|', '/', '\\', '→', '->']
//     let categories = []
    
//     // Try to find the best separator
//     for (const separator of separators) {
//       if (categoryPath.includes(separator)) {
//         categories = categoryPath.split(separator).map(cat => cat.trim()).filter(cat => cat !== '')
//         break
//       }
//     }
    
//     // If no separator found, treat the whole string as a single category
//     if (categories.length === 0) {
//       categories = [categoryPath.trim()]
//     }

//     if (categories.length === 0) {
//       return null
//     }

//     console.log(`Processing category hierarchy: ${categories.join(' > ')}`)

//     // Build the hierarchy chain
//     let currentParentId = null
//     let finalCategoryId = null

//     for (let i = 0; i < categories.length; i++) {
//       const categoryName = categories[i]
//       const level = i + 1

//       // Create cache key for this level
//       const cacheKey = `${type}:${categoryName}:${currentParentId}`
      
//       // Check cache first
//       if (categoryCache.has(cacheKey)) {
//         finalCategoryId = categoryCache.get(cacheKey)
//         console.log(`Found cached ${type} category: ${categoryName} (ID: ${finalCategoryId})`)
//       } else {
//         // Check if category already exists under current parent
//         const existingCategory = await findCategoryByNameAndParent(categoryName, currentParentId, type, connection)
        
//         if (existingCategory) {
//           // Use existing category
//           finalCategoryId = existingCategory.id
//           console.log(`Found existing ${type} category: ${categoryName} (ID: ${existingCategory.id})`)
//         } else {
//           // Create new category
//           finalCategoryId = await createOrGetCategory(categoryName, currentParentId, type, connection, vendorId)
//           console.log(`Created new ${type} category: ${categoryName} (ID: ${finalCategoryId})`)
//         }
        
//         // Cache the result
//         categoryCache.set(cacheKey, finalCategoryId)
//       }
      
//       currentParentId = finalCategoryId
//     }

//     console.log(`Final category ID for hierarchy: ${finalCategoryId}`)
//     return finalCategoryId

//   } catch (error) {
//     console.error('Error creating category hierarchy from path:', error)
//     return null
//   }
// }

// // NEW: Bulk hierarchical category creation function - VENDOR ONLY
// async function createBulkHierarchicalCategories(results, mapping, categoryCache, vendorId = null) {
//   try {
//     console.log('🔄 Creating bulk hierarchical VENDOR categories...')
    
//     // Step 1: Collect all unique vendor category hierarchies only
//     const vendorHierarchies = new Map() // parent -> [subcategories]
    
//     for (const row of results) {
//       // Process vendor categories only
//       let vendorParent = null
//       if (mapping.vendor_category && row[mapping.vendor_category]) {
//         vendorParent = row[mapping.vendor_category].trim()
//       } else if (mapping.vendor_ && row[mapping.vendor_]) {
//         vendorParent = row[mapping.vendor_].trim()
//       }
      
//       if (vendorParent) {
//         // Create vendor-specific category name if vendorId is provided
//         const categoryName = vendorId ? `${vendorParent} (Vendor ${vendorId})` : vendorParent
//         if (!vendorHierarchies.has(categoryName)) {
//           vendorHierarchies.set(categoryName, [])
//         }
        
//         // Collect vendor subcategories only
//         for (let i = 1; i <= 5; i++) {
//           const subcategoryKey = `vendor_subcategory_${i}`
//           const altSubcategoryKey = `suk_vendor_${i}`
          
//           let subcategoryName = null
//           if (mapping[subcategoryKey] && row[mapping[subcategoryKey]]) {
//             subcategoryName = row[mapping[subcategoryKey]].trim()
//           } else if (mapping[altSubcategoryKey] && row[mapping[altSubcategoryKey]]) {
//             subcategoryName = row[mapping[altSubcategoryKey]].trim()
//           }
          
//           if (subcategoryName && subcategoryName !== '') {
//             vendorHierarchies.get(categoryName).push({ level: i, name: subcategoryName })
//           }
//         }
//       }
//     }
    
//     console.log(`Found ${vendorHierarchies.size} vendor hierarchies`)
    
//     // Step 2: Create all root categories first
//     const rootCategoriesToCreate = []
    
//     for (const [parentName] of vendorHierarchies) {
//       const cacheKey = `vendor:${parentName}:null`
//       if (!categoryCache.has(cacheKey)) {
//         // Extract base name without vendor ID suffix
//         const baseName = vendorId ? parentName.replace(` (${vendorId})`, '') : parentName
//         rootCategoriesToCreate.push([baseName, null, 'vendor', 1, new Date()])
//       }
//     }
    

    
//     // Bulk insert root categories
//     if (rootCategoriesToCreate.length > 0) {
//       console.log(`Creating ${rootCategoriesToCreate.length} root categories...`)
      
//       for (const categoryData of rootCategoriesToCreate) {
//         const [result] = await db.execute(
//           'INSERT INTO categories (name, parent_id, type, level, created_at) VALUES (?, ?, ?, ?, ?)',
//           categoryData
//         )
        
//         // Update cache
//         const cacheKey = `${categoryData[2]}:${categoryData[0]}:null`
//         categoryCache.set(cacheKey, result.insertId)
//       }
//     }
    
//     // Step 3: Create subcategories in hierarchy order
//     console.log('Creating subcategories...')
    
//     // Process vendor hierarchies
//     for (const [parentName, subcategories] of vendorHierarchies) {
//       const parentId = categoryCache.get(`vendor:${parentName}:null`)
//       if (!parentId) continue
      
//       let currentParentId = parentId
      
//       // Sort subcategories by level
//       const sortedSubcategories = subcategories.sort((a, b) => a.level - b.level)
      
//       for (const subcategory of sortedSubcategories) {
//         const cacheKey = `vendor:${subcategory.name}:${currentParentId}`
        
//         if (!categoryCache.has(cacheKey)) {
//           // Check if subcategory already exists under this parent
//           const existingCategory = await findCategoryByNameAndParent(subcategory.name, currentParentId, 'vendor')
          
//           if (existingCategory) {
//             categoryCache.set(cacheKey, existingCategory.id)
//             currentParentId = existingCategory.id
//           } else {
//             // Create new subcategory
//             const [result] = await db.execute(
//               'INSERT INTO categories (name, parent_id, type, level, created_at) VALUES (?, ?, ?, ?, ?)',
//               [subcategory.name, currentParentId, 'vendor', subcategory.level, new Date()]
//             )
            
//             categoryCache.set(cacheKey, result.insertId)
//             currentParentId = result.insertId
//           }
//         } else {
//           const cachedId = categoryCache.get(cacheKey)
//           if (cachedId) {
//             currentParentId = cachedId
//           } else {
//             console.log(`Warning: Cache key ${cacheKey} not found, skipping subcategory ${subcategory.name}`)
//             continue
//           }
//         }
//       }
//     }
    

    
//     console.log('✅ Bulk hierarchical VENDOR categories created successfully')
    
//   } catch (error) {
//     console.error('❌ Error creating bulk hierarchical categories:', error)
//     throw error
//   }
// }

// // Get database fields for CSV import
// router.get("/import/fields", authenticateToken, async (req, res) => {
//   try {
//     const [columns] = await db.execute(`
//       SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
//       FROM INFORMATION_SCHEMA.COLUMNS 
//       WHERE TABLE_SCHEMA = 'product_management' AND TABLE_NAME = 'products'
//       ORDER BY ORDINAL_POSITION
//     `)

//     const fields = {
//       basic: {
//         label: "Basic Information",
//         fields: [
//           { key: "sku", label: "SKU", required: true, type: "text" },
//           { key: "name", label: "Product Name", required: true, type: "text" },
//           { key: "short_description", label: "Short Description", required: false, type: "text" },
//           { key: "description", label: "Description", required: false, type: "text" },
//           { key: "brand", label: "Brand", required: false, type: "text" },
//           { key: "mfn", label: "MFN", required: false, type: "text" }
//         ]
//       },
//       inventory: {
//         label: "Inventory",
//         fields: [
//           { key: "stock", label: "Stock Quantity", required: false, type: "number" }
//         ]
//       },
//       pricing: {
//         label: "Pricing",
//         fields: [
//           { key: "list_price", label: "List Price", required: false, type: "number" },
//           { key: "market_price", label: "Market Price", required: false, type: "number" },
//           { key: "vendor_cost", label: "Vendor Cost", required: false, type: "number" },
//           { key: "special_price", label: "Special Price", required: false, type: "number" }
//         ]
//       },
//       dimensions: {
//         label: "Dimensions & Weight",
//         fields: [
//           { key: "weight", label: "Weight", required: false, type: "number" },
//           { key: "length", label: "Length", required: false, type: "number" },
//           { key: "width", label: "Width", required: false, type: "number" },
//           { key: "height", label: "Height", required: false, type: "number" }
//         ]
//       },
//       categories: {
//         label: "Categories",
//         fields: [
//           { key: "google_category", label: "Google Category", required: false, type: "text" },
//           { key: "category_hierarchy", label: "Category Hierarchy (NEW - Recommended)", required: false, type: "text", description: "Use format: 'Electronics > Mobile Devices > Smartphones > Premium'" },
//           { key: "vendor_category", label: "Vendor Category", required: false, type: "text" },
//           { key: "vendor_subcategory_1", label: "Vendor Subcategory 1", required: false, type: "text" },
//           { key: "vendor_subcategory_2", label: "Vendor Subcategory 2", required: false, type: "text" },
//           { key: "vendor_subcategory_3", label: "Vendor Subcategory 3", required: false, type: "text" },
//           { key: "vendor_subcategory_4", label: "Vendor Subcategory 4", required: false, type: "text" },
//           { key: "vendor_subcategory_5", label: "Vendor Subcategory 5", required: false, type: "text" }
//         ]
//       },
//       settings: {
//         label: "Settings",
//         fields: [
//           { key: "published", label: "Published", required: false, type: "boolean" },
//           { key: "featured", label: "Featured", required: false, type: "boolean" },
//           { key: "visibility", label: "Visibility", required: false, type: "text" }
//         ]
//       },
//       relationships: {
//         label: "Relationships",
//         fields: [
//           { key: "vendor_id", label: "Vendor ID", required: false, type: "number" }
//         ]
//       },
//       seo: {
//         label: "SEO",
//         fields: [
//           { key: "meta_title", label: "Meta Title", required: false, type: "text" },
//           { key: "meta_description", label: "Meta Description", required: false, type: "text" },
//           { key: "meta_keywords", label: "Meta Keywords", required: false, type: "text" }
//         ]
//       }
//     }

//     res.json({ fields })
//   } catch (error) {
//     console.error("Error fetching database fields:", error)
//     res.status(500).json({ message: "Server error" })
//   }
// })

// // Download CSV template
// router.get("/import/template", authenticateToken, async (req, res) => {
//   try {
//     const templateData = [
//       {
//         sku: "PROD001",
//         name: "Sample Product",
//         short_description: "Brief product description",
//         description: "Detailed product description",
//         brand: "Sample Brand",
//         mfn: "MFN001",
//         stock: 100,
//         list_price: 99.99,
//         market_price: 89.99,
//         vendor_cost: 50.00,
//         special_price: 79.99,
//         weight: 1.5,
//         length: 10,
//         width: 5,
//         height: 3,
//         google_category: "Electronics",
//         category_hierarchy: "Electronics > Mobile Devices > Smartphones > Premium",
//         vendor_category: "Electronics",
//         vendor_subcategory_1: "Smartphones",
//         vendor_subcategory_2: "Android",
//         vendor_subcategory_3: "Flagship",
//         vendor_subcategory_4: "5G",
//         vendor_subcategory_5: "Premium",
//         published: true,
//         featured: false,
//         visibility: "public",
//         vendor_id: 1,
//         meta_title: "Sample Product - Meta Title",
//         meta_description: "Sample product meta description for SEO",
//         meta_keywords: "sample, product, keywords"
//       },
//       {
//         sku: "PROD002",
//         name: "Alternative Format Example",
//         short_description: "Example with alternative field names",
//         description: "This example uses the alternative field naming convention",
//         brand: "Alt Brand",
//         mfn: "MFN002",
//         stock: 50,
//         list_price: 149.99,
//         market_price: 129.99,
//         vendor_cost: 75.00,
//         special_price: 119.99,
//         weight: 2.0,
//         length: 15,
//         width: 8,
//         height: 4,
//         google_category: "Computers",
//         vendor_category: "Electronics",
//         vendor_subcategory_1: "Computers",
//         vendor_subcategory_2: "Laptops",
//         vendor_subcategory_3: "Gaming",
//         vendor_subcategory_4: "High-End",
//         vendor_subcategory_5: "RTX Series",
//         published: true,
//         featured: true,
//         visibility: "public",
//         vendor_id: 2,
//         meta_title: "Alternative Format - Meta Title",
//         meta_description: "Alternative format example meta description",
//         meta_keywords: "alternative, format, example"
//       }
//     ]

//     const csvHeader = Object.keys(templateData[0]).join(",")
//     const csvRows = templateData.map(row => Object.values(row).join(","))
//     const csvContent = [csvHeader, ...csvRows].join("\n")

//     res.setHeader("Content-Type", "text/csv")
//     res.setHeader("Content-Disposition", "attachment; filename=products_template.csv")
//     res.send(csvContent)
//   } catch (error) {
//     console.error("Error generating template:", error)
//     res.status(500).json({ message: "Server error" })
//   }
// })

// Preview CSV import
router.post("/import/preview", authenticateToken, upload.single("csvFile"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "CSV file is required" })
    }

    const { fieldMapping } = req.body
    const mapping = fieldMapping ? JSON.parse(fieldMapping) : {}
    const results = []
    const previewRows = []

    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", () => {
        // Generate preview of first 5 rows
        for (let i = 0; i < Math.min(5, results.length); i++) {
          const row = results[i]
          const mapped = {}
          const categoryInfo = {
            vendor_category: null,
            vendor_subcategories: []
          }
          
          Object.entries(mapping).forEach(([csvHeader, dbField]) => {
            const value = row[csvHeader] || ""
            
            // Handle category fields specially
            if (dbField === 'vendor_category') {
              categoryInfo.vendor_category = value
              mapped[dbField] = value
            } else if (dbField.startsWith('vendor_subcategory_')) {
              let level = parseInt(dbField.split('_')[2]) || 1;
              categoryInfo.vendor_subcategories.push({ level, name: value })
              mapped[dbField] = value
            } else {
              mapped[dbField] = value
            }
          })
          
          // Sort subcategories by level
          categoryInfo.vendor_subcategories.sort((a, b) => a.level - b.level)
          
          // Add category path information
          if (categoryInfo.vendor_category) {
            const vendorPath = [categoryInfo.vendor_category]
            categoryInfo.vendor_subcategories.forEach(sub => {
              vendorPath.push(sub.name)
            })
            mapped.vendor_category_path = vendorPath.join(' > ')
          }
          

          
          previewRows.push({
            rowNumber: i + 1,
            original: row,
            mapped: mapped,
            categoryInfo: categoryInfo
          })
        }

        // Clean up uploaded file
        fs.unlinkSync(req.file.path)

        res.json({
          previewRows,
          totalRows: results.length,
          mappedFields: Object.keys(mapping).length
        })
      })
      .on("error", (error) => {
        console.error("CSV parsing error:", error)
        res.status(500).json({ message: "Error parsing CSV file" })
      })
  } catch (error) {
    console.error("Preview error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Import products from CSV - OPTIMIZED VERSION
router.post("/import", authenticateToken, upload.single("csvFile"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "CSV file is required" })
    }

    const { fieldMapping, updateMode, selectedVendor } = req.body
    const rawMapping = fieldMapping ? JSON.parse(fieldMapping) : {}
    
    // Clean up mapping - remove empty or invalid entries
    const mapping = {}
    for (const [csvHeader, dbField] of Object.entries(rawMapping)) {
      if (dbField && dbField.trim() !== '' && csvHeader && csvHeader.trim() !== '') {
        mapping[csvHeader] = dbField.trim()
      }
    }
    
    console.log('Clean mapping:', mapping)
    
    const isUpdateMode = updateMode === 'true'
    const vendorId = selectedVendor ? parseInt(selectedVendor) : null
    const results = []
    const errors = []
    const startTime = Date.now()

    // Set headers for streaming response
    res.writeHead(200, {
      'Content-Type': 'text/plain',
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    })

    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", async () => {
        try {
          let imported = 0
          let updated = 0
          let skipped = 0
          let processed = 0

          // Send initial progress
          res.write(`data: ${JSON.stringify({
            type: 'progress',
            current: 0,
            total: results.length,
            imported: 0,
            updated: 0,
            skipped: 0,
            errors: 0,
            currentProduct: null,
            processingRate: 0
          })}\n\n`)

          // OPTIMIZATION 1: Pre-process all categories to avoid repeated database calls
          console.log('Pre-processing categories...')
          const categoryCache = new Map() // Cache for category lookups
          const categoryHierarchyCache = new Map() // Cache for hierarchy lookups
          
          // Collect all unique categories first
          const allVendorCategories = new Set()
          const allStoreCategories = new Set()
          const allCategoryHierarchies = new Set()
          const allVendorCategoryPaths = new Set()
          const allStoreCategoryPaths = new Set()
          
          for (const row of results) {
            // Collect vendor categories (single category)
            if (mapping.vendor_category && row[mapping.vendor_category]) {
              allVendorCategories.add(row[mapping.vendor_category].trim())
            }
            if (mapping.vendor_ && row[mapping.vendor_]) {
              allVendorCategories.add(row[mapping.vendor_].trim())
            }
            
            // Collect vendor category paths (hierarchical)
            if (mapping.vendor_category_path && row[mapping.vendor_category_path]) {
              allVendorCategoryPaths.add(row[mapping.vendor_category_path].trim())
            }
            if (mapping.vendor_category_hierarchy && row[mapping.vendor_category_hierarchy]) {
              allVendorCategoryPaths.add(row[mapping.vendor_category_hierarchy].trim())
            }
            
            // Collect store categories (single category)
            if (mapping.store_category && row[mapping.store_category]) {
              allStoreCategories.add(row[mapping.store_category].trim())
            }
            if (mapping.category && row[mapping.category]) {
              allStoreCategories.add(row[mapping.category].trim())
            }
            
            // Collect store category paths (hierarchical)
            if (mapping.store_category_path && row[mapping.store_category_path]) {
              allStoreCategoryPaths.add(row[mapping.store_category_path].trim())
            }
            if (mapping.store_category_hierarchy && row[mapping.store_category_hierarchy]) {
              allStoreCategoryPaths.add(row[mapping.store_category_hierarchy].trim())
            }
            
            // Collect legacy category hierarchies
            if (mapping.category_hierarchy && row[mapping.category_hierarchy]) {
              allCategoryHierarchies.add(row[mapping.category_hierarchy].trim())
            }
          }
          
          // OPTIMIZATION 2: Batch create all vendor categories at once
          console.log(`Creating ${allVendorCategories.size} vendor categories...`)
          for (const categoryName of allVendorCategories) {
            if (categoryName) {
              const categoryId = await createOrGetCategory(categoryName, null, 'vendor', null, vendorId)
              categoryCache.set(`vendor:${categoryName}`, categoryId)
            }
          }
          
          // OPTIMIZATION 3: Batch create all store categories at once
          console.log(`Creating ${allStoreCategories.size} store categories...`)
          for (const categoryName of allStoreCategories) {
            if (categoryName) {
              const categoryId = await createOrGetCategory(categoryName, null, 'store', null, null)
              categoryCache.set(`store:${categoryName}`, categoryId)
            }
          }
          
          // OPTIMIZATION 4: Process vendor category hierarchies in batch
          console.log(`Processing ${allVendorCategoryPaths.size} vendor category hierarchies...`)
          for (const categoryPath of allVendorCategoryPaths) {
            if (categoryPath) {
              const categoryId = await createCategoryHierarchyFromPath(categoryPath, 'vendor', categoryCache)
              categoryCache.set(`vendor_path:${categoryPath}`, categoryId)
            }
          }
          
          // OPTIMIZATION 5: Process store category hierarchies in batch
          console.log(`Processing ${allStoreCategoryPaths.size} store category hierarchies...`)
          for (const categoryPath of allStoreCategoryPaths) {
            if (categoryPath) {
              const categoryId = await createCategoryHierarchyFromPath(categoryPath, 'store', categoryCache)
              categoryCache.set(`store_path:${categoryPath}`, categoryId)
            }
          }
          
          // OPTIMIZATION 6: Process legacy category hierarchies in batch
          console.log(`Processing ${allCategoryHierarchies.size} legacy category hierarchies...`)
          for (const hierarchy of allCategoryHierarchies) {
            if (hierarchy) {
              const categoryId = await createCategoryHierarchyFromPath(hierarchy, 'store', categoryCache)
              categoryCache.set(`hierarchy:${hierarchy}`, categoryId)
            }
          }
          
          // OPTIMIZATION 4: Batch process products in chunks
          const BATCH_SIZE = 50 // Process 50 products at a time
          const batches = []
          
          for (let i = 0; i < results.length; i += BATCH_SIZE) {
            batches.push(results.slice(i, i + BATCH_SIZE))
          }
          
          console.log(`Processing ${results.length} products in ${batches.length} batches...`)
          
          for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
            const batch = batches[batchIndex]
            const batchStartTime = Date.now()
            
            // OPTIMIZATION 5: Use a single transaction for each batch
            const connection = await db.getConnection()
            await connection.beginTransaction()
            
            try {
              for (let i = 0; i < batch.length; i++) {
                const row = batch[i]
                const globalIndex = batchIndex * BATCH_SIZE + i
                processed++
                
                // Get current product info for progress display
                let currentProduct = null
                if (mapping.name && row[mapping.name]) {
                  currentProduct = row[mapping.name]
                } else if (mapping.sku && row[mapping.sku]) {
                  currentProduct = `SKU: ${row[mapping.sku]}`
                } else {
                  currentProduct = `Row ${globalIndex + 1}`
                }
                
                try {
                  const queryFields = []
                  const queryValues = []
                  let vendorCategoryId = null

                  // Process mapping entries
                  for (const [csvHeader, dbField] of Object.entries(mapping)) {
                    if (!dbField || dbField.trim() === '' || row[csvHeader] === undefined || row[csvHeader] === "") {
                      continue
                    }
                    
                    // Skip empty values for required fields
                    if ((dbField === 'sku' || dbField === 'name') && (!row[csvHeader] || row[csvHeader].toString().trim() === '')) {
                      console.log(`Row ${globalIndex + 1}: Empty value for required field '${dbField}', skipping row`)
                      continue
                    }
                    
                    let value = row[csvHeader]
                    
                                      // Handle vendor category (single category)
                  if (dbField === 'vendor_category' || dbField === 'vendor_') {
                    vendorCategoryId = categoryCache.get(`vendor:${value.trim()}`)
                    continue
                  }
                  
                  // Handle vendor category path (hierarchical)
                  if (dbField === 'vendor_category_path' || dbField === 'vendor_category_hierarchy') {
                    if (value && value.trim() !== '') {
                      const categoryId = categoryCache.get(`vendor_path:${value.trim()}`)
                      if (categoryId) {
                        vendorCategoryId = categoryId
                      }
                    }
                    continue
                  }
                  
                  // Handle store category (single category)
                  if (dbField === 'store_category' || dbField === 'category') {
                    const storeCategoryId = categoryCache.get(`store:${value.trim()}`)
                    if (storeCategoryId && !queryFields.includes('store_category_id')) {
                      queryFields.push('store_category_id')
                      queryValues.push(storeCategoryId)
                    }
                    continue
                  }
                  
                  // Handle store category path (hierarchical)
                  if (dbField === 'store_category_path' || dbField === 'store_category_hierarchy') {
                    if (value && value.trim() !== '') {
                      const categoryId = categoryCache.get(`store_path:${value.trim()}`)
                      if (categoryId && !queryFields.includes('store_category_id')) {
                        queryFields.push('store_category_id')
                        queryValues.push(categoryId)
                      }
                    }
                    continue
                  }
                  
                  // Handle legacy category hierarchy (use cache)
                  if (dbField === 'category_hierarchy') {
                    if (value && value.trim() !== '') {
                      const hierarchyId = categoryCache.get(`hierarchy:${value.trim()}`)
                      if (hierarchyId) {
                        vendorCategoryId = hierarchyId
                      }
                    }
                    continue
                  }
                    
                    // Skip subcategory fields - they will be processed by processCategoryHierarchy
                    if (dbField.startsWith('vendor_subcategory_') || dbField.startsWith('suk_vendor_') ||
                        dbField.startsWith('store_subcategory_') || dbField.startsWith('subc_store_')) {
                      continue
                    }
                    
                    // Convert data types
                    if (dbField.includes('price') || dbField.includes('cost') || 
                        dbField === 'stock' || dbField === 'weight' || 
                        dbField === 'length' || dbField === 'width' || dbField === 'height') {
                      value = Number.parseFloat(value) || 0
                    } else if (dbField === 'published' || dbField === 'featured') {
                      value = value.toLowerCase() === 'true' || value === '1' || value === 'yes'
                    } else if (dbField.includes('_id')) {
                      value = Number.parseInt(value) || null
                    }

                    // Only add if field is not already in the array
                    const existingIndex = queryFields.indexOf(dbField)
                    if (existingIndex === -1) {
                      queryFields.push(dbField)
                      queryValues.push(value)
                    } else {
                      queryValues[existingIndex] = value
                    }
                  }

                  // Add vendor_id if selected
                  if (vendorId && !queryFields.includes('vendor_id')) {
                    queryFields.push('vendor_id')
                    queryValues.push(vendorId)
                  }

                  // Process vendor category hierarchy - always process to get the deepest category
                  if (mapping.vendor_category || mapping.vendor_) {
                    vendorCategoryId = await processCategoryHierarchy(row, mapping, 'vendor', categoryCache, connection, vendorId)
                  }



                  // Add category IDs if available
                  if (vendorCategoryId && !queryFields.includes('vendor_category_id')) {
                    queryFields.push('vendor_category_id')
                    queryValues.push(vendorCategoryId)
                  }



                  // Add timestamps
                  queryFields.push('updated_at')
                  queryValues.push(new Date())

                  // Filter out any empty field names
                  const validFields = []
                  const validValues = []
                  for (let j = 0; j < queryFields.length; j++) {
                    if (queryFields[j] && queryFields[j].trim() !== '') {
                      validFields.push(queryFields[j])
                      validValues.push(queryValues[j])
                    }
                  }
                  
                  // Validate required fields before insert/update
                  const hasRequiredFields = validFields.includes('sku') && validFields.includes('name')
                  
                  if (validFields.length > 1 && hasRequiredFields) { // More than just updated_at and has required fields
                    if (isUpdateMode && mapping.sku) {
                      // Update existing product
                      const sku = row[mapping.sku]
                      const [existingProduct] = await connection.execute(
                        "SELECT id FROM products WHERE sku = ?",
                        [sku]
                      )

                      if (existingProduct.length > 0) {
                        const productId = existingProduct[0].id
                        const setClause = validFields.map(field => `${field} = ?`).join(', ')
                        const updateQuery = `UPDATE products SET ${setClause} WHERE id = ?`
                        await connection.execute(updateQuery, [...validValues, productId])
                        updated++
                      } else {
                        console.log(`Row ${globalIndex + 1}: SKU not found for update, skipping`)
                        skipped++
                      }
                    } else {
                      // Check if product with this SKU already exists
                      const sku = row[mapping.sku]
                      if (sku) {
                        const [existingProduct] = await connection.execute(
                          "SELECT id FROM products WHERE sku = ?",
                          [sku]
                        )
                        
                        if (existingProduct.length > 0) {
                          console.log(`Row ${globalIndex + 1}: SKU '${sku}' already exists, skipping`)
                          skipped++
                          continue
                        }
                      }
                      
                      // Insert new product
                      validFields.push('created_at')
                      validValues.push(new Date())
                      
                      const placeholders = validFields.map(() => '?').join(', ')
                      const query = `INSERT INTO products (${validFields.join(', ')}) VALUES (${placeholders})`
                      
                      const [result] = await connection.execute(query, validValues)
                      imported++
                    }
                  } else {
                    console.log(`Row ${globalIndex + 1}: Missing required fields (sku, name) or insufficient data, skipping`)
                    skipped++
                  }
                } catch (error) {
                  console.error(`Row ${globalIndex + 1} import error:`, error)
                  errors.push(`Row ${globalIndex + 1}: ${error.message}`)
                }
              }
              
              // Commit batch transaction
              await connection.commit()
              
              // OPTIMIZATION 6: Real-time progress updates after each batch
              const batchProcessingTime = Date.now() - batchStartTime
              const processingRate = Math.round(processed / ((Date.now() - startTime) / 1000))
              const estimatedTimeRemaining = Math.round(((results.length - processed) / processingRate) / 60)
              
              res.write(`data: ${JSON.stringify({
                type: 'progress',
                current: processed,
                total: results.length,
                imported,
                updated,
                skipped,
                errors: errors.length,
                processingRate,
                currentProduct: `Batch ${batchIndex + 1}/${batches.length}`,
                estimatedTimeRemaining,
                batchProcessingTime
              })}\n\n`)
              
            } catch (error) {
              await connection.rollback()
              throw error
            } finally {
              connection.release()
            }
          }

          // Clean up uploaded file
          fs.unlinkSync(req.file.path)

          // Get updated product count
          const [productCountResult] = await db.execute("SELECT COUNT(*) as total FROM products")
          const totalProducts = productCountResult[0].total

          // Send completion data
          console.log(`Import completed: ${imported} imported, ${updated} updated, ${skipped} skipped, ${errors.length} errors`)
          const completionData = {
            type: 'complete',
            message: `Import completed successfully! ${imported} products imported, ${updated} updated, ${skipped} skipped.`,
            imported,
            updated,
            skipped,
            total: results.length,
            errors: errors.slice(0, 10),
            totalProducts,
            processingTime: Math.round((Date.now() - startTime) / 1000)
          }
          console.log("Sending completion data:", completionData)
          res.write(`data: ${JSON.stringify(completionData)}\n\n`)

          res.end()
        } catch (error) {
          console.error("Error in import processing:", error)
          res.write(`data: ${JSON.stringify({
            type: 'error',
            message: "Error processing import: " + error.message
          })}\n\n`)
          res.end()
        }
      })
      .on("error", (error) => {
        console.error("CSV parsing error:", error)
        res.write(`data: ${JSON.stringify({
          type: 'error',
          message: "Error parsing CSV file: " + error.message
        })}\n\n`)
        res.end()
      })
  } catch (error) {
    console.error("Import error:", error)
    res.write(`data: ${JSON.stringify({
      type: 'error',
      message: "Server error: " + error.message
    })}\n\n`)
    res.end()
  }
})

// // ULTRA FAST Import products from CSV - NEW OPTIMIZED VERSION
router.post("/import/fast", authenticateToken, upload.single("csvFile"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "CSV file is required" })
    }

    const { fieldMapping, updateMode, selectedVendor } = req.body
    const rawMapping = fieldMapping ? JSON.parse(fieldMapping) : {}
    
    // Clean up mapping
    const mapping = {}
    for (const [csvHeader, dbField] of Object.entries(rawMapping)) {
      if (dbField && dbField.trim() !== '' && csvHeader && csvHeader.trim() !== '') {
        mapping[csvHeader] = dbField.trim()
      }
    }
    
    console.log('Fast import - Clean mapping:', mapping)
    
    const isUpdateMode = updateMode === 'true'
    const vendorId = selectedVendor ? parseInt(selectedVendor) : null
    const results = []
    const errors = []
    const startTime = Date.now()

    // Set headers for streaming response
    res.writeHead(200, {
      'Content-Type': 'text/plain',
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    })

    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", async () => {
        try {
          let imported = 0
          let updated = 0
          let skipped = 0
          let processed = 0

          // Send initial progress
          res.write(`data: ${JSON.stringify({
            type: 'progress',
            current: 0,
            total: results.length,
            imported: 0,
            updated: 0,
            skipped: 0,
            errors: 0,
            currentProduct: null,
            processingRate: 0
          })}\n\n`)

          // ULTRA OPTIMIZATION 1: Single database connection for entire operation
          const connection = await db.getConnection()
          
          try {
            await connection.beginTransaction()
            
            // ULTRA OPTIMIZATION 2: Load ALL existing data in one go
            console.log('Loading existing data...')
            const [existingCategories] = await connection.execute(
              "SELECT id, name, parent_id, type FROM categories WHERE type IN ('vendor', 'store')"
            )
            const [existingProducts] = await connection.execute(
              "SELECT id, sku FROM products"
            )
            
            // Create lookup maps
            const categoryMap = new Map()
            const productMap = new Map()
            const categoryCache = new Map() // Cache for category lookups
            
            existingCategories.forEach(cat => {
              const key = `${cat.type}:${cat.name}:${cat.parent_id || 'null'}`
              categoryMap.set(key, cat.id)
            })
            
            existingProducts.forEach(prod => {
              productMap.set(prod.sku, prod.id)
            })
            
            // ULTRA OPTIMIZATION 3: Collect all categories in memory
            const allCategories = new Map()
            const categoryHierarchies = new Map()
            
            for (const row of results) {
              // Collect vendor categories
              if (mapping.vendor_category && row[mapping.vendor_category]) {
                const catName = row[mapping.vendor_category].trim()
                if (!allCategories.has(`vendor:${catName}`)) {
                  allCategories.set(`vendor:${catName}`, { name: catName, type: 'vendor', parent: null })
                }
              }
              

              
              // Collect hierarchies
              if (mapping.category_hierarchy && row[mapping.category_hierarchy]) {
                const hierarchy = row[mapping.category_hierarchy].trim()
                if (!categoryHierarchies.has(hierarchy)) {
                  categoryHierarchies.set(hierarchy, hierarchy.split('>').map(cat => cat.trim()).filter(cat => cat !== ''))
                }
              }
            }
            
            // ULTRA OPTIMIZATION 4: Bulk create all categories at once
            console.log(`Creating ${allCategories.size} categories...`)
            const categoriesToCreate = []
            
            for (const [key, category] of allCategories) {
              const dbKey = `${category.type}:${category.name}:null`
              if (!categoryMap.has(dbKey)) {
                categoriesToCreate.push([category.name, null, category.type, 1, new Date()])
              }
            }
            
            // Bulk insert categories
            if (categoriesToCreate.length > 0) {
              const categoryQuery = 'INSERT INTO categories (name, parent_id, type, level, created_at) VALUES ?'
              const [categoryResult] = await connection.execute(categoryQuery, [categoriesToCreate])
              
              // Update category map with new IDs
              let insertId = categoryResult.insertId
              for (const [name, parent, type] of categoriesToCreate) {
                const key = `${type}:${name}:null`
                categoryMap.set(key, insertId++)
              }
            }
            
            // ULTRA OPTIMIZATION 5: Process hierarchies in memory
            for (const [hierarchy, categories] of categoryHierarchies) {
              let currentParentId = null
              
              for (let i = 0; i < categories.length; i++) {
                const categoryName = categories[i]
                const level = i + 1
                const key = `store:${categoryName}:${currentParentId || 'null'}`
                
                if (!categoryMap.has(key)) {
                  const [result] = await connection.execute(
                    'INSERT INTO categories (name, parent_id, type, level, created_at) VALUES (?, ?, ?, ?, ?)',
                    [categoryName, currentParentId, 'store', level, new Date()]
                  )
                  categoryMap.set(key, result.insertId)
                }
                currentParentId = categoryMap.get(key)
              }
              
              // Cache final hierarchy ID
              categoryMap.set(`hierarchy:${hierarchy}`, currentParentId)
            }
            
            // ULTRA OPTIMIZATION 6: Process products in large batches
            const BATCH_SIZE = 500 // Much larger batch size
            const batches = []
            
            for (let i = 0; i < results.length; i += BATCH_SIZE) {
              batches.push(results.slice(i, i + BATCH_SIZE))
            }
            
            console.log(`Processing ${results.length} products in ${batches.length} batches...`)
            
            for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
              const batch = batches[batchIndex]
              const batchStartTime = Date.now()
              
              // Prepare batch data
              const insertProducts = []
              const updateProducts = []
              
              for (let i = 0; i < batch.length; i++) {
                const row = batch[i]
                const globalIndex = batchIndex * BATCH_SIZE + i
                processed++
                
                try {
                  const productData = {}
                  let vendorCategoryId = null

                  // Process mapping entries
                  for (const [csvHeader, dbField] of Object.entries(mapping)) {
                    if (!dbField || dbField.trim() === '' || row[csvHeader] === undefined || row[csvHeader] === "") {
                      continue
                    }
                    
                    // Skip empty values for required fields
                    if ((dbField === 'sku' || dbField === 'name') && (!row[csvHeader] || row[csvHeader].toString().trim() === '')) {
                      continue
                    }
                    
                    let value = row[csvHeader]
                    
                    // Handle categories with cache
                    if (dbField === 'vendor_category' || dbField === 'vendor_') {
                      vendorCategoryId = categoryMap.get(`vendor:${value.trim()}`)
                      continue
                    }
                    

                    
                    if (dbField === 'category_hierarchy') {
                      if (value && value.trim() !== '') {
                        const hierarchyId = categoryMap.get(`hierarchy:${value.trim()}`)
                        if (hierarchyId) {
                          vendorCategoryId = hierarchyId
                        }
                      }
                      continue
                    }
                    
                    // Skip subcategory fields - they will be processed by processCategoryHierarchy
                    if (dbField.startsWith('vendor_subcategory_') || dbField.startsWith('suk_vendor_') ||
                        dbField.startsWith('store_subcategory_') || dbField.startsWith('subc_store_')) {
                      continue
                    }
                    
                    // Convert data types
                    if (dbField.includes('price') || dbField.includes('cost') || 
                        dbField === 'stock' || dbField === 'weight' || 
                        dbField === 'length' || dbField === 'width' || dbField === 'height') {
                      value = Number.parseFloat(value) || 0
                    } else if (dbField === 'published' || dbField === 'featured') {
                      value = value.toLowerCase() === 'true' || value === '1' || value === 'yes'
                    } else if (dbField.includes('_id')) {
                      value = Number.parseInt(value) || null
                    }

                    productData[dbField] = value
                  }

                  // Add vendor_id if selected
                  if (vendorId) {
                    productData.vendor_id = vendorId
                  }

                  // Process category hierarchies - always process to get the deepest category
                  if (mapping.vendor_category || mapping.vendor_) {
                    vendorCategoryId = await processCategoryHierarchy(row, mapping, 'vendor', categoryCache, connection, vendorId)
                  }
                  


                  // Add category IDs if available
                  if (vendorCategoryId) {
                    productData.vendor_category_id = vendorCategoryId
                  }



                  // Add timestamps
                  productData.updated_at = new Date()

                  // Validate required fields
                  if (productData.sku && productData.name) {
                    const sku = productData.sku
                    
                    if (isUpdateMode) {
                      // Update existing product
                      if (productMap.has(sku)) {
                        updateProducts.push({
                          id: productMap.get(sku),
                          data: productData
                        })
                      } else {
                        skipped++
                      }
                    } else {
                      // Check if product with this SKU already exists
                      if (productMap.has(sku)) {
                        skipped++
                      } else {
                        // Prepare for insert
                        productData.created_at = new Date()
                        insertProducts.push(productData)
                      }
                    }
                  } else {
                    skipped++
                  }
                } catch (error) {
                  console.error(`Row ${globalIndex + 1} import error:`, error)
                  errors.push(`Row ${globalIndex + 1}: ${error.message}`)
                }
              }
              
              // ULTRA OPTIMIZATION 7: Bulk insert all new products
              if (insertProducts.length > 0) {
                const fields = Object.keys(insertProducts[0])
                const values = insertProducts.map(product => 
                  fields.map(field => product[field])
                )
                
                const insertQuery = `INSERT INTO products (${fields.join(', ')}) VALUES ?`
                await connection.execute(insertQuery, [values])
                imported += insertProducts.length
              }
              
              // ULTRA OPTIMIZATION 8: Bulk update existing products
              for (const updateProduct of updateProducts) {
                const fields = Object.keys(updateProduct.data)
                const setClause = fields.map(field => `${field} = ?`).join(', ')
                const updateQuery = `UPDATE products SET ${setClause} WHERE id = ?`
                await connection.execute(updateQuery, [...fields.map(field => updateProduct.data[field]), updateProduct.id])
              }
              updated += updateProducts.length
              
              // Progress update
              const batchProcessingTime = Date.now() - batchStartTime
              const processingRate = Math.round(processed / ((Date.now() - startTime) / 1000))
              const estimatedTimeRemaining = Math.round(((results.length - processed) / processingRate) / 60)
              
              res.write(`data: ${JSON.stringify({
                type: 'progress',
                current: processed,
                total: results.length,
                imported,
                updated,
                skipped,
                errors: errors.length,
                processingRate,
                currentProduct: `Batch ${batchIndex + 1}/${batches.length}`,
                estimatedTimeRemaining,
                batchProcessingTime
              })}\n\n`)
            }
            
            // Commit all changes
            await connection.commit()
            
          } catch (error) {
            await connection.rollback()
            throw error
          } finally {
            connection.release()
          }

          // Clean up uploaded file
          fs.unlinkSync(req.file.path)

          // Get updated product count
          const [productCountResult] = await db.execute("SELECT COUNT(*) as total FROM products")
          const totalProducts = productCountResult[0].total

          // Send completion data
          console.log(`Fast import completed: ${imported} imported, ${updated} updated, ${skipped} skipped, ${errors.length} errors`)
          const completionData = {
            type: 'complete',
            message: `Fast import completed successfully! ${imported} products imported, ${updated} updated, ${skipped} skipped.`,
            imported,
            updated,
            skipped,
            total: results.length,
            errors: errors.slice(0, 10),
            totalProducts,
            processingTime: Math.round((Date.now() - startTime) / 1000)
          }
          console.log("Sending completion data:", completionData)
          res.write(`data: ${JSON.stringify(completionData)}\n\n`)

          res.end()
        } catch (error) {
          console.error("Error in fast import processing:", error)
          res.write(`data: ${JSON.stringify({
            type: 'error',
            message: "Error processing fast import: " + error.message
          })}\n\n`)
          res.end()
        }
      })
      .on("error", (error) => {
        console.error("CSV parsing error:", error)
        res.write(`data: ${JSON.stringify({
          type: 'error',
          message: "Error parsing CSV file: " + error.message
        })}\n\n`)
        res.end()
      })
  } catch (error) {
    console.error("Fast import error:", error)
    res.write(`data: ${JSON.stringify({
      type: 'error',
      message: "Server error: " + error.message
    })}\n\n`)
    res.end()
  }
})

// // Test route for vendor filtering (temporary - remove after testing)
// router.get("/test", async (req, res) => {
//   try {
//     const {
//       page = 1,
//       limit = 20,
//       search = "",
//       vendor_id = "",
//       category_id = "",
//       category_ids = [],
//       vendor_category_ids = [],
//       store_category_ids = [],
//       stock_min = "",
//       stock_max = "",
//       stock_status = "",
//       published = "",
//     } = req.query

//     // Convert page and limit to numbers
//     const pageNum = parseInt(page) || 1
//     const limitNum = parseInt(limit) || 20
//     const offset = (pageNum - 1) * limitNum
//     const whereConditions = []
//     const queryParams = []

//     // Build WHERE conditions
//     if (search) {
//       whereConditions.push(`(
//         p.name LIKE ? OR 
//         p.sku LIKE ? OR 
//         p.id LIKE ? OR 
//         p.short_description LIKE ? OR 
//         p.description LIKE ? OR 
//         p.brand LIKE ? OR 
//         p.mfn LIKE ? OR 
//         p.google_category LIKE ? OR 
//         p.meta_title LIKE ? OR 
//         p.meta_description LIKE ? OR 
//         p.meta_keywords LIKE ? OR 
//         p.visibility LIKE ? OR
//         CAST(p.list_price AS CHAR) LIKE ? OR 
//         CAST(p.market_price AS CHAR) LIKE ? OR 
//         CAST(p.vendor_cost AS CHAR) LIKE ? OR 
//         CAST(p.special_price AS CHAR) LIKE ? OR 
//         CAST(p.stock AS CHAR) LIKE ? OR 
//         CAST(p.weight AS CHAR) LIKE ? OR 
//         CAST(p.length AS CHAR) LIKE ? OR 
//         CAST(p.width AS CHAR) LIKE ? OR 
//         CAST(p.height AS CHAR) LIKE ? OR 
//         CAST(p.vendor_id AS CHAR) LIKE ? OR 
//         CAST(p.vendor_category_id AS CHAR) LIKE ? OR 
//         CAST(p.store_category_id AS CHAR) LIKE ? OR
//         CAST(p.published AS CHAR) LIKE ? OR
//         CAST(p.featured AS CHAR) LIKE ? OR
//         DATE_FORMAT(p.created_at, '%Y-%m-%d %H:%i:%s') LIKE ? OR
//         DATE_FORMAT(p.updated_at, '%Y-%m-%d %H:%i:%s') LIKE ? OR
//         v.name LIKE ? OR
//         vc.name LIKE ? OR
//         sc.name LIKE ?
//       )`)
      
//       // Add search parameter for each field (31 total - including meta fields and created_at)
//       const searchParam = `%${search}%`
//       for (let i = 0; i < 31; i++) {
//         queryParams.push(searchParam)
//       }
//     }

//     if (vendor_id && vendor_id !== "") {
//       const vendorIdNum = parseInt(vendor_id)
//       console.log(`🔍 Adding vendor filter: vendor_id = ${vendorIdNum}`)
//       whereConditions.push("p.vendor_id = ?")
//       queryParams.push(vendorIdNum)
//     }

//     const whereClause = whereConditions.length > 0 ? "WHERE " + whereConditions.join(" AND ") : ""
    
//     console.log(`🔍 Final WHERE clause: ${whereClause}`)
//     console.log(`🔍 Query parameters:`, queryParams)

//     // Get total count
//     const countQuery = `
//       SELECT COUNT(*) as total 
//       FROM products p 
//       LEFT JOIN vendors v ON p.vendor_id = v.id 
//       LEFT JOIN categories vc ON p.vendor_category_id = vc.id
//       LEFT JOIN categories sc ON p.store_category_id = sc.id
//       ${whereClause}
//     `

//     let countResult
//     if (queryParams.length > 0) {
//       [countResult] = await db.execute(countQuery, queryParams)
//     } else {
//       [countResult] = await db.query(countQuery)
//     }

//     // Get products
//     const productsQuery = `
//       SELECT p.*, v.name as vendor_name,
//              vc.name as vendor_category_name,
//              sc.name as store_category_name
//       FROM products p 
//       LEFT JOIN vendors v ON p.vendor_id = v.id 
//       LEFT JOIN categories vc ON p.vendor_category_id = vc.id
//       LEFT JOIN categories sc ON p.store_category_id = sc.id
//       ${whereClause}
//       ORDER BY p.updated_at DESC 
//       LIMIT ? OFFSET ?
//     `
    
//     const productsQueryParams = [...queryParams, parseInt(limitNum), parseInt(offset)]
    
//     const [products] = await db.execute(productsQuery, productsQueryParams)
    
//     return res.json({
//       products,
//       pagination: {
//         page: pageNum,
//         limit: limitNum,
//         total: countResult[0].total,
//         pages: Math.ceil(countResult[0].total / limitNum),
//       },
//       debug: {
//         whereClause,
//         queryParams,
//         vendor_id: req.query.vendor_id
//       }
//     })
//   } catch (error) {
//     console.error("Test route error:", error)
//     return res.status(500).json({ error: error.message })
//   }
// })

// // Get products with pagination
// router.get("/", authenticateToken, async (req, res) => {
//   try {
//     const {
//       page = 1,
//       limit = 20,
//       search = "",
//       vendor_id = "",
//       category_id = "",
//       category_ids = [],
//       vendor_category_ids = [],
//       store_category_ids = [],
//       stock_min = "",
//       stock_max = "",
//       stock_status = "",
//       published = "",
//     } = req.query

//     // Convert page and limit to numbers
//     const pageNum = parseInt(page) || 1
//     const limitNum = parseInt(limit) || 20
//     const offset = (pageNum - 1) * limitNum
//     const whereConditions = []
//     const queryParams = []

//     // Build WHERE conditions
//     if (search) {
//       whereConditions.push(`(
//         p.name LIKE ? OR 
//         p.sku LIKE ? OR 
//         p.id LIKE ? OR 
//         p.short_description LIKE ? OR 
//         p.description LIKE ? OR 
//         p.brand LIKE ? OR 
//         p.mfn LIKE ? OR 
//         p.google_category LIKE ? OR 
//         p.meta_title LIKE ? OR 
//         p.meta_description LIKE ? OR 
//         p.meta_keywords LIKE ? OR 
//         p.visibility LIKE ? OR
//         CAST(p.list_price AS CHAR) LIKE ? OR 
//         CAST(p.market_price AS CHAR) LIKE ? OR 
//         CAST(p.vendor_cost AS CHAR) LIKE ? OR 
//         CAST(p.special_price AS CHAR) LIKE ? OR 
//         CAST(p.stock AS CHAR) LIKE ? OR 
//         CAST(p.weight AS CHAR) LIKE ? OR 
//         CAST(p.length AS CHAR) LIKE ? OR 
//         CAST(p.width AS CHAR) LIKE ? OR 
//         CAST(p.height AS CHAR) LIKE ? OR 
//         CAST(p.vendor_id AS CHAR) LIKE ? OR 
//         CAST(p.vendor_category_id AS CHAR) LIKE ? OR 
//         CAST(p.store_category_id AS CHAR) LIKE ? OR
//         CAST(p.published AS CHAR) LIKE ? OR
//         CAST(p.featured AS CHAR) LIKE ? OR
//         DATE_FORMAT(p.created_at, '%Y-%m-%d %H:%i:%s') LIKE ? OR
//         DATE_FORMAT(p.updated_at, '%Y-%m-%d %H:%i:%s') LIKE ? OR
//         v.name LIKE ? OR
//         vc.name LIKE ? OR
//         sc.name LIKE ?
//       )`)
      
//       // Add search parameter for each field (31 total - including meta fields and created_at)
//       const searchParam = `%${search}%`
//       for (let i = 0; i < 31; i++) {
//         queryParams.push(searchParam)
//       }
//     }

//     // Handle advanced filters
//     if (req.query.advanced_filters) {
//       try {
//         const advancedFilters = JSON.parse(req.query.advanced_filters)
//         console.log('Processing advanced filters:', JSON.stringify(advancedFilters, null, 2))
        
//         advancedFilters.forEach(filter => {
//           if (filter.column && filter.operator && filter.column.trim() !== '' && filter.operator.trim() !== '') {
//             let condition = ''
//             let values = []
            
//             // Map column names to database fields
//             const columnMap = {
//               'id': 'p.id',
//               'sku': 'p.sku',
//               'name': 'p.name',
//               'short_description': 'p.short_description',
//               'description': 'p.description',
//               'brand': 'p.brand',
//               'mfn': 'p.mfn',
//               'stock': 'p.stock',
//               'list_price': 'p.list_price',
//               'market_price': 'p.market_price',
//               'vendor_cost': 'p.vendor_cost',
//               'special_price': 'p.special_price',
//               'weight': 'p.weight',
//               'length': 'p.length',
//               'width': 'p.width',
//               'height': 'p.height',
//               'vendor_name': 'v.name',
//               'vendor_category_name': 'vc.name',
//               'store_category_name': 'sc.name',
//               'google_category': 'p.google_category',
//               'published': 'p.published',
//               'featured': 'p.featured',
//               'visibility': 'p.visibility',
//               'created_at': 'p.created_at',
//               'updated_at': 'p.updated_at'
//             }
            
//             const dbColumn = columnMap[filter.column]
//             if (!dbColumn) return
            
//             // Helper function to convert value based on column type
//             const convertValue = (value, columnName) => {
//               if (value === null || value === undefined || value === '') {
//                 return null
//               }
              
//               // Handle numeric fields
//               if (['stock', 'list_price', 'market_price', 'vendor_cost', 'special_price', 
//                    'weight', 'length', 'width', 'height', 'vendor_id', 'vendor_category_id', 
//                    'store_category_id'].includes(columnName)) {
//                 const num = parseFloat(value)
//                 return isNaN(num) ? null : num
//               }
              
//               // Handle boolean fields
//               if (['published', 'featured'].includes(columnName)) {
//                 if (typeof value === 'boolean') return value
//                 if (typeof value === 'string') {
//                   return value.toLowerCase() === 'true' || value === '1' || value === 'yes'
//                 }
//                 return Boolean(value)
//               }
              
//               // Handle date fields
//               if (['created_at', 'updated_at'].includes(columnName)) {
//                 const date = new Date(value)
//                 return isNaN(date.getTime()) ? null : date
//               }
              
//               // Default to string
//               return String(value)
//             }
            
//             const convertedValue = convertValue(filter.value, filter.column)
//             const convertedValue2 = filter.value2 ? convertValue(filter.value2, filter.column) : null
            
//             switch (filter.operator) {
//               case 'is':
//                 if (convertedValue === null) {
//                   condition = `${dbColumn} IS NULL`
//                 } else {
//                   condition = `${dbColumn} = ?`
//                   values.push(convertedValue)
//                 }
//                 break
//               case 'is_not':
//                 if (convertedValue === null) {
//                   condition = `${dbColumn} IS NOT NULL`
//                 } else {
//                   condition = `${dbColumn} != ?`
//                   values.push(convertedValue)
//                 }
//                 break
//               case 'contains':
//                 if (convertedValue === null || convertedValue === '') {
//                   condition = `${dbColumn} IS NULL OR ${dbColumn} = ''`
//                 } else {
//                   condition = `${dbColumn} LIKE ?`
//                   values.push(`%${convertedValue}%`)
//                 }
//                 break
//               case 'does_not_contain':
//                 if (convertedValue === null || convertedValue === '') {
//                   condition = `${dbColumn} IS NOT NULL AND ${dbColumn} != ''`
//                 } else {
//                   condition = `${dbColumn} NOT LIKE ?`
//                   values.push(`%${convertedValue}%`)
//                 }
//                 break
//               case 'starts_with':
//                 if (convertedValue === null || convertedValue === '') {
//                   condition = `${dbColumn} IS NULL OR ${dbColumn} = ''`
//                 } else {
//                   condition = `${dbColumn} LIKE ?`
//                   values.push(`${convertedValue}%`)
//                 }
//                 break
//               case 'ends_with':
//                 if (convertedValue === null || convertedValue === '') {
//                   condition = `${dbColumn} IS NULL OR ${dbColumn} = ''`
//                 } else {
//                   condition = `${dbColumn} LIKE ?`
//                   values.push(`%${convertedValue}`)
//                 }
//                 break
//               case 'greater_than':
//                 if (convertedValue === null) {
//                   condition = `${dbColumn} IS NULL`
//                 } else {
//                   condition = `${dbColumn} > ?`
//                   values.push(convertedValue)
//                 }
//                 break
//               case 'less_than':
//                 if (convertedValue === null) {
//                   condition = `${dbColumn} IS NULL`
//                 } else {
//                   condition = `${dbColumn} < ?`
//                   values.push(convertedValue)
//                 }
//                 break
//               case 'greater_than_or_equal':
//                 if (convertedValue === null) {
//                   condition = `${dbColumn} IS NULL`
//                 } else {
//                   condition = `${dbColumn} >= ?`
//                   values.push(convertedValue)
//                 }
//                 break
//               case 'less_than_or_equal':
//                 if (convertedValue === null) {
//                   condition = `${dbColumn} IS NULL`
//                 } else {
//                   condition = `${dbColumn} <= ?`
//                   values.push(convertedValue)
//                 }
//                 break
//               case 'between':
//                 if (convertedValue === null || convertedValue2 === null) {
//                   condition = `${dbColumn} IS NULL`
//                 } else {
//                   condition = `${dbColumn} BETWEEN ? AND ?`
//                   values.push(convertedValue, convertedValue2)
//                 }
//                 break
//               case 'before':
//                 if (convertedValue === null) {
//                   condition = `${dbColumn} IS NULL`
//                 } else {
//                   condition = `${dbColumn} < ?`
//                   values.push(convertedValue)
//                 }
//                 break
//               case 'after':
//                 if (convertedValue === null) {
//                   condition = `${dbColumn} IS NULL`
//                 } else {
//                   condition = `${dbColumn} > ?`
//                   values.push(convertedValue)
//                 }
//                 break
//               case 'is_set':
//                 condition = `${dbColumn} IS NOT NULL AND ${dbColumn} != ''`
//                 break
//               case 'is_not_set':
//                 condition = `${dbColumn} IS NULL OR ${dbColumn} = ''`
//                 break
//               case 'equal_to':
//                 if (convertedValue === null) {
//                   condition = `${dbColumn} IS NULL`
//                 } else {
//                   condition = `${dbColumn} = ?`
//                   values.push(convertedValue)
//                 }
//                 break
//               case 'not_equal_to':
//                 if (convertedValue === null) {
//                   condition = `${dbColumn} IS NOT NULL`
//                 } else {
//                   condition = `${dbColumn} != ?`
//                   values.push(convertedValue)
//                 }
//                 break
//               case 'is_empty':
//                 condition = `${dbColumn} IS NULL OR ${dbColumn} = ''`
//                 break
//               case 'is_not_empty':
//                 condition = `${dbColumn} IS NOT NULL AND ${dbColumn} != ''`
//                 break
//               case 'not_between':
//                 if (convertedValue === null || convertedValue2 === null) {
//                   condition = `${dbColumn} IS NULL`
//                 } else {
//                   condition = `${dbColumn} NOT BETWEEN ? AND ?`
//                   values.push(convertedValue, convertedValue2)
//                 }
//                 break
//               case 'is_zero':
//                 condition = `${dbColumn} = 0`
//                 break
//               case 'is_not_zero':
//                 condition = `${dbColumn} != 0`
//                 break
//               case 'is_positive':
//                 condition = `${dbColumn} > 0`
//                 break
//               case 'is_negative':
//                 condition = `${dbColumn} < 0`
//                 break
//               case 'is_true':
//                 condition = `${dbColumn} = 1`
//                 break
//               case 'is_false':
//                 condition = `${dbColumn} = 0`
//                 break
//               case 'before_or_equal':
//                 if (convertedValue === null) {
//                   condition = `${dbColumn} IS NULL`
//                 } else {
//                   condition = `${dbColumn} <= ?`
//                   values.push(convertedValue)
//                 }
//                 break
//               case 'after_or_equal':
//                 if (convertedValue === null) {
//                   condition = `${dbColumn} IS NULL`
//                 } else {
//                   condition = `${dbColumn} >= ?`
//                   values.push(convertedValue)
//                 }
//                 break
//               case 'is_today':
//                 condition = `DATE(${dbColumn}) = CURDATE()`
//                 break
//               case 'is_yesterday':
//                 condition = `DATE(${dbColumn}) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)`
//                 break
//               case 'is_this_week':
//                 condition = `YEARWEEK(${dbColumn}) = YEARWEEK(NOW())`
//                 break
//               case 'is_this_month':
//                 condition = `YEAR(${dbColumn}) = YEAR(NOW()) AND MONTH(${dbColumn}) = MONTH(NOW())`
//                 break
//               case 'is_this_year':
//                 condition = `YEAR(${dbColumn}) = YEAR(NOW())`
//                 break
//             }
            
//             if (condition) {
//               console.log(`Filter: ${filter.column} ${filter.operator} ${filter.value} -> SQL: ${condition}`, values)
//               whereConditions.push(condition)
//               queryParams.push(...values)
//             }
//           }
//         })
//       } catch (error) {
//         console.error('Error parsing advanced filters:', error)
//         // Continue without filters rather than failing the entire request
//       }
//     }

//     if (vendor_id && vendor_id !== "") {
//       const vendorIdNum = parseInt(vendor_id)
//       console.log(`🔍 Adding vendor filter: vendor_id = ${vendorIdNum}`)
//       whereConditions.push("p.vendor_id = ?")
//       queryParams.push(vendorIdNum)
//     }

//     // Handle single category_id (backward compatibility)
//     if (category_id) {
//       whereConditions.push("(p.vendor_category_id = ? OR p.store_category_id = ?)")
//       queryParams.push(category_id, category_id)
//     }
    
//     // Handle multiple category_ids
//     if (category_ids && category_ids.length > 0) {
//       // Ensure category_ids is an array (Express might pass it as a string or array)
//       let categoryIdsArray
//       if (Array.isArray(category_ids)) {
//         categoryIdsArray = category_ids
//       } else if (typeof category_ids === 'string') {
//         // Handle comma-separated string
//         categoryIdsArray = category_ids.split(',').map(id => id.trim()).filter(id => id)
//       } else {
//         categoryIdsArray = [category_ids]
//       }
      
//       if (categoryIdsArray.length > 0) {
//         const placeholders = categoryIdsArray.map(() => "(p.vendor_category_id = ? OR p.store_category_id = ?)").join(" OR ")
//         whereConditions.push(`(${placeholders})`)
//         // Add each category_id twice (once for vendor_category_id, once for store_category_id)
//         categoryIdsArray.forEach(id => {
//           queryParams.push(id, id)
//         })
//       }
//     }

//     // Handle vendor_category_ids with hierarchical search
//     if (req.query.vendor_category_ids && req.query.vendor_category_ids.length > 0) {
//       let vendorCategoryIdsArray
//       if (Array.isArray(req.query.vendor_category_ids)) {
//         vendorCategoryIdsArray = req.query.vendor_category_ids
//       } else if (typeof req.query.vendor_category_ids === 'string') {
//         // Handle comma-separated string
//         vendorCategoryIdsArray = req.query.vendor_category_ids.split(',').map(id => id.trim()).filter(id => id)
//       } else {
//         vendorCategoryIdsArray = [req.query.vendor_category_ids]
//       }
      
//       // Get all subcategory IDs recursively for each vendor category
//       const allCategoryIds = new Set()
      
//       for (const categoryId of vendorCategoryIdsArray) {
//         // Add the parent category itself
//         allCategoryIds.add(parseInt(categoryId))
        
//         // Get all subcategories recursively
//         const [subcategories] = await db.execute(`
//           WITH RECURSIVE category_tree AS (
//             SELECT id, parent_id, 0 as level
//             FROM categories 
//             WHERE id = ?
            
//             UNION ALL
            
//             SELECT c.id, c.parent_id, ct.level + 1
//             FROM categories c
//             INNER JOIN category_tree ct ON c.parent_id = ct.id
//             WHERE ct.level < 10 -- Prevent infinite recursion
//           )
//           SELECT id FROM category_tree
//         `, [categoryId])
        
//         // Add all subcategory IDs
//         subcategories.forEach(subcat => {
//           allCategoryIds.add(subcat.id)
//         })
//       }
      
//       // Convert Set to Array
//       const allCategoryIdsArray = Array.from(allCategoryIds)
      
//       if (allCategoryIdsArray.length > 0) {
//         const placeholders = allCategoryIdsArray.map(() => "p.vendor_category_id = ?").join(" OR ")
//         whereConditions.push(`(${placeholders})`)
//         queryParams.push(...allCategoryIdsArray)
//       }
//     }

//     // Handle stock filters (both stock_status and stock_min/stock_max)
//     if (stock_status === "in_stock") {
//       console.log(`🔍 Adding stock filter: in_stock (stock > 0)`)
//       whereConditions.push("p.stock > 0")
//     } else if (stock_status === "out_of_stock") {
//       console.log(`🔍 Adding stock filter: out_of_stock (stock <= 0)`)
//       whereConditions.push("p.stock <= 0")
//     } else if (stock_min !== "" && stock_min !== undefined) {
//       console.log(`🔍 Adding stock filter: stock_min = ${stock_min}`)
//       whereConditions.push("p.stock >= ?")
//       queryParams.push(parseInt(stock_min))
//     } else if (stock_max !== "" && stock_max !== undefined) {
//       console.log(`🔍 Adding stock filter: stock_max = ${stock_max}`)
//       whereConditions.push("p.stock <= ?")
//       queryParams.push(parseInt(stock_max))
//     }

//     // Handle published filter
//     if (published !== "" && published !== undefined) {
//       console.log(`🔍 Adding published filter: published = ${published}`)
//       whereConditions.push("p.published = ?")
//       // Convert string to integer (1 for true, 0 for false)
//       queryParams.push(published === "true" ? 1 : 0)
//     }

//     const whereClause = whereConditions.length > 0 ? "WHERE " + whereConditions.join(" AND ") : ""
    
//     console.log(`🔍 Final WHERE clause: ${whereClause}`)
//     console.log(`🔍 Query parameters:`, queryParams)

//     // Get total count
//     const countQuery = `
//       SELECT COUNT(*) as total 
//       FROM products p 
//       LEFT JOIN vendors v ON p.vendor_id = v.id 
//       LEFT JOIN categories vc ON p.vendor_category_id = vc.id
//       LEFT JOIN categories sc ON p.store_category_id = sc.id
//       ${whereClause}
//     `

    
//     // Use query() for count to avoid prepared statement issues
//     let countResult
//     if (queryParams.length > 0) {
//       // If there are parameters, use execute
//       [countResult] = await db.execute(countQuery, queryParams)
//     } else {
//       // If no parameters, use query
//       [countResult] = await db.query(countQuery)
//     }

//     // Get products - rebuild the query and parameters to ensure consistency
//     const productsQuery = `
//       SELECT p.*, v.name as vendor_name,
//              vc.name as vendor_category_name,
//              sc.name as store_category_name
//       FROM products p 
//       LEFT JOIN vendors v ON p.vendor_id = v.id 
//       LEFT JOIN categories vc ON p.vendor_category_id = vc.id
//       LEFT JOIN categories sc ON p.store_category_id = sc.id
//       ${whereClause}
//       ORDER BY p.updated_at DESC 
//       LIMIT ? OFFSET ?
//     `
//     // Use the same parameters array that was built for the WHERE conditions
//     const productsQueryParams = [...queryParams]
    
//     // Add LIMIT and OFFSET parameters - ensure they are integers
//     productsQueryParams.push(parseInt(limitNum), parseInt(offset))
    
//     // Final validation
//     const placeholderCount = (productsQuery.match(/\?/g) || []).length
//     const paramCount = productsQueryParams.length
    
//     if (placeholderCount !== paramCount) {
//       console.error(`PARAMETER MISMATCH: ${paramCount} parameters for ${placeholderCount} placeholders`)
//       return res.status(500).json({ 
//         message: "Database query error", 
//         error: `Parameter mismatch: ${paramCount} parameters for ${placeholderCount} placeholders` 
//       })
//     }
    
//     // Try executing with explicit parameter types
//     try {
//       const [products] = await db.execute(productsQuery, productsQueryParams)
//       return res.json({
//         products,
//         pagination: {
//           page: pageNum,
//           limit: limitNum,
//           total: countResult[0].total,
//           pages: Math.ceil(countResult[0].total / limitNum),
//         },
//       })
//     } catch (executeError) {
//       console.error('Execute error details:', executeError)
//       console.error('Query:', productsQuery)
//       console.error('Parameters:', productsQueryParams)
//       console.error('Parameter types:', productsQueryParams.map(p => typeof p))
      
//       // Fallback: use query() instead of execute() to avoid prepared statement issues
//       const simpleQuery = `
//         SELECT p.*, v.name as vendor_name,
//                vc.name as vendor_category_name,
//                sc.name as store_category_name
//         FROM products p 
//         LEFT JOIN vendors v ON p.vendor_id = v.id 
//         LEFT JOIN categories vc ON p.vendor_category_id = vc.id
//         LEFT JOIN categories sc ON p.store_category_id = sc.id
//         ORDER BY p.updated_at DESC 
//         LIMIT ${parseInt(limitNum)} OFFSET ${parseInt(offset)}
//       `
//       const [products] = await db.query(simpleQuery)
      
//       return res.json({
//         products,
//         pagination: {
//           page: pageNum,
//           limit: limitNum,
//           total: countResult[0].total,
//           pages: Math.ceil(countResult[0].total / limitNum),
//         },
//       })
//     }
//   } catch (error) {
//     console.error("Get products error:", error)
//     res.status(500).json({ message: "Server error" })
//   }
// })

// // Create product
// router.post("/", authenticateToken, async (req, res) => {
//   try {
//     const {
//       sku,
//       mfn,
//       name,
//       short_description,
//       description,
//       brand,
//       stock,
//       list_price,
//       market_price,
//       vendor_cost,
//       special_price,
//       weight,
//       length,
//       width,
//       height,
//       vendor_id,
//       vendor_category_id,
//       store_category_id,
//       google_category,
//       published,
//       featured,
//       visibility,
//       meta_title,
//       meta_description,
//       meta_keywords,
//     } = req.body

//     // Sanitize text inputs to handle special characters and undefined values
//     const sanitizeText = (text) => {
//       if (text === undefined || text === null) return null;
//       if (text === '') return null;
//       return text.toString().trim();
//     };

//     // Check if meta fields exist in the database
//     let hasMetaFields = false
//     try {
//       const [columns] = await db.execute("SHOW COLUMNS FROM products LIKE 'meta_title'")
//       hasMetaFields = columns.length > 0
//     } catch (error) {
//       console.log("Meta fields not found in database, skipping them")
//     }

//     const insertFields = [
//       'sku', 'mfn', 'name', 'short_description', 'description', 'brand', 'stock', 'list_price',
//       'market_price', 'vendor_cost', 'special_price', 'weight', 'length',
//       'width', 'height', 'vendor_id', 'vendor_category_id', 'store_category_id',
//       'google_category', 'published', 'featured', 'visibility'
//     ]

//     const insertValues = [
//       sanitizeText(sku),
//       sanitizeText(mfn),
//       sanitizeText(name),
//       sanitizeText(short_description),
//       sanitizeText(description),
//       sanitizeText(brand),
//       stock || 0,
//       list_price || null,
//       market_price || null,
//       vendor_cost || null,
//       special_price || null,
//       weight || null,
//       length || null,
//       width || null,
//       height || null,
//       vendor_id || null,
//       vendor_category_id || null,
//       store_category_id || null,
//       sanitizeText(google_category),
//       published !== false,
//       featured === true,
//       visibility || "public"
//     ]

//     // Add meta fields only if they exist in the database
//     if (hasMetaFields) {
//       insertFields.push('meta_title', 'meta_description', 'meta_keywords')
//       insertValues.push(
//         sanitizeText(meta_title),
//         sanitizeText(meta_description),
//         sanitizeText(meta_keywords)
//       )
//     }

//     const [result] = await db.execute(
//       `INSERT INTO products (${insertFields.join(', ')}) VALUES (${insertFields.map(() => '?').join(', ')})`,
//       insertValues
//     )

//     res.status(201).json({ id: result.insertId, message: "Product created successfully" })
//   } catch (error) {
//     console.error("Create product error:", error)
//     if (error.code === "ER_DUP_ENTRY") {
//       res.status(400).json({ message: "SKU already exists" })
//     } else {
//       res.status(500).json({ message: "Server error" })
//     }
//   }
// })

// // Bulk update products
// router.put("/bulk/update", authenticateToken, async (req, res) => {
//   try {
//     const { ids, updateData } = req.body
    
//     console.log("Bulk update request:", { ids, updateData })

//     if (!ids || !Array.isArray(ids) || ids.length === 0) {
//       return res.status(400).json({ message: "Product IDs are required" })
//     }

//     if (!updateData || Object.keys(updateData).length === 0) {
//       return res.status(400).json({ message: "Update data is required" })
//     }

//     // Sanitize text inputs to handle special characters
//     const sanitizeText = (text) => {
//       if (!text) return text;
//       return text.toString().trim();
//     };

//     // Process the update data similar to single product update
//     const processedData = {}
//     Object.keys(updateData).forEach((key) => {
//       let value = updateData[key]
      
//       // Handle decimal/numeric fields
//       if (['list_price', 'market_price', 'vendor_cost', 'special_price', 'weight', 'length', 'width', 'height'].includes(key)) {
//         if (value === '' || value === null || value === undefined) {
//           value = null
//         } else {
//           value = Number.parseFloat(value) || null
//         }
//       }
//       // Handle integer fields
//       else if (['stock', 'vendor_id', 'vendor_category_id', 'store_category_id'].includes(key)) {
//         if (value === '' || value === null || value === undefined) {
//           value = null
//         } else {
//           value = Number.parseInt(value) || null
//         }
//       }
//       // Handle boolean fields
//       else if (['published', 'featured'].includes(key)) {
//         value = value === true || value === 'true' || value === 1
//       }
//       // Handle text fields
//       else {
//         value = sanitizeText(value)
//       }
      
//       processedData[key] = value
//     })

//     const fields = Object.keys(processedData)
//       .map((key) => `${key} = ?`)
//       .join(", ")
//     const values = Object.values(processedData)

//     // Update all products with the same data
//     const placeholders = ids.map(() => "?").join(",")
//     const updateQuery = `UPDATE products SET ${fields}, updated_at = NOW() WHERE id IN (${placeholders})`
    
//     await db.execute(updateQuery, [...values, ...ids])

//     res.json({ 
//       message: `${ids.length} product(s) updated successfully`,
//       updatedCount: ids.length
//     })
//   } catch (error) {
//     console.error("Bulk update products error:", error)
//     res.status(500).json({ message: "Server error" })
//   }
// })

// // Update product
// router.put("/:id", authenticateToken, async (req, res) => {
//   try {
//     const { id } = req.params
//     const updateData = req.body

//     // Validate required fields
//     if (!updateData.name || !updateData.sku) {
//       return res.status(400).json({ message: "Name and SKU are required" })
//     }

//     // Remove system fields that should not be updated
//     const systemFields = ['id', 'created_at', 'updated_at', 'vendor_name', 'vendor_category_name', 'store_category_name']
//     systemFields.forEach(field => {
//       delete updateData[field]
//     })

//     // Check if SKU already exists for another product
//     const [existing] = await db.execute(
//       "SELECT id FROM products WHERE sku = ? AND id != ?",
//       [updateData.sku, id]
//     )

//     if (existing.length > 0) {
//       return res.status(400).json({ message: "SKU already exists" })
//     }

//     // Sanitize text inputs to handle special characters
//     const sanitizeText = (text) => {
//       if (!text) return text;
//       return text.toString().trim();
//     };

//     // Process update data to handle empty values for decimal fields
//     const processedData = {}
//     Object.keys(updateData).forEach(key => {
//       // Skip timestamp fields that should not be updated by user
//       if (['created_at', 'updated_at', 'id'].includes(key)) {
//         return
//       }
      
//       let value = updateData[key]
      
//       // Handle decimal/numeric fields
//       if (['list_price', 'market_price', 'vendor_cost', 'special_price', 'weight', 'length', 'width', 'height'].includes(key)) {
//         if (value === '' || value === null || value === undefined) {
//           value = null
//         } else {
//           value = Number.parseFloat(value) || null
//         }
//       }
//       // Handle integer fields
//       else if (['stock', 'vendor_id', 'vendor_category_id', 'store_category_id'].includes(key)) {
//         if (value === '' || value === null || value === undefined) {
//           value = null
//         } else {
//           value = Number.parseInt(value) || null
//         }
//       }
//       // Handle boolean fields
//       else if (['published', 'featured'].includes(key)) {
//         value = value === true || value === 'true' || value === 1
//       }
//       // Handle JSON fields
//       else if (['images', 'gallery'].includes(key)) {
//         if (typeof value === 'string') {
//           try {
//             value = JSON.parse(value)
//           } catch (e) {
//             value = null
//           }
//         }
//         // If value is not null/undefined, stringify it for MySQL JSON storage
//         if (value !== null && value !== undefined) {
//           value = JSON.stringify(value)
//         }
//       }
//       // Handle text fields
//       else {
//         value = sanitizeText(value)
//       }
      
//       processedData[key] = value
//     })

//     const fields = Object.keys(processedData)
//       .map((key) => `${key} = ?`)
//       .join(", ")
//     const values = Object.values(processedData)
//     values.push(id)

//     await db.execute(`UPDATE products SET ${fields}, updated_at = NOW() WHERE id = ?`, values)

//     res.json({ message: "Product updated successfully" })
//   } catch (error) {
//     console.error("Update product error:", error)
//     res.status(500).json({ message: "Server error" })
//   }
// })



// // Delete product
// router.delete("/:id", authenticateToken, async (req, res) => {
//   try {
//     const { id } = req.params
//     await db.execute("DELETE FROM products WHERE id = ?", [id])
//     res.json({ message: "Product deleted successfully" })
//   } catch (error) {
//     console.error("Delete product error:", error)
//     res.status(500).json({ message: "Server error" })
//   }
// })

// // Export products with category path formatting
// router.get("/export", async (req, res) => {
//   try {
//     console.log("Export request received with query params:", req.query)
    
//     const { 
//       mode = "woocommerce",
//       search,
//       vendor_id,
//       category_ids,
//       stock_min,
//       stock_max,
//       published,
//       advanced_filters
//     } = req.query // woocommerce or direct
    
//     // Build the WHERE clause based on filters
//     let whereConditions = []
//     let queryParams = []
    
//     // Search filter
//     if (search) {
//       whereConditions.push(`(p.name LIKE ? OR p.sku LIKE ? OR p.description LIKE ? OR p.brand LIKE ?)`)
//       const searchTerm = `%${search}%`
//       queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm)
//     }
    
//     // Vendor filter
//     if (vendor_id) {
//       whereConditions.push(`p.vendor_id = ?`)
//       queryParams.push(vendor_id)
//     }
    
//     // Category filter
//     if (category_ids) {
//       const categoryIds = Array.isArray(category_ids) ? category_ids : [category_ids]
//       if (categoryIds.length > 0) {
//         const placeholders = categoryIds.map(() => '?').join(',')
//         whereConditions.push(`(p.store_category_id IN (${placeholders}) OR p.vendor_category_id IN (${placeholders}))`)
//         queryParams.push(...categoryIds, ...categoryIds)
//       }
//     }
    
//     // Stock filters
//     if (stock_min !== undefined) {
//       whereConditions.push(`p.stock >= ?`)
//       queryParams.push(stock_min)
//     }
//     if (stock_max !== undefined) {
//       whereConditions.push(`p.stock <= ?`)
//       queryParams.push(stock_max)
//     }
    
//     // Published filter
//     if (published !== undefined && published !== '') {
//       whereConditions.push(`p.published = ?`)
//       queryParams.push(published === 'true' ? 1 : 0)
//     }
    
//     // Advanced filters
//     if (advanced_filters) {
//       try {
//         const advancedFilters = JSON.parse(advanced_filters)
//         advancedFilters.forEach(filter => {
//           if (filter.column && filter.operator && filter.value !== undefined) {
//             let condition = ''
//             let value = filter.value
            
//             switch (filter.operator) {
//               case 'is':
//                 condition = `p.${filter.column} = ?`
//                 break
//               case 'is_not':
//                 condition = `p.${filter.column} != ?`
//                 break
//               case 'contains':
//                 condition = `p.${filter.column} LIKE ?`
//                 value = `%${filter.value}%`
//                 break
//               case 'does_not_contain':
//                 condition = `p.${filter.column} NOT LIKE ?`
//                 value = `%${filter.value}%`
//                 break
//               case 'starts_with':
//                 condition = `p.${filter.column} LIKE ?`
//                 value = `${filter.value}%`
//                 break
//               case 'ends_with':
//                 condition = `p.${filter.column} LIKE ?`
//                 value = `%${filter.value}`
//                 break
//               case 'greater_than':
//                 condition = `p.${filter.column} > ?`
//                 break
//               case 'less_than':
//                 condition = `p.${filter.column} < ?`
//                 break
//               case 'greater_than_or_equal':
//                 condition = `p.${filter.column} >= ?`
//                 break
//               case 'less_than_or_equal':
//                 condition = `p.${filter.column} <= ?`
//                 break
//               case 'between':
//                 if (filter.value2 !== undefined) {
//                   condition = `p.${filter.column} BETWEEN ? AND ?`
//                   queryParams.push(filter.value, filter.value2)
//                   break
//                 }
//                 break
//               case 'is_set':
//                 condition = `p.${filter.column} IS NOT NULL AND p.${filter.column} != ''`
//                 break
//               case 'is_not_set':
//                 condition = `(p.${filter.column} IS NULL OR p.${filter.column} = '')`
//                 break
//             }
            
//             if (condition) {
//               whereConditions.push(condition)
//               // Only add parameter for conditions that need it
//               if (filter.operator !== 'is_set' && filter.operator !== 'is_not_set') {
//                 queryParams.push(value)
//               }
//             }
//           }
//         })
//       } catch (error) {
//         console.error('Error parsing advanced filters:', error)
//       }
//     }
    
//     // Build the WHERE clause
//     const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''
    
//     console.log("WHERE clause:", whereClause)
//     console.log("Query params:", queryParams)
//     console.log("Number of where conditions:", whereConditions.length)
    
//     // Get filtered products with their category information
//     const [products] = await db.execute(`
//       SELECT 
//         p.*,
//         v.name as vendor_name,
//         vc.name as vendor_category_name,
//         sc.name as store_category_name,
//         sc.id as store_category_id
//       FROM products p
//       LEFT JOIN vendors v ON p.vendor_id = v.id
//       LEFT JOIN categories vc ON p.vendor_category_id = vc.id
//       LEFT JOIN categories sc ON p.store_category_id = sc.id
//       ${whereClause}
//       ORDER BY p.id
//     `, queryParams)

//     console.log("Number of products returned:", products.length)

//     // Get all categories for path building (both store and vendor)
//     const [categories] = await db.execute(`
//       SELECT id, name, parent_id, level, type
//       FROM categories 
//       ORDER BY type, level, name
//     `)

//     // Build category lookup map (for store categories only, used by buildCategoryPath)
//     const categoryMap = {}
//     categories.filter(cat => cat.type === 'store').forEach(cat => {
//       categoryMap[cat.id] = cat
//     })

//     // Function to build category path
//     const buildCategoryPath = (categoryId) => {
//       if (!categoryId || !categoryMap[categoryId]) return []
      
//       const path = []
//       let currentId = categoryId
      
//       while (currentId && categoryMap[currentId]) {
//         path.unshift(categoryMap[currentId].name)
//         currentId = categoryMap[currentId].parent_id
//       }
      
//       return path
//     }

//     // Function to format category path based on mode
//     const formatCategoryPath = (categoryId) => {
//       const path = buildCategoryPath(categoryId)
      
//       if (mode === "woocommerce") {
//         return path.join(" > ")
//       } else {
//         // Direct mode - return array with up to 5 levels
//         const result = new Array(5).fill("")
//         path.forEach((categoryName, index) => {
//           if (index < 5) {
//             result[index] = categoryName
//           }
//         })
//         return result
//       }
//     }

//     // Function to get vendor category path
//     const getVendorCategoryPath = (vendorCategoryId) => {
//       if (!vendorCategoryId) return ""
      
//       // Get vendor category and its parents
//       const vendorCategory = categories.find(cat => cat.id === vendorCategoryId && cat.type === 'vendor')
//       if (!vendorCategory) return ""
      
//       const path = [vendorCategory.name]
//       let currentId = vendorCategory.parent_id
      
//       while (currentId) {
//         const parent = categories.find(cat => cat.id === currentId && cat.type === 'vendor')
//         if (parent) {
//           path.unshift(parent.name)
//           currentId = parent.parent_id
//         } else {
//           break
//         }
//       }
      
//       return path.join(" > ")
//     }

//     // Prepare CSV data
//     let csvData = []
    
//     if (mode === "woocommerce") {
//       // WooCommerce mode - single Category Path column
//       const headers = [
//         "ID", "SKU", "Product Name", "Short Description", "Description", "Brand", "MFN",
//         "Stock", "List Price", "Market Price", "Cost", "Special Price", "Weight",
//         "Length", "Width", "Height", "Vendor", "Vendor Category", "Store Category Path", "Vendor Category Path",
//         "Google Category", "Published", "Featured", "Visibility", "Created", "Updated"
//       ]
      
//       csvData.push(headers)
      
//       products.forEach(product => {
//         const storeCategoryPath = formatCategoryPath(product.store_category_id)
//         const vendorCategoryPath = getVendorCategoryPath(product.vendor_category_id)
//         const row = [
//           product.id,
//           product.sku,
//           product.name,
//           product.short_description,
//           product.description,
//           product.brand,
//           product.mfn,
//           product.stock,
//           product.list_price,
//           product.market_price,
//           product.vendor_cost,
//           product.special_price,
//           product.weight,
//           product.length,
//           product.width,
//           product.height,
//           product.vendor_name,
//           product.vendor_category_name,
//           storeCategoryPath,
//           vendorCategoryPath,
//           product.google_category,
//           product.published ? "Yes" : "No",
//           product.featured ? "Yes" : "No",
//           product.visibility,
//           product.created_at,
//           product.updated_at
//         ]
//         csvData.push(row)
//       })
//     } else {
//       // Direct mode - separate columns for each category level
//       const headers = [
//         "ID", "SKU", "Product Name", "Short Description", "Description", "Brand", "MFN",
//         "Stock", "List Price", "Market Price", "Cost", "Special Price", "Weight",
//         "Length", "Width", "Height", "Vendor", "Vendor Category", "Store ParentCategory",
//         "Store Subcategory1", "Store Subcategory2", "Store Subcategory3", "Store Subcategory4",
//         "Vendor Category Path", "Google Category", "Published", "Featured", "Visibility", "Created", "Updated"
//       ]
      
//       csvData.push(headers)
      
//       products.forEach(product => {
//         const storeCategoryLevels = formatCategoryPath(product.store_category_id)
//         const vendorCategoryPath = getVendorCategoryPath(product.vendor_category_id)
//         const row = [
//           product.id,
//           product.sku,
//           product.name,
//           product.short_description,
//           product.description,
//           product.brand,
//           product.mfn,
//           product.stock,
//           product.list_price,
//           product.market_price,
//           product.vendor_cost,
//           product.special_price,
//           product.weight,
//           product.length,
//           product.width,
//           product.height,
//           product.vendor_name,
//           product.vendor_category_name,
//           storeCategoryLevels[0] || "", // Store ParentCategory
//           storeCategoryLevels[1] || "", // Store Subcategory1
//           storeCategoryLevels[2] || "", // Store Subcategory2
//           storeCategoryLevels[3] || "", // Store Subcategory3
//           storeCategoryLevels[4] || "", // Store Subcategory4
//           vendorCategoryPath, // Vendor Category Path
//           product.google_category,
//           product.published ? "Yes" : "No",
//           product.featured ? "Yes" : "No",
//           product.visibility,
//           product.created_at,
//           product.updated_at
//         ]
//         csvData.push(row)
//       })
//     }

//     // Convert to CSV string
//     const csvContent = csvData.map(row => 
//       row.map(cell => {
//         // Escape quotes and wrap in quotes if contains comma, quote, or newline
//         const cellStr = String(cell || "")
//         if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
//           return `"${cellStr.replace(/"/g, '""')}"`
//         }
//         return cellStr
//       }).join(',')
//     ).join('\n')

//     res.setHeader("Content-Type", "text/csv")
//     res.setHeader("Content-Disposition", `attachment; filename=products_${mode}_${new Date().toISOString().split('T')[0]}.csv`)
//     res.send(csvContent)
    
//   } catch (error) {
//     console.error("Export products error:", error)
//     res.status(500).json({ message: "Server error" })
//   }
// })

// // Get single product
// router.get("/:id", authenticateToken, async (req, res) => {
//   try {
//     const { id } = req.params
//     const [products] = await db.execute(`
//       SELECT 
//         p.*,
//         v.name as vendor_name,
//         vc.name as vendor_category_name,
//         sc.name as store_category_name
//       FROM products p
//       LEFT JOIN vendors v ON p.vendor_id = v.id
//       LEFT JOIN categories vc ON p.vendor_category_id = vc.id
//       LEFT JOIN categories sc ON p.store_category_id = sc.id
//       WHERE p.id = ?
//     `, [id])

//     if (products.length === 0) {
//       return res.status(404).json({ message: "Product not found" })
//     }

//     res.json(products[0])
//   } catch (error) {
//     console.error("Get product error:", error)
//     res.status(500).json({ message: "Server error" })
//   }
// })

// // ULTRA LIGHTNING FAST Import - Advanced DSA Optimized Version
// router.post("/import/lightning", authenticateToken, upload.single("csvFile"), async (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({ message: "CSV file is required" })
//     }

//     const { fieldMapping, updateMode, selectedVendor } = req.body
//     const rawMapping = fieldMapping ? JSON.parse(fieldMapping) : {}
    
//     // Clean up mapping
//     const mapping = {}
//     for (const [csvHeader, dbField] of Object.entries(rawMapping)) {
//       if (dbField && dbField.trim() !== '' && csvHeader && csvHeader.trim() !== '') {
//         mapping[csvHeader] = dbField.trim()
//       }
//     }
    
//     console.log('Lightning import - Clean mapping:', mapping)
    
//     const isUpdateMode = updateMode === 'true'
//     const vendorId = selectedVendor ? parseInt(selectedVendor) : null
//     const results = []
//     const errors = []
//     const startTime = Date.now()

//     // Set headers for streaming response
//     res.writeHead(200, {
//       'Content-Type': 'text/plain',
//       'Transfer-Encoding': 'chunked',
//       'Cache-Control': 'no-cache',
//       'Connection': 'keep-alive'
//     })

//     fs.createReadStream(req.file.path)
//       .pipe(csv())
//       .on("data", (data) => results.push(data))
//       .on("end", async () => {
//         try {
//           let imported = 0
//           let updated = 0
//           let skipped = 0
//           let processed = 0

//           // Send initial progress
//           res.write(`data: ${JSON.stringify({
//             type: 'progress',
//             current: 0,
//             total: results.length,
//             imported: 0,
//             updated: 0,
//             skipped: 0,
//             errors: 0,
//             currentProduct: null,
//             processingRate: 0
//           })}\n\n`)

//           // LIGHTNING OPTIMIZATION 1: Advanced Data Structures
//           console.log('Initializing advanced data structures...')
          
//           // Hash Map for O(1) category lookups
//           const categoryHashMap = new Map()
//           const categoryTreeMap = new Map() // For hierarchical categories
//           const productHashMap = new Map()
//           const categoryCache = new Map() // Cache for category lookups
          
//           // LIGHTNING OPTIMIZATION 2: Single Database Connection with Prepared Statements
//           const connection = await db.getConnection()
          
//           try {
//             await connection.beginTransaction()
            
//             // LIGHTNING OPTIMIZATION 3: Bulk Load ALL Data in One Query
//             console.log('Bulk loading existing data...')
//             const [existingData] = await connection.execute(`
//               SELECT 
//                 c.id as category_id, c.name as category_name, c.parent_id, c.type,
//                 p.id as product_id, p.sku
//               FROM categories c
//               LEFT JOIN products p ON p.sku IS NOT NULL
//               WHERE c.type IN ('vendor', 'store')
//             `)
            
//             // LIGHTNING OPTIMIZATION 4: O(n) Hash Map Population
//             const loadStartTime = Date.now()
//             existingData.forEach(row => {
//               if (row.category_id) {
//                 const key = `${row.type}:${row.category_name}:${row.parent_id || 'null'}`
//                 categoryHashMap.set(key, row.category_id)
//               }
//               if (row.product_id) {
//                 productHashMap.set(row.sku, row.product_id)
//               }
//             })
//             console.log(`Hash maps populated in ${Date.now() - loadStartTime}ms`)
            
//             // LIGHTNING OPTIMIZATION 5: Advanced Category Collection with Set Operations
//             const categoryCollectionStart = Date.now()
//             const vendorCategories = new Set()
//             const storeCategories = new Set()
//             const categoryHierarchies = new Map()
//             const subcategoryMap = new Map() // For O(1) subcategory lookups
            
//             // Single pass O(n) collection with Set operations
//             for (const row of results) {
//               // Vendor categories - O(1) Set insertion
//               if (mapping.vendor_category && row[mapping.vendor_category]) {
//                 vendorCategories.add(row[mapping.vendor_category].trim())
//               }
//               if (mapping.vendor_ && row[mapping.vendor_]) {
//                 vendorCategories.add(row[mapping.vendor_].trim())
//               }
              

              
//               // Category hierarchies - O(1) Map insertion
//               if (mapping.category_hierarchy && row[mapping.category_hierarchy]) {
//                 const hierarchy = row[mapping.category_hierarchy].trim()
//                 if (!categoryHierarchies.has(hierarchy)) {
//                   categoryHierarchies.set(hierarchy, hierarchy.split('>').map(cat => cat.trim()).filter(cat => cat !== ''))
//                 }
//               }
              
//               // Subcategory collection - O(1) operations
//               for (let i = 1; i <= 5; i++) {
//                 const vendorSubKey = `vendor_subcategory_${i}`
                
//                 if (mapping[vendorSubKey] && row[mapping[vendorSubKey]]) {
//                   const parent = row[mapping.vendor_category] || row[mapping.vendor_]
//                   if (parent) {
//                     const key = `vendor:${parent.trim()}:${i}`
//                     if (!subcategoryMap.has(key)) {
//                       subcategoryMap.set(key, new Set())
//                     }
//                     subcategoryMap.get(key).add(row[mapping[vendorSubKey]].trim())
//                   }
//                 }
                

//               }
//             }
            
//             console.log(`Category collection completed in ${Date.now() - categoryCollectionStart}ms`)
//             console.log(`- Vendor categories: ${vendorCategories.size}`)
//             console.log(`- Hierarchies: ${categoryHierarchies.size}`)
//             console.log(`- Subcategory groups: ${subcategoryMap.size}`)
            
//             // LIGHTNING OPTIMIZATION 6: Bulk Hierarchical Category Creation
//             const categoryCreationStart = Date.now()
            
//             // Use the new bulk hierarchical creation function
//             await createBulkHierarchicalCategories(results, mapping, categoryHashMap)
            
//             console.log(`Category creation completed in ${Date.now() - categoryCreationStart}ms`)
            
//             // LIGHTNING OPTIMIZATION 8: Advanced Product Processing with Queue Data Structure
//             const productProcessingStart = Date.now()
            
//             // Use Queue for efficient batch processing
//             const productQueue = []
//             const updateQueue = []
            
//             // Single pass O(n) product processing
//             for (let i = 0; i < results.length; i++) {
//               const row = results[i]
//               processed++
              
//               try {
//                 // LIGHTNING OPTIMIZATION 9: O(1) Product Data Extraction
//                 const productData = {}
//                 let vendorCategoryId = null

//                 // Fast field mapping with direct access
//                 for (const [csvHeader, dbField] of Object.entries(mapping)) {
//                   if (!dbField || dbField.trim() === '' || row[csvHeader] === undefined || row[csvHeader] === "") {
//                     continue
//                   }
                  
//                   // O(1) required field validation
//                   if ((dbField === 'sku' || dbField === 'name') && (!row[csvHeader] || row[csvHeader].toString().trim() === '')) {
//                     continue
//                   }
                  
//                   let value = row[csvHeader]
                  
//                   // O(1) category lookup with hash map - find deepest category in hierarchy
//                   if (dbField === 'vendor_category' || dbField === 'vendor_') {
//                     const rootCategoryId = categoryHashMap.get(`vendor:${value.trim()}:null`)
//                     if (rootCategoryId) {
//                       // Find the deepest category in the vendor hierarchy for this row
//                       vendorCategoryId = await findDeepestCategoryInHierarchy(row, mapping, 'vendor', rootCategoryId, categoryHashMap)
//                     }
//                     continue
//                   }
                  

                  
//                   if (dbField === 'category_hierarchy') {
//                     if (value && value.trim() !== '') {
//                       const hierarchyId = categoryHashMap.get(`hierarchy:${value.trim()}`)
//                       if (hierarchyId) {
//                         vendorCategoryId = hierarchyId
//                       }
//                     }
//                     continue
//                   }
                  
//                   // Skip vendor subcategory fields - they will be processed by processCategoryHierarchy
//                   if (dbField.startsWith('vendor_subcategory_') || dbField.startsWith('suk_vendor_')) {
//                     continue
//                   }
                  
//                   // LIGHTNING OPTIMIZATION 10: Fast Data Type Conversion
//                   if (dbField.includes('price') || dbField.includes('cost') || 
//                       dbField === 'stock' || dbField === 'weight' || 
//                       dbField === 'length' || dbField === 'width' || dbField === 'height') {
//                     value = Number.parseFloat(value) || 0
//                   } else if (dbField === 'published' || dbField === 'featured') {
//                     value = value.toLowerCase() === 'true' || value === '1' || value === 'yes'
//                   } else if (dbField.includes('_id')) {
//                     value = Number.parseInt(value) || null
//                   }

//                   productData[dbField] = value
//                 }

//                 // O(1) vendor assignment
//                 if (vendorId) {
//                   productData.vendor_id = vendorId
//                 }

//                 // Process vendor category hierarchy - always process to get the deepest category
//                 if (mapping.vendor_category || mapping.vendor_) {
//                   vendorCategoryId = await processCategoryHierarchy(row, mapping, 'vendor', categoryCache, connection, vendorId)
//                 }

//                 // O(1) vendor category assignment only
//                 if (vendorCategoryId) {
//                   productData.vendor_category_id = vendorCategoryId
//                 }

//                 productData.updated_at = new Date()

//                 // O(1) validation and queue assignment
//                 if (productData.sku && productData.name) {
//                   const sku = productData.sku
                  
//                   if (isUpdateMode) {
//                     if (productHashMap.has(sku)) {
//                       updateQueue.push({
//                         id: productHashMap.get(sku),
//                         data: productData
//                       })
//                     } else {
//                       skipped++
//                     }
//                   } else {
//                     if (!productHashMap.has(sku)) {
//                       productData.created_at = new Date()
//                       productQueue.push(productData)
//                     } else {
//                       skipped++
//                     }
//                   }
//                 } else {
//                   skipped++
//                 }
//               } catch (error) {
//                 console.error(`Row ${i + 1} import error:`, error)
//                 errors.push(`Row ${i + 1}: ${error.message}`)
//               }
//             }
            
//             // LIGHTNING OPTIMIZATION 11: Ultra-Fast Bulk Operations
//             console.log(`Product processing completed in ${Date.now() - productProcessingStart}ms`)
//             console.log(`- Products to insert: ${productQueue.length}`)
//             console.log(`- Products to update: ${updateQueue.length}`)
            
//             // LIGHTNING OPTIMIZATION 12: Massive Batch Insert with Prepared Statements
//             if (productQueue.length > 0) {
//               const insertStart = Date.now()
              
//               // Use prepared statement for maximum performance
//               const fields = Object.keys(productQueue[0])
//               const placeholders = fields.map(() => '?').join(', ')
//               const insertStmt = await connection.prepare(
//                 `INSERT INTO products (${fields.join(', ')}) VALUES (${placeholders})`
//               )
              
//               // Process in chunks of 1000 for optimal performance
//               const CHUNK_SIZE = 1000
//               for (let i = 0; i < productQueue.length; i += CHUNK_SIZE) {
//                 const chunk = productQueue.slice(i, i + CHUNK_SIZE)
                
//                 // Parallel processing within chunk
//                 const promises = chunk.map(productData => {
//                   const values = fields.map(field => productData[field])
//                   return insertStmt.execute(values)
//                 })
                
//                 await Promise.all(promises)
//                 imported += chunk.length
//               }
              
//               await insertStmt.close()
//               console.log(`Bulk insert completed in ${Date.now() - insertStart}ms`)
//             }
            
//             // LIGHTNING OPTIMIZATION 13: Fast Bulk Updates
//             if (updateQueue.length > 0) {
//               const updateStart = Date.now()
              
//               const fields = Object.keys(updateQueue[0].data)
//               const setClause = fields.map(field => `${field} = ?`).join(', ')
//               const updateStmt = await connection.prepare(
//                 `UPDATE products SET ${setClause} WHERE id = ?`
//               )
              
//               // Process updates in parallel
//               const promises = updateQueue.map(updateProduct => {
//                 const values = [...fields.map(field => updateProduct.data[field]), updateProduct.id]
//                 return updateStmt.execute(values)
//               })
              
//               await Promise.all(promises)
//               updated += updateQueue.length
              
//               await updateStmt.close()
//               console.log(`Bulk update completed in ${Date.now() - updateStart}ms`)
//             }
            
//             // Commit all changes
//             await connection.commit()
            
//             // Calculate final performance
//             const totalTime = Date.now() - startTime
//             const processingRate = Math.round(results.length / (totalTime / 1000))
            
//             console.log(`\n=== LIGHTNING IMPORT PERFORMANCE ===`)
//             console.log(`Total time: ${totalTime}ms`)
//             console.log(`Processing rate: ${processingRate} products/sec`)
//             console.log(`Time per product: ${(totalTime / results.length).toFixed(2)}ms`)
            
//             // Progress update
//             res.write(`data: ${JSON.stringify({
//               type: 'progress',
//               current: processed,
//               total: results.length,
//               imported,
//               updated,
//               skipped,
//               errors: errors.length,
//               processingRate,
//               currentProduct: 'Lightning Import Complete',
//               estimatedTimeRemaining: 0,
//               totalTime
//             })}\n\n`)
            
//           } catch (error) {
//             await connection.rollback()
//             throw error
//           } finally {
//             connection.release()
//           }

//           // Clean up uploaded file
//           fs.unlinkSync(req.file.path)

//           // Get updated product count
//           const [productCountResult] = await db.execute("SELECT COUNT(*) as total FROM products")
//           const totalProducts = productCountResult[0].total

//           // Send completion data
//           const completionData = {
//             type: 'complete',
//             message: `Lightning import completed! ${imported} products imported, ${updated} updated, ${skipped} skipped in ${Math.round((Date.now() - startTime) / 1000)}s`,
//             imported,
//             updated,
//             skipped,
//             total: results.length,
//             errors: errors.slice(0, 10),
//             totalProducts,
//             processingTime: Math.round((Date.now() - startTime) / 1000),
//             processingRate: Math.round(results.length / ((Date.now() - startTime) / 1000))
//           }
//           console.log("Sending completion data:", completionData)
//           res.write(`data: ${JSON.stringify(completionData)}\n\n`)

//           res.end()
//         } catch (error) {
//           console.error("Error in lightning import processing:", error)
//           res.write(`data: ${JSON.stringify({
//             type: 'error',
//             message: "Error processing lightning import: " + error.message
//           })}\n\n`)
//           res.end()
//         }
//       })
//       .on("error", (error) => {
//         console.error("CSV parsing error:", error)
//         res.write(`data: ${JSON.stringify({
//           type: 'error',
//           message: "Error parsing CSV file: " + error.message
//         })}\n\n`)
//         res.end()
//       })
//   } catch (error) {
//     console.error("Lightning import error:", error)
//     res.write(`data: ${JSON.stringify({
//       type: 'error',
//       message: "Server error: " + error.message
//     })}\n\n`)
//     res.end()
//   }
// })

// // ULTRA FAST BULK IMPORT - Optimized for 10,000+ products in under 1 minute


router.post("/import/ultra-fast", authenticateToken, upload.single("csvFile"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "CSV file is required" })
    }

    const { fieldMapping, updateMode, selectedVendor } = req.body
    const rawMapping = fieldMapping ? JSON.parse(fieldMapping) : {}
    
    // Clean up mapping
    const mapping = {}
    for (const [csvHeader, dbField] of Object.entries(rawMapping)) {
      if (dbField && dbField.trim() !== '' && csvHeader && csvHeader.trim() !== '') {
        mapping[csvHeader] = dbField.trim()
      }
    }
    
    console.log('🚀 ULTRA FAST IMPORT - Clean mapping:', mapping)
    
    const isUpdateMode = updateMode === 'true'
    const vendorId = selectedVendor ? parseInt(selectedVendor) : null
    const results = []
    const errors = []
    const startTime = Date.now()

    // Set headers for streaming response
    res.writeHead(200, {
      'Content-Type': 'text/plain',
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    })

    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", async () => {
        try {
          console.log(`📊 Processing ${results.length} products with ULTRA FAST import...`)
          
          let imported = 0
          let updated = 0
          let skipped = 0
          let processed = 0

          // Send initial progress
          res.write(`data: ${JSON.stringify({
            type: 'progress',
            current: 0,
            total: results.length,
            imported: 0,
            updated: 0,
            skipped: 0,
            errors: 0,
            currentProduct: 'Initializing...',
            processingRate: 0
          })}\n\n`)

          // ULTRA OPTIMIZATION 1: Single database connection for entire operation
          const connection = await db.getConnection()
          
          try {
            await connection.beginTransaction()
            
            // ULTRA OPTIMIZATION 2: Load ALL existing data in one go with indexes
            console.log('⚡ Loading existing data with indexes...')
            const [existingCategories] = await connection.execute(
              "SELECT id, name, parent_id, type FROM categories WHERE type = 'vendor'"
            )
            const [existingProducts] = await connection.execute(
              "SELECT id, sku FROM products"
            )
            
            // Create optimized lookup maps
            const categoryMap = new Map()
            const productMap = new Map()
            
            // Index categories by multiple keys for fast lookup
            existingCategories.forEach(cat => {
              const key1 = `${cat.type}:${cat.name}:${cat.parent_id || 'null'}`
              categoryMap.set(key1, cat.id)
            })
            
            existingProducts.forEach(prod => {
              productMap.set(prod.sku, prod.id)
            })
            
            console.log(`📋 Loaded ${existingCategories.length} categories and ${existingProducts.length} products`)
            
            // ULTRA OPTIMIZATION 3: Pre-process all categories in memory
            const categoryCache = new Map()
            const categoryHierarchies = new Map()
            const vendorCategories = new Map()
            
            // Collect all vendor categories first
            for (const row of results) {
              if (mapping.vendor_category && row[mapping.vendor_category]) {
                const catName = row[mapping.vendor_category].trim()
                if (!vendorCategories.has(catName)) {
                  vendorCategories.set(catName, [])
                }
                
                // Collect subcategories
                for (let i = 1; i <= 5; i++) {
                  const subcategoryKey = `vendor_subcategory_${i}`
                  const altSubcategoryKey = `suk_vendor_${i}`
                  
                  let subcategoryName = null
                  if (mapping[subcategoryKey] && row[mapping[subcategoryKey]]) {
                    subcategoryName = row[mapping[subcategoryKey]].trim()
                  } else if (mapping[altSubcategoryKey] && row[mapping[altSubcategoryKey]]) {
                    subcategoryName = row[mapping[altSubcategoryKey]].trim()
                  }
                  
                  if (subcategoryName && subcategoryName !== '') {
                    vendorCategories.get(catName).push({ level: i, name: subcategoryName })
                  }
                }
              }
            }
            
            console.log(`🏪 Found ${vendorCategories.size} vendor categories to process`)
            
            // Create root categories first
            for (const [catName, subcategories] of vendorCategories) {
              const cacheKey = `vendor:${catName}:null`
              if (!categoryMap.has(cacheKey)) {
                // Check if category already exists
                const [existing] = await connection.execute(
                  'SELECT id FROM categories WHERE name = ? AND type = ? AND parent_id IS NULL',
                  [catName, 'vendor']
                )
                
                if (existing.length > 0) {
                  categoryCache.set(cacheKey, existing[0].id)
                } else {
                  // Create new root category
                  const [result] = await connection.execute(
                    'INSERT INTO categories (name, parent_id, type, level, created_at) VALUES (?, ?, ?, ?, ?)',
                    [catName, null, 'vendor', 1, new Date()]
                  )
                  categoryCache.set(cacheKey, result.insertId)
                }
              } else {
                categoryCache.set(cacheKey, categoryMap.get(cacheKey))
              }
            }
            
            // Create subcategories using the fixed processCategoryHierarchy function
            console.log('Creating subcategories with proper caching...')
            for (const [catName, subcategories] of vendorCategories) {
              const parentId = categoryCache.get(`vendor:${catName}:null`)
              if (!parentId) continue
              
              // Create a mock row object for processCategoryHierarchy
              const mockRow = {
                [mapping.vendor_category]: catName
              }
              
              // Add subcategories to the mock row
              subcategories.forEach(sub => {
                const subcategoryKey = `vendor_subcategory_${sub.level}`
                mockRow[subcategoryKey] = sub.name
              })
              
              // Use the fixed processCategoryHierarchy function with connection
              await processCategoryHierarchy(mockRow, mapping, 'vendor', categoryCache, connection, vendorId)
            }
            
            console.log(`✅ Categories created successfully`)
            
            // ULTRA OPTIMIZATION 5: Process products in large batches (1000 items)
            const BATCH_SIZE = 1000
            const batches = []
            
            for (let i = 0; i < results.length; i += BATCH_SIZE) {
              batches.push(results.slice(i, i + BATCH_SIZE))
            }
            
            console.log(`📦 Processing ${batches.length} batches of ${BATCH_SIZE} products each`)
            
            for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
              const batch = batches[batchIndex]
              const batchStartTime = Date.now()
              
              // Prepare batch data
              const productsToInsert = []
              const productsToUpdate = []
              
              for (const row of batch) {
                try {
                  const sku = mapping.sku && row[mapping.sku] ? row[mapping.sku].trim() : null
                  const name = mapping.name && row[mapping.name] ? row[mapping.name].trim() : null
                  
                  if (!sku || !name) {
                    skipped++
                    continue
                  }
                  
                  // Check if product exists
                  const existingProductId = productMap.get(sku)
                  
                  // Get vendor category ID - use processCategoryHierarchy to get the deepest category
                  let vendorCategoryId = null
                  if (mapping.vendor_category || mapping.vendor_) {
                    vendorCategoryId = await processCategoryHierarchy(row, mapping, 'vendor', categoryCache, connection, vendorId)
                  }
                  
                  // Prepare product data
                  const productData = {
                    sku,
                    name,
                    short_description: mapping.short_description && row[mapping.short_description] ? row[mapping.short_description].trim() : null,
                    description: mapping.description && row[mapping.description] ? row[mapping.description].trim() : null,
                    brand: mapping.brand && row[mapping.brand] ? row[mapping.brand].trim() : null,
                    stock: mapping.stock && row[mapping.stock] ? parseInt(row[mapping.stock]) || 0 : 0,
                    list_price: mapping.list_price && row[mapping.list_price] ? parseFloat(row[mapping.list_price]) || 0 : 0,
                    market_price: mapping.market_price && row[mapping.market_price] ? parseFloat(row[mapping.market_price]) || 0 : 0,
                    vendor_cost: mapping.vendor_cost && row[mapping.vendor_cost] ? parseFloat(row[mapping.vendor_cost]) || 0 : 0,
                    special_price: mapping.special_price && row[mapping.special_price] ? parseFloat(row[mapping.special_price]) || 0 : 0,
                    weight: mapping.weight && row[mapping.weight] ? parseFloat(row[mapping.weight]) || 0 : 0,
                    length: mapping.length && row[mapping.length] ? parseFloat(row[mapping.length]) || 0 : 0,
                    width: mapping.width && row[mapping.width] ? parseFloat(row[mapping.width]) || 0 : 0,
                    height: mapping.height && row[mapping.height] ? parseFloat(row[mapping.height]) || 0 : 0,
                    vendor_id: vendorId,
                    vendor_category_id: vendorCategoryId,
                    created_at: new Date()
                  }
                  
                  if (existingProductId && isUpdateMode) {
                    productData.id = existingProductId
                    productsToUpdate.push(productData)
                  } else if (!existingProductId) {
                    productsToInsert.push(productData)
                  } else {
                    skipped++
                  }
                  
                } catch (error) {
                  console.error(`Row processing error:`, error)
                  errors.push(`Row error: ${error.message}`)
                }
              }
              
              // ULTRA OPTIMIZATION 6: Bulk insert/update operations
              if (productsToInsert.length > 0) {
                const insertFields = Object.keys(productsToInsert[0]).filter(key => key !== 'id')
                const insertPlaceholders = productsToInsert.map(() => 
                  `(${insertFields.map(() => '?').join(', ')})`
                ).join(', ')
                
                const insertValues = productsToInsert.flatMap(product => 
                  insertFields.map(field => product[field])
                )
                
                await connection.execute(
                  `INSERT INTO products (${insertFields.join(', ')}) VALUES ${insertPlaceholders}`,
                  insertValues
                )
                
                imported += productsToInsert.length
              }
              
              if (productsToUpdate.length > 0) {
                for (const product of productsToUpdate) {
                  const { id, ...updateData } = product
                  const updateFields = Object.keys(updateData)
                  const updatePlaceholders = updateFields.map(field => `${field} = ?`).join(', ')
                  
                  await connection.execute(
                    `UPDATE products SET ${updatePlaceholders} WHERE id = ?`,
                    [...Object.values(updateData), id]
                  )
                }
                
                updated += productsToUpdate.length
              }
              
              processed += batch.length
              
              // Real-time progress update
              const batchProcessingTime = Date.now() - batchStartTime
              const elapsedTime = (Date.now() - startTime) / 1000
              const processingRate = elapsedTime > 0 ? Math.round(processed / elapsedTime) : processed
              const estimatedTimeRemaining = processingRate > 0 ? Math.round(((results.length - processed) / processingRate) / 60) : 0
              
              res.write(`data: ${JSON.stringify({
                type: 'progress',
                current: processed,
                total: results.length,
                imported,
                updated,
                skipped,
                errors: errors.length,
                processingRate,
                currentProduct: `Batch ${batchIndex + 1}/${batches.length}`,
                estimatedTimeRemaining,
                batchProcessingTime
              })}\n\n`)
            }
            
            // Commit all changes
            await connection.commit()
            
          } catch (error) {
            await connection.rollback()
            throw error
          } finally {
            connection.release()
          }

          // Clean up uploaded file
          fs.unlinkSync(req.file.path)

          // Get updated product count
          const [productCountResult] = await db.execute("SELECT COUNT(*) as total FROM products")
          const totalProducts = productCountResult[0].total

          // Send completion data
          const totalTime = Math.round((Date.now() - startTime) / 1000)
          const avgRate = totalTime > 0 ? Math.round(results.length / totalTime) : results.length
          
          console.log(`🚀 ULTRA FAST IMPORT COMPLETED: ${imported} imported, ${updated} updated, ${skipped} skipped in ${totalTime}s (${avgRate} products/sec)`)
          
          const completionData = {
            type: 'complete',
            message: `Ultra-fast import completed! ${imported} products imported, ${updated} updated, ${skipped} skipped in ${totalTime} seconds (${avgRate} products/sec)`,
            imported,
            updated,
            skipped,
            total: results.length,
            errors: errors.slice(0, 10),
            totalProducts,
            processingTime: totalTime,
            processingRate: avgRate
          }
          
          res.write(`data: ${JSON.stringify(completionData)}\n\n`)
          res.end()
          
        } catch (error) {
          console.error("Error in ultra-fast import processing:", error)
          res.write(`data: ${JSON.stringify({
            type: 'error',
            message: "Error processing ultra-fast import: " + error.message
          })}\n\n`)
          res.end()
        }
      })
      .on("error", (error) => {
        console.error("CSV parsing error:", error)
        res.write(`data: ${JSON.stringify({
          type: 'error',
          message: "Error parsing CSV file: " + error.message
        })}\n\n`)
        res.end()
      })
  } catch (error) {
    console.error("Ultra-fast import error:", error)
    res.write(`data: ${JSON.stringify({
      type: 'error',
      message: "Server error: " + error.message
    })}\n\n`)
    res.end()
  }
})

module.exports = router

// Helper function to get all descendant category IDs recursively
async function getAllDescendantCategories(categoryIds, connection = null) {
  if (!categoryIds || categoryIds.length === 0) return []
  
  const dbConnection = connection || db
  const allCategoryIds = new Set([...categoryIds])
  
  try {
    // Get all subcategories recursively
    const placeholders = categoryIds.map(() => '?').join(',')
    const [subcategories] = await dbConnection.execute(`
      WITH RECURSIVE category_tree AS (
        SELECT id, parent_id, name, type, 1 as level
        FROM categories 
        WHERE id IN (${placeholders})
        
        UNION ALL
        
        SELECT c.id, c.parent_id, c.name, c.type, ct.level + 1
        FROM categories c
        INNER JOIN category_tree ct ON c.parent_id = ct.id
        WHERE ct.level < 10
      )
      SELECT DISTINCT id FROM category_tree
    `, categoryIds)
    
    // Add all found category IDs
    subcategories.forEach(subcat => {
      allCategoryIds.add(subcat.id)
    })
    
    return Array.from(allCategoryIds)
  } catch (error) {
    console.error("Error getting descendant categories:", error)
    return categoryIds // Fallback to original IDs
  }
}

// Helper function to find a category by name and parent
async function findCategoryByNameAndParent(name, parentId, type, connection = null) {
  try {
    if (!name || typeof name !== 'string') {
      console.log("Warning: Invalid name parameter:", name)
      return null
    }
    
    if (!type || typeof type !== 'string') {
      console.log("Warning: Invalid type parameter:", type)
      return null
    }
    
    const query = parentId === null || parentId === undefined
      ? "SELECT id, name, parent_id, type, level FROM categories WHERE name = ? AND parent_id IS NULL AND type = ?"
      : "SELECT id, name, parent_id, type, level FROM categories WHERE name = ? AND parent_id = ? AND type = ?"
    
    const params = parentId === null || parentId === undefined
      ? [name.trim(), type]
      : [name.trim(), parentId, type]
    
    const [categories] = await (connection || db).execute(query, params)
    
    if (categories.length > 0) {
      return categories[0]
    }
    return null
  } catch (error) {
    console.error("Error finding category by name and parent:", error)
    return null
  }
}

// Helper function to create or get a category with proper locking and retry logic
async function createOrGetCategory(name, parentId, type, connection = null, vendorId = null) {
  const maxRetries = 3;
  let retryCount = 0;
  
  while (retryCount < maxRetries) {
    const dbConnection = connection || await db.getConnection();
    
    try {
      if (!connection) {
        await dbConnection.beginTransaction();
      }
      
      if (parentId === null) {
        const [existingRootCategory] = await dbConnection.execute(
          "SELECT id FROM categories WHERE name = ? AND parent_id IS NULL AND type = ? AND vendor_id = ?",
          [name.trim(), type, vendorId]
        )
        
        if (existingRootCategory.length > 0) {
          if (!connection) {
            await dbConnection.commit();
            dbConnection.release();
          }
          return existingRootCategory[0].id
        }
      } else {
        const [existingCategory] = await dbConnection.execute(
          "SELECT id FROM categories WHERE name = ? AND parent_id = ? AND type = ? AND vendor_id = ?",
          [name.trim(), parentId, type, vendorId]
        )

        if (existingCategory.length > 0) {
          if (!connection) {
            await dbConnection.commit();
            dbConnection.release();
          }
          return existingCategory[0].id
        }
      }

      let level = 1
      if (parentId) {
        const [parentResult] = await dbConnection.execute(
          "SELECT level FROM categories WHERE id = ?",
          [parentId]
        )
        if (parentResult.length > 0) {
          level = parentResult[0].level + 1
        } else {
          level = 1
        }
      }
      
      let finalVendorId = vendorId
      if (parentId && !vendorId) {
        const [parentCategory] = await dbConnection.execute(
          "SELECT vendor_id FROM categories WHERE id = ?",
          [parentId]
        )
        if (parentCategory.length > 0) {
          finalVendorId = parentCategory[0].vendor_id
        }
      }

      const [result] = await dbConnection.execute(
        "INSERT INTO categories (name, parent_id, type, vendor_id, level, created_at) VALUES (?, ?, ?, ?, ?, NOW())",
        [name.trim(), parentId, type, finalVendorId, level]
      )
      
      if (!connection) {
        await dbConnection.commit();
        dbConnection.release();
      }
      return result.insertId
      
    } catch (error) {
      if (!connection) {
        await dbConnection.rollback();
        dbConnection.release();
      }
      
      if (error.code === 'ER_LOCK_WAIT_TIMEOUT' && retryCount < maxRetries - 1) {
        retryCount++;
        console.log(`Lock timeout, retrying category creation (attempt ${retryCount + 1}/${maxRetries}): ${name}`);
        await new Promise(resolve => setTimeout(resolve, 100 * retryCount));
        continue;
      }
      
      throw error;
    }
  }
}

// Helper function to process category hierarchy from CSV data
async function processCategoryHierarchy(row, mapping, type, categoryCache, connection = null, vendorId = null) {
  try {
    let mainCategoryName = null
    let mainCategoryId = null
    
    if (type === 'vendor') {
      if (mapping.vendor_category && row[mapping.vendor_category]) {
        mainCategoryName = row[mapping.vendor_category].trim()
      } else if (mapping.vendor_ && row[mapping.vendor_]) {
        mainCategoryName = row[mapping.vendor_].trim()
      }
    } else if (type === 'store') {
      if (mapping.store_category && row[mapping.store_category]) {
        mainCategoryName = row[mapping.store_category].trim()
      } else if (mapping.category && row[mapping.category]) {
        mainCategoryName = row[mapping.category].trim()
      }
    }
    
    if (!mainCategoryName) {
      return null
    }
    
    const cacheKey = `${type}:${mainCategoryName}:null`
    if (categoryCache.has(cacheKey)) {
      mainCategoryId = categoryCache.get(cacheKey)
    } else {
      mainCategoryId = await createOrGetCategory(mainCategoryName, null, type, connection, vendorId)
      categoryCache.set(cacheKey, mainCategoryId)
    }
    
    const subcategories = []
    const maxLevels = 5
    
    for (let i = 1; i <= maxLevels; i++) {
      let subcategoryName = null
      
      if (type === 'vendor') {
        const subcategoryKey = `vendor_subcategory_${i}`
        const altSubcategoryKey = `suk_vendor_${i}`
        
        if (mapping[subcategoryKey] && row[mapping[subcategoryKey]]) {
          subcategoryName = row[mapping[subcategoryKey]].trim()
        } else if (mapping[altSubcategoryKey] && row[mapping[altSubcategoryKey]]) {
          subcategoryName = row[mapping[altSubcategoryKey]].trim()
        }
      } else if (type === 'store') {
        const subcategoryKey = `store_subcategory_${i}`
        const altSubcategoryKey = `subc_store_${i}`
        
        if (mapping[subcategoryKey] && row[mapping[subcategoryKey]]) {
          subcategoryName = row[mapping[subcategoryKey]].trim()
        } else if (mapping[altSubcategoryKey] && row[mapping[altSubcategoryKey]]) {
          subcategoryName = row[mapping[altSubcategoryKey]].trim()
        }
      }
      
      if (subcategoryName && subcategoryName !== '') {
        subcategories.push({ level: i, name: subcategoryName })
      }
    }
    
    let currentParentId = mainCategoryId
    let finalCategoryId = mainCategoryId
    
    for (const subcategory of subcategories) {
      const subcategoryCacheKey = `${type}:${subcategory.name}:${currentParentId}`
      
      if (categoryCache.has(subcategoryCacheKey)) {
        currentParentId = categoryCache.get(subcategoryCacheKey)
        finalCategoryId = currentParentId
      } else {
        const existingCategory = await findCategoryByNameAndParent(subcategory.name, currentParentId, type, connection)
        
        if (existingCategory) {
          currentParentId = existingCategory.id
          finalCategoryId = existingCategory.id
          categoryCache.set(subcategoryCacheKey, existingCategory.id)
        } else {
          const newCategoryId = await createOrGetCategory(subcategory.name, currentParentId, type, connection, vendorId)
          currentParentId = newCategoryId
          finalCategoryId = newCategoryId
          categoryCache.set(subcategoryCacheKey, newCategoryId)
        }
      }
    }
    
    return finalCategoryId
    
  } catch (error) {
    console.error(`Error processing ${type} category hierarchy:`, error)
    return null
  }
}

// Get products with pagination and FIXED filtering
router.get("/", authenticateToken, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = "",
      vendor_id = "",
      category_id = "",
      category_ids = [],
      vendor_category_ids = [],
      store_category_ids = [],
      stock_min = "",
      stock_max = "",
      stock_status = "",
      published = "",
    } = req.query

    console.log('🔍 Raw query parameters:', req.query)

    // Convert page and limit to numbers
    const pageNum = parseInt(page) || 1
    const limitNum = parseInt(limit) || 20
    const offset = (pageNum - 1) * limitNum
    const whereConditions = []
    const queryParams = []

    // Build WHERE conditions
    if (search && search.trim() !== "") {
      whereConditions.push(`(
        p.name LIKE ? OR 
        p.sku LIKE ? OR 
        p.id LIKE ? OR 
        p.short_description LIKE ? OR 
        p.description LIKE ? OR 
        p.brand LIKE ? OR 
        p.mfn LIKE ? OR 
        p.google_category LIKE ? OR 
        p.meta_title LIKE ? OR 
        p.meta_description LIKE ? OR 
        p.meta_keywords LIKE ? OR 
        p.visibility LIKE ? OR
        CAST(p.list_price AS CHAR) LIKE ? OR 
        CAST(p.market_price AS CHAR) LIKE ? OR 
        CAST(p.vendor_cost AS CHAR) LIKE ? OR 
        CAST(p.special_price AS CHAR) LIKE ? OR 
        CAST(p.stock AS CHAR) LIKE ? OR 
        CAST(p.weight AS CHAR) LIKE ? OR 
        CAST(p.length AS CHAR) LIKE ? OR 
        CAST(p.width AS CHAR) LIKE ? OR 
        CAST(p.height AS CHAR) LIKE ? OR 
        CAST(p.vendor_id AS CHAR) LIKE ? OR 
        CAST(p.vendor_category_id AS CHAR) LIKE ? OR 
        CAST(p.store_category_id AS CHAR) LIKE ? OR
        CAST(p.published AS CHAR) LIKE ? OR
        CAST(p.featured AS CHAR) LIKE ? OR
        DATE_FORMAT(p.created_at, '%Y-%m-%d %H:%i:%s') LIKE ? OR
        DATE_FORMAT(p.updated_at, '%Y-%m-%d %H:%i:%s') LIKE ? OR
        v.name LIKE ? OR
        vc.name LIKE ? OR
        sc.name LIKE ?
      )`)
      
      const searchParam = `%${search.trim()}%`
      for (let i = 0; i < 31; i++) {
        queryParams.push(searchParam)
      }
    }

    // Handle advanced filters
    if (req.query.advanced_filters) {
      try {
        const advancedFilters = JSON.parse(req.query.advanced_filters)
        console.log('🔍 Processing advanced filters:', JSON.stringify(advancedFilters, null, 2))
        
        advancedFilters.forEach(filter => {
          if (filter.column && filter.operator && filter.column.trim() !== '' && filter.operator.trim() !== '') {
            let condition = ''
            let values = []
            
            const columnMap = {
              'id': 'p.id',
              'sku': 'p.sku',
              'name': 'p.name',
              'short_description': 'p.short_description',
              'description': 'p.description',
              'brand': 'p.brand',
              'mfn': 'p.mfn',
              'stock': 'p.stock',
              'list_price': 'p.list_price',
              'market_price': 'p.market_price',
              'vendor_cost': 'p.vendor_cost',
              'special_price': 'p.special_price',
              'weight': 'p.weight',
              'length': 'p.length',
              'width': 'p.width',
              'height': 'p.height',
              'vendor_name': 'v.name',
              'vendor_category_name': 'vc.name',
              'store_category_name': 'sc.name',
              'google_category': 'p.google_category',
              'published': 'p.published',
              'featured': 'p.featured',
              'visibility': 'p.visibility',
              'created_at': 'p.created_at',
              'updated_at': 'p.updated_at'
            }
            
            const dbColumn = columnMap[filter.column]
            if (!dbColumn) return
            
            const convertValue = (value, columnName) => {
              if (value === null || value === undefined || value === '') {
                return null
              }
              
              if (['stock', 'list_price', 'market_price', 'vendor_cost', 'special_price', 
                   'weight', 'length', 'width', 'height', 'vendor_id', 'vendor_category_id', 
                   'store_category_id'].includes(columnName)) {
                const num = parseFloat(value)
                return isNaN(num) ? null : num
              }
              
              if (['published', 'featured'].includes(columnName)) {
                if (typeof value === 'boolean') return value
                if (typeof value === 'string') {
                  return value.toLowerCase() === 'true' || value === '1' || value === 'yes'
                }
                return Boolean(value)
              }
              
              if (['created_at', 'updated_at'].includes(columnName)) {
                const date = new Date(value)
                return isNaN(date.getTime()) ? null : date
              }
              
              return String(value)
            }
            
            const convertedValue = convertValue(filter.value, filter.column)
            const convertedValue2 = filter.value2 ? convertValue(filter.value2, filter.column) : null
            
            switch (filter.operator) {
              case 'is':
                if (convertedValue === null) {
                  condition = `${dbColumn} IS NULL`
                } else {
                  condition = `${dbColumn} = ?`
                  values.push(convertedValue)
                }
                break
              case 'is_not':
                if (convertedValue === null) {
                  condition = `${dbColumn} IS NOT NULL`
                } else {
                  condition = `${dbColumn} != ?`
                  values.push(convertedValue)
                }
                break
              case 'contains':
                if (convertedValue === null || convertedValue === '') {
                  condition = `${dbColumn} IS NULL OR ${dbColumn} = ''`
                } else {
                  condition = `${dbColumn} LIKE ?`
                  values.push(`%${convertedValue}%`)
                }
                break
              case 'does_not_contain':
                if (convertedValue === null || convertedValue === '') {
                  condition = `${dbColumn} IS NOT NULL AND ${dbColumn} != ''`
                } else {
                  condition = `${dbColumn} NOT LIKE ?`
                  values.push(`%${convertedValue}%`)
                }
                break
              case 'starts_with':
                if (convertedValue === null || convertedValue === '') {
                  condition = `${dbColumn} IS NULL OR ${dbColumn} = ''`
                } else {
                  condition = `${dbColumn} LIKE ?`
                  values.push(`${convertedValue}%`)
                }
                break
              case 'ends_with':
                if (convertedValue === null || convertedValue === '') {
                  condition = `${dbColumn} IS NULL OR ${dbColumn} = ''`
                } else {
                  condition = `${dbColumn} LIKE ?`
                  values.push(`%${convertedValue}`)
                }
                break
              case 'greater_than':
                if (convertedValue === null) {
                  condition = `${dbColumn} IS NULL`
                } else {
                  condition = `${dbColumn} > ?`
                  values.push(convertedValue)
                }
                break
              case 'less_than':
                if (convertedValue === null) {
                  condition = `${dbColumn} IS NULL`
                } else {
                  condition = `${dbColumn} < ?`
                  values.push(convertedValue)
                }
                break
              case 'greater_than_or_equal':
                if (convertedValue === null) {
                  condition = `${dbColumn} IS NULL`
                } else {
                  condition = `${dbColumn} >= ?`
                  values.push(convertedValue)
                }
                break
              case 'less_than_or_equal':
                if (convertedValue === null) {
                  condition = `${dbColumn} IS NULL`
                } else {
                  condition = `${dbColumn} <= ?`
                  values.push(convertedValue)
                }
                break
              case 'between':
                if (convertedValue === null || convertedValue2 === null) {
                  condition = `${dbColumn} IS NULL`
                } else {
                  condition = `${dbColumn} BETWEEN ? AND ?`
                  values.push(convertedValue, convertedValue2)
                }
                break
              case 'before':
                if (convertedValue === null) {
                  condition = `${dbColumn} IS NULL`
                } else {
                  condition = `${dbColumn} < ?`
                  values.push(convertedValue)
                }
                break
              case 'after':
                if (convertedValue === null) {
                  condition = `${dbColumn} IS NULL`
                } else {
                  condition = `${dbColumn} > ?`
                  values.push(convertedValue)
                }
                break
              case 'is_set':
                condition = `${dbColumn} IS NOT NULL AND ${dbColumn} != ''`
                break
              case 'is_not_set':
                condition = `${dbColumn} IS NULL OR ${dbColumn} = ''`
                break
              case 'equal_to':
                if (convertedValue === null) {
                  condition = `${dbColumn} IS NULL`
                } else {
                  condition = `${dbColumn} = ?`
                  values.push(convertedValue)
                }
                break
              case 'not_equal_to':
                if (convertedValue === null) {
                  condition = `${dbColumn} IS NOT NULL`
                } else {
                  condition = `${dbColumn} != ?`
                  values.push(convertedValue)
                }
                break
              case 'is_empty':
                condition = `${dbColumn} IS NULL OR ${dbColumn} = ''`
                break
              case 'is_not_empty':
                condition = `${dbColumn} IS NOT NULL AND ${dbColumn} != ''`
                break
              case 'not_between':
                if (convertedValue === null || convertedValue2 === null) {
                  condition = `${dbColumn} IS NULL`
                } else {
                  condition = `${dbColumn} NOT BETWEEN ? AND ?`
                  values.push(convertedValue, convertedValue2)
                }
                break
              case 'is_zero':
                condition = `${dbColumn} = 0`
                break
              case 'is_not_zero':
                condition = `${dbColumn} != 0`
                break
              case 'is_positive':
                condition = `${dbColumn} > 0`
                break
              case 'is_negative':
                condition = `${dbColumn} < 0`
                break
              case 'is_true':
                condition = `${dbColumn} = 1`
                break
              case 'is_false':
                condition = `${dbColumn} = 0`
                break
              case 'before_or_equal':
                if (convertedValue === null) {
                  condition = `${dbColumn} IS NULL`
                } else {
                  condition = `${dbColumn} <= ?`
                  values.push(convertedValue)
                }
                break
              case 'after_or_equal':
                if (convertedValue === null) {
                  condition = `${dbColumn} IS NULL`
                } else {
                  condition = `${dbColumn} >= ?`
                  values.push(convertedValue)
                }
                break
              case 'is_today':
                condition = `DATE(${dbColumn}) = CURDATE()`
                break
              case 'is_yesterday':
                condition = `DATE(${dbColumn}) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)`
                break
              case 'is_this_week':
                condition = `YEARWEEK(${dbColumn}) = YEARWEEK(NOW())`
                break
              case 'is_this_month':
                condition = `YEAR(${dbColumn}) = YEAR(NOW()) AND MONTH(${dbColumn}) = MONTH(NOW())`
                break
              case 'is_this_year':
                condition = `YEAR(${dbColumn}) = YEAR(NOW())`
                break
            }
            
            if (condition) {
              console.log(`🔍 Filter: ${filter.column} ${filter.operator} ${filter.value} -> SQL: ${condition}`, values)
              whereConditions.push(condition)
              queryParams.push(...values)
            }
          }
        })
      } catch (error) {
        console.error('❌ Error parsing advanced filters:', error)
      }
    }

    // FIXED: Vendor ID filter with proper type conversion and validation
    if (vendor_id && vendor_id.toString().trim() !== "") {
      const vendorIdNum = parseInt(vendor_id, 10)
      if (!isNaN(vendorIdNum)) {
        console.log(`🔍 Adding vendor filter: vendor_id = ${vendorIdNum}`)
        whereConditions.push("p.vendor_id = ?")
        queryParams.push(vendorIdNum)
      } else {
        console.warn(`⚠️ Invalid vendor_id: ${vendor_id}`)
      }
    }

    // Handle single category_id (backward compatibility)
    if (category_id && category_id.toString().trim() !== "") {
      const categoryIdNum = parseInt(category_id, 10)
      if (!isNaN(categoryIdNum)) {
        console.log(`🔍 Adding single category filter: category_id = ${categoryIdNum}`)
        whereConditions.push("(p.vendor_category_id = ? OR p.store_category_id = ?)")
        queryParams.push(categoryIdNum, categoryIdNum)
      }
    }
    
    // FIXED: Handle multiple category_ids with hierarchical search
    if (category_ids && category_ids.length > 0) {
      let categoryIdsArray = []
      
      if (Array.isArray(category_ids)) {
        categoryIdsArray = category_ids.map(id => parseInt(id, 10)).filter(id => !isNaN(id))
      } else if (typeof category_ids === 'string') {
        categoryIdsArray = category_ids.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id))
      } else {
        const parsed = parseInt(category_ids, 10)
        if (!isNaN(parsed)) {
          categoryIdsArray = [parsed]
        }
      }
      
      if (categoryIdsArray.length > 0) {
        console.log(`🔍 Processing ${categoryIdsArray.length} category IDs for hierarchical search`)
        
        // Get all descendant categories
        const allCategoryIds = await getAllDescendantCategories(categoryIdsArray)
        
        if (allCategoryIds.length > 0) {
          const placeholders = allCategoryIds.map(() => "?").join(",")
          whereConditions.push(`(p.vendor_category_id IN (${placeholders}) OR p.store_category_id IN (${placeholders}))`)
          queryParams.push(...allCategoryIds, ...allCategoryIds)
          console.log(`🔍 Added hierarchical category filter for ${allCategoryIds.length} categories`)
        }
      }
    }

    // FIXED: Handle vendor_category_ids with hierarchical search
    if (req.query.vendor_category_ids && req.query.vendor_category_ids.length > 0) {
      let vendorCategoryIdsArray = []
      
      if (Array.isArray(req.query.vendor_category_ids)) {
        vendorCategoryIdsArray = req.query.vendor_category_ids.map(id => parseInt(id, 10)).filter(id => !isNaN(id))
      } else if (typeof req.query.vendor_category_ids === 'string') {
        vendorCategoryIdsArray = req.query.vendor_category_ids.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id))
      } else {
        const parsed = parseInt(req.query.vendor_category_ids, 10)
        if (!isNaN(parsed)) {
          vendorCategoryIdsArray = [parsed]
        }
      }
      
      if (vendorCategoryIdsArray.length > 0) {
        console.log(`🔍 Processing ${vendorCategoryIdsArray.length} vendor category IDs for hierarchical search`)
        
        // Get all descendant categories
        const allVendorCategoryIds = await getAllDescendantCategories(vendorCategoryIdsArray)
        
        if (allVendorCategoryIds.length > 0) {
          const placeholders = allVendorCategoryIds.map(() => "?").join(",")
          whereConditions.push(`p.vendor_category_id IN (${placeholders})`)
          queryParams.push(...allVendorCategoryIds)
          console.log(`🔍 Added vendor category hierarchical filter for ${allVendorCategoryIds.length} categories`)
        }
      }
    }

    // FIXED: Handle store_category_ids with hierarchical search
    if (req.query.store_category_ids && req.query.store_category_ids.length > 0) {
      let storeCategoryIdsArray = []
      
      if (Array.isArray(req.query.store_category_ids)) {
        storeCategoryIdsArray = req.query.store_category_ids.map(id => parseInt(id, 10)).filter(id => !isNaN(id))
      } else if (typeof req.query.store_category_ids === 'string') {
        storeCategoryIdsArray = req.query.store_category_ids.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id))
      } else {
        const parsed = parseInt(req.query.store_category_ids, 10)
        if (!isNaN(parsed)) {
          storeCategoryIdsArray = [parsed]
        }
      }
      
      if (storeCategoryIdsArray.length > 0) {
        console.log(`🔍 Processing ${storeCategoryIdsArray.length} store category IDs for hierarchical search`)
        
        // Get all descendant categories
        const allStoreCategoryIds = await getAllDescendantCategories(storeCategoryIdsArray)
        
        if (allStoreCategoryIds.length > 0) {
          const placeholders = allStoreCategoryIds.map(() => "?").join(",")
          whereConditions.push(`p.store_category_id IN (${placeholders})`)
          queryParams.push(...allStoreCategoryIds)
          console.log(`🔍 Added store category hierarchical filter for ${allStoreCategoryIds.length} categories`)
        }
      }
    }

    // FIXED: Handle stock filters properly - separate logic for status vs min/max
    if (stock_status && stock_status.toString().trim() !== "") {
      if (stock_status === "in_stock") {
        console.log(`🔍 Adding stock filter: in_stock (stock > 0)`)
        whereConditions.push("p.stock > ?")
        queryParams.push(0)
      } else if (stock_status === "out_of_stock") {
        console.log(`🔍 Adding stock filter: out_of_stock (stock = 0)`)
        whereConditions.push("p.stock = ?")
        queryParams.push(0)
      }
    } else {
      // Only apply min/max if stock_status is not set
      if (stock_min && stock_min.toString().trim() !== "") {
        const stockMinNum = parseInt(stock_min, 10)
        if (!isNaN(stockMinNum)) {
          console.log(`🔍 Adding stock filter: stock_min = ${stockMinNum}`)
          whereConditions.push("p.stock >= ?")
          queryParams.push(stockMinNum)
        }
      }
      
      if (stock_max && stock_max.toString().trim() !== "") {
        const stockMaxNum = parseInt(stock_max, 10)
        if (!isNaN(stockMaxNum)) {
          console.log(`🔍 Adding stock filter: stock_max = ${stockMaxNum}`)
          whereConditions.push("p.stock <= ?")
          queryParams.push(stockMaxNum)
        }
      }
    }

    // FIXED: Handle published filter with proper validation
    if (published && published.toString().trim() !== "") {
      console.log(`🔍 Adding published filter: published = ${published}`)
      whereConditions.push("p.published = ?")
      
      // Convert to proper boolean value
      let publishedValue
      if (published === "true" || published === true || published === 1 || published === "1") {
        publishedValue = 1
      } else if (published === "false" || published === false || published === 0 || published === "0") {
        publishedValue = 0
      } else {
        publishedValue = published === "true" ? 1 : 0
      }
      
      queryParams.push(publishedValue)
    }

    const whereClause = whereConditions.length > 0 ? "WHERE " + whereConditions.join(" AND ") : ""
    
    console.log(`🔍 Final WHERE clause: ${whereClause}`)
    console.log(`🔍 Query parameters (${queryParams.length}):`, queryParams)

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM products p 
      LEFT JOIN vendors v ON p.vendor_id = v.id 
      LEFT JOIN categories vc ON p.vendor_category_id = vc.id
      LEFT JOIN categories sc ON p.store_category_id = sc.id
      ${whereClause}
    `

    let countResult
    if (queryParams.length > 0) {
      [countResult] = await db.query(countQuery, queryParams)
    } else {
      [countResult] = await db.query(countQuery)
    }

    // Get products
    const productsQuery = `
      SELECT p.*, v.name as vendor_name,
             vc.name as vendor_category_name,
             sc.name as store_category_name
      FROM products p 
      LEFT JOIN vendors v ON p.vendor_id = v.id 
      LEFT JOIN categories vc ON p.vendor_category_id = vc.id
      LEFT JOIN categories sc ON p.store_category_id = sc.id
      ${whereClause}
      ORDER BY p.updated_at DESC 
      LIMIT ? OFFSET ?
    `
    
    const productsQueryParams = [...queryParams, parseInt(limitNum), parseInt(offset)]
    
    // Validate parameter count
    const placeholderCount = (productsQuery.match(/\?/g) || []).length
    const paramCount = productsQueryParams.length
    
    console.log(`🔍 Placeholder count: ${placeholderCount}, Parameter count: ${paramCount}`)
    console.log(`🔍 Query params: ${queryParams.length}, LIMIT/OFFSET: 2`)
    
    if (placeholderCount !== paramCount) {
      console.error(`❌ PARAMETER MISMATCH: ${paramCount} parameters for ${placeholderCount} placeholders`)
      console.error('Query:', productsQuery)
      console.error('Params:', productsQueryParams)
      
      // Try to fix the parameter mismatch by using query() instead
      const simpleQuery = `
        SELECT p.*, v.name as vendor_name,
               vc.name as vendor_category_name,
               sc.name as store_category_name
        FROM products p 
        LEFT JOIN vendors v ON p.vendor_id = v.id 
        LEFT JOIN categories vc ON p.vendor_category_id = vc.id
        LEFT JOIN categories sc ON p.store_category_id = sc.id
        ${whereClause}
        ORDER BY p.updated_at DESC 
        LIMIT ${parseInt(limitNum)} OFFSET ${parseInt(offset)}
      `
      const [products] = await db.query(simpleQuery)
      
      return res.json({
        products,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: countResult[0].total,
          pages: Math.ceil(countResult[0].total / limitNum),
        },
        warning: "Filters applied but using fallback query method"
      })
    }
    
    try {
      // Use query() instead of execute() for better compatibility
      const [products] = await db.query(productsQuery, productsQueryParams)
      
      console.log(`✅ Query executed successfully, returned ${products.length} products`)
      
      return res.json({
        products,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: countResult[0].total,
          pages: Math.ceil(countResult[0].total / limitNum),
        },
      })
    } catch (executeError) {
      console.error('❌ Query error details:', executeError)
      console.error('Query:', productsQuery)
      console.error('Parameters:', productsQueryParams)
      console.error('Parameter types:', productsQueryParams.map(p => typeof p))
      
      // Fallback: use query() instead of execute() without filters
      const simpleQuery = `
        SELECT p.*, v.name as vendor_name,
               vc.name as vendor_category_name,
               sc.name as store_category_name
        FROM products p 
        LEFT JOIN vendors v ON p.vendor_id = v.id 
        LEFT JOIN categories vc ON p.vendor_category_id = vc.id
        LEFT JOIN categories sc ON p.store_category_id = sc.id
        ORDER BY p.updated_at DESC 
        LIMIT ${parseInt(limitNum)} OFFSET ${parseInt(offset)}
      `
      const [products] = await db.query(simpleQuery)
      
      return res.json({
        products,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: countResult[0].total,
          pages: Math.ceil(countResult[0].total / limitNum),
        },
        warning: "Filters were skipped due to query error"
      })
    }
  } catch (error) {
    console.error("❌ Get products error:", error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Get database fields for CSV import
router.get("/import/fields", authenticateToken, async (req, res) => {
  try {
    const [columns] = await db.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'product_management' AND TABLE_NAME = 'products'
      ORDER BY ORDINAL_POSITION
    `)

    const fields = {
      basic: {
        label: "Basic Information",
        fields: [
          { key: "sku", label: "SKU", required: true, type: "text" },
          { key: "name", label: "Product Name", required: true, type: "text" },
          { key: "short_description", label: "Short Description", required: false, type: "text" },
          { key: "description", label: "Description", required: false, type: "text" },
          { key: "brand", label: "Brand", required: false, type: "text" },
          { key: "mfn", label: "MFN", required: false, type: "text" }
        ]
      },
      inventory: {
        label: "Inventory",
        fields: [
          { key: "stock", label: "Stock Quantity", required: false, type: "number" }
        ]
      },
      pricing: {
        label: "Pricing",
        fields: [
          { key: "list_price", label: "List Price", required: false, type: "number" },
          { key: "market_price", label: "Market Price", required: false, type: "number" },
          { key: "vendor_cost", label: "Vendor Cost", required: false, type: "number" },
          { key: "special_price", label: "Special Price", required: false, type: "number" }
        ]
      },
      dimensions: {
        label: "Dimensions & Weight",
        fields: [
          { key: "weight", label: "Weight", required: false, type: "number" },
          { key: "length", label: "Length", required: false, type: "number" },
          { key: "width", label: "Width", required: false, type: "number" },
          { key: "height", label: "Height", required: false, type: "number" }
        ]
      },
      categories: {
        label: "Categories",
        fields: [
          { key: "google_category", label: "Google Category", required: false, type: "text" },
          { key: "category_hierarchy", label: "Category Hierarchy (NEW - Recommended)", required: false, type: "text", description: "Use format: 'Electronics > Mobile Devices > Smartphones > Premium'" },
          { key: "vendor_category", label: "Vendor Category", required: false, type: "text" },
          { key: "vendor_subcategory_1", label: "Vendor Subcategory 1", required: false, type: "text" },
          { key: "vendor_subcategory_2", label: "Vendor Subcategory 2", required: false, type: "text" },
          { key: "vendor_subcategory_3", label: "Vendor Subcategory 3", required: false, type: "text" },
          { key: "vendor_subcategory_4", label: "Vendor Subcategory 4", required: false, type: "text" },
          { key: "vendor_subcategory_5", label: "Vendor Subcategory 5", required: false, type: "text" }
        ]
      },
      settings: {
        label: "Settings",
        fields: [
          { key: "published", label: "Published", required: false, type: "boolean" },
          { key: "featured", label: "Featured", required: false, type: "boolean" },
          { key: "visibility", label: "Visibility", required: false, type: "text" }
        ]
      },
      relationships: {
        label: "Relationships",
        fields: [
          { key: "vendor_id", label: "Vendor ID", required: false, type: "number" }
        ]
      },
      seo: {
        label: "SEO",
        fields: [
          { key: "meta_title", label: "Meta Title", required: false, type: "text" },
          { key: "meta_description", label: "Meta Description", required: false, type: "text" },
          { key: "meta_keywords", label: "Meta Keywords", required: false, type: "text" }
        ]
      }
    }

    res.json({ fields })
  } catch (error) {
    console.error("Error fetching database fields:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Create product
router.post("/", authenticateToken, async (req, res) => {
  try {
    const {
      sku,
      mfn,
      name,
      short_description,
      description,
      brand,
      stock,
      list_price,
      market_price,
      vendor_cost,
      special_price,
      weight,
      length,
      width,
      height,
      vendor_id,
      vendor_category_id,
      store_category_id,
      google_category,
      published,
      featured,
      visibility,
      meta_title,
      meta_description,
      meta_keywords,
    } = req.body

    const sanitizeText = (text) => {
      if (text === undefined || text === null) return null;
      if (text === '') return null;
      return text.toString().trim();
    };

    let hasMetaFields = false
    try {
      const [columns] = await db.execute("SHOW COLUMNS FROM products LIKE 'meta_title'")
      hasMetaFields = columns.length > 0
    } catch (error) {
      console.log("Meta fields not found in database, skipping them")
    }

    const insertFields = [
      'sku', 'mfn', 'name', 'short_description', 'description', 'brand', 'stock', 'list_price',
      'market_price', 'vendor_cost', 'special_price', 'weight', 'length',
      'width', 'height', 'vendor_id', 'vendor_category_id', 'store_category_id',
      'google_category', 'published', 'featured', 'visibility'
    ]

    const insertValues = [
      sanitizeText(sku),
      sanitizeText(mfn),
      sanitizeText(name),
      sanitizeText(short_description),
      sanitizeText(description),
      sanitizeText(brand),
      stock || 0,
      list_price || null,
      market_price || null,
      vendor_cost || null,
      special_price || null,
      weight || null,
      length || null,
      width || null,
      height || null,
      vendor_id || null,
      vendor_category_id || null,
      store_category_id || null,
      sanitizeText(google_category),
      published !== false,
      featured === true,
      visibility || "public"
    ]

    if (hasMetaFields) {
      insertFields.push('meta_title', 'meta_description', 'meta_keywords')
      insertValues.push(
        sanitizeText(meta_title),
        sanitizeText(meta_description),
        sanitizeText(meta_keywords)
      )
    }

    const [result] = await db.execute(
      `INSERT INTO products (${insertFields.join(', ')}) VALUES (${insertFields.map(() => '?').join(', ')})`,
      insertValues
    )

    res.status(201).json({ id: result.insertId, message: "Product created successfully" })
  } catch (error) {
    console.error("Create product error:", error)
    if (error.code === "ER_DUP_ENTRY") {
      res.status(400).json({ message: "SKU already exists" })
    } else {
      res.status(500).json({ message: "Server error" })
    }
  }
})

// Bulk update products
router.put("/bulk/update", authenticateToken, async (req, res) => {
  try {
    const { ids, updateData } = req.body
    
    console.log("Bulk update request:", { ids, updateData })

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "Product IDs are required" })
    }

    if (!updateData || Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "Update data is required" })
    }

    const sanitizeText = (text) => {
      if (!text) return text;
      return text.toString().trim();
    };

    const processedData = {}
    Object.keys(updateData).forEach((key) => {
      let value = updateData[key]
      
      if (['list_price', 'market_price', 'vendor_cost', 'special_price', 'weight', 'length', 'width', 'height'].includes(key)) {
        if (value === '' || value === null || value === undefined) {
          value = null
        } else {
          value = Number.parseFloat(value) || null
        }
      }
      else if (['stock', 'vendor_id', 'vendor_category_id', 'store_category_id'].includes(key)) {
        if (value === '' || value === null || value === undefined) {
          value = null
        } else {
          value = Number.parseInt(value) || null
        }
      }
      else if (['published', 'featured'].includes(key)) {
        value = value === true || value === 'true' || value === 1
      }
      else {
        value = sanitizeText(value)
      }
      
      processedData[key] = value
    })

    const fields = Object.keys(processedData)
      .map((key) => `${key} = ?`)
      .join(", ")
    const values = Object.values(processedData)

    const placeholders = ids.map(() => "?").join(",")
    const updateQuery = `UPDATE products SET ${fields}, updated_at = NOW() WHERE id IN (${placeholders})`
    
    await db.execute(updateQuery, [...values, ...ids])

    // Update category names if product name changed
    if (updateData.name && processedData.name) {
      // Get all products with their category IDs
      const [products] = await db.execute(
        "SELECT id, vendor_category_id, store_category_id FROM products WHERE id IN (?)",
        [ids]
      )
      
      // Update category names for each product
      for (const product of products) {
        const { vendor_category_id, store_category_id } = product
        
        // Update vendor category name if it exists
        if (vendor_category_id) {
          await db.execute(
            "UPDATE categories SET name = ? WHERE id = ?",
            [processedData.name, vendor_category_id]
          )
        }
        
        // Update store category name if it exists
        if (store_category_id) {
          await db.execute(
            "UPDATE categories SET name = ? WHERE id = ?",
            [processedData.name, store_category_id]
          )
        }
      }
    }

    res.json({ 
      message: `${ids.length} product(s) updated successfully`,
      updatedCount: ids.length
    })
  } catch (error) {
    console.error("Bulk update products error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Update product
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const updateData = req.body

    console.log(`📥 Received update data for product ${id}:`, updateData)

    if (!updateData.name || !updateData.sku) {
      return res.status(400).json({ message: "Name and SKU are required" })
    }

    const systemFields = ['id', 'created_at', 'updated_at', 'vendor_name', 'vendor_category_name', 'store_category_name']
    systemFields.forEach(field => {
      delete updateData[field]
    })

    // Exclude frontend category fields that shouldn't be processed
    const frontendCategoryFields = [
      'newParent', 'parent_id', 'level', 'type', 'status', 
      'parent_name', 'vendor_name', 'direct_product_count', 
      'product_count', 'description', 'subcategories',
      'category_id', 'category_name', 'category_type'
    ]
    frontendCategoryFields.forEach(field => {
      if (updateData[field] !== undefined) {
        console.log(`🚫 Excluding frontend category field: ${field} = ${updateData[field]}`)
        delete updateData[field]
      }
    })

    // If only name is being updated, preserve category relationships
    const isOnlyNameUpdate = Object.keys(updateData).length === 1 && updateData.name
    if (isOnlyNameUpdate) {
      delete updateData.vendor_category_id
      delete updateData.store_category_id
    }

    console.log(`🔧 Filtered update data:`, updateData)

    const [existing] = await db.execute(
      "SELECT id FROM products WHERE sku = ? AND id != ?",
      [updateData.sku, id]
    )

    if (existing.length > 0) {
      return res.status(400).json({ message: "SKU already exists" })
    }

    const sanitizeText = (text) => {
      if (!text) return text;
      return text.toString().trim();
    };

    const processedData = {}
    Object.keys(updateData).forEach(key => {
      if (['created_at', 'updated_at', 'id'].includes(key)) {
        return
      }
      
      let value = updateData[key]
      
      if (['list_price', 'market_price', 'vendor_cost', 'special_price', 'weight', 'length', 'width', 'height'].includes(key)) {
        if (value === '' || value === null || value === undefined) {
          value = null
        } else {
          value = Number.parseFloat(value) || null
        }
      }
      else if (['stock', 'vendor_id', 'vendor_category_id', 'store_category_id'].includes(key)) {
        if (value === '' || value === null || value === undefined) {
          value = null
        } else {
          value = Number.parseInt(value) || null
        }
      }
      else if (['published', 'featured'].includes(key)) {
        value = value === true || value === 'true' || value === 1
      }
      else if (['images', 'gallery'].includes(key)) {
        if (typeof value === 'string') {
          try {
            value = JSON.parse(value)
          } catch (e) {
            value = null
          }
        }
        if (value !== null && value !== undefined) {
          value = JSON.stringify(value)
        }
      }
      else {
        value = sanitizeText(value)
      }
      
      processedData[key] = value
    })

    const fields = Object.keys(processedData)
      .map((key) => `${key} = ?`)
      .join(", ")
    const values = Object.values(processedData)
    values.push(id)

    await db.execute(`UPDATE products SET ${fields}, updated_at = NOW() WHERE id = ?`, values)

    // Update category name if product name changed and category exists
    if (updateData.name && processedData.name) {
      console.log(`🔄 Product ${id} name changed to: ${processedData.name}`)
      
      const [product] = await db.execute(
        "SELECT vendor_category_id, store_category_id FROM products WHERE id = ?",
        [id]
      )
      
      if (product.length > 0) {
        const { vendor_category_id, store_category_id } = product[0]
        
        // Update vendor category name if it exists (ONLY the name, preserve all other fields)
        if (vendor_category_id) {
          console.log(`📝 Updating vendor category ${vendor_category_id} name to: ${processedData.name}`)
          console.log(`🔒 Preserving category structure - only updating name field`)
          await db.execute(
            "UPDATE categories SET name = ? WHERE id = ?",
            [processedData.name, vendor_category_id]
          )
        }
        
        // Update store category name if it exists (ONLY the name, preserve all other fields)
        if (store_category_id) {
          console.log(`📝 Updating store category ${store_category_id} name to: ${processedData.name}`)
          console.log(`🔒 Preserving category structure - only updating name field`)
          await db.execute(
            "UPDATE categories SET name = ? WHERE id = ?",
            [processedData.name, store_category_id]
          )
        }
      }
    }

    res.json({ message: "Product updated successfully" })
  } catch (error) {
    console.error("Update product error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Delete product
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    await db.execute("DELETE FROM products WHERE id = ?", [id])
    res.json({ message: "Product deleted successfully" })
  } catch (error) {
    console.error("Delete product error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Export products with category path formatting
router.get("/export", authenticateToken, async (req, res) => {
  try {
    console.log("Export request received with query params:", req.query)
    
    const { 
      mode = "woocommerce",
      search,
      vendor_id,
      category_ids,
      stock_min,
      stock_max,
      published,
      advanced_filters
    } = req.query
    
    let whereConditions = []
    let queryParams = []
    
    if (search) {
      whereConditions.push(`(p.name LIKE ? OR p.sku LIKE ? OR p.description LIKE ? OR p.brand LIKE ?)`)
      const searchTerm = `%${search}%`
      queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm)
    }
    
    if (vendor_id) {
      whereConditions.push(`p.vendor_id = ?`)
      queryParams.push(vendor_id)
    }
    
    if (category_ids) {
      const categoryIds = Array.isArray(category_ids) ? category_ids : [category_ids]
      if (categoryIds.length > 0) {
        const placeholders = categoryIds.map(() => '?').join(',')
        whereConditions.push(`(p.store_category_id IN (${placeholders}) OR p.vendor_category_id IN (${placeholders}))`)
        queryParams.push(...categoryIds, ...categoryIds)
      }
    }
    
    if (stock_min !== undefined) {
      whereConditions.push(`p.stock >= ?`)
      queryParams.push(stock_min)
    }
    if (stock_max !== undefined) {
      whereConditions.push(`p.stock <= ?`)
      queryParams.push(stock_max)
    }
    
    if (published !== undefined && published !== '') {
      whereConditions.push(`p.published = ?`)
      queryParams.push(published === 'true' ? 1 : 0)
    }
    
    if (advanced_filters) {
      try {
        const advancedFilters = JSON.parse(advanced_filters)
        advancedFilters.forEach(filter => {
          if (filter.column && filter.operator && filter.value !== undefined) {
            let condition = ''
            let value = filter.value
            
            switch (filter.operator) {
              case 'is':
                condition = `p.${filter.column} = ?`
                break
              case 'is_not':
                condition = `p.${filter.column} != ?`
                break
              case 'contains':
                condition = `p.${filter.column} LIKE ?`
                value = `%${filter.value}%`
                break
              case 'does_not_contain':
                condition = `p.${filter.column} NOT LIKE ?`
                value = `%${filter.value}%`
                break
              case 'starts_with':
                condition = `p.${filter.column} LIKE ?`
                value = `${filter.value}%`
                break
              case 'ends_with':
                condition = `p.${filter.column} LIKE ?`
                value = `%${filter.value}`
                break
              case 'greater_than':
                condition = `p.${filter.column} > ?`
                break
              case 'less_than':
                condition = `p.${filter.column} < ?`
                break
              case 'greater_than_or_equal':
                condition = `p.${filter.column} >= ?`
                break
              case 'less_than_or_equal':
                condition = `p.${filter.column} <= ?`
                break
              case 'between':
                if (filter.value2 !== undefined) {
                  condition = `p.${filter.column} BETWEEN ? AND ?`
                  queryParams.push(filter.value, filter.value2)
                  break
                }
                break
              case 'is_set':
                condition = `p.${filter.column} IS NOT NULL AND p.${filter.column} != ''`
                break
              case 'is_not_set':
                condition = `(p.${filter.column} IS NULL OR p.${filter.column} = '')`
                break
            }
            
            if (condition) {
              whereConditions.push(condition)
              if (filter.operator !== 'is_set' && filter.operator !== 'is_not_set') {
                queryParams.push(value)
              }
            }
          }
        })
      } catch (error) {
        console.error('Error parsing advanced filters:', error)
      }
    }
    
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''
    
    console.log("WHERE clause:", whereClause)
    console.log("Query params:", queryParams)
    console.log("Number of where conditions:", whereConditions.length)
    
    const [products] = await db.execute(`
      SELECT 
        p.*,
        v.name as vendor_name,
        vc.name as vendor_category_name,
        sc.name as store_category_name,
        sc.id as store_category_id
      FROM products p
      LEFT JOIN vendors v ON p.vendor_id = v.id
      LEFT JOIN categories vc ON p.vendor_category_id = vc.id
      LEFT JOIN categories sc ON p.store_category_id = sc.id
      ${whereClause}
      ORDER BY p.id
    `, queryParams)

    console.log("Number of products returned:", products.length)

    const [categories] = await db.execute(`
      SELECT id, name, parent_id, level, type
      FROM categories 
      ORDER BY type, level, name
    `)

    // Create category maps for both store and vendor categories
    const storeCategoryMap = {}
    const vendorCategoryMap = {}
    
    categories.filter(cat => cat.type === 'store').forEach(cat => {
      storeCategoryMap[cat.id] = cat
    })
    
    categories.filter(cat => cat.type === 'vendor').forEach(cat => {
      vendorCategoryMap[cat.id] = cat
    })

    const buildCategoryPath = (categoryId, categoryMap) => {
      if (!categoryId || !categoryMap[categoryId]) return []
      
      const path = []
      let currentId = categoryId
      
      while (currentId && categoryMap[currentId]) {
        path.unshift(categoryMap[currentId].name)
        currentId = categoryMap[currentId].parent_id
      }
      
      return path
    }

    const formatCategoryPath = (categoryId, categoryMap) => {
      const path = buildCategoryPath(categoryId, categoryMap)
      
      if (mode === "woocommerce") {
        return path.join(" > ")
      } else {
        const result = new Array(5).fill("")
        path.forEach((categoryName, index) => {
          if (index < 5) {
            result[index] = categoryName
          }
        })
        return result
      }
    }

    const getVendorCategoryPath = (vendorCategoryId) => {
      const path = buildCategoryPath(vendorCategoryId, vendorCategoryMap)
      return path.join(" < ")
    }

    let csvData = []
    
    if (mode === "woocommerce") {
      const headers = [
        "ID", "SKU", "Product Name", "Short Description", "Description", "Brand", "MFN",
        "Stock", "List Price", "Market Price", "Cost", "Special Price", "Weight",
        "Length", "Width", "Height", "Vendor", "Vendor Category", "Store Category Path", "Vendor Category Path",
        "Google Category", "Published", "Featured", "Visibility", "Created", "Updated"
      ]
      
      csvData.push(headers)
      
      products.forEach(product => {
        const storeCategoryPath = formatCategoryPath(product.store_category_id, storeCategoryMap)
        const vendorCategoryPath = getVendorCategoryPath(product.vendor_category_id)
        const row = [
          product.id,
          product.sku,
          product.name,
          product.short_description,
          product.description,
          product.brand,
          product.mfn,
          product.stock,
          product.list_price,
          product.market_price,
          product.vendor_cost,
          product.special_price,
          product.weight,
          product.length,
          product.width,
          product.height,
          product.vendor_name,
          product.vendor_category_name,
          storeCategoryPath,
          vendorCategoryPath,
          product.google_category,
          product.published ? "Yes" : "No",
          product.featured ? "Yes" : "No",
          product.visibility,
          product.created_at,
          product.updated_at
        ]
        csvData.push(row)
      })
    } else {
      const headers = [
        "ID", "SKU", "Product Name", "Short Description", "Description", "Brand", "MFN",
        "Stock", "List Price", "Market Price", "Cost", "Special Price", "Weight",
        "Length", "Width", "Height", "Vendor", "Vendor ParentCategory", "Vendor Subcategory1", 
        "Vendor Subcategory2", "Vendor Subcategory3", "Vendor Subcategory4",
        "Store ParentCategory", "Store Subcategory1", "Store Subcategory2", "Store Subcategory3", "Store Subcategory4",
        "Google Category", "Published", "Featured", "Visibility", "Created", "Updated"
      ]
      
      csvData.push(headers)
      
      products.forEach(product => {
        const storeCategoryLevels = formatCategoryPath(product.store_category_id, storeCategoryMap)
        const vendorCategoryLevels = formatCategoryPath(product.vendor_category_id, vendorCategoryMap)
        const row = [
          product.id,
          product.sku,
          product.name,
          product.short_description,
          product.description,
          product.brand,
          product.mfn,
          product.stock,
          product.list_price,
          product.market_price,
          product.vendor_cost,
          product.special_price,
          product.weight,
          product.length,
          product.width,
          product.height,
          product.vendor_name,
          vendorCategoryLevels[0] || "",
          vendorCategoryLevels[1] || "",
          vendorCategoryLevels[2] || "",
          vendorCategoryLevels[3] || "",
          vendorCategoryLevels[4] || "",
          storeCategoryLevels[0] || "",
          storeCategoryLevels[1] || "",
          storeCategoryLevels[2] || "",
          storeCategoryLevels[3] || "",
          storeCategoryLevels[4] || "",
          product.google_category,
          product.published ? "Yes" : "No",
          product.featured ? "Yes" : "No",
          product.visibility,
          product.created_at,
          product.updated_at
        ]
        csvData.push(row)
      })
    }

    const csvContent = csvData.map(row => 
      row.map(cell => {
        const cellStr = String(cell || "")
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr.replace(/"/g, '""')}"`
        }
        return cellStr
      }).join(',')
    ).join('\n')

    res.setHeader("Content-Type", "text/csv")
    res.setHeader("Content-Disposition", `attachment; filename=products_${mode}_${new Date().toISOString().split('T')[0]}.csv`)
    res.send(csvContent)
    
  } catch (error) {
    console.error("Export products error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Real-time search endpoint
router.get("/search/realtime", authenticateToken, async (req, res) => {
  try {
    const { q, limit = 10 } = req.query
    
    if (!q || q.trim().length < 2) {
      return res.json([])
    }

    const searchTerm = `%${q.trim()}%`
    const [products] = await db.execute(`
      SELECT 
        p.id,
        p.name,
        p.sku,
        p.list_price,
        p.market_price,
        p.special_price,
        p.image_url,
        p.stock,
        v.name as vendor_name
      FROM products p
      LEFT JOIN vendors v ON p.vendor_id = v.id
      WHERE (p.name LIKE ? OR p.sku LIKE ? OR p.brand LIKE ?)
      ORDER BY 
        CASE 
          WHEN p.name LIKE ? THEN 1
          WHEN p.sku LIKE ? THEN 2
          ELSE 3
        END,
        p.name ASC
      LIMIT ?
    `, [searchTerm, searchTerm, searchTerm, `%${q.trim()}%`, `%${q.trim()}%`, parseInt(limit)])

    res.json(products)
  } catch (error) {
    console.error("Real-time search error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Get single product
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const [products] = await db.execute(`
      SELECT 
        p.*,
        v.name as vendor_name,
        vc.name as vendor_category_name,
        sc.name as store_category_name
      FROM products p
      LEFT JOIN vendors v ON p.vendor_id = v.id
      LEFT JOIN categories vc ON p.vendor_category_id = vc.id
      LEFT JOIN categories sc ON p.store_category_id = sc.id
      WHERE p.id = ?
    `, [id])

    if (products.length === 0) {
      return res.status(404).json({ message: "Product not found" })
    }

    res.json(products[0])
  } catch (error) {
    console.error("Get product error:", error)
    res.status(500).json({ message: "Server error" })
  }
})


module.exports = router;