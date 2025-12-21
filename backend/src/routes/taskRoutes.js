const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const authenticate = require('../middleware/auth');

// All task routes require authentication
router.use(authenticate);

// Get tasks by project
router.get('/project/:projectId', taskController.getTasksByProject);

// Create task
router.post('/', taskController.createTask);

// Get task by ID
router.get('/:id', taskController.getTaskById);

// Update task
router.put('/:id', taskController.updateTask);

// Update task status
router.patch('/:id/status', taskController.updateTaskStatus);

// Delete task
router.delete('/:id', taskController.deleteTask);

module.exports = router;
