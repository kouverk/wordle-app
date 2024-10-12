const express = require('express')
const router = express.Router()
//Auth handlers
const {register, login, start, submit} = require('../controllers/auth.js')
//Game handlers
const {getSolution, checkWord} = require('../controllers/game.js')

//Auth routes
router.post('/register', register) 
router.post('/login', login)
router.post('/game/start', start)
router.post('/game/submit', submit)
//Game routes
router.get('/get-solution', getSolution)
router.get('/check-word/:word', checkWord)

module.exports = router;