const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const express = require('express');
const app = express();
const db = require('../db'); // MySQL connection
app.use(express.json()); 

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
            const token = jwt.sign({ id: user_id }, 'your_jwt_secret', { expiresIn: '7d' });
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
  const { user_id, avatar_num } = req.body
  const query = `UPDATE users SET avatar_num = ? WHERE id = ?;
                 SELECT users.id, users.username, users.password, users.avatar_num, avatars.url as avatar_url 
                 FROM users
                 LEFT JOIN avatars ON users.avatar_num = avatars.id
                 WHERE users.id = ?`

  db.query(query, [avatar_num, user_id, user_id], 
      (err, results) => {
          if (err){ return res.status(500).json({ error: err.message }); }
          const user = results[0]
          res.json({
            user_id: user.id,
            username: user.username,
            avatar_num: user.avatar_num,
            avatar_url: user.avatar_url
        });
      });
}

//Login, returns a most recent game state upon login 
const login = async (req, res) => {
    const { username, password } = req.body;

    // Step 1: Retrieve user data and determine game type
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
            WHERE u1.username = ? OR u2.username = ?

            UNION ALL

            SELECT spg.id AS game_id, 'singleplayer' AS game_type, spg.last_turn_time AS last_turn_time
            FROM single_player_games spg 
            LEFT JOIN users u ON spg.player_id = u.id 
            WHERE u.username = ?
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
                SELECT id, 'multiplayer' AS game_type, player1_id, player2_id, player_turn, 
                       current_turn_num, word, player1_score, player2_score, status, completed_at 
                FROM multiplayer_games 
                WHERE id = ?;
            `;
            gameParams = [userData.game_id];
        } else {
            gameQuery = `
                SELECT id, 'singleplayer' AS game_type, player_id AS player1_id, 
                       current_turn_num, word, status, completed_at 
                FROM single_player_games 
                WHERE id = ?;
            `;
            gameParams = [userData.game_id];
        }

        db.query(gameQuery, gameParams, (err, gameResults) => {
            if (err) return res.status(500).json({ error: err.message });
            const mostRecentGame = gameResults[0] || null;

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

                // Construct response with user data, game data, and attempt data separately
                const response = {
                    token: jwt.sign({ id: userData.user_id, avatar_num: userData.avatar_num }, 'your_jwt_secret', { expiresIn: '7d' }),
                    user: {
                        user_id: userData.user_id,
                        username: userData.username,
                        avatar_num: userData.avatar_num,
                        avatar_url: userData.avatar_url
                    },
                    game: mostRecentGame, // Return the most recent game object
                    attempts // Return attempts separately
                };

                // If no recent game found, return game as null
                if (!mostRecentGame) {
                    response.game = null;
                    response.attempts = null; 
                }

                res.json(response);
            });
        });
    });
};




module.exports = {signup, getAvatars, assignAvatar, login};