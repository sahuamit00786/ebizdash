const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: '45.77.196.170',
  user: 'ebizdash_products_react',
  password: 'products_react',
  database: 'ebizdash_products_react',
  charset: 'utf8mb4'
};

// Test data that should create a clean hierarchy
const testData = [
  {
    vendor_category: 'Electronics',
    vendor_subcategory_1: 'Smartphones',
    vendor_subcategory_2: 'Android',
    vendor_subcategory_3: 'Flagship',
    vendor_subcategory_4: 'New Premium',
    sku: 'PHONE001',
    name: 'iPhone 15 Pro'
  },
  {
    vendor_category: 'Electronics',
    vendor_subcategory_1: 'Smartphones',
    vendor_subcategory_2: 'Android',
    vendor_subcategory_3: 'Flagship',
    vendor_subcategory_4: 'New Premium',
    sku: 'PHONE002',
    name: 'Samsung Galaxy S24'
  },
  {
    vendor_category: 'Electronics',
    vendor_subcategory_1: 'Smartphones',
    vendor_subcategory_2: 'Android',
    vendor_subcategory_3: 'Flagship',
    vendor_subcategory_4: 'New Premium',
    sku: 'PHONE003',
    name: 'Google Pixel 8 Pro'
  }
];

// Helper function to find category by name and parent (from the fixed code)
async function findCategoryByNameAndParent(name, parentId, type, connection) {
  try {
    if (!name || typeof name !== 'string') {
      return null;
    }
    
    if (!type || typeof type !== 'string') {
      return null;
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

// Helper function to create or get category (from the fixed code)
async function createOrGetCategory(name, parentId, type, connection = null) {
  const maxRetries = 3;
  let retryCount = 0;
  
  while (retryCount < maxRetries) {
    const dbConnection = connection || await db.getConnection();
    
    try {
      if (!connection) {
        await dbConnection.beginTransaction();
      }
      
      // For root categories (parent_id = NULL), also check if a category with the same name exists at root level
      if (parentId === null) {
        const [existingRootCategory] = await dbConnection.execute(
          "SELECT id FROM categories WHERE name = ? AND parent_id IS NULL AND type = ?",
          [name.trim(), type]
        )
        
        if (existingRootCategory.length > 0) {
          if (!connection) {
            await dbConnection.commit();
            dbConnection.release();
          }
          return existingRootCategory[0].id
        }
      } else {
        // For subcategories, check with specific parent
        const [existingCategory] = await dbConnection.execute(
          "SELECT id FROM categories WHERE name = ? AND parent_id = ? AND type = ?",
          [name.trim(), parentId, type]
        )

        if (existingCategory.length > 0) {
          if (!connection) {
            await dbConnection.commit();
            dbConnection.release();
          }
          return existingCategory[0].id
        }
      }

      // Calculate level based on parent_id
      let level = 1
      if (parentId) {
        // Get the parent's level and add 1
        const [parentResult] = await dbConnection.execute(
          "SELECT level FROM categories WHERE id = ?",
          [parentId]
        )
        if (parentResult.length > 0) {
          level = parentResult[0].level + 1
        } else {
          level = 1 // Fallback if parent not found
        }
      }
      
      const [result] = await dbConnection.execute(
        "INSERT INTO categories (name, parent_id, type, level, created_at) VALUES (?, ?, ?, ?, NOW())",
        [name.trim(), parentId, type, level]
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
      
      // If it's a lock timeout error, retry
      if (error.code === 'ER_LOCK_WAIT_TIMEOUT' && retryCount < maxRetries - 1) {
        retryCount++;
        console.log(`Lock timeout, retrying category creation (attempt ${retryCount + 1}/${maxRetries}): ${name}`);
        await new Promise(resolve => setTimeout(resolve, 100 * retryCount)); // Exponential backoff
        continue;
      }
      
      throw error;
    }
  }
}

// Fixed processCategoryHierarchy function (the one we fixed)
async function processCategoryHierarchy(row, mapping, type, categoryCache, connection = null) {
  try {
    // Get the main category (parent)
    let mainCategoryName = null
    let mainCategoryId = null
    
    if (type === 'vendor') {
      if (mapping.vendor_category && row[mapping.vendor_category]) {
        mainCategoryName = row[mapping.vendor_category].trim()
      } else if (mapping.vendor_ && row[mapping.vendor_]) {
        mainCategoryName = row[mapping.vendor_].trim()
      }
    }
    
    if (!mainCategoryName) {
      return null
    }
    
    // Get or create main category
    const cacheKey = `${type}:${mainCategoryName}:null`
    if (categoryCache.has(cacheKey)) {
      mainCategoryId = categoryCache.get(cacheKey)
    } else {
      mainCategoryId = await createOrGetCategory(mainCategoryName, null, type, connection)
      categoryCache.set(cacheKey, mainCategoryId)
    }
    
    // Collect subcategories
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
      }
      
      if (subcategoryName && subcategoryName !== '') {
        subcategories.push({ level: i, name: subcategoryName })
      }
    }
    
    // Build hierarchy chain
    let currentParentId = mainCategoryId
    let finalCategoryId = mainCategoryId
    
    for (const subcategory of subcategories) {
      // Create cache key for this subcategory level - use parent ID to ensure correct hierarchy
      const subcategoryCacheKey = `${type}:${subcategory.name}:${currentParentId}`
      
      // Check cache first
      if (categoryCache.has(subcategoryCacheKey)) {
        currentParentId = categoryCache.get(subcategoryCacheKey)
        finalCategoryId = currentParentId
        console.log(`Found cached ${type} subcategory: ${subcategory.name} (ID: ${currentParentId}) under parent ${currentParentId}`)
      } else {
        // Check if subcategory already exists under current parent
        const existingCategory = await findCategoryByNameAndParent(subcategory.name, currentParentId, type, connection)
        
        if (existingCategory) {
          // Use existing category
          currentParentId = existingCategory.id
          finalCategoryId = existingCategory.id
          // Cache the found category
          categoryCache.set(subcategoryCacheKey, existingCategory.id)
          console.log(`Found existing ${type} subcategory: ${subcategory.name} (ID: ${existingCategory.id}) under parent ${currentParentId}`)
        } else {
          // Create new subcategory
          const newCategoryId = await createOrGetCategory(subcategory.name, currentParentId, type, connection)
          currentParentId = newCategoryId
          finalCategoryId = newCategoryId
          // Cache the newly created category
          categoryCache.set(subcategoryCacheKey, newCategoryId)
          console.log(`Created new ${type} subcategory: ${subcategory.name} (ID: ${newCategoryId}) under parent ${currentParentId}`)
        }
      }
    }
    
    return finalCategoryId
    
  } catch (error) {
    console.error(`Error processing ${type} category hierarchy:`, error)
    return null
  }
}

async function testUltraFastFix() {
  let connection;
  
  try {
    console.log('🔍 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    
    console.log('🧪 Testing ultra-fast import fix...\n');
    
    // Create mapping object (simulating CSV header mapping)
    const mapping = {
      vendor_category: 'vendor_category',
      vendor_subcategory_1: 'vendor_subcategory_1',
      vendor_subcategory_2: 'vendor_subcategory_2',
      vendor_subcategory_3: 'vendor_subcategory_3',
      vendor_subcategory_4: 'vendor_subcategory_4',
      sku: 'sku',
      name: 'name'
    };
    
    // Initialize category cache
    const categoryCache = new Map();
    
    console.log('📦 Processing test data with ultra-fast logic...\n');
    
    // Simulate the ultra-fast import logic
    await connection.beginTransaction();
    
    try {
      // Collect all vendor categories first (like ultra-fast does)
      const vendorCategories = new Map();
      
      for (const row of testData) {
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
      
      console.log(`🏪 Found ${vendorCategories.size} vendor categories to process`);
      
      // Create root categories first
      for (const [catName, subcategories] of vendorCategories) {
        const cacheKey = `vendor:${catName}:null`
        if (!categoryCache.has(cacheKey)) {
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
        }
      }
      
      // Create subcategories using the fixed processCategoryHierarchy function
      console.log('Creating subcategories with proper caching...');
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
        
        // Use the fixed processCategoryHierarchy function
        await processCategoryHierarchy(mockRow, mapping, 'vendor', categoryCache, connection)
      }
      
      await connection.commit();
      
      console.log('\n📊 Ultra-fast import simulation completed!\n');
      
      // Show final results
      console.log('🔍 Final category structure:');
      const [categories] = await connection.execute(`
        SELECT 
          id,
          name,
          type,
          parent_id,
          level,
          created_at
        FROM categories 
        WHERE type = 'vendor' AND name LIKE '%Electronics%' OR name LIKE '%Smartphones%' OR name LIKE '%Android%' OR name LIKE '%Flagship%' OR name LIKE '%New Premium%'
        ORDER BY level, name
      `);
      
      if (categories.length === 0) {
        console.log('❌ No categories created');
      } else {
        console.log(`✅ Created ${categories.length} categories:`);
        
        // Group by level
        const byLevel = {};
        categories.forEach(cat => {
          if (!byLevel[cat.level]) byLevel[cat.level] = [];
          byLevel[cat.level].push(cat);
        });
        
        Object.keys(byLevel).sort().forEach(level => {
          console.log(`\nLevel ${level}:`);
          byLevel[level].forEach(cat => {
            const parentInfo = cat.parent_id ? ` (Parent: ${cat.parent_id})` : ' (Root)';
            console.log(`  - ${cat.name} [ID: ${cat.id}]${parentInfo}`);
          });
        });
      }
      
      // Check for duplicates
      console.log('\n🔍 Duplicate check:');
      const [duplicates] = await connection.execute(`
        SELECT 
          c1.name,
          c1.type,
          c1.parent_id,
          COUNT(*) as count,
          GROUP_CONCAT(c1.id ORDER BY c1.id) as ids
        FROM categories c1
        INNER JOIN categories c2 ON 
          c1.name = c2.name AND 
          c1.parent_id = c2.parent_id AND 
          c1.type = c2.type
        GROUP BY c1.name, c1.type, c1.parent_id
        HAVING COUNT(*) > 1
      `);
      
      if (duplicates.length === 0) {
        console.log('✅ No duplicate categories found!');
      } else {
        console.log(`❌ Found ${duplicates.length} duplicate category groups:`);
        duplicates.forEach(dup => {
          console.log(`   ${dup.name} (${dup.type}) - ${dup.count} instances: IDs ${dup.ids}`);
        });
      }
      
    } catch (error) {
      await connection.rollback();
      throw error;
    }
    
  } catch (error) {
    console.error('❌ Error during test:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the test
if (require.main === module) {
  testUltraFastFix()
    .then(() => {
      console.log('\n🎉 Ultra-fast fix test completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Test failed:', error);
      process.exit(1);
    });
}

module.exports = { testUltraFastFix };
