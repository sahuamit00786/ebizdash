const mysql = require('mysql2/promise');

async function testVendorHierarchyDirect() {
  let connection;
  
  try {
    console.log('🔍 Testing vendor hierarchy directly from database...');
    
    // Connect to database
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'product_management'
    });
    
    // Get all vendor categories for vendor ID 6 (CWR)
    const [categories] = await connection.execute(`
      SELECT DISTINCT
        c.id, c.name, c.type, c.parent_id, c.level, 
        c.status, c.created_at,
        p.name as parent_name
      FROM categories c
      LEFT JOIN categories p ON c.parent_id = p.id
      WHERE c.type = 'vendor'
      ORDER BY COALESCE(c.parent_id, c.id), c.level, c.name
    `);
    
    console.log(`📊 Found ${categories.length} vendor categories total`);
    
    // Filter for categories that should be associated with vendor 6
    // Based on your data, we know the root category has vendor_id = 6
    const [vendorCategories] = await connection.execute(`
      SELECT DISTINCT
        c.id, c.name, c.type, c.parent_id, c.level, 
        c.status, c.created_at,
        p.name as parent_name
      FROM categories c
      LEFT JOIN categories p ON c.parent_id = p.id
      WHERE c.type = 'vendor' 
        AND (c.id = 1234 OR c.parent_id IN (
          SELECT id FROM categories WHERE id = 1234
        ) OR c.id IN (
          SELECT id FROM categories WHERE parent_id IN (
            SELECT id FROM categories WHERE parent_id = 1234
          )
        ))
      ORDER BY COALESCE(c.parent_id, c.id), c.level, c.name
    `);
    
    console.log(`🎯 Found ${vendorCategories.length} categories in the Audio hierarchy`);
    
    // Build the hierarchy
    const buildCategoryTree = (items, parentId = null) => {
      const filtered = items.filter(item => item.parent_id === parentId)
      console.log(`🌳 Building tree for parent ${parentId}: ${filtered.length} items`)
      
      return filtered.map(item => {
        const subcategories = buildCategoryTree(items, item.id)
        console.log(`📁 Category ${item.name} (${item.id}) has ${subcategories.length} subcategories`)
        return {
          ...item,
          subcategories: subcategories
        }
      })
    }
    
    const categoryTree = buildCategoryTree(vendorCategories)
    console.log(`🌲 Final tree has ${categoryTree.length} root categories`);
    
    // Show the complete hierarchy
    const printHierarchy = (categories, level = 0) => {
      categories.forEach(cat => {
        const indent = '  '.repeat(level)
        console.log(`${indent}📁 ${cat.name} (ID: ${cat.id}, Level: ${cat.level})`)
        if (cat.subcategories.length > 0) {
          printHierarchy(cat.subcategories, level + 1)
        }
      })
    }
    
    console.log('\n🌳 Complete hierarchy:')
    printHierarchy(categoryTree)
    
    // Check for the deep nesting issue
    const deepCategories = vendorCategories.filter(cat => cat.level > 10)
    console.log(`\n🔍 Deep categories (level > 10): ${deepCategories.length}`)
    
    if (deepCategories.length > 0) {
      console.log('📋 Deep categories found:')
      deepCategories.slice(0, 10).forEach(cat => {
        console.log(`   - ${cat.name} (ID: ${cat.id}, Level: ${cat.level}, Parent: ${cat.parent_id})`)
      })
    }
    
    // Check if we have the specific categories from your data
    const audioCategory = vendorCategories.find(cat => cat.id === 1234)
    if (audioCategory) {
      console.log(`\n✅ Found Audio category: ${audioCategory.name} (ID: ${audioCategory.id})`)
    }
    
    const speakersCategory = vendorCategories.find(cat => cat.id === 1239)
    if (speakersCategory) {
      console.log(`✅ Found Speakers category: ${speakersCategory.name} (ID: ${speakersCategory.id})`)
    }
    
    const headphonesCategory = vendorCategories.find(cat => cat.id === 1240)
    if (headphonesCategory) {
      console.log(`✅ Found Headphones category: ${headphonesCategory.name} (ID: ${headphonesCategory.id})`)
    }
    
  } catch (error) {
    console.error('❌ Error testing vendor hierarchy:', error)
  } finally {
    if (connection) {
      await connection.end()
    }
  }
}

testVendorHierarchyDirect();
