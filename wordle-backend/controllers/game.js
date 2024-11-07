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
  const query = `SELECT u.username, u.id as user_id, u.avatar_num, a.url as avatar_url FROM users u
                 LEFT JOIN avatars as a on a.id = u.avatar_num`;
  db.query(query, (error, results) => {
    if (error) {
      console.error('Get user query failed:', error);  // Log the error
      return res.status(500).json({ error: 'Get Users query failed' });
    }
      res.json(results);
  });
};

//load multiplayer game
const retrieveMultiPlayerGame = (req, res) => {
  const { player1_id, player2_id } = req.query;

  // Step 1: Try to retrieve an existing multiplayer game
  const selectQuery = `
    SELECT mpg.id AS game_id, 'multiplayer' AS game_type, player1_id, player2_id, 
           u1.username AS player1_username, u2.username AS player2_username, player_turn, 
           current_turn_num, word, player1_score, player2_score, status, completed_at, 
           mpg.last_turn_time 
    FROM multiplayer_games mpg 
    LEFT JOIN users u1 ON mpg.player1_id = u1.id 
    LEFT JOIN users u2 ON mpg.player2_id = u2.id 
    WHERE (u1.id = ? AND u2.id = ?) OR (u1.id = ? AND u2.id = ?)
    ORDER BY last_turn_time DESC
    LIMIT 1
  `;

  db.query(selectQuery, [player1_id, player2_id, player2_id, player1_id], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (results.length > 0) {
      const game = results[0];

      // Step 2: Retrieve attempts for the existing game
      const attemptsQuery = `
        SELECT * FROM multiplayer_game_attempts 
        WHERE game_id = ? 
        ORDER BY created_at ASC
      `;

      db.query(attemptsQuery, [game.game_id], (err, attemptsResults) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        return res.json({
          game: game,
          attempts: attemptsResults.length > 0 ? attemptsResults : null // Return attempts or null if empty
        });
      });
    } else { 
      // Step 3: Select a random word and create a new multiplayer game
      const wordQuery = `SELECT word FROM words ORDER BY RAND() LIMIT 1`;

      db.query(wordQuery, (err, wordResults) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        const randomWord = wordResults[0].word;

        const insertQuery = `
          INSERT INTO multiplayer_games (player1_id, player2_id, word, current_turn_num, player_turn, 
                                         player1_score, player2_score, status, last_turn_time)
          VALUES (?, ?, ?, 0, ?, 0, 0, 'in_progress', NULL)
        `;

        db.query(insertQuery, [player1_id, player2_id, randomWord, player1_id], (err, insertResult) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }

          // Step 4: Retrieve the newly created game record
          const newGameId = insertResult.insertId;
          const newSelectQuery = `
            SELECT mpg.id AS game_id, 'multiplayer' AS game_type, player1_id, player2_id, 
                   u1.username AS player1_username, u2.username AS player2_username, player_turn, 
                   current_turn_num, word, player1_score, player2_score, status, completed_at, 
                   mpg.last_turn_time 
            FROM multiplayer_games mpg 
            LEFT JOIN users u1 ON mpg.player1_id = u1.id 
            LEFT JOIN users u2 ON mpg.player2_id = u2.id 
            WHERE mpg.id = ?
          `;

          db.query(newSelectQuery, [newGameId], (err, newResults) => {
            if (err) {
              return res.status(500).json({ error: err.message });
            }
            return res.json({
              game: newResults[0],
              attempts: null // Set to null for the newly created game as no attempts exist yet
            });
          });
        });
      });
    }
  });
};


// load single player game 
const retrieveSinglePlayerGame = (req, res) => {
  const { player_id } = req.query;

  // Step 1: Try to retrieve an existing single-player game
  const selectQuery = `
    SELECT spg.id AS game_id, 'singleplayer' AS game_type, player_id, 
           u.username AS player_username, current_turn_num, word, status, 
           completed_at, spg.last_turn_time 
    FROM single_player_games spg 
    LEFT JOIN users u ON spg.player_id = u.id 
    WHERE spg.player_id = ?
    ORDER BY last_turn_time DESC
    LIMIT 1
  `;

  db.query(selectQuery, [player_id], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (results.length > 0) {
      const game = results[0];

      // Step 2: Retrieve attempts for the existing game
      const attemptsQuery = `
        SELECT * FROM attempts 
        WHERE game_id = ? 
        ORDER BY attempt_time ASC
      `;

      db.query(attemptsQuery, [game.game_id], (err, attemptsResults) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        return res.json({
          game: game,
          attempts: attemptsResults.length > 0 ? attemptsResults : null // Return attempts or null if empty
        });
      });
    } else {
      // Step 3: Select a random word and create a new game record
      const wordQuery = `SELECT word FROM words ORDER BY RAND() LIMIT 1`;

      db.query(wordQuery, (err, wordResults) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        const randomWord = wordResults[0].word;

        const insertQuery = `
          INSERT INTO single_player_games (player_id, word, current_turn_num, status, last_turn_time)
          VALUES (?, ?, 0, 'in_progress', NULL)
        `;

        db.query(insertQuery, [player_id, randomWord], (err, insertResult) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }

          // Step 4: Retrieve the newly created game record
          const newGameId = insertResult.insertId;
          const newSelectQuery = `
            SELECT spg.id AS game_id, 'singleplayer' AS game_type, player_id, 
                   u.username AS player_username, current_turn_num, word, status, 
                   completed_at, spg.last_turn_time 
            FROM single_player_games spg 
            LEFT JOIN users u ON spg.player_id = u.id 
            WHERE spg.id = ?
          `;

          db.query(newSelectQuery, [newGameId], (err, newResults) => {
            if (err) {
              return res.status(500).json({ error: err.message });
            }

            return res.json({
              game: newResults[0],
              attempts: null // Set to null for the newly created game as no attempts exist yet
            });
          });
        });
      });
    }
  });
};

const chooseWord = (req, res) => {
  db.query('SELECT word FROM words ORDER BY RAND() LIMIT 12', (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (results.length > 0) {
      res.json(results);
    } else {
      res.status(404).json({ error: 'Error in databse. No words found' });
    }
    
  })
}

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



module.exports = {getSolution, checkWord, retrieveMultiPlayerGame, retrieveSinglePlayerGame, chooseWord, getUsers, start, submit}