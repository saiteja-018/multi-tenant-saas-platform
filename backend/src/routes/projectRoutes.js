const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
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

module.exports = router;
