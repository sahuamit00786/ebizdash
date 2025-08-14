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
    
    const [categories] = await connection.execute(query, params)
    
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
async function createOrGetCategory(name, parentId, type, connection) {
  try {
    // For root categories (parent_id = NULL), also check if a category with the same name exists at root level
    if (parentId === null) {
      const [existingRootCategory] = await connection.execute(
        "SELECT id FROM categories WHERE name = ? AND parent_id IS NULL AND type = ?",
        [name.trim(), type]
      )
      
      if (existingRootCategory.length > 0) {
        return existingRootCategory[0].id
      }
    } else {
      // For subcategories, check with specific parent
      const [existingCategory] = await connection.execute(
        "SELECT id FROM categories WHERE name = ? AND parent_id = ? AND type = ?",
        [name.trim(), parentId, type]
      )

      if (existingCategory.length > 0) {
        return existingCategory[0].id
      }
    }

    // Calculate level based on parent_id
    let level = 1
    if (parentId) {
      // Get the parent's level and add 1
      const [parentResult] = await connection.execute(
        "SELECT level FROM categories WHERE id = ?",
        [parentId]
      )
      if (parentResult.length > 0) {
        level = parentResult[0].level + 1
      } else {
        level = 1 // Fallback if parent not found
      }
    }
    
    const [result] = await connection.execute(
      "INSERT INTO categories (name, parent_id, type, level, created_at) VALUES (?, ?, ?, ?, NOW())",
      [name.trim(), parentId, type, level]
    )
    
    return result.insertId
    
  } catch (error) {
    console.error("Error creating category:", error)
    throw error
  }
}

// Fixed processCategoryHierarchy function (the one we fixed)
async function processCategoryHierarchy(row, mapping, type, categoryCache, connection) {
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

async function testHierarchyDebug() {
  let connection;
  
  try {
    console.log('🔍 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    
    console.log('🧪 Testing hierarchical category creation with debug...\n');
    
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
    
    console.log('📦 Processing test data...\n');
    
    // Process each row (simulating CSV import)
    for (let i = 0; i < testData.length; i++) {
      const row = testData[i];
      console.log(`\n🔄 Processing row ${i + 1}: ${row.sku} - ${row.name}`);
      console.log('='.repeat(60));
      
      // Process vendor category hierarchy
      const vendorCategoryId = await processCategoryHierarchy(row, mapping, 'vendor', categoryCache, connection);
      
      if (vendorCategoryId) {
        console.log(`✅ Assigned to vendor category ID: ${vendorCategoryId}`);
      } else {
        console.log(`❌ Failed to assign vendor category`);
      }
      
      // Show cache contents after each row
      console.log('\n📋 Cache contents after row', i + 1, ':');
      for (const [key, value] of categoryCache.entries()) {
        console.log(`  ${key} -> ${value}`);
      }
    }
    
    console.log('\n📊 Import simulation completed!\n');
    
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
  testHierarchyDebug()
    .then(() => {
      console.log('\n🎉 Debug test completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Test failed:', error);
      process.exit(1);
    });
}

module.exports = { testHierarchyDebug };
