require('dotenv').config();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const express = require('express');
const app = express();
const db = require('../db'); // MySQL connection
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET; 

const signup = async (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    db.query('INSERT INTO users (username, password) VALUES (?, ?)', 
        [username, hashedPassword], 
        (err, result) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            const user_id = result.insertId;
            const token = jwt.sign({ id: user_id }, JWT_SECRET, { expiresIn: '7d' });
            // Return the token and userId
            res.json({ message: 'User registered successfully', token: token, user_id: user_id });
        }
    );
};

const getAvatars = (req, res) => {
    const word = req.params.word; 
    
    // Database query to check if the word exists
    db.query('SELECT * FROM avatars', (err, results) => {
        if (err) {
            console.error('Get Avatar query failed:', err);  // Log the error
            return res.status(500).json({ err: err.message });
        }        
        return res.json(results);
    });
  };
  
// Assign an avatar upon selection. Note: this as the same return object as login, because they both complete the login process, and fire uponLogin
const assignAvatar = (req, res) => {
    const { user_id, avatar_num } = req.body;
    const updateQuery = `UPDATE users SET avatar_num = ? WHERE id = ?`;
    db.query(updateQuery, [avatar_num, user_id], (err, updateResults) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
  
      const getUserQuery = `
        SELECT users.id, users.username, users.avatar_num, avatars.url AS avatar_url 
        FROM users
        LEFT JOIN avatars ON users.avatar_num = avatars.id
        WHERE users.id = ?`;
  
      db.query(getUserQuery, [user_id], (err, selectResults) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
  
        if (selectResults.length > 0) {
          const user = selectResults[0];
          res.json({
            user_id: user.id,
            username: user.username,
            avatar_num: user.avatar_num,
            avatar_url: user.avatar_url
          });
        } else {
          res.status(404).json({ error: 'User not found' });
        }
      });
    });
  };
  

//Login, returns a most recent game state upon login 
const login = async (req, res) => {
    const { username, password } = req.body;

    // Step 1: Retrieve user data and determine game type (only in_progress games)
    const userQuery = `
        SELECT u.id AS user_id, u.username, u.password, u.avatar_num, a.url AS avatar_url,
               g.game_id, g.game_type
        FROM users u
        LEFT JOIN avatars a ON u.avatar_num = a.id
        LEFT JOIN (
            SELECT mpg.id AS game_id, 'multiplayer' AS game_type, mpg.last_turn_time AS last_turn_time
            FROM multiplayer_games mpg
            LEFT JOIN users u1 ON mpg.player1_id = u1.id
            LEFT JOIN users u2 ON mpg.player2_id = u2.id
            WHERE (u1.username = ? OR u2.username = ?) AND mpg.status = 'in_progress'

            UNION ALL

            SELECT spg.id AS game_id, 'singleplayer' AS game_type, spg.last_turn_time AS last_turn_time
            FROM single_player_games spg
            LEFT JOIN users u ON spg.player_id = u.id
            WHERE u.username = ? AND spg.status = 'in_progress'
            ORDER BY last_turn_time DESC
            LIMIT 1
        ) AS g ON u.username = ?
        WHERE u.username = ?;
    `;

    const params = Array(5).fill(username);

    db.query(userQuery, params, async (err, userResults) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: err.message });
        }

        const userData = userResults[0];
        if (!userData) return res.status(404).json({ error: 'User not found' });

        const isPasswordValid = await bcrypt.compare(password, userData.password);
        if (!isPasswordValid) return res.status(401).json({ error: 'Invalid password' });

        // Step 2: Query specific game data based on game_type
        let gameQuery, gameParams;
        if (userData.game_type === 'multiplayer') {
            gameQuery = `
                SELECT mpg.id AS game_id, 'multiplayer' AS game_type, player1_id, player2_id,
                       u1.username AS player1_username, u2.username AS player2_username, player_turn,
                       current_turn_num, word, player1_score, player2_score, status, completed_at
                FROM multiplayer_games mpg
                LEFT JOIN users u1 ON mpg.player1_id = u1.id
                LEFT JOIN users u2 ON mpg.player2_id = u2.id
                WHERE mpg.id = ?;
            `;
            gameParams = [userData.game_id];
        } else {
            gameQuery = `
                SELECT spg.id AS game_id, 'singleplayer' AS game_type, player_id AS player1_id,
                       u.username AS player1_username, current_turn_num, word, status, completed_at
                FROM single_player_games spg
                LEFT JOIN users u ON spg.player_id = u.id
                WHERE spg.id = ?;
            `;
            gameParams = [userData.game_id];
        }

        db.query(gameQuery, gameParams, (err, gameResults) => {
            if (err) return res.status(500).json({ error: err.message });
            const mostRecentGame = gameResults[0] || null;

            // If no game or multiplayer game with no word set, don't fetch attempts
            // (attempts from previous turns shouldn't be returned)
            if (!mostRecentGame || (userData.game_type === 'multiplayer' && !mostRecentGame.word)) {
                const response = {
                    token: jwt.sign({ id: userData.user_id, avatar_num: userData.avatar_num }, JWT_SECRET, { expiresIn: '7d' }),
                    user: {
                        user_id: userData.user_id,
                        username: userData.username,
                        avatar_num: userData.avatar_num,
                        avatar_url: userData.avatar_url
                    },
                    game: mostRecentGame,
                    attempts: null
                };
                return res.json(response);
            }

            // Step 3: Query attempt data based on game_id
            let attemptsQuery;
            if (userData.game_type === 'multiplayer') {
                attemptsQuery = `
                    SELECT * FROM multiplayer_game_attempts
                    WHERE game_id = ?
                    ORDER BY attempt_num ASC;
                `;
            } else {
                attemptsQuery = `
                    SELECT * FROM single_player_game_attempts
                    WHERE game_id = ?
                    ORDER BY attempt_num ASC;
                `;
            }

            db.query(attemptsQuery, [userData.game_id], (err, attempts) => {
                if (err) return res.status(500).json({ error: err.message });

                const response = {
                    token: jwt.sign({ id: userData.user_id, avatar_num: userData.avatar_num }, JWT_SECRET, { expiresIn: '7d' }),
                    user: {
                        user_id: userData.user_id,
                        username: userData.username,
                        avatar_num: userData.avatar_num,
                        avatar_url: userData.avatar_url
                    },
                    game: mostRecentGame,
                    attempts
                };

                res.json(response);
            });
        });
    });
};




// Request password reset - generates a token for the user
const requestPasswordReset = (req, res) => {
    const { username } = req.body;

    if (!username) {
        return res.status(400).json({ error: 'Username is required' });
    }

    // Check if user exists
    db.query('SELECT id FROM users WHERE username = ?', [username], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const userId = results[0].id;

        // Generate a random reset token
        const resetToken = crypto.randomBytes(32).toString('hex');

        // Token expires in 1 hour
        const expiry = new Date(Date.now() + 3600000);

        // Store the token in the database
        db.query(
            'UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE id = ?',
            [resetToken, expiry, userId],
            (err) => {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }

                // In a production app, you'd send this token via email
                // For now, we return it directly (dev mode)
                res.json({
                    message: 'Password reset token generated',
                    reset_token: resetToken,
                    expires_at: expiry
                });
            }
        );
    });
};

// Reset password using the token
const resetPassword = async (req, res) => {
    const { reset_token, new_password } = req.body;

    if (!reset_token || !new_password) {
        return res.status(400).json({ error: 'Reset token and new password are required' });
    }

    if (new_password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Find user with this token and check expiry
    db.query(
        'SELECT id, username FROM users WHERE reset_token = ? AND reset_token_expiry > NOW()',
        [reset_token],
        async (err, results) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            if (results.length === 0) {
                return res.status(400).json({ error: 'Invalid or expired reset token' });
            }

            const user = results[0];

            // Hash the new password
            const hashedPassword = await bcrypt.hash(new_password, 10);

            // Update password and clear the reset token
            db.query(
                'UPDATE users SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?',
                [hashedPassword, user.id],
                (err) => {
                    if (err) {
                        return res.status(500).json({ error: err.message });
                    }

                    res.json({
                        message: 'Password reset successful',
                        username: user.username
                    });
                }
            );
        }
    );
};

module.exports = {signup, getAvatars, assignAvatar, login, requestPasswordReset, resetPassword};