# Image URL Import Issue - Fix Guide

## Problem Identified

The `image_url` field is not getting inserted during bulk import because **your CSV files do not contain an `image_url` column**.

## Root Cause Analysis

1. **Database Schema**: ✅ The `image_url` field exists in the database (VARCHAR(500))
2. **Import Logic**: ✅ The import code correctly handles the `image_url` field
3. **Auto-Mapping**: ✅ The auto-mapping logic works for columns containing "image" and "url"
4. **CSV Structure**: ❌ **Your CSV files are missing the `image_url` column**

## Current CSV Header (Missing image_url)
```
sku,name,short_description,description,brand,mfn,stock,list_price,market_price,vendor_cost,special_price,weight,length,width,height,google_category,vendor_category,store_category,vendor_subcategory_1,vendor_subcategory_2,vendor_subcategory_3,vendor_subcategory_4,store_subcategory_1,store_subcategory_2,store_subcategory_3,store_subcategory_4,published,featured,visibility,vendor_id,meta_title,meta_description,meta_keywords
```

## Correct CSV Header (With image_url)
```
sku,name,short_description,description,brand,mfn,stock,list_price,market_price,vendor_cost,special_price,weight,length,width,height,google_category,vendor_category,store_category,vendor_subcategory_1,vendor_subcategory_2,vendor_subcategory_3,vendor_subcategory_4,store_subcategory_1,store_subcategory_2,store_subcategory_3,store_subcategory_4,published,featured,visibility,vendor_id,meta_title,meta_description,meta_keywords,image_url
```

## Solutions

### Solution 1: Add image_url Column to Your CSV Files (Recommended)

1. **Add a new column** to your CSV files with the header `image_url`
2. **Fill in the image URLs** for each product
3. **The auto-mapping will automatically detect** and map the `image_url` column

Example:
```csv
sku,name,image_url
SKU001,Wireless Mouse,https://example.com/images/wireless-mouse.jpg
SKU002,Gaming Keyboard,https://example.com/images/gaming-keyboard.jpg
```

### Solution 2: Rename Existing Image Column

If you already have an image column with a different name, rename it to include "image" and "url":

**Before:**
```csv
sku,name,product_image
SKU001,Wireless Mouse,https://example.com/images/wireless-mouse.jpg
```

**After:**
```csv
sku,name,image_url
SKU001,Wireless Mouse,https://example.com/images/wireless-mouse.jpg
```

### Solution 3: Manual Field Mapping

If you can't change the CSV structure, you can manually map your existing image column:

1. During the import process, in the field mapping step
2. Find your image column (e.g., "product_image", "image", "photo_url")
3. Manually map it to the "image_url" database field

## Auto-Mapping Logic

The system automatically maps columns that contain:
- "image" AND ("url" OR "link")

Examples of column names that will auto-map:
- `image_url` ✅
- `image_link` ✅
- `product_image_url` ✅
- `photo_url` ✅
- `img_link` ✅

## Testing the Fix

### Run the Test Script
```bash
node test-image-url-import.js
```

This will:
1. Verify the database schema supports `image_url`
2. Test direct database insertion
3. Confirm the import logic works

### Test with Sample CSV
Use the provided `sample_with_image_url.csv` file to test the import process.

## Updated Template

The `product_import_template_dummy.csv` has been updated to include the `image_url` column as an example.

## Verification Steps

After implementing the fix:

1. **Check the field mapping** during import - you should see `image_url` mapped
2. **Verify in the preview** - image URLs should appear in the preview data
3. **Check the database** - imported products should have `image_url` values
4. **View in product list** - images should display in the products table

## Common Issues and Solutions

### Issue: "image_url column not found in mapping"
**Solution**: Ensure your CSV header contains `image_url` or a column name with "image" and "url"

### Issue: "Auto-mapping not working"
**Solution**: Check that your column name contains both "image" and "url" (or "link")

### Issue: "Image URLs not showing in product list"
**Solution**: Verify the `image_url` field is visible in the column selector and enabled

## Summary

The `image_url` import issue is caused by missing the `image_url` column in your CSV files. Simply add this column to your CSV files and the import will work correctly. The database and import logic are already properly configured to handle image URLs.
