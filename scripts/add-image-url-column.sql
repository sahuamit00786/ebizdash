-- Add image_url column to products table
USE product_management;

ALTER TABLE products 
ADD COLUMN image_url VARCHAR(500) NULL 
AFTER meta_keywords;

-- Update existing products to have a default image_url if they have images
UPDATE products 
SET image_url = JSON_UNQUOTE(JSON_EXTRACT(images, '$[0]'))
WHERE images IS NOT NULL 
AND JSON_VALID(images) 
AND JSON_LENGTH(images) > 0
AND image_url IS NULL;
