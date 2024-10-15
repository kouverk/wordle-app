const express = require('express')
const router = express.Router()
//Auth handlers
const {signup, login, start, submit} = require('../controllers/auth.js')
//Game handlers
const {getSolution, checkWord, getAvatars} = require('../controllers/game.js')

//Auth routes
router.post('/signup', signup) 
router.post('/login', login)
router.post('/game/start', start)
router.post('/game/submit', submit)
//Game routes
router.get('/get-solution', getSolution)
router.get('/check-word/:word', checkWord)
router.get('/get-avatars', getAvatars)

module.exports = router;