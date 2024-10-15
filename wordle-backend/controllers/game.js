const express = require('express');
const app = express();
const db = require('../db'); // MySQL connection
app.use(express.json()); 

// Route to get a solution word
const getSolution = (req, res) => {
    const query = 'SELECT word FROM words ORDER BY RAND() LIMIT 1';
  
    db.query(query, (error, results) => {
      if (error) {
        console.error('Database query failed:', error);  // Log the error
        return res.status(500).json({ error: 'Database query failed' });
      }
      if (results.length > 0) {
        res.json({ word: results[0].word });
      } else {
        res.status(404).json({ error: 'No words found' });
      }
    });
  };

const checkWord = (req, res) => {
    const word = req.params.word; 
    
    // Database query to check if the word exists
    db.query('SELECT COUNT(*) as `exists` FROM words WHERE word = ?', [word], (err, results) => {
        if (err) {
            console.error('Database query failed:', err);  // Log the error
            return res.status(500).json({ err: 'Database query failed' });
        }        
        // Check the first result in the array
        if (results[0].exists == 1) {
            return res.json({ exists: true });
        } else {
            return res.json({ exists: false });
        }
    });
};

const getAvatars = (req, res) => {
  const word = req.params.word; 
  
  // Database query to check if the word exists
  db.query('SELECT * FROM avatars', (err, results) => {
      if (err) {
          console.error('Database query failed:', err);  // Log the error
          return res.status(500).json({ err: 'Database query failed' });
      }        
      return res.json(results);
  });
};


module.exports = {getSolution, checkWord, getAvatars}