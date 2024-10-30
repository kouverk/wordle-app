const express = require('express')
const router = express.Router()
//Auth handlers
const {signup, getAvatars, assignAvatar, login} = require('../controllers/auth.js')
//Game handlers
const {getSolution, checkWord, retrieveMultiPlayerGame, retrieveSinglePlayerGame, getUsers, chooseWord, start, submit} = require('../controllers/game.js')

//Auth routes
router.post('/signup', signup) 
router.get('/get-avatars', getAvatars)
router.post('/assign-avatar', assignAvatar)
router.post('/login', login)

//Game routes
router.get('/get-solution', getSolution)
router.get('/check-word/:word', checkWord)
router.get('/retrieve-multiplayer-game', retrieveMultiPlayerGame)
router.get('/retrieve-singleplayer-game', retrieveSinglePlayerGame)
router.get('/get-users', getUsers)
router.get('/choose-word', chooseWord)
router.post('/game/start', start)
router.post('/game/submit', submit)
module.exports = router;