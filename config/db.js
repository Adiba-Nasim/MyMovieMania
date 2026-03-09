const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
  host              : process.env.DB_HOST,
  port              : process.env.DB_PORT,
  user              : process.env.DB_USER,
  password          : process.env.DB_PASS,
  database          : process.env.DB_NAME,
  ssl               : { rejectUnauthorized: false },
  connectTimeout    : 30000,
  waitForConnections: true,
  connectionLimit   : 10,
  queueLimit        : 0,
  enableKeepAlive   : true,      // ← keeps connection alive
  keepAliveInitialDelay: 10000   // ← ping every 10 seconds
});

// Test connection on startup
pool.getConnection((err, conn) => {
  if (err) {
    console.error('❌ DB connection failed:', err.code);
  } else {
    console.log('✅ Railway MySQL connected!');
    conn.release();
  }
});

module.exports = pool.promise();