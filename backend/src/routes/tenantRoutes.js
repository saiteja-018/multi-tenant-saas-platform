const express = require('express');
const router = express.Router();
const tenantController = require('../controllers/tenantController');
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

// Update tenant
router.put('/:id', authenticate, authorize('super_admin', 'admin'), tenantController.updateTenant);

// Super admin only - delete tenant
router.delete('/:id', authenticate, authorize('super_admin'), tenantController.deleteTenant);

module.exports = router;
