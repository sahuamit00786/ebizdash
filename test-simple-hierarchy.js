// Simple test to verify hierarchical category creation
const API_BASE_URL = 'http://localhost:5000/api';

async function testSimpleHierarchy() {
  try {
    // Login
    const loginRes = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' })
    });
    
    const { token } = await loginRes.json();
    console.log('✅ Login successful');

    // Create root category
    const rootRes = await fetch(`${API_BASE_URL}/categories`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        name: 'Test Electronics',
        type: 'store',
        parent_id: null
      })
    });

    if (!rootRes.ok) {
      const error = await rootRes.json();
      throw new Error(`Root category creation failed: ${error.message}`);
    }

    const rootData = await rootRes.json();
    console.log('✅ Root category created:', rootData.category);

    // Create subcategory
    const subRes = await fetch(`${API_BASE_URL}/categories`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        name: 'Test Computers',
        type: 'store',
        parent_id: rootData.category.id
      })
    });

    if (!subRes.ok) {
      const error = await subRes.json();
      throw new Error(`Subcategory creation failed: ${error.message}`);
    }

    const subData = await subRes.json();
    console.log('✅ Subcategory created:', subData.category);

    // Fetch all categories to verify hierarchy
    const fetchRes = await fetch(`${API_BASE_URL}/categories`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const categoriesData = await fetchRes.json();
    console.log('✅ Categories fetched successfully');
    console.log('📊 Category structure:');
    
    function displayHierarchy(cats, level = 0) {
      cats.forEach(cat => {
        const indent = '  '.repeat(level);
        console.log(`${indent}📁 ${cat.name} (ID: ${cat.id}, Level: ${cat.level}, Parent: ${cat.parent_id})`);
        if (cat.subcategories && cat.subcategories.length > 0) {
          displayHierarchy(cat.subcategories, level + 1);
        }
      });
    }
    
    displayHierarchy(categoriesData.categories);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testSimpleHierarchy();
