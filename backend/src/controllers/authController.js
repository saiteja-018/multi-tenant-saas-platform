const userModel = require('../models/userModel');
const tenantModel = require('../models/tenantModel');
const { hashPassword, comparePassword } = require('../utils/bcrypt');
const { generateToken } = require('../utils/jwt');
const { logAudit } = require('../utils/logger');
const { transaction } = require('../config/database');

// Register tenant (creates both tenant and admin user)
const register = async (req, res, next) => {
  try {
    const { tenantName, subdomain, adminEmail, adminPassword, adminFullName } = req.body;

    // Validate required fields
    if (!tenantName || !subdomain || !adminEmail || !adminPassword || !adminFullName) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Check if subdomain already exists
    const existingTenant = await tenantModel.findTenantBySubdomain(subdomain);
    if (existingTenant) {
      return res.status(409).json({
        success: false,
        message: 'Subdomain already exists'
      });
    }

    const { tenant, admin } = await transaction(async (client) => {
      const createdTenant = await tenantModel.createTenant({
        name: tenantName,
        subdomain: subdomain.toLowerCase(),
        subscriptionPlan: 'free',
        status: 'active'
      }, client);

      const passwordHash = await hashPassword(adminPassword);

      const createdAdmin = await userModel.createUser({
        tenantId: createdTenant.id,
        email: adminEmail.toLowerCase(),
        passwordHash,
        fullName: adminFullName,
        role: 'tenant_admin',
        isActive: true
      }, client);

      return { tenant: createdTenant, admin: createdAdmin };
    });

    // Log audit
    await logAudit({
      tenantId: tenant.id,
      userId: admin.id,
      action: 'TENANT_REGISTER',
      entityType: 'tenant',
      entityId: tenant.id,
      ipAddress: req.ip
    });

    res.status(201).json({
      success: true,
      message: 'Tenant registered successfully',
      data: {
        tenant: {
          id: tenant.id,
          name: tenant.name,
          subdomain: tenant.subdomain
        },
        admin: {
          id: admin.id,
          email: admin.email,
          fullName: admin.full_name,
          role: admin.role
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Login
const login = async (req, res, next) => {
  try {
    const { email, password, subdomain, tenantSubdomain } = req.body;
    const loginSubdomain = subdomain || tenantSubdomain;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    let user;
    
    // Check if this is a super admin login (no subdomain)
    if (!loginSubdomain || loginSubdomain === 'admin') {
      user = await userModel.findSuperAdminByEmail(email.toLowerCase());
    } else {
      // Regular user login - find tenant first
      const tenant = await tenantModel.findTenantBySubdomain(loginSubdomain.toLowerCase());
      
      if (!tenant) {
        return res.status(404).json({
          success: false,
          message: 'Tenant not found'
        });
      }

      if (tenant.status !== 'active') {
        return res.status(403).json({
          success: false,
          message: 'Tenant is not active'
        });
      }

      user = await userModel.findUserByEmailAndTenant(email.toLowerCase(), tenant.id);
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'User account is inactive'
      });
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password_hash);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      tenantId: user.tenant_id,
      role: user.role
    });

    // Log audit
    await logAudit({
      tenantId: user.tenant_id,
      userId: user.id,
      action: 'USER_LOGIN',
      entityType: 'user',
      entityId: user.id,
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          role: user.role,
          tenantId: user.tenant_id
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get current user profile
const getProfile = async (req, res, next) => {
  try {
    const user = await userModel.findUserById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
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
        tenantName: user.tenant_name,
        subdomain: user.subdomain,
        subscriptionPlan: user.subscription_plan,
        maxUsers: user.max_users,
        maxProjects: user.max_projects,
        createdAt: user.created_at
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getProfile,
  logout: async (req, res, next) => {
    try {
      await logAudit({
        tenantId: req.user.tenantId,
        userId: req.user.userId,
        action: 'USER_LOGOUT',
        entityType: 'user',
        entityId: req.user.userId,
        ipAddress: req.ip
      });

      res.json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      next(error);
    }
  }
};
