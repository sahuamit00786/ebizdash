# Local Database Setup Guide

## Prerequisites

1. **Install MySQL Server** (if not already installed)
   - Download from: https://dev.mysql.com/downloads/mysql/
   - Or use XAMPP: https://www.apachefriends.org/
   - Or use WAMP: https://www.wampserver.com/

2. **Install MySQL Workbench** (optional but recommended)
   - Download from: https://dev.mysql.com/downloads/workbench/

## Step-by-Step Setup

### 1. Start MySQL Server
- If using XAMPP: Start Apache and MySQL services
- If using standalone MySQL: Start the MySQL service
- If using WAMP: Start WAMP services

### 2. Create Database and Tables

**Option A: Using MySQL Command Line**
```bash
# Connect to MySQL
mysql -u root -p

# Run the setup script
source setup-local-database.sql
```

**Option B: Using MySQL Workbench**
1. Open MySQL Workbench
2. Connect to your local MySQL server
3. Open the `setup-local-database.sql` file
4. Execute the script (Ctrl+Shift+Enter)

**Option C: Using phpMyAdmin (if using XAMPP)**
1. Open http://localhost/phpmyadmin
2. Click "Import"
3. Select the `setup-local-database.sql` file
4. Click "Go"

### 3. Verify Setup
After running the script, you should see:
- Database `product_management` created
- All tables created with proper relationships
- Sample data inserted
- Performance indexes created

### 4. Test Connection
Start your Node.js server:
```bash
npm run server
```

The server should connect to localhost without errors.

## Default Login Credentials

- **Username:** admin
- **Password:** admin123
- **Email:** admin@example.com

## Database Configuration

The application is now configured to use:
- **Host:** localhost
- **User:** root
- **Password:** (empty)
- **Database:** product_management

## Sample Data Included

- **4 Vendors** (including CWR)
- **7 Categories** (hierarchical structure)
- **3 Sample Products**
- **1 Admin User**

## Troubleshooting

### Connection Error
If you get connection errors:
1. Make sure MySQL is running
2. Check if the database `product_management` exists
3. Verify username/password in `server/config/database.js`

### Permission Error
If you get permission errors:
1. Make sure the MySQL user has proper privileges
2. Try creating a new MySQL user:
```sql
CREATE USER 'product_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON product_management.* TO 'product_user'@'localhost';
FLUSH PRIVILEGES;
```

### Port Issues
If MySQL is running on a different port:
1. Update the host in `server/config/database.js` to include port:
```javascript
host: "localhost:3306", // or whatever port you're using
```

## Performance Tips

1. **Enable Query Cache** (if available)
2. **Monitor slow queries** (they'll be logged automatically)
3. **Use indexes** (already created in the setup script)
4. **Regular backups** of your local database

## Next Steps

1. Start the frontend: `npm start`
2. Start the backend: `npm run server`
3. Login with admin/admin123
4. Test the hierarchical category search feature
5. Import your own data using the CSV import feature
