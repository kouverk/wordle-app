// db.js
require('dotenv').config();
const mysql = require('mysql2');

// Support Railway's MYSQLHOST format, MYSQL_HOST format, and local DB_* vars
// Using a connection pool instead of single connection to handle reconnection automatically
const db = mysql.createPool({
    host: process.env.MYSQLHOST || process.env.MYSQL_HOST || process.env.DB_HOST,
    port: process.env.MYSQLPORT || process.env.MYSQL_PORT || process.env.DB_PORT || 3306,
    user: process.env.MYSQLUSER || process.env.MYSQL_USER || process.env.DB_USER,
    password: process.env.MYSQLPASSWORD || process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD,
    database: process.env.MYSQLDATABASE || process.env.MYSQL_DATABASE || process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000
});

// Test the connection on startup
db.getConnection((err, connection) => {
    if (err) {
        console.error('Database connection failed:', err.stack);
        return;
    }
    console.log('Connected to MySQL database (using connection pool)');
    connection.release();
});

module.exports = db; // Export the pool for use in other files
