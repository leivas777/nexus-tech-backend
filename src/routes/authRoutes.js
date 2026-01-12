// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const customerController = require('../controllers/customerController');
const { authenticate } = require('../middlewares/authMiddleware');
const { loginLimiter, registerLimiter } = require('../middlewares/rateLimiter');

// ✅ Rotas públicas
router.post('/register', registerLimiter, authController.register);
router.post('/login', loginLimiter, authController.login);

// ✅ Rotas protegidas
router.get('/profile', authenticate, authController.getProfile);

// ✅ Rotas de segmentos (pública)
router.get('/business-segments', customerController.getBusinessSegments);

// ✅ Rotas de customer (protegidas - apenas para usuário autenticado)
router.post('/customers', authenticate, customerController.createCustomer);
router.get('/customers', authenticate, customerController.getCustomer); // ✅ Singular - busca do usuário
router.put('/customers/:id', authenticate, customerController.updateCustomer);
router.delete('/customers/:id', authenticate, customerController.deleteCustomer);

module.exports = router;