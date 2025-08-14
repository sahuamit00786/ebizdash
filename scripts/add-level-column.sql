-- Add level column to categories table if it doesn't exist
ALTER TABLE categories ADD COLUMN IF NOT EXISTS level INT DEFAULT 1;

-- Update existing categories to have proper levels
-- Root categories (parent_id IS NULL) should have level 0
UPDATE categories SET level = 0 WHERE parent_id IS NULL;

-- Subcategories should have level 1 (we'll need to calculate this properly)
-- For now, set all categories with parent_id to level 1
UPDATE categories SET level = 1 WHERE parent_id IS NOT NULL;

-- Create a function to calculate levels properly
DELIMITER $$

CREATE PROCEDURE UpdateCategoryLevels()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE cat_id INT;
    DECLARE cat_parent_id INT;
    DECLARE cat_level INT;
    
    -- Cursor for all categories
    DECLARE cat_cursor CURSOR FOR 
        SELECT id, parent_id FROM categories ORDER BY parent_id IS NULL DESC, id;
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    OPEN cat_cursor;
    
    read_loop: LOOP
        FETCH cat_cursor INTO cat_id, cat_parent_id;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        -- Calculate level based on parent
        IF cat_parent_id IS NULL THEN
            SET cat_level = 0;
        ELSE
            -- Get parent's level and add 1
            SELECT level + 1 INTO cat_level FROM categories WHERE id = cat_parent_id;
            IF cat_level IS NULL THEN
                SET cat_level = 1; -- Fallback
            END IF;
        END IF;
        
        -- Update the category level
        UPDATE categories SET level = cat_level WHERE id = cat_id;
        
    END LOOP;
    
    CLOSE cat_cursor;
END$$

DELIMITER ;

-- Execute the procedure to update all levels
CALL UpdateCategoryLevels();

-- Drop the procedure
DROP PROCEDURE UpdateCategoryLevels;

-- Show the updated categories
SELECT id, name, type, parent_id, level FROM categories ORDER BY type, level, name;
