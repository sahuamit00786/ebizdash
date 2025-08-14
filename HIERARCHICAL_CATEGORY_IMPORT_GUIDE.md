# Hierarchical Category Import Guide

## Problem with Current CSV Structure

Your current CSV headers:
```
vendor_category,store_category,vendor_subcategory_1,vendor_subcategory_2,vendor_subcategory_3,vendor_subcategory_4,store_subcategory_1,store_subcategory_2,store_subcategory_3,store_subcategory_4
```

**Issues:**
1. **Separated vendor and store categories** - Makes it hard to establish parent-child relationships
2. **Limited to 4 levels** - vendor_subcategory_4 and store_subcategory_4
3. **No clear hierarchy** - Can't easily see the full category path
4. **Complex mapping** - Need to handle multiple columns for the same concept

## New Hierarchical CSV Structure

### Single Category Hierarchy Column
Instead of multiple separate columns, use one `category_hierarchy` column:

```csv
sku,name,description,category_hierarchy
PROD001,Sample Product,Description,"Electronics > Mobile Devices > Smartphones > Premium"
PROD002,Sample Product,Description,"Computers > Laptops > Gaming > High-End"
```

### Benefits:
1. **Unlimited levels** - Can have as many levels as needed
2. **Clear hierarchy** - Easy to see the full category path
3. **Simple structure** - One column instead of multiple
4. **Flexible** - Can have different depths for different products

## CSV Template Structure

### Basic Template
```csv
sku,name,description,brand,mfn,stock,list_price,market_price,vendor_cost,special_price,weight,length,width,height,google_category,published,featured,visibility,vendor_id,meta_title,meta_description,meta_keywords,category_hierarchy
```

### Example Data
```csv
PROD001,Sample Product 1,Description,Brand A,MFN001,100,199.99,179.99,120.00,159.99,2.5,15,10,5,Electronics,true,false,public,1,Meta Title,Meta Description,keywords,"Electronics > Mobile Devices > Smartphones > Premium"
PROD002,Sample Product 2,Description,Brand B,MFN002,50,299.99,269.99,180.00,249.99,3.0,20,12,6,Computers,true,true,public,2,Meta Title,Meta Description,keywords,"Computers > Laptops > Gaming > High-End"
```

## Category Hierarchy Format

### Syntax
- Use `>` as the separator between levels
- Each level represents a category or subcategory
- Example: `"Electronics > Mobile Devices > Smartphones > Premium"`

### Levels Explained
- **Level 1**: Electronics (Root category)
- **Level 2**: Mobile Devices (Subcategory of Electronics)
- **Level 3**: Smartphones (Subcategory of Mobile Devices)
- **Level 4**: Premium (Subcategory of Smartphones)

### Rules
1. **Case sensitive** - "Electronics" and "electronics" are different categories
2. **Spaces matter** - "Mobile Devices" and "MobileDevices" are different
3. **No empty levels** - Don't use `"Electronics > > Smartphones"`
4. **Consistent naming** - Use the same category names across products

## Import Process

### Step 1: Prepare Your CSV
1. Use the template provided in `hierarchical_category_template.csv`
2. Fill in the `category_hierarchy` column with your category paths
3. Ensure all other required fields are filled

### Step 2: Import Categories
1. The system will automatically:
   - Parse the category hierarchy
   - Create categories that don't exist
   - Establish parent-child relationships
   - Assign proper levels (1, 2, 3, etc.)

### Step 3: Import Products
1. Products will be linked to the deepest category in their hierarchy
2. All parent categories will be created automatically
3. The system maintains the full hierarchy structure

## Examples

### Simple 2-Level Hierarchy
```csv
PROD001,Product 1,Description,...,"Electronics > Smartphones"
PROD002,Product 2,Description,...,"Electronics > Laptops"
```

### Complex 4-Level Hierarchy
```csv
PROD001,Product 1,Description,...,"Electronics > Mobile Devices > Smartphones > Premium > 5G"
PROD002,Product 2,Description,...,"Electronics > Mobile Devices > Smartphones > Budget"
```

### Mixed Depths
```csv
PROD001,Product 1,Description,...,"Electronics > Smartphones"
PROD002,Product 2,Description,...,"Electronics > Mobile Devices > Smartphones > Premium"
PROD003,Product 3,Description,...,"Electronics"
```

## Migration from Old Format

### Converting Old CSV to New Format

**Old Format:**
```csv
vendor_category,store_category,vendor_subcategory_1,vendor_subcategory_2
Electronics,Electronics,Smartphones,Premium
```

**New Format:**
```csv
category_hierarchy
"Electronics > Smartphones > Premium"
```

### Conversion Rules:
1. **Vendor categories**: Use as the base hierarchy
2. **Store categories**: Can be used as alternative or combined
3. **Subcategories**: Chain them together with `>` separators
4. **Empty fields**: Skip empty subcategory fields

## Best Practices

### 1. Plan Your Hierarchy
- Design your category structure before importing
- Keep it consistent across all products
- Use clear, descriptive category names

### 2. Test with Small Data
- Start with a few products to test the import
- Verify categories are created correctly
- Check parent-child relationships

### 3. Maintain Consistency
- Use the same category names across products
- Follow a consistent naming convention
- Avoid special characters in category names

### 4. Backup Before Import
- Always backup your database before large imports
- Test the import process with sample data
- Verify the results before proceeding

## Troubleshooting

### Common Issues

1. **Categories not created**
   - Check for typos in category names
   - Ensure proper `>` separator usage
   - Verify CSV format is correct

2. **Wrong parent-child relationships**
   - Check category hierarchy order
   - Ensure consistent naming
   - Verify no extra spaces

3. **Import errors**
   - Check CSV encoding (use UTF-8)
   - Verify all required fields are filled
   - Check for special characters

### Error Messages

- **"Invalid category hierarchy format"**: Check separator usage
- **"Category name too long"**: Shorten category names
- **"Duplicate category found"**: Categories already exist (this is normal)

## Support

If you encounter issues:
1. Check this guide first
2. Review the example CSV template
3. Test with a small dataset
4. Contact support with specific error messages
