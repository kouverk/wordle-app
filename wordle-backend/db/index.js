// db.js
require('dotenv').config();
const mysql = require('mysql2');

// Support both Railway's MYSQL_* vars and local DB_* vars
const db = mysql.createConnection({
    host: process.env.MYSQL_HOST || process.env.DB_HOST,
    port: process.env.MYSQL_PORT || process.env.DB_PORT || 3306,
    user: process.env.MYSQL_USER || process.env.DB_USER,
    password: process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD,
    database: process.env.MYSQL_DATABASE || process.env.DB_NAME
});

db.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err.stack);
        return;
    }
    console.log('Connected to MySQL database');
});

module.exports = db; // Export the connection for use in other files
