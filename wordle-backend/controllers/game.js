const express = require('express');
const app = express();
const db = require('../db'); // MySQL connection
app.use(express.json()); 

// Route to get a solution word
const getSolution = (req, res) => {
    const query = 'SELECT word FROM words ORDER BY RAND() LIMIT 1';
  
    db.query(query, (error, results) => {
      if (error) {
        console.error('Get Solution query failed:', error);  // Log the error
        return res.status(500).json({ error: 'Get Solution query failed' });
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
            return res.status(500).json({ err: 'Check word query failed' });
        }        
        // Check the first result in the array
        if (results[0].exists == 1) {
            return res.json({ exists: true });
        } else {
            return res.json({ exists: false });
        }
    });
};


const getUsers = (req, res) => {
  const query = 'SELECT username, avatar_num FROM users';

  db.query(query, (error, results) => {
    if (error) {
      console.error('Get user query failed:', error);  // Log the error
      return res.status(500).json({ error: 'Get Users query failed' });
    }
      res.json(results);
  });
};

//Start a multiplayer game
const start = (req, res) => {
  const { player1_id, player2_id } = req.body;
  
  db.query('INSERT INTO games (player1_id, player2_id) VALUES (?, ?)', [player1_id, player2_id], 
      (err, result) => {
          if (err) return res.status(500).json({ error: err.message });
          res.json({ gameId: result.insertId });
      });
};

const submit = (req, res) => {
  const { gameId, word } = req.body;

  db.query('UPDATE games SET current_word = ?, current_turn = (current_turn + 1) % 2 WHERE id = ?', [word, gameId], 
      (err) => {
          if (err) return res.status(500).json({ error: err.message });
          res.json({ message: 'Word submitted successfully' });
      });
}



module.exports = {getSolution, checkWord, getUsers, start, submit}