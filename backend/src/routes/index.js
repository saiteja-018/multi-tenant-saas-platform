const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./authRoutes');
const tenantRoutes = require('./tenantRoutes');
const userRoutes = require('./userRoutes');
const projectRoutes = require('./projectRoutes');
const taskRoutes = require('./taskRoutes');
// API health endpoint (inside router)
const { pool } = require('../config/database')
router.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1')
    res.json({ success: true, message: 'OK', database: 'connected' })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Database connection failed', error: err.message })
  }
})
// Mount routes
router.use('/auth', authRoutes);
router.use('/tenants', tenantRoutes);
router.use('/users', userRoutes);
router.use('/projects', projectRoutes);
router.use('/tasks', taskRoutes);

module.exports = router;
