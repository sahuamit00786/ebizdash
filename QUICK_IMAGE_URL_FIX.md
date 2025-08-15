# Quick Fix for Image URL Import Issue

## 🔍 **Step 1: Debug Your CSV File**

Run this command to analyze your CSV file:
```bash
node debug-your-csv.js your-csv-file.csv
```

This will tell you exactly what's wrong with your CSV file.

## 🛠️ **Step 2: Common Issues & Quick Fixes**

### Issue 1: Header Name Problem
**Problem**: Your header might be named differently than expected.

**Quick Fix**: Rename your header to exactly `image_url`

**Examples of problematic headers:**
- `Image_URL` → Change to `image_url`
- `image url` → Change to `image_url`
- `product_image` → Change to `image_url`
- `photo_url` → Change to `image_url`

### Issue 2: Extra Spaces or Characters
**Problem**: Hidden spaces or special characters in header.

**Quick Fix**: 
1. Open your CSV in a text editor
2. Make sure the header is exactly: `image_url`
3. No extra spaces before or after

### Issue 3: Manual Mapping Needed
**Problem**: Auto-mapping not working.

**Quick Fix**: 
1. During import, go to the field mapping step
2. Find your image column
3. Manually map it to "Image URL" in the dropdown

## 📋 **Step 3: Verify Your CSV Format**

Your CSV should look like this:
```csv
sku,name,image_url,description
SKU001,Product Name,https://example.com/image.jpg,Description
SKU002,Another Product,https://example.com/another.jpg,Another description
```

## 🔧 **Step 4: Test with Sample File**

Use the provided sample file to test:
```bash
node debug-your-csv.js sample_with_image_url.csv
```

## ❓ **Still Not Working?**

1. **Check the debug output** - it will tell you exactly what's wrong
2. **Share your CSV header** - tell me the exact header name
3. **Try manual mapping** - during import, manually map your image column
4. **Check for encoding issues** - save your CSV as UTF-8

## 🎯 **Most Common Solution**

**Rename your header to exactly `image_url`** - this works 90% of the time!

## 📞 **Need More Help?**

Run the debug tool and share the output - it will show exactly what's wrong with your CSV file.
