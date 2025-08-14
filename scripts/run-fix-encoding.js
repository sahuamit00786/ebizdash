const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function setupDatabase() {
  let connection;
  
  try {
    console.log('Connecting to database...');
    
    // Create connection
    connection = await mysql.createConnection({
      host: "45.77.196.170",
      user: "ebizdash_products_react",
      password: "products_react",
      database: "ebizdash_products_react",
      charset: 'utf8mb4'
    });

    console.log('Connected to database successfully!');

    // Read and execute the SQL script
    const sqlPath = path.join(__dirname, 'enhanced-category-setup.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Split the SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`Found ${statements.length} SQL statements to execute`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`Executing statement ${i + 1}/${statements.length}`);
          await connection.execute(statement);
        } catch (error) {
          console.log(`Error in statement ${i + 1}:`, error.message);
          // Continue with other statements
        }
      }
    }

    console.log('Database setup completed!');

    // Test the categories table
    console.log('Testing categories table...');
    const [categories] = await connection.execute('SELECT * FROM categories LIMIT 5');
    console.log('Categories found:', categories.length);
    console.log('Sample categories:', categories);

    // Test the vendors table
    console.log('Testing vendors table...');
    const [vendors] = await connection.execute('SELECT * FROM vendors LIMIT 5');
    console.log('Vendors found:', vendors.length);
    console.log('Sample vendors:', vendors);

    // Test the products table
    console.log('Testing products table...');
    const [products] = await connection.execute('SELECT * FROM products LIMIT 5');
    console.log('Products found:', products.length);
    console.log('Sample products:', products);

  } catch (error) {
    console.error('Database setup error:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed.');
    }
  }
}

setupDatabase(); 