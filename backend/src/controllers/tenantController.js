const tenantModel = require('../models/tenantModel');
const { logAudit } = require('../utils/logger');

const normalizeTenant = (tenant) => ({
  id: tenant.id,
  name: tenant.name,
  subdomain: tenant.subdomain,
  status: tenant.status,
  subscriptionPlan: tenant.subscription_plan,
  maxUsers: tenant.max_users,
  maxProjects: tenant.max_projects,
  createdAt: tenant.created_at,
  updatedAt: tenant.updated_at
});

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
      data: {
        tenants: result.tenants.map((tenant) => ({
          ...normalizeTenant(tenant),
          totalUsers: parseInt(tenant.total_users || 0),
          totalProjects: parseInt(tenant.total_projects || 0)
        })),
        pagination: result.pagination
      }
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
        ...normalizeTenant(tenant),
        stats: {
          totalUsers: parseInt(stats.total_users || 0),
          totalProjects: parseInt(stats.total_projects || 0),
          totalTasks: parseInt(stats.total_tasks || 0)
        }
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
    const updates = { ...req.body };

    // Super admin can update any tenant, tenant_admins can only update their own
    if (req.user.role !== 'super_admin' && req.user.tenantId !== id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Only super admin can change subscription plan and max limits
    const restrictedFields = ['status', 'subscriptionPlan', 'maxUsers', 'maxProjects', 'subscription_plan', 'max_users', 'max_projects'];
    if (req.user.role !== 'super_admin') {
      const hasRestricted = restrictedFields.some((field) => updates[field] !== undefined);
      if (hasRestricted) {
        return res.status(403).json({
          success: false,
          message: 'Only super admins can update subscription or status fields'
        });
      }
    }

    if (updates.subscriptionPlan !== undefined) {
      updates.subscription_plan = updates.subscriptionPlan;
    }
    if (updates.maxUsers !== undefined) {
      updates.max_users = updates.maxUsers;
    }
    if (updates.maxProjects !== undefined) {
      updates.max_projects = updates.maxProjects;
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
      data: normalizeTenant(tenant)
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
        ...normalizeTenant(tenant),
        stats: {
          totalUsers: parseInt(stats.total_users || 0),
          totalProjects: parseInt(stats.total_projects || 0),
          totalTasks: parseInt(stats.total_tasks || 0)
        }
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
      data: normalizeTenant(tenant)
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
