-- Setup Local Database for Product Management System
-- Run this script in your local MySQL server

-- Create database
CREATE DATABASE IF NOT EXISTS product_management;
USE product_management;

-- Users table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'shop_manager') DEFAULT 'shop_manager',
    permissions JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Vendors table
CREATE TABLE vendors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    address TEXT,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Categories table (for both vendor and store categories)
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type ENUM('vendor', 'store') NOT NULL,
    parent_id INT NULL,
    vendor_id INT NULL,
    level INT DEFAULT 1,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL,
    FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE SET NULL
);

-- Products table with enhanced fields
CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sku VARCHAR(50) UNIQUE NOT NULL,
    mfn VARCHAR(50),
    name VARCHAR(255) NOT NULL,
    short_description VARCHAR(500),
    description TEXT,
    brand VARCHAR(100),
    stock INT DEFAULT 0,
    list_price DECIMAL(10,2),
    market_price DECIMAL(10,2),
    vendor_cost DECIMAL(10,2),
    special_price DECIMAL(10,2),
    weight DECIMAL(8,2),
    length DECIMAL(8,2),
    width DECIMAL(8,2),
    height DECIMAL(8,2),
    images JSON,
    gallery JSON,
    vendor_id INT,
    vendor_category_id INT,
    store_category_id INT,
    google_category VARCHAR(255),
    published BOOLEAN DEFAULT true,
    featured BOOLEAN DEFAULT false,
    visibility ENUM('public', 'private', 'hidden') DEFAULT 'public',
    meta_title VARCHAR(255),
    meta_description TEXT,
    meta_keywords VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE SET NULL,
    FOREIGN KEY (vendor_category_id) REFERENCES categories(id) ON DELETE SET NULL,
    FOREIGN KEY (store_category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- Attributes table
CREATE TABLE attributes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type ENUM('text', 'number', 'select', 'multiselect') DEFAULT 'text',
    options JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Product attributes junction table
CREATE TABLE product_attributes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT,
    attribute_id INT,
    value TEXT,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (attribute_id) REFERENCES attributes(id) ON DELETE CASCADE
);

-- Settings table
CREATE TABLE settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default admin user (password: admin123)
INSERT INTO users (username, email, password, role) VALUES 
('admin', 'admin@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin');

-- Insert default settings
INSERT INTO settings (setting_key, setting_value) VALUES 
('company_name', 'Product Management System'),
('logo_url', '/assets/logo.png');

-- Insert sample vendors
INSERT INTO vendors (name, email, phone) VALUES 
('Tech Supplies Inc', 'contact@techsupplies.com', '555-0101'),
('Global Electronics', 'info@globalelectronics.com', '555-0102'),
('Premium Parts Co', 'sales@premiumparts.com', '555-0103'),
('CWR', 'contact@cwr.com', '555-0104');

-- Insert sample categories
INSERT INTO categories (name, type, parent_id, level, vendor_id) VALUES 
('Electronics', 'vendor', NULL, 1, 4),
('Smartphones', 'vendor', 1, 2, 4),
('Android', 'vendor', 2, 3, 4),
('Flagship', 'vendor', 3, 4, 4),
('New Premium', 'vendor', 4, 5, 4),
('Forgetable', 'vendor', 5, 6, 4),
('New Category', 'vendor', 5, 6, 4);

-- Insert sample products
INSERT INTO products (sku, name, description, brand, stock, list_price, market_price, vendor_cost, vendor_id, vendor_category_id) VALUES 
('PROD001', 'Sample Smartphone', 'A high-end smartphone with advanced features', 'TechBrand', 10, 999.99, 899.99, 600.00, 4, 6),
('PROD002', 'Premium Headphones', 'Wireless noise-canceling headphones', 'AudioTech', 25, 299.99, 249.99, 150.00, 4, 6),
('PROD003', 'Gaming Laptop', 'High-performance gaming laptop', 'GameTech', 5, 1499.99, 1299.99, 900.00, 4, 7);

-- Create indexes for better performance
CREATE INDEX idx_products_vendor_id ON products(vendor_id);
CREATE INDEX idx_products_vendor_category_id ON products(vendor_category_id);
CREATE INDEX idx_products_store_category_id ON products(store_category_id);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_published ON products(published);
CREATE INDEX idx_categories_parent_id ON categories(parent_id);
CREATE INDEX idx_categories_vendor_id ON categories(vendor_id);
CREATE INDEX idx_categories_type ON categories(type);

-- Show setup completion message
SELECT 'Local database setup completed successfully!' as message;
SELECT COUNT(*) as total_products FROM products;
SELECT COUNT(*) as total_categories FROM categories;
SELECT COUNT(*) as total_vendors FROM vendors;
