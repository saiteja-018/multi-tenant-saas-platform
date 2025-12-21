const tenantModel = require('../models/tenantModel');
const { logAudit } = require('../utils/logger');

// Get all tenants (Super Admin only)
const getAllTenants = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, subscriptionPlan } = req.query;

    const result = await tenantModel.listTenants({
      page: parseInt(page),
      limit: parseInt(limit),
      status,
      subscriptionPlan
    });

    res.json({
      success: true,
      data: result.tenants,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
};

// Get tenant by ID
const getTenantById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Super admin can view any tenant, others can only view their own
    if (req.user.role !== 'super_admin' && req.user.tenantId !== id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const tenant = await tenantModel.findTenantById(id);

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    // Get tenant stats
    const stats = await tenantModel.getTenantStats(id);

    res.json({
      success: true,
      data: {
        ...tenant,
        stats
      }
    });
  } catch (error) {
    next(error);
  }
};

// Update tenant
const updateTenant = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Super admin can update any tenant, admins can only update their own
    if (req.user.role !== 'super_admin' && req.user.tenantId !== id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Only super admin can change subscription plan and max limits
    if (req.user.role !== 'super_admin') {
      delete updates.subscription_plan;
      delete updates.max_users;
      delete updates.max_projects;
      delete updates.status;
    }

    const tenant = await tenantModel.updateTenant(id, updates);

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    // Log audit
    await logAudit({
      tenantId: id,
      userId: req.user.userId,
      action: 'TENANT_UPDATE',
      entityType: 'tenant',
      entityId: id,
      ipAddress: req.ip,
      metadata: { updates }
    });

    res.json({
      success: true,
      message: 'Tenant updated successfully',
      data: tenant
    });
  } catch (error) {
    next(error);
  }
};

// Get current tenant info (for logged-in admin/user)
const getCurrentTenant = async (req, res, next) => {
  try {
    if (!req.user.tenantId) {
      return res.status(400).json({
        success: false,
        message: 'No tenant associated with this user'
      });
    }

    const tenant = await tenantModel.findTenantById(req.user.tenantId);

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    const stats = await tenantModel.getTenantStats(req.user.tenantId);

    res.json({
      success: true,
      data: {
        ...tenant,
        stats
      }
    });
  } catch (error) {
    next(error);
  }
};

// Create tenant (Super Admin only)
const createTenant = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Tenant name is required'
      });
    }

    // Generate subdomain from name (simple version)
    const subdomain = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    // Check if subdomain already exists
    const existingTenant = await tenantModel.findTenantBySubdomain(subdomain);
    if (existingTenant) {
      return res.status(409).json({
        success: false,
        message: 'Subdomain already exists. Please use a different tenant name.'
      });
    }

    // Create tenant with default free plan
    const tenant = await tenantModel.createTenant({
      name: name.trim(),
      subdomain,
      description: description || null,
      subscription_plan: 'free',
      status: 'active'
    });

    // Log audit
    await logAudit({
      tenantId: tenant.id,
      userId: req.user.userId,
      action: 'TENANT_CREATE',
      entityType: 'tenant',
      entityId: tenant.id,
      ipAddress: req.ip,
      metadata: { name, subdomain }
    });

    res.status(201).json({
      success: true,
      message: 'Tenant created successfully',
      data: tenant
    });
  } catch (error) {
    next(error);
  }
};

// Delete tenant (Super Admin only)
const deleteTenant = async (req, res, next) => {
  try {
    const { id } = req.params;

    const tenant = await tenantModel.findTenantById(id);
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    // Delete tenant (will cascade delete users, projects, tasks)
    await tenantModel.deleteTenant(id);

    // Log audit
    await logAudit({
      tenantId: id,
      userId: req.user.userId,
      action: 'TENANT_DELETE',
      entityType: 'tenant',
      entityId: id,
      ipAddress: req.ip,
      metadata: { tenantName: tenant.name }
    });

    res.json({
      success: true,
      message: 'Tenant deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllTenants,
  getTenantById,
  updateTenant,
  getCurrentTenant,
  createTenant,
  deleteTenant
};
