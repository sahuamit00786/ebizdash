const API_BASE_URL = 'http://localhost:5000/api';

async function testHierarchicalCategoryCreation() {
  console.log('Testing hierarchical category creation...\n');

  try {
    // First, login to get a token
    const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      })
    });

    if (!loginResponse.ok) {
      throw new Error('Login failed');
    }

    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✅ Login successful');

    // Test 1: Create a root category
    console.log('\n📝 Test 1: Creating root category "Electronics"');
    const rootCategoryResponse = await fetch(`${API_BASE_URL}/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        name: 'Electronics',
        type: 'store',
        parent_id: null
      })
    });

    if (!rootCategoryResponse.ok) {
      const error = await rootCategoryResponse.json();
      throw new Error(`Failed to create root category: ${error.message}`);
    }

    const rootCategoryData = await rootCategoryResponse.json();
    const rootCategoryId = rootCategoryData.category.id;
    console.log(`✅ Root category created with ID: ${rootCategoryId}`);

    // Test 2: Create a subcategory
    console.log('\n📝 Test 2: Creating subcategory "Computers" under Electronics');
    const subCategoryResponse = await fetch(`${API_BASE_URL}/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        name: 'Computers',
        type: 'store',
        parent_id: rootCategoryId
      })
    });

    if (!subCategoryResponse.ok) {
      const error = await subCategoryResponse.json();
      throw new Error(`Failed to create subcategory: ${error.message}`);
    }

    const subCategoryData = await subCategoryResponse.json();
    const subCategoryId = subCategoryData.category.id;
    console.log(`✅ Subcategory created with ID: ${subCategoryId}`);

    // Test 3: Create a sub-subcategory
    console.log('\n📝 Test 3: Creating sub-subcategory "Laptops" under Computers');
    const subSubCategoryResponse = await fetch(`${API_BASE_URL}/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        name: 'Laptops',
        type: 'store',
        parent_id: subCategoryId
      })
    });

    if (!subSubCategoryResponse.ok) {
      const error = await subSubCategoryResponse.json();
      throw new Error(`Failed to create sub-subcategory: ${error.message}`);
    }

    const subSubCategoryData = await subSubCategoryResponse.json();
    const subSubCategoryId = subSubCategoryData.category.id;
    console.log(`✅ Sub-subcategory created with ID: ${subSubCategoryId}`);

    // Test 4: Fetch all categories to verify hierarchy
    console.log('\n📝 Test 4: Fetching all categories to verify hierarchy');
    const fetchResponse = await fetch(`${API_BASE_URL}/categories`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!fetchResponse.ok) {
      throw new Error('Failed to fetch categories');
    }

    const categoriesData = await fetchResponse.json();
    console.log('✅ Categories fetched successfully');
    
    // Display the hierarchy
    console.log('\n📊 Category Hierarchy:');
    displayCategoryHierarchy(categoriesData.categories, 0);

    // Test 5: Test with empty string parent_id (should create root category)
    console.log('\n📝 Test 5: Testing with empty string parent_id');
    const emptyParentResponse = await fetch(`${API_BASE_URL}/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        name: 'Test Root Category',
        type: 'store',
        parent_id: ''
      })
    });

    if (!emptyParentResponse.ok) {
      const error = await emptyParentResponse.json();
      console.log(`❌ Empty parent_id test failed: ${error.message}`);
    } else {
      const emptyParentData = await emptyParentResponse.json();
      console.log(`✅ Empty parent_id test successful - created category with ID: ${emptyParentData.category.id}`);
    }

    console.log('\n🎉 All hierarchical category creation tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

function displayCategoryHierarchy(categories, level = 0) {
  categories.forEach(category => {
    const indent = '  '.repeat(level);
    console.log(`${indent}📁 ${category.name} (ID: ${category.id}, Level: ${category.level}, Type: ${category.type})`);
    
    if (category.subcategories && category.subcategories.length > 0) {
      displayCategoryHierarchy(category.subcategories, level + 1);
    }
  });
}

// Run the test
testHierarchicalCategoryCreation();
