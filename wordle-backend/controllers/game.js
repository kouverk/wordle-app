const express = require('express');
const app = express();
const db = require('../db'); // MySQL connection
const { calculateFinalScore } = require('../utils/scoring');
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

      // If word is null, the current turn hasn't started yet (player needs to choose a word)
      // Don't return attempts from previous turns
      if (!game.word) {
        return res.json({
          game: game,
          attempts: null,
          newGame: false
        });
      }

      // Step 2: Retrieve attempts for the existing game (only current turn's attempts)
      const attemptsQuery = `
        SELECT * FROM multiplayer_game_attempts
        WHERE game_id = ? AND turn_num = ?
        ORDER BY created_at ASC
      `;

      db.query(attemptsQuery, [game.game_id, game.current_turn_num], (err, attemptsResults) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        return res.json({
          game: game,
          attempts: attemptsResults.length > 0 ? attemptsResults : null,
          newGame: false
        });
      });
    } else {
      // No existing game - create a new multiplayer game with word = NULL
      // The challenger will pick a word on the /choose-word page
      const insertQuery = `
        INSERT INTO multiplayer_games (player1_id, player2_id, word, current_turn_num, player_turn,
                                       player1_score, player2_score, status, last_turn_time)
        VALUES (?, ?, NULL, 0, ?, 0, 0, 'in_progress', NULL)
      `;

      db.query(insertQuery, [player1_id, player2_id, player1_id], (err, insertResult) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        // Retrieve the newly created game record
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
            attempts: null,
            newGame: true
          });
        });
      });
    }
  });
};


// load single player game 
const retrieveSinglePlayerGame = (req, res) => {
  const { player_id } = req.query;

  // Step 1: Try to retrieve an existing in-progress single-player game
  const selectQuery = `
    SELECT spg.id AS game_id, 'singleplayer' AS game_type, player_id AS player1_id,
           u.username AS player1_username, current_turn_num, word, status,
           completed_at, spg.last_turn_time
    FROM single_player_games spg
    LEFT JOIN users u ON spg.player_id = u.id
    WHERE spg.player_id = ? AND spg.status = 'in_progress'
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
        SELECT * FROM single_player_game_attempts
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
            SELECT spg.id AS game_id, 'singleplayer' AS game_type, player_id AS player1_id,
                   u.username AS player1_username, current_turn_num, word, status,
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

//Add attempts data
const addAttempt = (req, res) => {
  const { game_id, game_type, player_id, attempt, attempt_num, is_correct, turn_num } = req.body;

  // Validate game_type to ensure only valid tables are used
  const validTables = {
    singleplayer: 'single_player_game_attempts',
    multiplayer: 'multiplayer_game_attempts'
  };

  const tableName = validTables[game_type];
  if (!tableName) {
    return res.status(400).json({ error: 'Invalid game type' });
  }

  // SQL query for inserting a new attempt (multiplayer includes turn_num)
  const attemptInsert = game_type === 'multiplayer'
    ? `INSERT INTO ?? (game_id, player_id, attempt, attempt_num, is_correct, turn_num, created_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`
    : `INSERT INTO ?? (game_id, player_id, attempt, attempt_num, is_correct, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`;

  const insertParams = game_type === 'multiplayer'
    ? [tableName, game_id, player_id, attempt, attempt_num, is_correct, turn_num || 0]
    : [tableName, game_id, player_id, attempt, attempt_num, is_correct];

  // Perform the insert query
  db.query(attemptInsert, insertParams, (err, attemptResults) => {
    if (err) {
      console.error('Database error at attempts insert:', err);
      return res.status(500).json({ error: err.message });
    }
    // SQL query to retrieve all attempts for this game
    const retrieveAttempts = `SELECT * FROM ?? WHERE game_id = ? ORDER BY attempt_num ASC`;
    const retrieveParams = [tableName, game_id];

    // Perform the retrieve query after successful insertion
    db.query(retrieveAttempts, retrieveParams, (err, allAttempts) => {
      if (err) {
        console.error('Database error retrieving attempts:', err);
        return res.status(500).json({ error: err.message });
      }

      // Send response with all attempts after successful retrieval
      res.status(200).json(allAttempts);
    });
  });
};



// Update the word for a multiplayer game (used when player picks a word for opponent)
// After setting the word, switch player_turn to the opponent who will guess it
const updateGameWord = (req, res) => {
  const { game_id, word } = req.body;

  // First get the current game to determine who the opponent is
  const getGameQuery = `SELECT player1_id, player2_id, player_turn FROM multiplayer_games WHERE id = ?`;

  db.query(getGameQuery, [game_id], (err, gameResults) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (gameResults.length === 0) {
      return res.status(404).json({ error: 'Game not found' });
    }

    const game = gameResults[0];
    // Switch turn to the opponent (who will guess the word)
    const opponentId = game.player_turn === game.player1_id ? game.player2_id : game.player1_id;

    const updateQuery = `
      UPDATE multiplayer_games
      SET word = ?, player_turn = ?, last_turn_time = NOW()
      WHERE id = ?
    `;

    db.query(updateQuery, [word, opponentId, game_id], (err, result) => {
      if (err) {
        console.error('Failed to update game word:', err);
        return res.status(500).json({ error: err.message });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Game not found' });
      }

      // Return the updated game
      const selectQuery = `
        SELECT mpg.id AS game_id, 'multiplayer' AS game_type, player1_id, player2_id,
               u1.username AS player1_username, u2.username AS player2_username, player_turn,
               current_turn_num, word, player1_score, player2_score, status, completed_at,
               mpg.last_turn_time
        FROM multiplayer_games mpg
        LEFT JOIN users u1 ON mpg.player1_id = u1.id
        LEFT JOIN users u2 ON mpg.player2_id = u2.id
        WHERE mpg.id = ?
      `;

      db.query(selectQuery, [game_id], (err, results) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        return res.json({ game: results[0] });
      });
    });
  });
};

// Complete current turn - player who finished will now pick a word for opponent
// Also calculates and updates the player's score based on word difficulty and attempts
const completeTurn = (req, res) => {
  const { game_id, player_id, attempts_used, won } = req.body;
  
  // First, get the current game to find the word and determine which player scored
  const getGameQuery = `
    SELECT player1_id, player2_id, word
    FROM multiplayer_games
    WHERE id = ?
  `;

  db.query(getGameQuery, [game_id], (err, gameResults) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (gameResults.length === 0) {
      return res.status(404).json({ error: 'Game not found' });
    }

    const game = gameResults[0];
    const isPlayer1 = player_id === game.player1_id;

    // If the player won, calculate their score based on word difficulty and attempts
    if (won && attempts_used > 0) {
      // Get the word's base score from the words table
      const getWordScoreQuery = `SELECT score FROM words WHERE word = ?`;

      db.query(getWordScoreQuery, [game.word], (err, wordResults) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        // Default to 5.0 if word not found (shouldn't happen)
        const wordBaseScore = wordResults.length > 0 ? parseFloat(wordResults[0].score) : 5.0;
        const pointsEarned = calculateFinalScore(wordBaseScore, attempts_used);

        // Update the game: increment score, clear word, increment turn, switch player_turn
        const scoreColumn = isPlayer1 ? 'player1_score' : 'player2_score';
        const updateQuery = `
          UPDATE multiplayer_games
          SET player_turn = ?,
              word = NULL,
              current_turn_num = current_turn_num + 1,
              ${scoreColumn} = ${scoreColumn} + ?,
              last_turn_time = NOW()
          WHERE id = ?
        `;

        db.query(updateQuery, [player_id, pointsEarned, game_id], (err) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          returnUpdatedGame(game_id, pointsEarned, res);
        });
      });
    } else {
      // Player lost (didn't guess the word) - no points, just advance the turn
      const updateQuery = `
        UPDATE multiplayer_games
        SET player_turn = ?,
            word = NULL,
            current_turn_num = current_turn_num + 1,
            last_turn_time = NOW()
        WHERE id = ?
      `;

      db.query(updateQuery, [player_id, game_id], (err) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        returnUpdatedGame(game_id, 0, res);
      });
    }
  });
};

// Helper function to return the updated game after completeTurn
function returnUpdatedGame(game_id, pointsEarned, res) {
  // Delete attempts for this game (turn is complete, no longer needed)
  const deleteAttemptsQuery = `DELETE FROM multiplayer_game_attempts WHERE game_id = ?`;

  db.query(deleteAttemptsQuery, [game_id], (err) => {
    if (err) {
      console.error('Failed to delete attempts:', err);
      // Continue anyway - not critical
    }

    const selectQuery = `
      SELECT mpg.id AS game_id, 'multiplayer' AS game_type, player1_id, player2_id,
             u1.username AS player1_username, u2.username AS player2_username, player_turn,
             current_turn_num, word, player1_score, player2_score, status, completed_at,
             mpg.last_turn_time
      FROM multiplayer_games mpg
      LEFT JOIN users u1 ON mpg.player1_id = u1.id
      LEFT JOIN users u2 ON mpg.player2_id = u2.id
      WHERE mpg.id = ?
    `;

    db.query(selectQuery, [game_id], (err, results) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      return res.json({ game: results[0], turnCompleted: true, pointsEarned });
    });
  });
}

// Check game status for polling (lightweight - just returns player_turn and word status)
const checkGameStatus = (req, res) => {
  const { game_id } = req.query;

  const query = `SELECT player_turn, word FROM multiplayer_games WHERE id = ?`;

  db.query(query, [game_id], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'Game not found' });
    }

    return res.json({
      player_turn: results[0].player_turn,
      has_word: results[0].word !== null
    });
  });
};

// Complete a single player game (mark as completed)
const completeSinglePlayerGame = (req, res) => {
  const { game_id, won } = req.body;

  const updateQuery = `
    UPDATE single_player_games
    SET status = 'completed',
        completed_at = NOW()
    WHERE id = ?
  `;

  db.query(updateQuery, [game_id], (err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    return res.json({ success: true, won: won });
  });
};

module.exports = {getSolution, checkWord, retrieveMultiPlayerGame, retrieveSinglePlayerGame, chooseWord, getUsers, addAttempt, updateGameWord, completeTurn, checkGameStatus, completeSinglePlayerGame}