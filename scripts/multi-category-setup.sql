-- Multi-Category System Setup
-- This script creates the proper category hierarchy structure

-- Update categories table to support parent-child relationships
ALTER TABLE categories 
ADD COLUMN parent_id INT NULL,
ADD COLUMN image_url VARCHAR(500) NULL,
ADD COLUMN description TEXT NULL,
ADD COLUMN sort_order INT DEFAULT 0,
ADD FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE CASCADE;

-- Add images column to products table
ALTER TABLE products 
ADD COLUMN images JSON NULL COMMENT 'Array of product images with URLs and metadata';

-- Create indexes for better performance
CREATE INDEX idx_categories_parent_id ON categories(parent_id);
CREATE INDEX idx_categories_sort_order ON categories(sort_order);
CREATE INDEX idx_products_vendor_category ON products(vendor_category_id);
CREATE INDEX idx_products_store_category ON products(store_category_id);

-- Insert sample parent categories
INSERT INTO categories (name, description, image_url, parent_id, sort_order, created_at, updated_at) VALUES
('Electronics', 'Electronic devices and accessories', '/images/categories/electronics.jpg', NULL, 1, NOW(), NOW()),
('Clothing', 'Fashion and apparel items', '/images/categories/clothing.jpg', NULL, 2, NOW(), NOW()),
('Home & Garden', 'Home improvement and garden supplies', '/images/categories/home-garden.jpg', NULL, 3, NOW(), NOW()),
('Sports & Outdoors', 'Sports equipment and outdoor gear', '/images/categories/sports.jpg', NULL, 4, NOW(), NOW()),
('Books & Media', 'Books, movies, and digital media', '/images/categories/books.jpg', NULL, 5, NOW(), NOW());

-- Get the inserted parent category IDs
SET @electronics_id = (SELECT id FROM categories WHERE name = 'Electronics' AND parent_id IS NULL);
SET @clothing_id = (SELECT id FROM categories WHERE name = 'Clothing' AND parent_id IS NULL);
SET @home_garden_id = (SELECT id FROM categories WHERE name = 'Home & Garden' AND parent_id IS NULL);
SET @sports_id = (SELECT id FROM categories WHERE name = 'Sports & Outdoors' AND parent_id IS NULL);
SET @books_id = (SELECT id FROM categories WHERE name = 'Books & Media' AND parent_id IS NULL);

-- Insert Electronics subcategories
INSERT INTO categories (name, description, image_url, parent_id, sort_order, created_at, updated_at) VALUES
('Smartphones', 'Mobile phones and accessories', '/images/categories/smartphones.jpg', @electronics_id, 1, NOW(), NOW()),
('Laptops', 'Portable computers and accessories', '/images/categories/laptops.jpg', @electronics_id, 2, NOW(), NOW()),
('Audio Equipment', 'Speakers, headphones, and audio devices', '/images/categories/audio.jpg', @electronics_id, 3, NOW(), NOW()),
('Gaming', 'Video games and gaming accessories', '/images/categories/gaming.jpg', @electronics_id, 4, NOW(), NOW()),
('Cameras', 'Digital cameras and photography equipment', '/images/categories/cameras.jpg', @electronics_id, 5, NOW(), NOW());

-- Insert Clothing subcategories
INSERT INTO categories (name, description, image_url, parent_id, sort_order, created_at, updated_at) VALUES
('Men\'s Clothing', 'Clothing for men', '/images/categories/mens-clothing.jpg', @clothing_id, 1, NOW(), NOW()),
('Women\'s Clothing', 'Clothing for women', '/images/categories/womens-clothing.jpg', @clothing_id, 2, NOW(), NOW()),
('Kids\' Clothing', 'Clothing for children', '/images/categories/kids-clothing.jpg', @clothing_id, 3, NOW(), NOW()),
('Shoes', 'Footwear for all ages', '/images/categories/shoes.jpg', @clothing_id, 4, NOW(), NOW()),
('Accessories', 'Jewelry, bags, and fashion accessories', '/images/categories/accessories.jpg', @clothing_id, 5, NOW(), NOW());

-- Insert Home & Garden subcategories
INSERT INTO categories (name, description, image_url, parent_id, sort_order, created_at, updated_at) VALUES
('Kitchen & Dining', 'Kitchen appliances and dining items', '/images/categories/kitchen.jpg', @home_garden_id, 1, NOW(), NOW()),
('Furniture', 'Home and office furniture', '/images/categories/furniture.jpg', @home_garden_id, 2, NOW(), NOW()),
('Garden Tools', 'Gardening equipment and supplies', '/images/categories/garden-tools.jpg', @home_garden_id, 3, NOW(), NOW()),
('Home Decor', 'Decorative items for home', '/images/categories/home-decor.jpg', @home_garden_id, 4, NOW(), NOW()),
('Lighting', 'Lighting fixtures and bulbs', '/images/categories/lighting.jpg', @home_garden_id, 5, NOW(), NOW());

-- Insert Sports & Outdoors subcategories
INSERT INTO categories (name, description, image_url, parent_id, sort_order, created_at, updated_at) VALUES
('Fitness Equipment', 'Exercise and fitness gear', '/images/categories/fitness.jpg', @sports_id, 1, NOW(), NOW()),
('Team Sports', 'Balls, equipment for team sports', '/images/categories/team-sports.jpg', @sports_id, 2, NOW(), NOW()),
('Outdoor Recreation', 'Camping, hiking, and outdoor gear', '/images/categories/outdoor.jpg', @sports_id, 3, NOW(), NOW()),
('Water Sports', 'Swimming and water activity equipment', '/images/categories/water-sports.jpg', @sports_id, 4, NOW(), NOW()),
('Winter Sports', 'Skiing, snowboarding, and winter gear', '/images/categories/winter-sports.jpg', @sports_id, 5, NOW(), NOW());

-- Insert Books & Media subcategories
INSERT INTO categories (name, description, image_url, parent_id, sort_order, created_at, updated_at) VALUES
('Fiction Books', 'Novels and fiction literature', '/images/categories/fiction.jpg', @books_id, 1, NOW(), NOW()),
('Non-Fiction Books', 'Educational and reference books', '/images/categories/non-fiction.jpg', @books_id, 2, NOW(), NOW()),
('Movies & TV', 'DVDs, Blu-rays, and streaming content', '/images/categories/movies.jpg', @books_id, 3, NOW(), NOW()),
('Music', 'CDs, vinyl records, and digital music', '/images/categories/music.jpg', @books_id, 4, NOW(), NOW()),
('Video Games', 'Physical and digital video games', '/images/categories/video-games.jpg', @books_id, 5, NOW(), NOW());

-- Create a view for easy category hierarchy queries
CREATE OR REPLACE VIEW category_hierarchy AS
SELECT 
    c.id,
    c.name,
    c.description,
    c.image_url,
    c.parent_id,
    c.sort_order,
    p.name as parent_name,
    p.description as parent_description,
    p.image_url as parent_image_url,
    CONCAT(COALESCE(p.name, ''), ' > ', c.name) as full_path,
    CASE 
        WHEN c.parent_id IS NULL THEN 'parent'
        ELSE 'child'
    END as category_type,
    c.created_at,
    c.updated_at
FROM categories c
LEFT JOIN categories p ON c.parent_id = p.id
ORDER BY COALESCE(c.parent_id, c.id), c.sort_order, c.name;

-- Create a stored procedure for getting category tree
DELIMITER //
CREATE PROCEDURE GetCategoryTree()
BEGIN
    SELECT 
        id,
        name,
        description,
        image_url,
        parent_id,
        sort_order,
        category_type,
        full_path,
        created_at,
        updated_at
    FROM category_hierarchy
    ORDER BY COALESCE(parent_id, id), sort_order, name;
END //
DELIMITER ;

-- Create a function to get category path
DELIMITER //
CREATE FUNCTION GetCategoryPath(category_id INT) 
RETURNS VARCHAR(500)
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE path VARCHAR(500);
    DECLARE current_id INT;
    DECLARE current_name VARCHAR(255);
    
    SET path = '';
    SET current_id = category_id;
    
    WHILE current_id IS NOT NULL DO
        SELECT name INTO current_name FROM categories WHERE id = current_id;
        IF path = '' THEN
            SET path = current_name;
        ELSE
            SET path = CONCAT(current_name, ' > ', path);
        END IF;
        
        SELECT parent_id INTO current_id FROM categories WHERE id = current_id;
    END WHILE;
    
    RETURN path;
END //
DELIMITER ;

-- Update existing products to have proper category relationships
-- This assumes you have some existing products that need category assignment
-- You can run this after setting up your categories

-- Example: Update a product to use the new category system
-- UPDATE products SET vendor_category_id = (SELECT id FROM categories WHERE name = 'Smartphones' LIMIT 1) WHERE id = 1;
-- UPDATE products SET store_category_id = (SELECT id FROM categories WHERE name = 'Electronics' LIMIT 1) WHERE id = 1;

COMMIT; 