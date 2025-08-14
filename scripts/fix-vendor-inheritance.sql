-- Fix vendor inheritance for existing categories
-- Update subcategories to inherit vendor_id from their parent categories

-- First, update level 2 categories that have null vendor_id
UPDATE categories c1
JOIN categories c2 ON c1.parent_id = c2.id
SET c1.vendor_id = c2.vendor_id
WHERE c1.vendor_id IS NULL 
AND c2.vendor_id IS NOT NULL 
AND c1.type = 'vendor';

-- Then, update level 3 categories
UPDATE categories c1
JOIN categories c2 ON c1.parent_id = c2.id
SET c1.vendor_id = c2.vendor_id
WHERE c1.vendor_id IS NULL 
AND c2.vendor_id IS NOT NULL 
AND c1.type = 'vendor';

-- Update level 4 categories
UPDATE categories c1
JOIN categories c2 ON c1.parent_id = c2.id
SET c1.vendor_id = c2.vendor_id
WHERE c1.vendor_id IS NULL 
AND c2.vendor_id IS NOT NULL 
AND c1.type = 'vendor';

-- Update level 5 categories (if any)
UPDATE categories c1
JOIN categories c2 ON c1.parent_id = c2.id
SET c1.vendor_id = c2.vendor_id
WHERE c1.vendor_id IS NULL 
AND c2.vendor_id IS NOT NULL 
AND c1.type = 'vendor';

-- Show the results
SELECT 
    c.id,
    c.name,
    c.parent_id,
    c.level,
    c.vendor_id,
    p.name as parent_name,
    v.name as vendor_name
FROM categories c
LEFT JOIN categories p ON c.parent_id = p.id
LEFT JOIN vendors v ON c.vendor_id = v.id
WHERE c.type = 'vendor'
ORDER BY c.level, c.name;
