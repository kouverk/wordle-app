const express = require('express');
const morgan = require('morgan');
const mysql = require('mysql2');
const cors = require('cors');
const routes = require('./routes/index');
const app = express();
const port = 3000; // Change if necessary

// Middleware
app.use(cors());
app.use(express.json()); // for parsing application/json
app.use(morgan(':method :url :status :res[content-length] - :response-time ms'));

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
