const express = require('express');
const router = express.Router();
const tenantController = require('../controllers/tenantController');
const userController = require('../controllers/userController');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/authorize');

// Super admin only - create tenant
router.post('/', authenticate, authorize('super_admin'), tenantController.createTenant);

// Super admin only - get all tenants
router.get('/', authenticate, authorize('super_admin'), tenantController.getAllTenants);

// Get current user's tenant
router.get('/current', authenticate, tenantController.getCurrentTenant);

// Get tenant by ID (super admin or tenant admin)
router.get('/:id', authenticate, tenantController.getTenantById);

// Tenant users (spec-compliant)
router.post('/:tenantId/users', authenticate, authorize('super_admin', 'tenant_admin'), (req, res, next) => {
	if (req.user.role !== 'super_admin' && req.user.tenantId !== req.params.tenantId) {
		return res.status(403).json({ success: false, message: 'Access denied' });
	}
	req.body.tenantId = req.params.tenantId;
	return userController.createUser(req, res, next);
});

router.get('/:tenantId/users', authenticate, authorize('super_admin', 'tenant_admin', 'user'), (req, res, next) => {
	if (req.user.role !== 'super_admin' && req.user.tenantId !== req.params.tenantId) {
		return res.status(403).json({ success: false, message: 'Access denied' });
	}
	req.query.tenantId = req.params.tenantId;
	return userController.getUsers(req, res, next);
});

// Update tenant
router.put('/:id', authenticate, authorize('super_admin', 'tenant_admin'), tenantController.updateTenant);

// Super admin only - delete tenant
router.delete('/:id', authenticate, authorize('super_admin'), tenantController.deleteTenant);

module.exports = router;
