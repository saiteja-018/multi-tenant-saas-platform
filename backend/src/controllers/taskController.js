const taskModel = require('../models/taskModel');
const projectModel = require('../models/projectModel');
const userModel = require('../models/userModel');
const { logAudit } = require('../utils/logger');

const normalizeTask = (task) => ({
  id: task.id,
  projectId: task.project_id,
  tenantId: task.tenant_id,
  title: task.title,
  description: task.description,
  status: task.status,
  priority: task.priority,
  assignedTo: task.assigned_to ? {
    id: task.assigned_to,
    fullName: task.assigned_to_name,
    email: task.assigned_to_email
  } : null,
  dueDate: task.due_date,
  createdAt: task.created_at,
  updatedAt: task.updated_at
});

// Create task
const createTask = async (req, res, next) => {
  try {
    const projectId = req.params.projectId || req.body.projectId;
    const { title, description, status = 'todo', priority = 'medium', assignedTo, dueDate } = req.body;
    const validStatuses = ['todo', 'in_progress', 'completed'];
    const validPriorities = ['low', 'medium', 'high'];

    if (!projectId || !title) {
      return res.status(400).json({
        success: false,
        message: 'Project ID and title are required'
      });
    }

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }

    if (!validPriorities.includes(priority)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid priority value'
      });
    }

    // Verify project exists and belongs to tenant
    const project = await projectModel.findProjectById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    if (project.tenant_id !== req.user.tenantId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // If assigned to someone, verify user exists in tenant
    if (assignedTo) {
      const user = await userModel.findUserById(assignedTo);
      if (!user || user.tenant_id !== req.user.tenantId) {
        return res.status(400).json({
          success: false,
          message: 'Invalid user assignment'
        });
      }
    }

    // Create task
    const task = await taskModel.createTask({
      projectId,
      tenantId: project.tenant_id,
      title,
      description,
      status,
      priority,
      assignedTo,
      dueDate
    });

    // Log audit
    await logAudit({
      tenantId: req.user.tenantId,
      userId: req.user.userId,
      action: 'TASK_CREATE',
      entityType: 'task',
      entityId: task.id,
      ipAddress: req.ip,
      metadata: { title: task.title, projectId }
    });

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: normalizeTask(task)
    });
  } catch (error) {
    next(error);
  }
};

// Get tasks by project
const getTasksByProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { status, assignedTo, priority, search, page = 1, limit = 50 } = req.query;

    // Verify project exists and belongs to tenant
    const project = await projectModel.findProjectById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    if (project.tenant_id !== req.user.tenantId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const result = await taskModel.listTasksByProject(projectId, {
      status,
      assignedTo,
      priority,
      search,
      page: parseInt(page),
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: {
        tasks: result.tasks.map(normalizeTask),
        total: result.total,
        pagination: result.pagination
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get task by ID
const getTaskById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const task = await taskModel.findTaskById(id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check tenant access
    if (task.tenant_id !== req.user.tenantId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: normalizeTask(task)
    });
  } catch (error) {
    next(error);
  }
};

// Update task
const updateTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };
    const validStatuses = ['todo', 'in_progress', 'completed'];
    const validPriorities = ['low', 'medium', 'high'];

    // Get task
    const task = await taskModel.findTaskById(id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check tenant access
    if (task.tenant_id !== req.user.tenantId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (updates.assignedTo !== undefined) {
      updates.assigned_to = updates.assignedTo;
    }
    if (updates.dueDate !== undefined) {
      updates.due_date = updates.dueDate;
    }

    if (updates.status !== undefined && !validStatuses.includes(updates.status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }

    if (updates.priority !== undefined && !validPriorities.includes(updates.priority)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid priority value'
      });
    }

    // If changing assignment, verify user exists in tenant
    if (updates.assigned_to !== undefined && updates.assigned_to !== null) {
      const user = await userModel.findUserById(updates.assigned_to);
      if (!user || user.tenant_id !== req.user.tenantId) {
        return res.status(400).json({
          success: false,
          message: 'Invalid user assignment'
        });
      }
    }

    // Update task
    const updatedTask = await taskModel.updateTask(id, updates);

    // Log audit
    await logAudit({
      tenantId: req.user.tenantId,
      userId: req.user.userId,
      action: 'TASK_UPDATE',
      entityType: 'task',
      entityId: id,
      ipAddress: req.ip,
      metadata: { updates }
    });

    res.json({
      success: true,
      message: 'Task updated successfully',
      data: normalizeTask(updatedTask)
    });
  } catch (error) {
    next(error);
  }
};

// Update task status
const updateTaskStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    // Validate status
    const validStatuses = ['todo', 'in_progress', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }

    // Get task
    const task = await taskModel.findTaskById(id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check tenant access
    if (task.tenant_id !== req.user.tenantId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Update status
    const updatedTask = await taskModel.updateTaskStatus(id, status);

    // Log audit
    await logAudit({
      tenantId: req.user.tenantId,
      userId: req.user.userId,
      action: 'TASK_STATUS_UPDATE',
      entityType: 'task',
      entityId: id,
      ipAddress: req.ip,
      metadata: { oldStatus: task.status, newStatus: status }
    });

    res.json({
      success: true,
      data: {
        id: updatedTask.id,
        status: updatedTask.status,
        updatedAt: updatedTask.updated_at
      }
    });
  } catch (error) {
    next(error);
  }
};

// Delete task
const deleteTask = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get task
    const task = await taskModel.findTaskById(id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check tenant access
    if (task.tenant_id !== req.user.tenantId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Delete task
    await taskModel.deleteTask(id);

    // Log audit
    await logAudit({
      tenantId: req.user.tenantId,
      userId: req.user.userId,
      action: 'TASK_DELETE',
      entityType: 'task',
      entityId: id,
      ipAddress: req.ip,
      metadata: { title: task.title }
    });

    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTask,
  getTasksByProject,
  getTaskById,
  updateTask,
  updateTaskStatus,
  deleteTask
};
