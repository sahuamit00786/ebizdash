# Database Configuration Fix

## Issue
You're getting a MySQL connection error: `Access denied for user 'root'@'localhost' (using password: NO)`

## Solution

### Option 1: Create a .env file (Recommended)

Create a `.env` file in the root directory with the following content:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_actual_mysql_password
DB_NAME=product_management
DB_PORT=3306

# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=24h
```

**Replace `your_actual_mysql_password` with your actual MySQL root password.**

### Option 2: Set MySQL root password to empty

If you want to use the default configuration (no password), you can reset your MySQL root password:

1. **Stop MySQL service**
2. **Start MySQL in safe mode:**
   ```bash
   mysqld --skip-grant-tables
   ```
3. **In another terminal, connect to MySQL:**
   ```bash
   mysql -u root
   ```
4. **Reset the password:**
   ```sql
   USE mysql;
   UPDATE user SET authentication_string='' WHERE user='root';
   FLUSH PRIVILEGES;
   EXIT;
   ```
5. **Restart MySQL normally**

### Option 3: Create a new MySQL user

1. **Connect to MySQL as root:**
   ```bash
   mysql -u root -p
   ```
2. **Create a new user:**
   ```sql
   CREATE USER 'product_user'@'localhost' IDENTIFIED BY 'your_password';
   GRANT ALL PRIVILEGES ON product_management.* TO 'product_user'@'localhost';
   FLUSH PRIVILEGES;
   EXIT;
   ```
3. **Update your .env file:**
   ```env
   DB_USER=product_user
   DB_PASSWORD=your_password
   ```

## Database Setup

After fixing the connection, you need to create the database and tables:

1. **Connect to MySQL:**
   ```bash
   mysql -u root -p
   ```
2. **Run the setup script:**
   ```sql
   source setup-local-database.sql
   ```

## Restart the Application

After making these changes:

1. **Stop the current server** (Ctrl+C)
2. **Restart the server:**
   ```bash
   npm run server
   ```

## Default Login Credentials

Once the database is set up, you can login with:
- **Username:** admin
- **Password:** admin123
- **Email:** admin@example.com

## Troubleshooting

### Still getting connection errors?
1. Make sure MySQL is running
2. Verify the password in your .env file
3. Check if the database `product_management` exists
4. Try connecting manually: `mysql -u root -p`

### Permission denied?
1. Make sure the MySQL user has proper privileges
2. Try creating a new user as shown in Option 3

### Port issues?
If MySQL is running on a different port, add it to your .env file:
```env
DB_HOST=localhost:3306
```
