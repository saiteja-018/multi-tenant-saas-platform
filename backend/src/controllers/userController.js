const userModel = require('../models/userModel');
const tenantModel = require('../models/tenantModel');
const { hashPassword } = require('../utils/bcrypt');
const { logAudit } = require('../utils/logger');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

const normalizeUser = (user) => ({
  id: user.id,
  email: user.email,
  fullName: user.full_name || user.fullName,
  role: user.role,
  isActive: user.is_active ?? user.isActive,
  tenantId: user.tenant_id || user.tenantId,
  createdAt: user.created_at || user.createdAt,
  updatedAt: user.updated_at || user.updatedAt
});

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

    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters'
      });
    }

    const allowedRoles = ['user', 'tenant_admin'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role value'
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
      data: normalizeUser(user)
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
      data: {
        users: result.users.map(normalizeUser),
        total: result.total,
        pagination: result.pagination
      }
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
      data: normalizeUser(user)
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

    if (updates.role !== undefined && !['user', 'tenant_admin'].includes(updates.role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role value'
      });
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
      data: normalizeUser(updatedUser)
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
