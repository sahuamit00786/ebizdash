# Advanced Product Filtering System

## Overview

This advanced product filtering system provides WooCommerce admins with powerful filtering capabilities to streamline product management tasks. The system supports dynamic filtering, nested categories, multiple conditions, and advanced export functionality.

## Features

### 🎯 Advanced Filtering
- **Dynamic Filter Rows**: Add/remove filter conditions on the fly
- **Multiple Conditions**: is, is not, contains, starts with, ends with, greater than, less than, between, in, not in
- **Logic Operators**: AND/OR logic for combining multiple filters
- **Field Types**: Text, number, date, select dropdowns with appropriate input types

### 📊 Filter Fields
- **Product Name**: Text search with various conditions
- **SKU**: Exact match or pattern matching
- **Vendor**: Dropdown selection from available vendors
- **Category**: Multi-level category support
- **Brand**: Dropdown with unique brands from database
- **Stock Status**: In Stock, Out of Stock, On Backorder
- **Stock Quantity**: Numeric comparisons and ranges
- **Price**: Numeric comparisons and price ranges
- **Status**: Published/Draft toggle
- **Date Created/Updated**: Date comparisons and ranges

### 📤 Advanced Export
- **Column Selection**: Choose which fields to include in export
- **Filtered Export**: Export only filtered results
- **CSV Format**: Standard CSV format with proper escaping
- **Custom Headers**: Human-readable column headers

### ✏️ Inline Editing
- **Quick Edits**: Edit product fields directly in the table
- **Visual Feedback**: Highlighted editing state with animations
- **Validation**: Real-time validation and error handling
- **Save/Cancel**: Immediate save or cancel changes

## Components

### 1. AdvancedProductFilter Component
**File**: `src/components/AdvancedProductFilter.js`

**Features**:
- Dynamic filter row management
- Logic operator selection (AND/OR)
- Export modal with column selection
- Inline edit toggle
- Reset functionality

**Props**:
```javascript
{
  onFiltersChange: (filterConfig) => void,
  onExport: (exportConfig) => void,
  onReset: () => void,
  onInlineEditToggle: () => void,
  vendors: Array,
  categories: Array,
  brands: Array,
  inlineEditEnabled: boolean
}
```

### 2. InlineEditProduct Component
**File**: `src/components/InlineEditProduct.js`

**Features**:
- Inline editing of product fields
- Save/cancel functionality
- Visual editing state
- Form validation

**Props**:
```javascript
{
  product: Object,
  vendors: Array,
  categories: Array,
  onSave: (productId, updateData) => Promise,
  onCancel: () => void
}
```

## Backend Implementation

### Advanced Filtering Logic
**File**: `server/routes/products.js`

The backend uses a sophisticated filter building system:

```javascript
const buildAdvancedFilters = (filters, logicOperator = 'AND') => {
  // Converts filter objects to SQL conditions
  // Supports multiple field types and conditions
  // Returns conditions array and query parameters
}
```

### Supported Filter Types

#### Text Fields (name, sku, brand)
- `is`: Exact match
- `is_not`: Not equal
- `contains`: LIKE %value%
- `starts_with`: LIKE value%
- `ends_with`: LIKE %value

#### Numeric Fields (stock, price)
- `greater_than`: > value
- `less_than`: < value
- `greater_equal`: >= value
- `less_equal`: <= value
- `between`: BETWEEN value1 AND value2
- `is`: = value

#### Date Fields (created_at, updated_at)
- `greater_than`: DATE(field) > value
- `less_than`: DATE(field) < value
- `between`: DATE(field) BETWEEN value1 AND value2
- `is`: DATE(field) = value

#### Select Fields (vendor_id, category_id, published)
- `is`: = value
- `is_not`: != value
- `in`: IN (value1, value2, ...)
- `not_in`: NOT IN (value1, value2, ...)

### API Endpoints

#### GET /api/products
**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `search`: Basic text search
- `vendor_id`: Filter by vendor
- `category_id`: Filter by category
- `stock_status`: Filter by stock status
- `published`: Filter by publication status
- `filters`: JSON string of advanced filters
- `logicOperator`: AND/OR logic (default: AND)

#### GET /api/products/brands
Returns unique brands for filter dropdown

#### GET /api/products/export
**Query Parameters**:
- All filter parameters from GET /api/products
- `columns`: JSON string of selected columns

#### PATCH /api/products/:id/inline
**Body**: Object with fields to update
**Allowed Fields**: name, sku, vendor_id, stock, list_price, published

## Usage Examples

### Basic Filtering
```javascript
// Filter products by vendor and stock status
const filters = {
  vendor_id: "123",
  stock_status: "in_stock"
}
```

### Advanced Filtering
```javascript
// Complex filter with multiple conditions
const advancedFilters = {
  filters: [
    {
      field: "name",
      condition: "contains",
      value: "iPhone"
    },
    {
      field: "price",
      condition: "between",
      value: "500",
      value2: "1000"
    },
    {
      field: "stock",
      condition: "greater_than",
      value: "10"
    }
  ],
  logicOperator: "AND"
}
```

### Export Configuration
```javascript
const exportConfig = {
  filters: [...], // Same as advanced filters
  logicOperator: "AND",
  columns: {
    id: true,
    name: true,
    sku: true,
    vendor: true,
    category: true,
    brand: true,
    stock: true,
    price: true,
    status: true,
    created_at: false,
    updated_at: false
  }
}
```

## CSS Styling

### Advanced Filter Styles
**File**: `src/components/AdvancedProductFilter.css`

Features:
- Modern card-based design
- Responsive layout
- Smooth animations
- Modal overlay for export options

### Inline Edit Styles
**File**: `src/components/InlineEditProduct.css` + `src/components/Products.css`

Features:
- Visual editing state with yellow highlight
- Smooth transitions
- Responsive input sizing
- Save/cancel button styling

## Performance Considerations

### Database Optimization
- Indexes on commonly filtered fields (name, sku, vendor_id, stock, price)
- Efficient JOIN queries with proper indexing
- Parameterized queries to prevent SQL injection

### Frontend Optimization
- Debounced filter changes
- Pagination to limit data transfer
- Efficient re-rendering with React state management

## Security Features

### Input Validation
- Server-side validation of all filter parameters
- SQL injection prevention with parameterized queries
- XSS prevention with proper escaping

### Access Control
- JWT token authentication required
- Role-based access control for admin functions
- CSRF protection

## Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Responsive design for mobile devices
- Progressive enhancement for older browsers

## Installation & Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Database Setup**:
   Ensure your database has the required indexes:
   ```sql
   CREATE INDEX idx_products_name ON products(name);
   CREATE INDEX idx_products_sku ON products(sku);
   CREATE INDEX idx_products_vendor_id ON products(vendor_id);
   CREATE INDEX idx_products_stock ON products(stock);
   CREATE INDEX idx_products_price ON products(list_price);
   ```

3. **Start Development Server**:
   ```bash
   npm run dev:full
   ```

## Troubleshooting

### Common Issues

1. **Filters not working**: Check browser console for JavaScript errors
2. **Export fails**: Verify file permissions and CSV format
3. **Inline edit not saving**: Check network tab for API errors
4. **Performance issues**: Ensure database indexes are properly set

### Debug Mode
Enable debug logging by setting `NODE_ENV=development` in your environment variables.

## Future Enhancements

- **Saved Filters**: Save and reuse filter configurations
- **Filter Templates**: Predefined filter sets for common tasks
- **Bulk Operations**: Apply actions to filtered results
- **Advanced Analytics**: Filter-based reporting and insights
- **Real-time Updates**: WebSocket integration for live data
- **Filter History**: Track and restore previous filter states

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 