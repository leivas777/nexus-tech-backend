const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const {authenticate} = require('../middlewares/authMiddleware');
const {loginLimiter, registerLimiter} = require('../middlewares/rateLimiter');

//Rotas públicas
router.post('/register', registerLimiter, authController.register);
router.post('/login', loginLimiter, authController.login);

//Rotas protegidas
router.get('/profile', authenticate, authController.getProfile);

module.exports = router;