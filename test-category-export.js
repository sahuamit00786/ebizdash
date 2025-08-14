// Test script to verify category path functionality
const categories = [
  {
    "id": 1,
    "name": "Electronic",
    "type": "store",
    "parent_id": null,
    "level": 1,
    "status": "active",
    "created_at": "2025-08-03T11:38:22.000Z",
    "product_count": 0,
    "description": "store",
    "subcategories": [
      {
        "id": 7,
        "name": "Laptops",
        "type": "store",
        "parent_id": 1,
        "level": 1,
        "status": "active",
        "created_at": "2025-08-07T12:47:02.000Z",
        "product_count": 0,
        "description": "store",
        "subcategories": [
          {
            "id": 12,
            "name": "hIIII",
            "type": "store",
            "parent_id": 7,
            "level": 2,
            "status": "active",
            "created_at": "2025-08-08T12:03:04.000Z",
            "product_count": 3,
            "description": "store",
            "subcategories": []
          }
        ]
      },
      {
        "id": 6,
        "name": "Laptops",
        "type": "store",
        "parent_id": 1,
        "level": 1,
        "status": "active",
        "created_at": "2025-08-07T12:38:56.000Z",
        "product_count": 0,
        "description": "store",
        "subcategories": [
          {
            "id": 13,
            "name": "Asus Laptops",
            "type": "store",
            "parent_id": 6,
            "level": 2,
            "status": "active",
            "created_at": "2025-08-09T04:14:34.000Z",
            "product_count": 0,
            "description": "store",
            "subcategories": []
          }
        ]
      }
    ]
  }
];

// Flatten categories for easier lookup
function flattenCategories(catList, flatList = []) {
  catList.forEach(cat => {
    flatList.push({
      id: cat.id,
      name: cat.name,
      parent_id: cat.parent_id,
      level: cat.level
    });
    if (cat.subcategories && cat.subcategories.length > 0) {
      flattenCategories(cat.subcategories, flatList);
    }
  });
  return flatList;
}

// Build category lookup map
const flatCategories = flattenCategories(categories);
const categoryMap = {};
flatCategories.forEach(cat => {
  categoryMap[cat.id] = cat;
});

// Function to build category path
function buildCategoryPath(categoryId) {
  if (!categoryId || !categoryMap[categoryId]) return [];
  
  const path = [];
  let currentId = categoryId;
  
  while (currentId && categoryMap[currentId]) {
    path.unshift(categoryMap[currentId].name);
    currentId = categoryMap[currentId].parent_id;
  }
  
  return path;
}

// Function to format category path based on mode
function formatCategoryPath(categoryId, mode) {
  const path = buildCategoryPath(categoryId);
  
  if (mode === "woocommerce") {
    return path.join(" > ");
  } else {
    // Direct mode - return array with up to 5 levels
    const result = new Array(5).fill("");
    path.forEach((categoryName, index) => {
      if (index < 5) {
        result[index] = categoryName;
      }
    });
    return result;
  }
}

// Test cases
console.log("=== Category Path Test Results ===\n");

// Test 1: Product in "hIIII" category (id: 12)
console.log("Test 1: Product in 'hIIII' category (id: 12)");
console.log("WooCommerce mode:", formatCategoryPath(12, "woocommerce"));
console.log("Direct mode:", formatCategoryPath(12, "direct"));
console.log();

// Test 2: Product in "Asus Laptops" category (id: 13)
console.log("Test 2: Product in 'Asus Laptops' category (id: 13)");
console.log("WooCommerce mode:", formatCategoryPath(13, "woocommerce"));
console.log("Direct mode:", formatCategoryPath(13, "direct"));
console.log();

// Test 3: Product in "Laptops" category (id: 7)
console.log("Test 3: Product in 'Laptops' category (id: 7)");
console.log("WooCommerce mode:", formatCategoryPath(7, "woocommerce"));
console.log("Direct mode:", formatCategoryPath(7, "direct"));
console.log();

// Test 4: Product in "Electronic" category (id: 1)
console.log("Test 4: Product in 'Electronic' category (id: 1)");
console.log("WooCommerce mode:", formatCategoryPath(1, "woocommerce"));
console.log("Direct mode:", formatCategoryPath(1, "direct"));
console.log();

// Test 5: Invalid category ID
console.log("Test 5: Invalid category ID (999)");
console.log("WooCommerce mode:", formatCategoryPath(999, "woocommerce"));
console.log("Direct mode:", formatCategoryPath(999, "direct"));
console.log();

console.log("=== Expected Results ===");
console.log("Test 1 should show: Electronic > Laptops > hIIII");
console.log("Test 2 should show: Electronic > Laptops > Asus Laptops");
console.log("Test 3 should show: Electronic > Laptops");
console.log("Test 4 should show: Electronic");
console.log("Test 5 should show: empty string/array");
