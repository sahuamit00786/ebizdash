-- Enhanced Database Setup for Categories
-- This script creates the correct table structure that matches the API expectations

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS ebizdash_products_react;
USE ebizdash_products_react;

-- Users table
CREATE TABLE IF NOT EXISTS users (
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
CREATE TABLE IF NOT EXISTS vendors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    address TEXT,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Categories table with correct structure for API
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    vendor_id INT NULL,
    parent_id INT NULL,
    level INT DEFAULT 1,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE SET NULL,
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sku VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2),
    stock_quantity INT DEFAULT 0,
    image_url VARCHAR(500),
    category_id INT,
    vendor_id INT,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE SET NULL
);

-- Insert default admin user (password: admin123)
INSERT IGNORE INTO users (id, username, email, password, role) VALUES 
(1, 'admin', 'admin@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin');

-- Insert sample vendors
INSERT IGNORE INTO vendors (id, name, email, phone) VALUES 
(1, 'Tech Supplies Inc', 'contact@techsupplies.com', '555-0101'),
(2, 'Global Electronics', 'info@globalelectronics.com', '555-0102'),
(3, 'Premium Parts Co', 'sales@premiumparts.com', '555-0103');

-- Insert sample categories with proper structure
INSERT IGNORE INTO categories (id, name, description, vendor_id, parent_id, level, status) VALUES 
-- Root categories
(1, 'Electronics', 'Electronic devices and accessories', NULL, NULL, 1, 'active'),
(2, 'Clothing', 'Fashion and apparel items', NULL, NULL, 1, 'active'),
(3, 'Home & Garden', 'Home improvement and garden supplies', NULL, NULL, 1, 'active'),

-- Electronics subcategories
(4, 'Computers', 'Desktop and laptop computers', NULL, 1, 2, 'active'),
(5, 'Mobile Devices', 'Smartphones and tablets', NULL, 1, 2, 'active'),
(6, 'Accessories', 'Computer and mobile accessories', NULL, 1, 2, 'active'),

-- Computer subcategories
(7, 'Laptops', 'Portable computers', NULL, 4, 3, 'active'),
(8, 'Desktops', 'Desktop computers', NULL, 4, 3, 'active'),
(9, 'Gaming Laptops', 'High-performance gaming laptops', NULL, 7, 4, 'active'),
(10, 'Business Laptops', 'Professional business laptops', NULL, 7, 4, 'active'),

-- Mobile subcategories
(11, 'Smartphones', 'Mobile phones with advanced features', NULL, 5, 3, 'active'),
(12, 'Tablets', 'Portable tablet devices', NULL, 5, 3, 'active'),
(13, 'Android Phones', 'Android-based smartphones', NULL, 11, 4, 'active'),
(14, 'iOS Phones', 'Apple iPhone devices', NULL, 11, 4, 'active'),

-- Accessories subcategories
(15, 'Cables', 'Various types of cables', NULL, 6, 3, 'active'),
(16, 'Chargers', 'Power adapters and chargers', NULL, 6, 3, 'active'),

-- Clothing subcategories
(17, 'Men', 'Men\'s clothing and accessories', NULL, 2, 2, 'active'),
(18, 'Women', 'Women\'s clothing and accessories', NULL, 2, 2, 'active'),
(19, 'T-Shirts', 'Casual t-shirts for men', NULL, 17, 3, 'active'),
(20, 'Jeans', 'Denim jeans for men', NULL, 17, 3, 'active'),
(21, 'Dresses', 'Women\'s dresses', NULL, 18, 3, 'active'),
(22, 'Tops', 'Women\'s tops and blouses', NULL, 18, 3, 'active'),

-- Vendor-specific categories
(23, 'Tech Supplies Categories', 'Categories specific to Tech Supplies Inc', 1, NULL, 1, 'active'),
(24, 'Global Electronics Categories', 'Categories specific to Global Electronics', 2, NULL, 1, 'active'),
(25, 'Premium Parts Categories', 'Categories specific to Premium Parts Co', 3, NULL, 1, 'active');

-- Insert sample products
INSERT IGNORE INTO products (sku, name, description, price, stock_quantity, category_id, vendor_id) VALUES 
('PROD001', 'Gaming Laptop Pro', 'High-performance gaming laptop with RTX graphics', 1299.99, 50, 9, 1),
('PROD002', 'Business Laptop Elite', 'Professional laptop for business use', 899.99, 30, 10, 1),
('PROD003', 'Android Smartphone', 'Latest Android smartphone with advanced features', 599.99, 100, 13, 2),
('PROD004', 'iPhone 15 Pro', 'Apple iPhone 15 Pro with premium features', 999.99, 75, 14, 2),
('PROD005', 'USB-C Cable', 'High-speed USB-C cable for fast charging', 19.99, 200, 15, 3),
('PROD006', 'Wireless Charger', 'Fast wireless charging pad', 49.99, 150, 16, 3),
('PROD007', 'Men\'s T-Shirt', 'Comfortable cotton t-shirt for men', 24.99, 300, 19, 1),
('PROD008', 'Men\'s Jeans', 'Classic denim jeans for men', 59.99, 200, 20, 1),
('PROD009', 'Women\'s Dress', 'Elegant dress for women', 79.99, 100, 21, 2),
('PROD010', 'Women\'s Top', 'Stylish top for women', 39.99, 150, 22, 2); 