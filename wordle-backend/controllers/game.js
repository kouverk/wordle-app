const express = require('express');
const app = express();
const db = require('../db'); // MySQL connection
const { calculateFinalScore } = require('../utils/scoring');
app.use(express.json()); 

// Route to get a solution word (requires player_id for single player filtering)
const getSolution = (req, res) => {
    const { player_id } = req.query;

    // For single player: frequency >= 20 AND not played in last 365 days
    const query = `
      SELECT word FROM words
      WHERE frequency >= 20
      AND word NOT IN (
        SELECT word FROM single_player_games
        WHERE player_id = ?
        AND completed_at > DATE_SUB(NOW(), INTERVAL 365 DAY)
      )
      ORDER BY RAND()
      LIMIT 1
    `;

    db.query(query, [player_id], (error, results) => {
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

//load multiplayer game (each row = one turn between two players)
const retrieveMultiPlayerGame = (req, res) => {
  const { player1_id, player2_id } = req.query;

  // Step 1: Try to retrieve an existing in_progress turn for this pair
  const selectQuery = `
    SELECT mpg.id AS game_id, 'multiplayer' AS game_type, player1_id, player2_id,
           u1.username AS player1_username, u2.username AS player2_username, player_turn,
           current_turn_num, word, player1_score, player2_score, status, completed_at,
           mpg.last_turn_time
    FROM multiplayer_games mpg
    LEFT JOIN users u1 ON mpg.player1_id = u1.id
    LEFT JOIN users u2 ON mpg.player2_id = u2.id
    WHERE ((mpg.player1_id = ? AND mpg.player2_id = ?) OR (mpg.player1_id = ? AND mpg.player2_id = ?))
      AND mpg.status = 'in_progress'
    ORDER BY mpg.id DESC
    LIMIT 1
  `;

  db.query(selectQuery, [player1_id, player2_id, player2_id, player1_id], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (results.length > 0) {
      const game = results[0];

      // If word is null, the current turn hasn't started yet (player needs to choose a word)
      if (!game.word) {
        return res.json({
          game: game,
          attempts: null,
          newGame: false
        });
      }

      // Step 2: Retrieve attempts for this turn
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
          attempts: attemptsResults.length > 0 ? attemptsResults : null,
          newGame: false
        });
      });
    } else {
      // No in_progress turn - create a new one
      // First, get the previous turn's scores and turn number for this pair
      const getPreviousQuery = `
        SELECT player1_id, player2_id, player1_score, player2_score, current_turn_num
        FROM multiplayer_games
        WHERE ((player1_id = ? AND player2_id = ?) OR (player1_id = ? AND player2_id = ?))
          AND status = 'completed'
        ORDER BY id DESC
        LIMIT 1
      `;

      db.query(getPreviousQuery, [player1_id, player2_id, player2_id, player1_id], (err, prevResults) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        // Determine scores and turn number to carry forward
        let prevPlayer1Score = 0;
        let prevPlayer2Score = 0;
        let nextTurnNum = 0;

        // Also need to maintain consistent player1/player2 ordering
        let consistentPlayer1Id = parseInt(player1_id);
        let consistentPlayer2Id = parseInt(player2_id);

        if (prevResults.length > 0) {
          const prev = prevResults[0];
          // Use the same player ordering as previous turns
          consistentPlayer1Id = prev.player1_id;
          consistentPlayer2Id = prev.player2_id;
          prevPlayer1Score = prev.player1_score;
          prevPlayer2Score = prev.player2_score;
          nextTurnNum = prev.current_turn_num + 1;
        }

        // The challenger (player1_id from request) picks the word first
        const insertQuery = `
          INSERT INTO multiplayer_games (player1_id, player2_id, word, current_turn_num, player_turn,
                                         player1_score, player2_score, status, last_turn_time)
          VALUES (?, ?, NULL, ?, ?, ?, ?, 'in_progress', NULL)
        `;

        db.query(insertQuery, [consistentPlayer1Id, consistentPlayer2Id, nextTurnNum, player1_id, prevPlayer1Score, prevPlayer2Score], (err, insertResult) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }

          // Retrieve the newly created turn record
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
      // Step 3: Select a random word (frequency >= 20, not played in last 365 days)
      const wordQuery = `
        SELECT word FROM words
        WHERE frequency >= 20
        AND word NOT IN (
          SELECT word FROM single_player_games
          WHERE player_id = ?
          AND completed_at > DATE_SUB(NOW(), INTERVAL 365 DAY)
        )
        ORDER BY RAND()
        LIMIT 1
      `;

      db.query(wordQuery, [player_id], (err, wordResults) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        if (!wordResults || wordResults.length === 0) {
          return res.status(500).json({ error: 'No words available for new game' });
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
  const { player1_id, player2_id } = req.query;

  // Multiplayer: frequency >= 20, exclude words this pair has played in last 365 days
  const query = `
    SELECT word FROM words
    WHERE frequency >= 20
    AND word NOT IN (
      SELECT word FROM multiplayer_games
      WHERE ((player1_id = ? AND player2_id = ?) OR (player1_id = ? AND player2_id = ?))
        AND word IS NOT NULL
        AND completed_at > DATE_SUB(NOW(), INTERVAL 365 DAY)
    )
    ORDER BY RAND()
    LIMIT 12
  `;

  db.query(query, [player1_id, player2_id, player2_id, player1_id], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (results.length > 0) {
      res.json(results);
    } else {
      res.status(404).json({ error: 'Error in database. No words found' });
    }
  });
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

    // Update last_turn_time on the game table
    const gameTable = game_type === 'multiplayer' ? 'multiplayer_games' : 'single_player_games';
    const updateGameQuery = `UPDATE ?? SET last_turn_time = NOW() WHERE id = ?`;
    db.query(updateGameQuery, [gameTable, game_id], (err) => {
      if (err) {
        console.error('Database error updating last_turn_time:', err);
        // Don't fail the whole request, just log it
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

// Complete current turn - marks this turn as completed
// The player who finished will pick a word for opponent in a NEW turn (new row)
const completeTurn = (req, res) => {
  const { game_id, player_id, attempts_used, won } = req.body;

  // First, get the current game to find the word and determine which player scored
  const getGameQuery = `
    SELECT player1_id, player2_id, word, player1_score, player2_score
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

        // Mark this turn as completed, add points to the winner's score
        // Word stays in the row (for history), status becomes 'completed'
        const scoreColumn = isPlayer1 ? 'player1_score' : 'player2_score';
        const updateQuery = `
          UPDATE multiplayer_games
          SET status = 'completed',
              completed_at = NOW(),
              ${scoreColumn} = ${scoreColumn} + ?,
              last_turn_time = NOW()
          WHERE id = ?
        `;

        db.query(updateQuery, [pointsEarned, game_id], (err) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          returnUpdatedGame(game_id, player_id, pointsEarned, res);
        });
      });
    } else {
      // Player lost (didn't guess the word) - no points, just mark completed
      const updateQuery = `
        UPDATE multiplayer_games
        SET status = 'completed',
            completed_at = NOW(),
            last_turn_time = NOW()
        WHERE id = ?
      `;

      db.query(updateQuery, [game_id], (err) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        returnUpdatedGame(game_id, player_id, 0, res);
      });
    }
  });
};

// Helper function to create a new turn and return it after completeTurn
// Attempts stay with the completed turn (not deleted)
function returnUpdatedGame(completed_game_id, next_turn_player_id, pointsEarned, res) {
  // Get the completed turn's data to carry forward scores
  const getCompletedQuery = `
    SELECT player1_id, player2_id, player1_score, player2_score, current_turn_num
    FROM multiplayer_games
    WHERE id = ?
  `;

  db.query(getCompletedQuery, [completed_game_id], (err, completedResults) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    const completed = completedResults[0];

    // Create a new turn row for the player who just finished (they pick the next word)
    const insertQuery = `
      INSERT INTO multiplayer_games (player1_id, player2_id, word, current_turn_num, player_turn,
                                     player1_score, player2_score, status, last_turn_time)
      VALUES (?, ?, NULL, ?, ?, ?, ?, 'in_progress', NULL)
    `;

    const nextTurnNum = completed.current_turn_num + 1;

    db.query(insertQuery, [
      completed.player1_id,
      completed.player2_id,
      nextTurnNum,
      next_turn_player_id,
      completed.player1_score,
      completed.player2_score
    ], (err, insertResult) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      // Return the newly created turn
      const newGameId = insertResult.insertId;
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

      db.query(selectQuery, [newGameId], (err, results) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        return res.json({ game: results[0], turnCompleted: true, pointsEarned });
      });
    });
  });
}

// Check game status for polling (lightweight - just returns player_turn and word status)
// If the queried turn is completed, check for the latest in_progress turn for this pair
const checkGameStatus = (req, res) => {
  const { game_id } = req.query;

  const query = `SELECT player1_id, player2_id, player_turn, word, status FROM multiplayer_games WHERE id = ?`;

  db.query(query, [game_id], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'Game not found' });
    }

    const turn = results[0];

    // If this turn is completed, look for the latest in_progress turn for this pair
    if (turn.status === 'completed') {
      const latestQuery = `
        SELECT id AS game_id, player_turn, word, status
        FROM multiplayer_games
        WHERE ((player1_id = ? AND player2_id = ?) OR (player1_id = ? AND player2_id = ?))
          AND status = 'in_progress'
        ORDER BY id DESC
        LIMIT 1
      `;

      db.query(latestQuery, [turn.player1_id, turn.player2_id, turn.player2_id, turn.player1_id], (err, latestResults) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        if (latestResults.length > 0) {
          const latest = latestResults[0];
          return res.json({
            player_turn: latest.player_turn,
            has_word: latest.word !== null,
            game_id: latest.game_id, // Include new game_id so frontend can update
            turn_completed: true
          });
        } else {
          // No in_progress turn found (shouldn't happen normally)
          return res.json({
            player_turn: turn.player_turn,
            has_word: turn.word !== null,
            turn_completed: true
          });
        }
      });
    } else {
      // Turn is still in_progress
      return res.json({
        player_turn: turn.player_turn,
        has_word: turn.word !== null,
        turn_completed: false
      });
    }
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

// Get the current game state for a logged-in user (called on page refresh/app init)
// Returns the most recent in_progress game (multiplayer or singleplayer) with attempts
const getCurrentGame = (req, res) => {
  const { user_id } = req.query;

  if (!user_id) {
    return res.status(400).json({ error: 'user_id is required' });
  }

  // Find the most recent in_progress game for this user (same logic as login)
  // COALESCE handles NULL last_turn_time - games with NULL are treated as oldest
  const findGameQuery = `
    SELECT * FROM (
      SELECT mpg.id AS game_id, 'multiplayer' AS game_type, mpg.last_turn_time AS last_turn_time,
             mpg.player1_id, mpg.player2_id
      FROM multiplayer_games mpg
      WHERE (mpg.player1_id = ? OR mpg.player2_id = ?) AND mpg.status = 'in_progress'

      UNION ALL

      SELECT spg.id AS game_id, 'singleplayer' AS game_type, spg.last_turn_time AS last_turn_time,
             spg.player_id AS player1_id, NULL AS player2_id
      FROM single_player_games spg
      WHERE spg.player_id = ? AND spg.status = 'in_progress'
    ) AS combined_games
    ORDER BY COALESCE(last_turn_time, '1970-01-01') DESC
    LIMIT 1
  `;

  db.query(findGameQuery, [user_id, user_id, user_id], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (results.length === 0) {
      // No in_progress game found
      return res.json({ game: null, attempts: null });
    }

    const gameInfo = results[0];

    // Now fetch the full game details based on game_type
    if (gameInfo.game_type === 'multiplayer') {
      const gameQuery = `
        SELECT mpg.id AS game_id, 'multiplayer' AS game_type, player1_id, player2_id,
               u1.username AS player1_username, u2.username AS player2_username, player_turn,
               current_turn_num, word, player1_score, player2_score, status, completed_at
        FROM multiplayer_games mpg
        LEFT JOIN users u1 ON mpg.player1_id = u1.id
        LEFT JOIN users u2 ON mpg.player2_id = u2.id
        WHERE mpg.id = ?
      `;

      db.query(gameQuery, [gameInfo.game_id], (err, gameResults) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        const game = gameResults[0];

        // If no word set, don't return attempts (they're from previous turn)
        if (!game.word) {
          return res.json({ game: game, attempts: null });
        }

        // Fetch attempts for this game
        const attemptsQuery = `SELECT * FROM multiplayer_game_attempts WHERE game_id = ? ORDER BY attempt_num ASC`;
        db.query(attemptsQuery, [gameInfo.game_id], (err, attempts) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          return res.json({ game: game, attempts: attempts.length > 0 ? attempts : null });
        });
      });
    } else {
      // Single player
      const gameQuery = `
        SELECT spg.id AS game_id, 'singleplayer' AS game_type, player_id AS player1_id,
               u.username AS player1_username, current_turn_num, word, status, completed_at
        FROM single_player_games spg
        LEFT JOIN users u ON spg.player_id = u.id
        WHERE spg.id = ?
      `;

      db.query(gameQuery, [gameInfo.game_id], (err, gameResults) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        const game = gameResults[0];

        // Fetch attempts
        const attemptsQuery = `SELECT * FROM single_player_game_attempts WHERE game_id = ? ORDER BY attempt_num ASC`;
        db.query(attemptsQuery, [gameInfo.game_id], (err, attempts) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          return res.json({ game: game, attempts: attempts.length > 0 ? attempts : null });
        });
      });
    }
  });
};

module.exports = {getSolution, checkWord, retrieveMultiPlayerGame, retrieveSinglePlayerGame, chooseWord, getUsers, addAttempt, updateGameWord, completeTurn, checkGameStatus, completeSinglePlayerGame, getCurrentGame}