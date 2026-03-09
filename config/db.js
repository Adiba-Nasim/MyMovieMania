// ============================================
//  config/db.js  —  MyMovieMania
//  MySQL connection pool using mysql2
// ============================================

const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host    : process.env.DB_HOST || 'localhost',
    user    : process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'mymoviemania',
    port    : process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit   : 10,
});

module.exports = pool;