// db.js
const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost', // Your database host
    user: 'root',      // Your MySQL username
    password: 'Befef$#$1', // Your MySQL password
    database: 'applications' // Your database name
});

db.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err.stack);
        return;
    }
    console.log('Connected to MySQL database');
});

module.exports = db; // Export the connection for use in other files
