const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authenticate = require('../middleware/auth');

// Public routes
router.post('/register', authController.register);
// Alias to match spec naming
router.post('/register-tenant', authController.register);
router.post('/login', authController.login);

// Protected routes
router.get('/profile', authenticate, authController.getProfile);
// Alias to match spec naming
router.get('/me', authenticate, authController.getProfile);
// Stateless logout for JWT-only setup
router.post('/logout', authenticate, (req, res) => {
	res.json({ success: true, message: 'Logged out' });
});

module.exports = router;
