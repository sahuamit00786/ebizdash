-- Add vendor_id column to categories table
ALTER TABLE categories ADD COLUMN vendor_id INT NULL AFTER type;

-- Add foreign key constraint
ALTER TABLE categories ADD CONSTRAINT fk_categories_vendor_id 
FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE SET NULL;

-- Update existing vendor categories to have vendor_id = NULL (they will be global)
-- This ensures existing data is not affected

-- Add index for better performance
CREATE INDEX idx_categories_vendor_id ON categories(vendor_id);
CREATE INDEX idx_categories_type_vendor ON categories(type, vendor_id);
