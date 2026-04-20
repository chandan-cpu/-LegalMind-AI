const express = require('express');
const router = express.Router();
const { registerUser, loginUser } = require('../controllers/authController');

// Jab koi frontend se HTTP request bhejega in URLs pe, toh hum controller ko call karenge
router.post('/register', registerUser);
router.post('/login', loginUser);

module.exports = router;
