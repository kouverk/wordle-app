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
            const token = jwt.sign({ id: user_id }, 'your_jwt_secret', { expiresIn: '1h' });
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
            return res.status(500).json({ err: 'Get Avatar query failed' });
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

//Login 
const login = async (req, res) => {
    const { username, password } = req.body;

    const query = `
        SELECT u.id AS user_id, u.username, u.password, u.avatar_num, a.url AS avatar_url, g.* 
        FROM users u 
        LEFT JOIN avatars a ON u.avatar_num = a.id 
        LEFT JOIN (
            SELECT * FROM (
                SELECT mpg.id AS game_id, 'multiplayer' AS game_type, player1_id, player2_id, 
                       u1.username AS player1_username, u2.username AS player2_username, player_turn, 
                       current_turn_num, word, player1_score, player2_score, status, completed_at, 
                       mpg.last_turn_time 
                FROM multiplayer_games mpg 
                LEFT JOIN users u1 ON mpg.player1_id = u1.id 
                LEFT JOIN users u2 ON mpg.player2_id = u2.id 
                WHERE u1.username = ? OR u2.username = ?

                UNION ALL

                SELECT spg.id AS game_id, 'singleplayer' AS game_type, player_id AS player1_id, 
                       NULL AS player2_id, u.username AS player1_username, NULL AS player2_username, 
                       NULL AS player_turn, current_turn_num, word, NULL AS player1_score, 
                       NULL AS player2_score, status, completed_at, spg.last_turn_time 
                FROM single_player_games spg 
                LEFT JOIN users u ON spg.player_id = u.id 
                WHERE u.username = ?
            ) AS games 
            ORDER BY last_turn_time DESC, completed_at DESC 
            LIMIT 1
        ) AS g ON u.username = ? 
        WHERE u.username = ?;
    `;

    const params = Array(5).fill(username); // Create an array with 5 elements, all set to username

    db.query(query, params, async (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        const userData = results[0]; // User data including most recent game data

        // Handle the case when no user data is found
        if (!userData) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Check if the password is valid
        const isPasswordValid = await bcrypt.compare(password, userData.password);
        
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid password' });
        }
        
        // Generate JWT token with user ID and avatar_num
        const token = jwt.sign({ id: userData.user_id, avatar_num: userData.avatar_num }, 'your_jwt_secret', { expiresIn: '1h' });
        
        // Prepare the most recent game data, default to empty object if all fields are empty
        const mostRecentGame = {
            id: userData.game_id || null,
            game_type: userData.game_type || null,
            player1_id: userData.player1_id || null,
            player2_id: userData.player2_id || null,
            player1_username: userData.player1_username || null,
            player2_username: userData.player2_username || null,
            player_turn: userData.player_turn || null,
            current_turn_num: userData.current_turn_num || null,
            word: userData.word || null,
            player1_score: userData.player1_score || null,
            player2_score: userData.player2_score || null,
            status: userData.status || null,
            completed_at: userData.completed_at || null
        };

        // Set mostRecentGame to an empty object if all fields are empty or null
        const isEmptyGame = Object.values(mostRecentGame).every(value => value === null || value === '');
        
        // Return an array with 3 objects: token, user info, and most recent game
        res.json([
            { token },
            { 
                id: userData.user_id,
                username: userData.username,
                avatar_num: userData.avatar_num,
                avatar_url: userData.avatar_url
            },
            isEmptyGame ? null : mostRecentGame // Directly assign mostRecentGame or empty object
        ]);
    });
};


module.exports = {signup, getAvatars, assignAvatar, login};