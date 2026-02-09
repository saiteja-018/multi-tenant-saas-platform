const userModel = require('../models/userModel');
const tenantModel = require('../models/tenantModel');
const { hashPassword } = require('../utils/bcrypt');
const { logAudit } = require('../utils/logger');

// Create user
const createUser = async (req, res, next) => {
  try {
    const { email, password, fullName, role = 'user' } = req.body;

    // Validate required fields
    if (!email || !password || !fullName) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, and full name are required'
      });
    }

    // Determine tenant ID
    let tenantId;
    if (req.user.role === 'super_admin') {
      // Super admin can specify tenant in request
      tenantId = req.body.tenantId;
      if (!tenantId) {
        return res.status(400).json({
          success: false,
          message: 'Tenant ID is required'
        });
      }
    } else {
      // Tenant admin can only create users in their own tenant
      tenantId = req.user.tenantId;
    }

    // Check tenant exists and get limits
    const tenant = await tenantModel.findTenantById(tenantId);
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    // Check user limit
    const currentUserCount = await userModel.countUsersByTenant(tenantId);
    if (currentUserCount >= tenant.max_users) {
      return res.status(403).json({
        success: false,
        message: `User limit reached (${tenant.max_users} users max for ${tenant.subscription_plan} plan)`
      });
    }

    // Check if user already exists
    const existingUser = await userModel.findUserByEmailAndTenant(email.toLowerCase(), tenantId);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists in this tenant'
      });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await userModel.createUser({
      tenantId,
      email: email.toLowerCase(),
      passwordHash,
      fullName,
      role,
      isActive: true
    });

    // Log audit
    await logAudit({
      tenantId,
      userId: req.user.userId,
      action: 'USER_CREATE',
      entityType: 'user',
      entityId: user.id,
      ipAddress: req.ip,
      metadata: { email: user.email, role: user.role }
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// Get users
const getUsers = async (req, res, next) => {
  try {
    const { search, role, page = 1, limit = 50 } = req.query;

    // Determine tenant ID
    let tenantId;
    if (req.user.role === 'super_admin' && req.query.tenantId) {
      tenantId = req.query.tenantId;
    } else {
      tenantId = req.user.tenantId;
    }

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant ID is required'
      });
    }

    const result = await userModel.listUsersByTenant(tenantId, {
      search,
      role,
      page: parseInt(page),
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: result.users,
      total: result.total,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
};

// Get user by ID
const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await userModel.findUserById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check permissions
    if (req.user.role === 'user' && req.user.userId !== id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (req.user.role === 'tenant_admin' && user.tenant_id !== req.user.tenantId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        isActive: user.is_active,
        tenantId: user.tenant_id,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      }
    });
  } catch (error) {
    next(error);
  }
};

// Update user
const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    let updates = req.body;

    // Get user
    const user = await userModel.findUserById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check permissions
    if (req.user.role === 'user' && req.user.userId !== id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (req.user.role === 'tenant_admin' && user.tenant_id !== req.user.tenantId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Normalize field names
    if (updates.fullName !== undefined) {
      updates.full_name = updates.fullName;
    }
    if (updates.isActive !== undefined) {
      updates.is_active = updates.isActive;
    }

    // Regular users can only update their own full name
    if (req.user.role === 'user') {
      updates = { full_name: updates.full_name };
    }

    // Update user
    const updatedUser = await userModel.updateUser(id, updates);

    // Log audit
    await logAudit({
      tenantId: user.tenant_id,
      userId: req.user.userId,
      action: 'USER_UPDATE',
      entityType: 'user',
      entityId: id,
      ipAddress: req.ip,
      metadata: { updates }
    });

    res.json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser
    });
  } catch (error) {
    next(error);
  }
};

// Delete user
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get user
    const user = await userModel.findUserById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check permissions (only tenant_admins and super admins can delete)
    if (req.user.role === 'tenant_admin' && user.tenant_id !== req.user.tenantId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Cannot delete yourself
    if (req.user.userId === id) {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    // Delete user
    await userModel.deleteUser(id);

    // Log audit
    await logAudit({
      tenantId: user.tenant_id,
      userId: req.user.userId,
      action: 'USER_DELETE',
      entityType: 'user',
      entityId: id,
      ipAddress: req.ip,
      metadata: { email: user.email }
    });

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser
};
