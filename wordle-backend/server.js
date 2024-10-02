const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
const port = 3000; // Change if necessary

// Middleware
app.use(cors());
app.use(express.json()); // for parsing application/json

// MySQL Connection
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root', // Change to your MySQL username
    password: 'Befef$#$1', // Change to your MySQL password
    database: 'applications' // Your database name
});

// Connect to MySQL
connection.connect((err) => {
    if (err) throw err;
    console.log('Connected to MySQL!');
});

// API homepage
app.get('/', (req, res) => {
    res.send('This is the homepage')
});
// API endpoint to get users
app.get('/getwords', (req, res) => {
    connection.query('SELECT * FROM wordlewords', (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
