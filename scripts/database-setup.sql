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
    level INT DEFAULT 1,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
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
('Premium Parts Co', 'sales@premiumparts.com', '555-0103');

-- Insert sample categories
INSERT INTO categories (name, type, parent_id, level) VALUES 
('Electronics', 'store', NULL, 1),
('Computers', 'store', 1, 2),
('Laptops', 'store', 2, 3),
('Accessories', 'vendor', NULL, 1),
('Cables', 'vendor', 4, 2);

-- Insert sample products with descriptions
INSERT INTO products (sku, name, short_description, description, brand, stock, list_price, market_price, vendor_cost, vendor_id, vendor_category_id, store_category_id) VALUES 
('PROD001', 'Gaming Laptop Pro', 'High-performance gaming laptop with RTX graphics', 'This premium gaming laptop features the latest RTX graphics card, high-refresh display, and advanced cooling system. Perfect for gamers and content creators who need powerful performance.', 'GamingTech', 50, 1299.99, 1199.99, 800.00, 1, 4, 3),
('PROD002', 'Wireless Mouse', 'Ergonomic wireless mouse with precision tracking', 'Comfortable wireless mouse with 12,000 DPI sensor, programmable buttons, and long battery life. Ideal for both work and gaming.', 'TechAccess', 100, 49.99, 39.99, 25.00, 2, 4, 1),
('PROD003', 'USB-C Cable', 'High-speed USB-C cable for fast charging and data transfer', 'Premium USB-C cable with 100W power delivery and 10Gbps data transfer speeds. Compatible with all USB-C devices.', 'CablePro', 200, 19.99, 15.99, 8.00, 3, 5, 1);
