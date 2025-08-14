# Hierarchical Category Import Troubleshooting Guide

## Quick Diagnostic Steps

### 1. Check Server Status
```bash
# Make sure your server is running
npm start
# or
node server/server.js
```

### 2. Test Database Connection
```bash
# Run the debug test
node debug-hierarchical-test.js
```

### 3. Check Browser Console
- Open Developer Tools (F12)
- Go to Console tab
- Look for any error messages during import

### 4. Check Server Logs
- Look at your terminal where the server is running
- Check for any error messages during import

## Common Issues and Solutions

### Issue 1: CSV File Not Uploading
**Symptoms:**
- File upload fails
- "Please select a valid CSV file" error

**Solutions:**
1. Make sure file is saved as `.csv`
2. Check file encoding (should be UTF-8)
3. Try the simple test file: `simple-csv-test.csv`

### Issue 2: Field Mapping Not Working
**Symptoms:**
- `category_hierarchy` field not auto-mapped
- Manual mapping doesn't work

**Solutions:**
1. Check CSV header spelling: `category_hierarchy`
2. Make sure there are no extra spaces
3. Try manual mapping in the import modal

### Issue 3: Preview Fails
**Symptoms:**
- Preview step shows errors
- "Error previewing data" message

**Solutions:**
1. Check server logs for specific errors
2. Verify database connection
3. Check if all required fields are mapped

### Issue 4: Import Fails
**Symptoms:**
- Import starts but fails
- Products not created
- Categories not created

**Solutions:**
1. Check database permissions
2. Verify category table structure
3. Check server logs for SQL errors

## Step-by-Step Testing

### Test 1: Basic Import
1. Use `simple-csv-test.csv`
2. Upload file
3. Check field mapping
4. Try preview
5. Check for errors

### Test 2: Database Test
1. Run `node debug-hierarchical-test.js`
2. Check if categories are created
3. Verify hierarchy structure

### Test 3: Full Import Test
1. Use `test-hierarchical-new.csv`
2. Complete full import process
3. Check database for results

## Debug Information

### Check Database Structure
```sql
-- Check if categories table exists
DESCRIBE categories;

-- Check existing categories
SELECT * FROM categories LIMIT 10;

-- Check table structure
SHOW CREATE TABLE categories;
```

### Check Server Logs
Look for these error patterns:
- `ER_NO_SUCH_TABLE`: Table doesn't exist
- `ER_ACCESS_DENIED`: Database permission issues
- `ER_DUP_ENTRY`: Duplicate entry errors
- `ER_PARSE_ERROR`: SQL syntax errors

### Check Browser Network Tab
1. Open Developer Tools
2. Go to Network tab
3. Try import process
4. Look for failed requests
5. Check response details

## Quick Fixes

### Fix 1: Database Connection
If database connection fails:
```javascript
// Check server/config/database.js
// Verify connection details
```

### Fix 2: Table Structure
If categories table is missing:
```sql
-- Run the database setup script
-- scripts/database-setup.sql
```

### Fix 3: Permissions
If permission errors:
```sql
-- Grant necessary permissions
GRANT ALL PRIVILEGES ON ebizdash_products_react.* TO 'ebizdash_products_react'@'%';
FLUSH PRIVILEGES;
```

## Emergency Fallback

If hierarchical import still doesn't work:

### Option 1: Use Legacy Format
```csv
sku,name,description,vendor_category,store_category,vendor_subcategory_1,store_subcategory_1
PROD001,Product 1,Description,Electronics,Electronics,Smartphones,Mobile Devices
```

### Option 2: Manual Category Creation
1. Create categories manually in the Categories section
2. Use simple category mapping in CSV
3. Link products to existing categories

### Option 3: Database Direct Import
1. Export your data to SQL format
2. Import directly to database
3. Use database tools for category creation

## Getting Help

If you're still having issues:

1. **Collect Debug Info:**
   - Server logs
   - Browser console errors
   - Database error messages
   - Screenshots of the issue

2. **Test with Minimal Data:**
   - Use `simple-csv-test.csv`
   - Try with just 1-2 products
   - Test each step separately

3. **Check Environment:**
   - Node.js version
   - Database version
   - Server configuration

## Common Error Messages

### "Invalid category hierarchy format"
- Check for proper `>` separators
- Remove extra spaces
- Ensure no empty levels

### "Category name too long"
- Shorten category names
- Check database field length limits

### "Duplicate category found"
- This is normal, categories already exist
- Import should continue normally

### "Database connection failed"
- Check database credentials
- Verify network connectivity
- Check database server status
