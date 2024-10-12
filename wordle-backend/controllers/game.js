const express = require('express');
const app = express();
const db = require('../db'); // MySQL connection
app.use(express.json()); 

// Route to get a solution word
const getsolution = (req, res) => {
    const query = 'SELECT word FROM words ORDER BY RAND() LIMIT 1';
  
    db.query(query, (error, results) => {
      if (error) {
        return res.status(500).json({ error: 'Database query failed' });
      }
      if (results.length > 0) {
        res.json({ word: results[0].word });
      } else {
        res.status(404).json({ error: 'No words found' });
      }
    });
  };

module.exports = {getsolution}