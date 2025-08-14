# Hierarchical Category Selection Feature

## Overview

The hierarchical category selection feature provides a user-friendly way to select vendor and store categories in the product edit form. Instead of a flat dropdown list, users can now see the parent-child relationships between categories, making it easier to navigate and select the appropriate category.

## Features

### 1. Hierarchical Display
- Categories are displayed in a tree structure showing parent-child relationships
- Proper indentation to visualize hierarchy levels
- Search functionality to quickly find categories
- Product count display for each category

### 2. Type-Specific Filtering
- Separate selectors for vendor categories and store categories
- Automatic filtering based on category type
- Clean separation between different category types

### 3. User Experience
- Dropdown with search functionality
- Click outside to close
- Visual feedback for selected items
- Responsive design for mobile devices

## Components

### HierarchicalCategorySelect
The main component that provides the hierarchical category selection functionality.

**Props:**
- `categories` (array): Array of category objects from the API
- `value` (string/number): Currently selected category ID
- `onChange` (function): Callback when a category is selected
- `placeholder` (string): Placeholder text for the select
- `type` (string): Category type - "vendor" or "store"

**Usage:**
```jsx
<HierarchicalCategorySelect
  categories={categories}
  value={selectedCategoryId}
  onChange={setSelectedCategoryId}
  placeholder="Select Category"
  type="vendor"
/>
```

### HierarchicalCategoryDemo
A demo component to showcase and test the hierarchical category selection functionality.

## Implementation Details

### Category Structure
The component expects categories in the following format:
```javascript
{
  id: number,
  name: string,
  type: "vendor" | "store",
  parent_id: number | null,
  level: number,
  product_count: number
}
```

### Hierarchy Building
The component automatically builds the hierarchical structure by:
1. Filtering categories by type (vendor/store)
2. Building a tree structure based on parent_id relationships
3. Sorting categories alphabetically within each level
4. Adding proper indentation for visual hierarchy

### Search Functionality
- Real-time search through category names
- Maintains hierarchy structure during search
- Case-insensitive matching
- Clears search when dropdown is closed

## API Integration

The component works with the existing categories API endpoint:
```
GET /api/categories
```

The API returns both flat and hierarchical category structures:
```javascript
{
  categories: [...], // Hierarchical structure
  flatCategories: [...] // Flat structure with all category data
}
```

## Styling

The component includes comprehensive CSS styling with:
- Professional dropdown appearance
- Hover and focus states
- Responsive design
- Custom scrollbar styling
- Mobile-friendly touch targets

## Usage in ProductDetail

The hierarchical category selection is integrated into the ProductDetail component in the "Categories" tab:

1. **Vendor Category**: Hierarchical selector for vendor-specific categories
2. **Store Category**: Hierarchical selector for store-specific categories
3. **Google Category**: Regular text input (unchanged)

## Benefits

1. **Better Navigation**: Users can easily see category relationships
2. **Improved UX**: No more scrolling through long flat lists
3. **Visual Hierarchy**: Clear indication of parent-child relationships
4. **Search Capability**: Quick access to specific categories
5. **Type Separation**: Clear distinction between vendor and store categories

## Testing

Use the `HierarchicalCategoryDemo` component to test the functionality:
1. Navigate to the demo page
2. Test vendor category selection
3. Test store category selection
4. Verify search functionality
5. Check responsive behavior

## Future Enhancements

Potential improvements for the future:
1. Multi-select capability
2. Category creation from the selector
3. Drag-and-drop category reordering
4. Category path display (e.g., "Electronics > Computers > Laptops")
5. Keyboard navigation support
6. Category icons or images

## Troubleshooting

### Common Issues

1. **Categories not loading**: Check API endpoint and authentication
2. **Hierarchy not displaying**: Verify category data has proper parent_id values
3. **Search not working**: Ensure category names are properly formatted
4. **Styling issues**: Check CSS file is properly imported

### Debug Steps

1. Check browser console for errors
2. Verify API response structure
3. Test with sample category data
4. Check component props are correctly passed
