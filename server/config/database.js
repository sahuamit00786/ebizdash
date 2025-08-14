const mysql = require("mysql2")
const dotenv = require("dotenv")

dotenv.config()

const pool = mysql.createPool({
  host:  "localhost",
  user:  "root",
  password:  "123456",
  database:  "product_management",
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 20, // Reduced for better performance
  queueLimit: 5, // Reduced queue limit
  // Performance optimizations
  acquireTimeout: 10000, // Faster timeout
  timeout: 10000, // Faster timeout
  // Connection optimizations
  multipleStatements: true,
  // Query optimizations
  namedPlaceholders: false,
  // Buffer optimizations
  maxPreparedStatements: 25, // Reduced
  // Connection reuse
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  // Additional optimizations
  dateStrings: true,
  supportBigNumbers: true,
  bigNumberStrings: true,
  // Performance tuning
  trace: false, // Disable tracing
  debug: false, // Disable debug
  // Connection pooling optimizations
  idleTimeoutMillis: 30000, // Close idle connections faster
  reapIntervalMillis: 1000 // Check for dead connections every second
})

// Add connection event handlers for better error handling
pool.on('connection', function (connection) {
  console.log('New database connection established');
  
  // Set session variables for better performance
  connection.execute('SET SESSION sql_mode = "NO_AUTO_VALUE_ON_ZERO"');
  connection.execute('SET SESSION innodb_lock_wait_timeout = 30'); // Reduced from 50
  connection.execute('SET SESSION lock_wait_timeout = 30'); // Reduced from 50
  connection.execute('SET SESSION wait_timeout = 28800'); // 8 hours
  connection.execute('SET SESSION interactive_timeout = 28800'); // 8 hours
});

pool.on('error', function (err) {
  console.error('Database pool error:', err);
});

// Removed excessive logging to reduce console noise
// pool.on('acquire', function (connection) {
//   console.log('Connection %d acquired', connection.threadId);
// });

// pool.on('release', function (connection) {
//   console.log('Connection %d released', connection.threadId);
// });

// Simple query cache for frequently accessed data
const queryCache = new Map();
const CACHE_TTL = 30000; // 30 seconds

// Create a wrapper function to handle connection errors gracefully with caching
const executeWithRetry = async (query, params = [], useCache = false) => {
  // Check cache for read queries
  if (useCache && query.trim().toUpperCase().startsWith('SELECT')) {
    const cacheKey = `${query}-${JSON.stringify(params)}`;
    const cached = queryCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.result;
    }
  }

  let retries = 3;
  while (retries > 0) {
    try {
      const startTime = Date.now();
      const result = await pool.promise().execute(query, params);
      const duration = Date.now() - startTime;
      
      // Log slow queries
      if (duration > 1000) {
        console.warn(`Slow query (${duration}ms):`, query.substring(0, 100) + '...');
      }
      
      // Cache result for read queries
      if (useCache && query.trim().toUpperCase().startsWith('SELECT')) {
        const cacheKey = `${query}-${JSON.stringify(params)}`;
        queryCache.set(cacheKey, {
          result,
          timestamp: Date.now()
        });
      }
      
      return result;
    } catch (error) {
      retries--;
      if (error.code === 'ER_CON_COUNT_ERROR' && retries > 0) {
        console.log(`Connection limit reached, retrying... (${retries} attempts left)`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
        continue;
      }
      throw error;
    }
  }
};


module.exports = {
  pool: pool.promise(),
  executeWithRetry
}
