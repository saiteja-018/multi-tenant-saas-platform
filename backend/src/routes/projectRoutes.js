const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const taskController = require('../controllers/taskController');
const authenticate = require('../middleware/auth');

// All project routes require authentication
router.use(authenticate);

// Create project
router.post('/', projectController.createProject);

// Get all projects (for current tenant)
router.get('/', projectController.getProjects);

// Get project by ID
router.get('/:id', projectController.getProjectById);

// Update project
router.put('/:id', projectController.updateProject);

// Delete project (admin only, checked in controller)
router.delete('/:id', projectController.deleteProject);

// Spec-compliant task routes under projects
router.get('/:projectId/tasks', taskController.getTasksByProject);
router.post('/:projectId/tasks', taskController.createTask);

module.exports = router;
