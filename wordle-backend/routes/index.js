const express = require('express')
const router = express.Router()
const = {register, login, start, submit} = require('../controllers/index.js')

router.post('/register', register) 
router.post('/login', login)
router.post('/game/start', start)
router.post('/game/submit', submit)
