const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const routes = require('./routes/index');
const app = express();
const port = 3000; // Change if necessary

// Middleware
app.use(cors());
app.use(express.json()); // for parsing application/json

// API homepage
app.get('/', (req, res) => {
    res.send('This is the homepage')
});

//Handle routing
app.use('/', routes); 

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
