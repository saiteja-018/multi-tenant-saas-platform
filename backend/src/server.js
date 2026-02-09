const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const allowedOrigins = (process.env.FRONTEND_URL || process.env.CORS_ORIGIN || 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint - Welcome message
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Multi-Tenant SaaS Platform API',
    version: '1.0.0',
    endpoints: {
      health: 'GET /health',
      api_health: 'GET /api/health',
      auth: 'POST /api/auth/login, /api/auth/register, /api/auth/logout',
      tenants: 'GET /api/tenants, POST /api/tenants, PUT /api/tenants/:id, DELETE /api/tenants/:id',
      users: 'GET /api/users, POST /api/users, PUT /api/users/:id, DELETE /api/users/:id',
      projects: 'GET /api/projects, POST /api/projects, PUT /api/projects/:id, DELETE /api/projects/:id',
      tasks: 'GET /api/tasks, POST /api/tasks, PUT /api/tasks/:id, DELETE /api/tasks/:id'
    },
    documentation: 'See /docs/API.md for detailed documentation'
  });
});

// API health endpoint (required by main goal spec)
// Returns system status and database connection status
const { pool } = require('./config/database');
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      database: 'disconnected',
      timestamp: new Date().toISOString()
    });
  }
});

// API routes
app.use('/api', routes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log(`📡 API endpoint: http://localhost:${PORT}/api`);
});

module.exports = app;
