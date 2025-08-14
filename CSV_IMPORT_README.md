# CSV Import System

## Overview
The CSV import system allows you to bulk import products into your e-commerce platform. The system supports comprehensive product data including categories, pricing, inventory, and now **hierarchical subcategories**.

## New Feature: Subcategory Support

### Subcategory Columns
The CSV template now includes **6 subcategory columns** that allow you to create hierarchical category structures:

- `subcategory_1` - First level subcategory
- `subcategory_2` - Second level subcategory  
- `subcategory_3` - Third level subcategory
- `subcategory_4` - Fourth level subcategory
- `subcategory_5` - Fifth level subcategory
- `subcategory_6` - Sixth level subcategory

### How Subcategories Work
1. **Hierarchical Structure**: Subcategories are processed in order (1 through 6)
2. **Automatic Creation**: If a subcategory doesn't exist, it will be automatically created
3. **Parent-Child Relationships**: Each subcategory becomes the parent of the next level
4. **Product Association**: Products are linked to all relevant subcategories in the hierarchy

### Example Subcategory Structure
```
Electronics (Main Category)
├── Smartphones (subcategory_1)
│   ├── Android (subcategory_2)
│   │   ├── Flagship (subcategory_3)
│   │   │   ├── 5G (subcategory_4)
│   │   │   │   ├── Camera (subcategory_5)
│   │   │   │   │   └── Premium (subcategory_6)
```

### CSV Example
```csv
sku,name,subcategory_1,subcategory_2,subcategory_3,subcategory_4,subcategory_5,subcategory_6
PROD001,Samsung Galaxy S24,Smartphones,Android,Flagship,5G,Camera,Premium
PROD002,iPhone 15 Pro,Smartphones,iOS,Flagship,5G,Camera,Premium
```

## Supported Fields

### Basic Information
- `sku` (required) - Product SKU
- `name` (required) - Product name
- `short_description` - Brief product description
- `description` - Detailed product description
- `brand` - Product brand
- `mfn` - Manufacturer number

### Inventory
- `stock` - Stock quantity

### Pricing
- `list_price` - List price
- `market_price` - Market price
- `vendor_cost` - Vendor cost
- `special_price` - Special price

### Dimensions & Weight
- `weight` - Product weight
- `length` - Product length
- `width` - Product width
- `height` - Product height

### Categories
- `google_category` - Google category
- `vendor_category_id` - Vendor category ID
- `store_category_id` - Store category ID
- `subcategory_1` - First level subcategory
- `subcategory_2` - Second level subcategory
- `subcategory_3` - Third level subcategory
- `subcategory_4` - Fourth level subcategory
- `subcategory_5` - Fifth level subcategory
- `subcategory_6` - Sixth level subcategory

### Settings
- `published` - Published status (true/false)
- `featured` - Featured status (true/false)
- `visibility` - Product visibility

### Relationships
- `vendor_id` - Vendor ID

### SEO
- `meta_title` - Meta title
- `meta_description` - Meta description
- `meta_keywords` - Meta keywords

## Import Process

### Step 1: Upload CSV File
1. Click "Import CSV" in the Products page
2. Select your CSV file
3. The system will automatically detect and map fields

### Step 2: Field Mapping
1. Review the automatic field mapping
2. Adjust mappings if needed
3. Ensure required fields are mapped

### Step 3: Preview Data
1. Preview the first 5 rows of mapped data
2. Verify subcategory structure is correct
3. Check for any mapping errors

### Step 4: Import
1. Start the import process
2. Monitor real-time progress
3. View import results and any errors

## Best Practices

### Subcategory Guidelines
1. **Consistent Naming**: Use consistent naming conventions for subcategories
2. **Logical Hierarchy**: Create logical parent-child relationships
3. **Not Too Deep**: Avoid creating unnecessarily deep hierarchies (6 levels max)
4. **Descriptive Names**: Use clear, descriptive names for each level

### Data Quality
1. **Clean Data**: Ensure CSV data is clean and properly formatted
2. **Required Fields**: Always include SKU and name
3. **Valid IDs**: Ensure vendor_id and category_id values exist in the database
4. **Consistent Formatting**: Use consistent date, number, and boolean formats

### Performance
1. **Batch Size**: Import in batches of 1000-5000 products for optimal performance
2. **File Size**: Keep CSV files under 10MB for best results
3. **Network**: Ensure stable internet connection during import

## Error Handling

### Common Errors
1. **Missing Required Fields**: SKU and name are required
2. **Invalid Data Types**: Ensure numbers are numeric, booleans are true/false
3. **Duplicate SKUs**: Each product must have a unique SKU
4. **Invalid Category IDs**: Ensure category IDs exist in the database

### Subcategory Errors
1. **Empty Subcategories**: Empty subcategory fields are ignored
2. **Invalid Hierarchy**: Subcategories are processed in order (1-6)
3. **Duplicate Names**: Subcategories with the same name and parent are reused

## Template Download

### Getting the Template
1. Click "Download Template" in the import modal
2. The template includes sample data with subcategory examples
3. Use the template as a starting point for your import

### Template Features
- Sample data for all fields
- Subcategory examples showing hierarchy
- Proper formatting for all data types
- Comments explaining field usage

## Troubleshooting

### Import Issues
1. **Check File Format**: Ensure CSV is properly formatted
2. **Verify Encoding**: Use UTF-8 encoding
3. **Review Mapping**: Check field mapping is correct
4. **Check Permissions**: Ensure you have import permissions

### Subcategory Issues
1. **Verify Hierarchy**: Check subcategory order and relationships
2. **Check Names**: Ensure subcategory names are not empty
3. **Review Structure**: Verify the category structure makes sense

## Support

For issues with CSV import or subcategory functionality:
1. Check the error messages in the import results
2. Review the import logs
3. Contact system administrator for technical support 