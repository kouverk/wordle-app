const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const express = require('express');
const app = express();
const db = require('../db'); // MySQL connection
app.use(express.json()); 

const register = async (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    db.query('INSERT INTO users (username, password) VALUES (?, ?)', 
        [username, hashedPassword], 
        (err, result) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({ message: 'User registered successfully' });
        }
    );
};

const login = async (req, res) => {
    const { username, password } = req.body;
    
    db.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
        if (err || results.length === 0) {
            return res.status(400).json({ error: 'User not found' });
        }

        const user = results[0];
        const isPasswordValid = await bcrypt.compare(password, user.password);
        
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid password' });
        }

        // Generate JWT
        const token = jwt.sign({ id: user.id }, 'your_jwt_secret', { expiresIn: '1h' });
        res.json({ token });
    });
}

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



module.exports = {register, login, start, submit}; 