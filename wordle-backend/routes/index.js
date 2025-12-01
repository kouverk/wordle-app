const express = require('express')
const router = express.Router()
//Auth handlers
const {signup, getAvatars, assignAvatar, login, requestPasswordReset, resetPassword} = require('../controllers/auth.js')
//Game handlers
const {getSolution, checkWord, retrieveMultiPlayerGame, retrieveSinglePlayerGame, chooseWord, getUsers, addAttempt, updateGameWord, completeTurn, checkGameStatus, completeSinglePlayerGame, getCurrentGame} = require('../controllers/game.js')

//Auth routes
router.post('/signup', signup) 
router.get('/get-avatars', getAvatars)
router.post('/assign-avatar', assignAvatar)
router.post('/login', login)
router.post('/request-password-reset', requestPasswordReset)
router.post('/reset-password', resetPassword)

//Game routes
router.get('/get-solution', getSolution)
router.get('/check-word/:word', checkWord)
router.get('/retrieve-multiplayer-game', retrieveMultiPlayerGame)
router.get('/retrieve-singleplayer-game', retrieveSinglePlayerGame)
router.get('/get-users', getUsers)
router.get('/choose-word', chooseWord)
router.post('/add-attempt', addAttempt)
router.post('/update-game-word', updateGameWord)
router.post('/complete-turn', completeTurn)
router.get('/check-game-status', checkGameStatus)
router.post('/complete-singleplayer-game', completeSinglePlayerGame)
router.get('/get-current-game', getCurrentGame)
module.exports = router;