const projectModel = require('../models/projectModel');
const tenantModel = require('../models/tenantModel');
const { logAudit } = require('../utils/logger');

// Create project
const createProject = async (req, res, next) => {
  try {
    const { name, description, status = 'active' } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Project name is required'
      });
    }

    const tenantId = req.user.tenantId;

    // Check tenant and project limits
    const tenant = await tenantModel.findTenantById(tenantId);
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    const currentProjectCount = await projectModel.countProjectsByTenant(tenantId);
    if (currentProjectCount >= tenant.max_projects) {
      return res.status(403).json({
        success: false,
        message: `Project limit reached (${tenant.max_projects} projects max for ${tenant.subscription_plan} plan)`
      });
    }

    // Create project
    const project = await projectModel.createProject({
      tenantId,
      name,
      description,
      status,
      createdBy: req.user.userId
    });

    // Log audit
    await logAudit({
      tenantId,
      userId: req.user.userId,
      action: 'PROJECT_CREATE',
      entityType: 'project',
      entityId: project.id,
      ipAddress: req.ip,
      metadata: { name: project.name }
    });

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: project
    });
  } catch (error) {
    next(error);
  }
};

// Get projects
const getProjects = async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const tenantId = req.user.tenantId;

    const result = await projectModel.listProjectsByTenant(tenantId, {
      status,
      search,
      page: parseInt(page),
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: result.projects,
      total: result.total,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
};

// Get project by ID
const getProjectById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const project = await projectModel.findProjectById(id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check tenant access
    if (project.tenant_id !== req.user.tenantId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: project
    });
  } catch (error) {
    next(error);
  }
};

// Update project
const updateProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Get project
    const project = await projectModel.findProjectById(id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check tenant access
    if (project.tenant_id !== req.user.tenantId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Only tenant_admin or project creator can update
    if (req.user.role === 'user' && project.created_by !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Only the project creator or tenant admin can update this project'
      });
    }

    // Update project
    const updatedProject = await projectModel.updateProject(id, updates);

    // Log audit
    await logAudit({
      tenantId: req.user.tenantId,
      userId: req.user.userId,
      action: 'PROJECT_UPDATE',
      entityType: 'project',
      entityId: id,
      ipAddress: req.ip,
      metadata: { updates }
    });

    res.json({
      success: true,
      message: 'Project updated successfully',
      data: updatedProject
    });
  } catch (error) {
    next(error);
  }
};

// Delete project
const deleteProject = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get project
    const project = await projectModel.findProjectById(id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check tenant access and role
    if (project.tenant_id !== req.user.tenantId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Only tenant_admin or project creator can delete
    if (req.user.role === 'user' && project.created_by !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Only the project creator or tenant admin can delete this project'
      });
    }

    // Delete project (cascades to tasks)
    await projectModel.deleteProject(id);

    // Log audit
    await logAudit({
      tenantId: req.user.tenantId,
      userId: req.user.userId,
      action: 'PROJECT_DELETE',
      entityType: 'project',
      entityId: id,
      ipAddress: req.ip,
      metadata: { name: project.name }
    });

    res.json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject
};
