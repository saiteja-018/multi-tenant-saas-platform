const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/authorize');

// Create user (admin, tenant_admin and super admin)
router.post('/', authenticate, authorize('super_admin', 'admin', 'tenant_admin'), userController.createUser);

// Get users (tenant_admin, admin, and super admin)
router.get('/', authenticate, authorize('super_admin', 'admin', 'tenant_admin', 'user'), userController.getUsers);

// Get user by ID
router.get('/:id', authenticate, userController.getUserById);

// Update user
router.put('/:id', authenticate, userController.updateUser);

// Delete user (admins only)
router.delete('/:id', authenticate, authorize('super_admin', 'admin'), userController.deleteUser);

module.exports = router;
