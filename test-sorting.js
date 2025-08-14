// Test sorting functionality
const testProducts = [
  { id: 1, name: "Product C", sku: "SKU003", stock: 50, list_price: 25.99, created_at: "2024-01-15" },
  { id: 2, name: "Product A", sku: "SKU001", stock: 100, list_price: 15.99, created_at: "2024-01-10" },
  { id: 3, name: "Product B", sku: "SKU002", stock: 75, list_price: 35.99, created_at: "2024-01-12" },
];

// Test sorting function (similar to what we implemented)
function sortProducts(products, sortConfig) {
  if (!sortConfig.key) return products;

  return [...products].sort((a, b) => {
    let aValue = a[sortConfig.key];
    let bValue = b[sortConfig.key];

    // Handle null/undefined values
    if (aValue === null || aValue === undefined) aValue = '';
    if (bValue === null || bValue === undefined) bValue = '';

    // Handle different data types
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
    }

    if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
      return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
    }

    // Handle dates
    if (sortConfig.key === 'created_at' || sortConfig.key === 'updated_at') {
      const aDate = new Date(aValue);
      const bDate = new Date(bValue);
      return sortConfig.direction === 'asc' ? aDate - bDate : bDate - aDate;
    }

    // Handle currency values
    if (sortConfig.key.includes('price') || sortConfig.key.includes('cost')) {
      const aNum = parseFloat(aValue) || 0;
      const bNum = parseFloat(bValue) || 0;
      return sortConfig.direction === 'asc' ? aNum - bNum : bNum - aNum;
    }

    // Default string comparison
    const aStr = String(aValue).toLowerCase();
    const bStr = String(bValue).toLowerCase();
    
    if (sortConfig.direction === 'asc') {
      return aStr.localeCompare(bStr);
    } else {
      return bStr.localeCompare(aStr);
    }
  });
}

// Test cases
console.log('=== Sorting Test Results ===\n');

// Test 1: Sort by name ascending
const sortByNameAsc = sortProducts(testProducts, { key: 'name', direction: 'asc' });
console.log('Sort by name (ascending):');
console.log(sortByNameAsc.map(p => p.name));

// Test 2: Sort by name descending
const sortByNameDesc = sortProducts(testProducts, { key: 'name', direction: 'desc' });
console.log('\nSort by name (descending):');
console.log(sortByNameDesc.map(p => p.name));

// Test 3: Sort by stock ascending
const sortByStockAsc = sortProducts(testProducts, { key: 'stock', direction: 'asc' });
console.log('\nSort by stock (ascending):');
console.log(sortByStockAsc.map(p => ({ name: p.name, stock: p.stock })));

// Test 4: Sort by price descending
const sortByPriceDesc = sortProducts(testProducts, { key: 'list_price', direction: 'desc' });
console.log('\nSort by price (descending):');
console.log(sortByPriceDesc.map(p => ({ name: p.name, price: p.list_price })));

// Test 5: Sort by date ascending
const sortByDateAsc = sortProducts(testProducts, { key: 'created_at', direction: 'asc' });
console.log('\nSort by date (ascending):');
console.log(sortByDateAsc.map(p => ({ name: p.name, date: p.created_at })));

console.log('\n=== All tests completed ===');
