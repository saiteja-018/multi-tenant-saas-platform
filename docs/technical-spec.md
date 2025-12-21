# Technical Specification Document
## Multi-Tenant SaaS Platform

**Version**: 1.0  
**Date**: December 2025

---

## 1. Project Structure

### 1.1 Backend Structure

```
backend/
├── src/
│   ├── controllers/           # Request handlers
│   │   ├── authController.js
│   │   ├── tenantController.js
│   │   ├── userController.js
│   │   ├── projectController.js
│   │   └── taskController.js
│   ├── middleware/            # Express middleware
│   │   ├── auth.js           # JWT verification
│   │   ├── authorize.js      # Role-based authorization
│   │   ├── tenantIsolation.js # Automatic tenant filtering
│   │   ├── errorHandler.js   # Error handling
│   │   └── validate.js       # Request validation
│   ├── routes/               # API route definitions
│   │   ├── authRoutes.js
│   │   ├── tenantRoutes.js
│   │   ├── userRoutes.js
│   │   ├── projectRoutes.js
│   │   ├── taskRoutes.js
│   │   └── index.js          # Route aggregator
│   ├── models/               # Database models/queries
│   │   ├── tenantModel.js
│   │   ├── userModel.js
│   │   ├── projectModel.js
│   │   ├── taskModel.js
│   │   └── auditModel.js
│   ├── utils/                # Utility functions
│   │   ├── jwt.js            # JWT generation/verification
│   │   ├── bcrypt.js         # Password hashing
│   │   ├── logger.js         # Logging utility
│   │   └── validator.js      # Input validation helpers
│   ├── config/               # Configuration
│   │   ├── database.js       # DB connection config
│   │   └── constants.js      # App constants
│   └── server.js             # Express app entry point
├── migrations/               # Database migrations
│   ├── 001_create_tenants.sql
│   ├── 002_create_users.sql
│   ├── 003_create_projects.sql
│   ├── 004_create_tasks.sql
│   └── 005_create_audit_logs.sql
├── seeds/                    # Seed data
│   └── seed_data.sql
├── scripts/                  # Utility scripts
│   └── init-db.sh           # Database initialization
├── .env.example             # Environment variable template
├── package.json             # Node.js dependencies
├── Dockerfile               # Docker configuration
└── .dockerignore           # Docker ignore file
```

### 1.2 Frontend Structure

```
frontend/
├── public/
│   ├── index.html
│   └── favicon.ico
├── src/
│   ├── components/          # Reusable components
│   │   ├── common/
│   │   │   ├── Button.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Loading.jsx
│   │   │   └── ErrorMessage.jsx
│   │   ├── layout/
│   │   │   ├── Navbar.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── Footer.jsx
│   │   └── ProtectedRoute.jsx
│   ├── pages/               # Page components
│   │   ├── auth/
│   │   │   ├── Register.jsx
│   │   │   └── Login.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Projects.jsx
│   │   ├── ProjectDetails.jsx
│   │   └── Users.jsx
│   ├── context/             # React Context
│   │   └── AuthContext.jsx
│   ├── services/            # API services
│   │   ├── api.js          # Axios instance
│   │   ├── authService.js
│   │   ├── tenantService.js
│   │   ├── projectService.js
│   │   └── taskService.js
│   ├── utils/               # Utility functions
│   │   ├── tokenManager.js
│   │   └── validators.js
│   ├── App.jsx              # Main app component
│   └── index.js             # Entry point
├── .env.example             # Environment variables
├── package.json             # Dependencies
├── Dockerfile               # Docker configuration
└── .dockerignore           # Docker ignore file
```

### 1.3 Root Structure

```
project-root/
├── backend/                 # Backend application
├── frontend/                # Frontend application
├── docs/                    # Documentation
│   ├── research.md
│   ├── PRD.md
│   ├── architecture.md
│   ├── technical-spec.md
│   ├── API.md
│   └── images/
│       ├── system-architecture.png
│       └── database-erd.png
├── docker-compose.yml       # Docker Compose config
├── .gitignore              # Git ignore file
├── README.md               # Main documentation
└── submission.json         # Test credentials
```

---

## 2. Development Setup Guide

### 2.1 Prerequisites

**Required Software:**
- **Node.js**: v18.x or higher
- **npm**: v9.x or higher
- **PostgreSQL**: v15.x (for local development)
- **Docker**: v20.x or higher
- **Docker Compose**: v2.x or higher
- **Git**: Latest version

**Check Versions:**
```bash
node --version    # Should be v18+
npm --version     # Should be v9+
docker --version  # Should be v20+
docker-compose --version  # Should be v2+
psql --version   # Should be v15+
```

### 2.2 Local Development Setup (Without Docker)

**Step 1: Clone Repository**
```bash
git clone <repository-url>
cd Multi-Tenant-SaaS-Platform
```

**Step 2: Setup PostgreSQL Database**
```bash
# Create database
createdb saas_db

# Or using psql
psql -U postgres
CREATE DATABASE saas_db;
\q
```

**Step 3: Backend Setup**
```bash
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env file with your database credentials
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=saas_db
# DB_USER=postgres
# DB_PASSWORD=your_password
# JWT_SECRET=your_secret_key_min_32_chars
# PORT=5000

# Run migrations
npm run migrate

# Seed database
npm run seed

# Start development server
npm run dev
```

**Step 4: Frontend Setup**
```bash
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env file
# REACT_APP_API_URL=http://localhost:5000/api

# Start development server
npm start
```

**Step 5: Verify Setup**
- Backend API: http://localhost:5000/api/health
- Frontend App: http://localhost:3000
- Login with seed credentials: admin@demo.com / Demo@123

### 2.3 Docker Development Setup (Recommended)

**Step 1: Clone Repository**
```bash
git clone <repository-url>
cd Multi-Tenant-SaaS-Platform
```

**Step 2: Start All Services**
```bash
# Start all services (database, backend, frontend)
docker-compose up -d

# View logs
docker-compose logs -f

# Check service status
docker-compose ps
```

**Step 3: Verify Setup**
Wait 30-60 seconds for services to initialize, then verify:

```bash
# Check health endpoint
curl http://localhost:5000/api/health

# Should return:
# {"status":"ok","database":"connected"}
```

**Step 4: Access Application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- PostgreSQL: localhost:5432

**Step 5: Login with Seed Credentials**
- Super Admin: superadmin@system.com / Admin@123
- Tenant Admin (Demo): admin@demo.com / Demo@123
- Regular User: user1@demo.com / User@123

### 2.4 Docker Commands

**Start Services:**
```bash
docker-compose up -d
```

**Stop Services:**
```bash
docker-compose down
```

**View Logs:**
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f database
```

**Rebuild Containers:**
```bash
# Rebuild all
docker-compose build

# Rebuild specific service
docker-compose build backend
```

**Access Container Shell:**
```bash
# Backend container
docker-compose exec backend sh

# Database container
docker-compose exec database psql -U postgres -d saas_db
```

**Reset Everything:**
```bash
# Stop and remove containers, networks, volumes
docker-compose down -v

# Rebuild and start
docker-compose up -d --build
```

---

## 3. Environment Variables

### 3.1 Backend Environment Variables

**File**: `backend/.env`

```bash
# Database Configuration
DB_HOST=database              # Use 'database' for Docker, 'localhost' for local
DB_PORT=5432
DB_NAME=saas_db
DB_USER=postgres
DB_PASSWORD=postgres          # Change for production

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_must_be_at_least_32_characters_long
JWT_EXPIRES_IN=24h

# Server Configuration
PORT=5000
NODE_ENV=development          # development | production

# Frontend URL (for CORS)
FRONTEND_URL=http://frontend:3000  # Use 'frontend' for Docker, 'localhost:3000' for local

# Logging
LOG_LEVEL=info               # error | warn | info | debug
```

**Important Notes:**
- Use service names (`database`, `frontend`) in Docker environment
- Use `localhost` when running locally without Docker
- JWT_SECRET must be at least 32 characters for security
- Never commit real production secrets to Git

### 3.2 Frontend Environment Variables

**File**: `frontend/.env`

```bash
# Backend API URL
REACT_APP_API_URL=http://backend:5000/api  # Docker
# REACT_APP_API_URL=http://localhost:5000/api  # Local

# Optional: Feature flags
REACT_APP_ENABLE_ANALYTICS=false
```

---

## 4. Database Management

### 4.1 Migration Strategy

**Migration Files Location**: `backend/migrations/`

**Naming Convention**: `XXX_description.sql`
- 001_create_tenants.sql
- 002_create_users.sql
- etc.

**Running Migrations:**
```bash
# Local
npm run migrate

# Docker
docker-compose exec backend npm run migrate
```

**Migration File Structure:**
```sql
-- UP Migration
CREATE TABLE IF NOT EXISTS table_name (
  id VARCHAR(36) PRIMARY KEY,
  ...
);

-- DOWN Migration (optional)
-- DROP TABLE IF EXISTS table_name CASCADE;
```

### 4.2 Seeding Database

**Seed File Location**: `backend/seeds/seed_data.sql`

**Running Seeds:**
```bash
# Local
npm run seed

# Docker
docker-compose exec backend npm run seed
```

**Seed Data Includes:**
- 1 Super Admin user
- 1 Demo tenant
- 1 Tenant Admin for Demo
- 2 Regular users for Demo
- 2 Sample projects
- 5 Sample tasks

---

## 5. API Development Guidelines

### 5.1 Controller Pattern

```javascript
// Example: projectController.js
const projectModel = require('../models/projectModel');
const auditModel = require('../models/auditModel');

exports.createProject = async (req, res) => {
  try {
    // 1. Extract data from request
    const { name, description } = req.body;
    const { userId, tenantId } = req.user; // From JWT
    
    // 2. Validate input
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Project name is required'
      });
    }
    
    // 3. Check subscription limits
    const currentCount = await projectModel.countByTenant(tenantId);
    const tenant = await tenantModel.findById(tenantId);
    
    if (currentCount >= tenant.max_projects) {
      return res.status(403).json({
        success: false,
        message: 'Project limit reached for your subscription'
      });
    }
    
    // 4. Create project
    const project = await projectModel.create({
      tenantId,
      name,
      description,
      createdBy: userId
    });
    
    // 5. Log action
    await auditModel.log({
      tenantId,
      userId,
      action: 'CREATE_PROJECT',
      entityType: 'project',
      entityId: project.id
    });
    
    // 6. Return response
    res.status(201).json({
      success: true,
      data: project
    });
    
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
```

### 5.2 Model Pattern

```javascript
// Example: projectModel.js
const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

exports.create = async (projectData) => {
  const id = uuidv4();
  const query = `
    INSERT INTO projects (id, tenant_id, name, description, created_by, status, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, 'active', NOW(), NOW())
    RETURNING *
  `;
  
  const result = await db.query(query, [
    id,
    projectData.tenantId,
    projectData.name,
    projectData.description || null,
    projectData.createdBy
  ]);
  
  return result.rows[0];
};

exports.findByTenant = async (tenantId, filters = {}) => {
  let query = `
    SELECT p.*, u.full_name as creator_name,
           COUNT(t.id) as task_count,
           COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_count
    FROM projects p
    LEFT JOIN users u ON p.created_by = u.id
    LEFT JOIN tasks t ON p.id = t.project_id
    WHERE p.tenant_id = $1
  `;
  
  const params = [tenantId];
  
  // Add filters
  if (filters.status) {
    params.push(filters.status);
    query += ` AND p.status = $${params.length}`;
  }
  
  query += ` GROUP BY p.id, u.full_name ORDER BY p.created_at DESC`;
  
  const result = await db.query(query, params);
  return result.rows;
};
```

---

## 6. Frontend Development Guidelines

### 6.1 API Service Pattern

```javascript
// services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor - Add auth token
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// Response interceptor - Handle errors
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

```javascript
// services/authService.js
import api from './api';

export const authService = {
  login: async (email, password, tenantSubdomain) => {
    const response = await api.post('/auth/login', {
      email,
      password,
      tenantSubdomain
    });
    return response.data;
  },
  
  register: async (tenantData) => {
    const response = await api.post('/auth/register-tenant', tenantData);
    return response.data;
  },
  
  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
  
  logout: async () => {
    const response = await api.post('/auth/logout');
    localStorage.removeItem('token');
    return response.data;
  }
};
```

### 6.2 Component Pattern

```javascript
// pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { projectService } from '../services/projectService';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    fetchProjects();
  }, []);
  
  const fetchProjects = async () => {
    try {
      setLoading(true);
      const data = await projectService.getAll();
      setProjects(data.projects);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div>
      <h1>Welcome, {user.fullName}</h1>
      <div className="stats">
        <div className="stat-card">
          <h3>{projects.length}</h3>
          <p>Total Projects</p>
        </div>
        {/* More stats */}
      </div>
      <div className="projects-list">
        {projects.map(project => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
```

---

## 7. Testing Strategy

### 7.1 Backend Testing

```bash
# Install testing dependencies
npm install --save-dev jest supertest

# Run tests
npm test

# Run with coverage
npm run test:coverage
```

**Example Test:**
```javascript
// __tests__/auth.test.js
const request = require('supertest');
const app = require('../src/server');

describe('POST /api/auth/login', () => {
  it('should login with valid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@demo.com',
        password: 'Demo@123',
        tenantSubdomain: 'demo'
      });
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.token).toBeDefined();
  });
  
  it('should reject invalid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@demo.com',
        password: 'wrongpassword',
        tenantSubdomain: 'demo'
      });
    
    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });
});
```

### 7.2 Frontend Testing

```bash
# Install testing dependencies
npm install --save-dev @testing-library/react @testing-library/jest-dom

# Run tests
npm test
```

---

## 8. Deployment Checklist

### 8.1 Pre-Deployment

- [ ] All environment variables configured
- [ ] Database migrations tested
- [ ] Seed data loaded successfully
- [ ] All API endpoints tested
- [ ] Frontend builds without errors
- [ ] Docker containers start successfully
- [ ] Health check endpoint responds
- [ ] CORS configured correctly
- [ ] All tests passing

### 8.2 Docker Deployment

```bash
# Build all services
docker-compose build

# Start services
docker-compose up -d

# Verify health
curl http://localhost:5000/api/health

# Check logs
docker-compose logs -f
```

### 8.3 Production Considerations

- Use production-grade secrets (not test values)
- Enable HTTPS/TLS encryption
- Configure proper CORS origins
- Implement rate limiting
- Setup monitoring and alerting
- Configure automated backups
- Use managed database service
- Implement CDN for frontend assets

---

**Document Version**: 1.0  
**Last Updated**: December 2025  
**Maintained By**: Development Team
