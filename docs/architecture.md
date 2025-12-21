# Architecture Document
## Multi-Tenant SaaS Platform - System Architecture

**Version**: 1.0  
**Date**: December 2025

---

## 1. System Architecture Overview

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │           Web Browser (Chrome, Firefox, Safari)           │  │
│  │              React Frontend Application                   │  │
│  │              (Port 3000 - Dockerized)                    │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS/HTTP
                              │ JWT Token in Header
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │           Node.js + Express Backend API                   │  │
│  │              (Port 5000 - Dockerized)                    │  │
│  │                                                            │  │
│  │  ┌────────────┐ ┌─────────────┐ ┌──────────────┐        │  │
│  │  │   Auth     │ │  Tenant     │ │   Project    │        │  │
│  │  │ Controller │ │ Controller  │ │  Controller  │  ...   │  │
│  │  └────────────┘ └─────────────┘ └──────────────┘        │  │
│  │                                                            │  │
│  │  ┌────────────────────────────────────────────┐          │  │
│  │  │        Middleware Layer                     │          │  │
│  │  │  - Authentication (JWT Verification)        │          │  │
│  │  │  - Authorization (Role-Based Access)        │          │  │
│  │  │  - Tenant Isolation (Auto-filtering)        │          │  │
│  │  │  - Error Handling                           │          │  │
│  │  └────────────────────────────────────────────┘          │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ SQL Queries
                              │ (Parameterized)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        DATA LAYER                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              PostgreSQL Database 15                       │  │
│  │              (Port 5432 - Dockerized)                    │  │
│  │                                                            │  │
│  │  ┌─────────┐ ┌────────┐ ┌──────────┐ ┌───────┐          │  │
│  │  │ tenants │ │ users  │ │ projects │ │ tasks │ ...      │  │
│  │  └─────────┘ └────────┘ └──────────┘ └───────┘          │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘

                  ┌──────────────────────┐
                  │   Docker Compose     │
                  │   Orchestration      │
                  │   (docker-compose.yml)│
                  └──────────────────────┘
```

### 1.2 Authentication Flow

```
┌────────┐                  ┌─────────┐                ┌──────────┐
│ Client │                  │ Backend │                │ Database │
└───┬────┘                  └────┬────┘                └────┬─────┘
    │                            │                          │
    │ 1. POST /api/auth/login    │                          │
    │ {email, password, subdomain│                          │
    ├───────────────────────────>│                          │
    │                            │                          │
    │                            │ 2. Verify tenant exists  │
    │                            ├─────────────────────────>│
    │                            │                          │
    │                            │ 3. Return tenant data    │
    │                            │<─────────────────────────┤
    │                            │                          │
    │                            │ 4. Verify user & password│
    │                            ├─────────────────────────>│
    │                            │                          │
    │                            │ 5. Return user data      │
    │                            │<─────────────────────────┤
    │                            │                          │
    │                            │ 6. Generate JWT token    │
    │                            │    {userId, tenantId,    │
    │                            │     role, exp: 24h}      │
    │                            │                          │
    │ 7. Return token & user     │                          │
    │<───────────────────────────┤                          │
    │                            │                          │
    │ 8. Store token in          │                          │
    │    localStorage            │                          │
    │                            │                          │
    │ 9. Subsequent API requests │                          │
    │    Authorization: Bearer   │                          │
    │    <token>                 │                          │
    ├───────────────────────────>│                          │
    │                            │                          │
    │                            │ 10. Verify & decode token│
    │                            │     Extract tenant_id    │
    │                            │                          │
    │                            │ 11. Query with tenant    │
    │                            │     filtering            │
    │                            ├─────────────────────────>│
    │                            │                          │
    │                            │ 12. Return filtered data │
    │                            │<─────────────────────────┤
    │                            │                          │
    │ 13. Response with data     │                          │
    │<───────────────────────────┤                          │
    │                            │                          │
```

---

## 2. Database Schema Design

### 2.1 Entity Relationship Diagram (ERD)

```
┌─────────────────────────────┐
│         TENANTS             │
│─────────────────────────────│
│ PK id (VARCHAR/UUID)        │
│    name (VARCHAR)           │
│    subdomain (VARCHAR)UNIQUE│
│    status (ENUM)            │
│    subscription_plan (ENUM) │
│    max_users (INTEGER)      │
│    max_projects (INTEGER)   │
│    created_at (TIMESTAMP)   │
│    updated_at (TIMESTAMP)   │
└─────────────────────────────┘
              │
              │ 1:N
              │
     ┌────────┴────────────────────────────────┐
     │                                          │
     ▼                                          ▼
┌─────────────────────────────┐    ┌─────────────────────────────┐
│          USERS              │    │        PROJECTS             │
│─────────────────────────────│    │─────────────────────────────│
│ PK id (VARCHAR/UUID)        │    │ PK id (VARCHAR/UUID)        │
│ FK tenant_id → tenants.id   │    │ FK tenant_id → tenants.id   │
│    email (VARCHAR)          │    │ FK created_by → users.id    │
│    password_hash (VARCHAR)  │    │    name (VARCHAR)           │
│    full_name (VARCHAR)      │    │    description (TEXT)       │
│    role (ENUM)              │    │    status (ENUM)            │
│    is_active (BOOLEAN)      │    │    created_at (TIMESTAMP)   │
│    created_at (TIMESTAMP)   │    │    updated_at (TIMESTAMP)   │
│    updated_at (TIMESTAMP)   │    └─────────────────────────────┘
│                             │                  │
│ UNIQUE(tenant_id, email)    │                  │ 1:N
│ INDEX(tenant_id)            │                  │
└─────────────────────────────┘                  ▼
              │                      ┌─────────────────────────────┐
              │                      │          TASKS              │
              │                      │─────────────────────────────│
              │ 1:N                  │ PK id (VARCHAR/UUID)        │
              │                      │ FK project_id → projects.id │
              │                      │ FK tenant_id → tenants.id   │
              │                      │ FK assigned_to → users.id   │
              │                      │    title (VARCHAR)          │
              │                      │    description (TEXT)       │
              │                      │    status (ENUM)            │
              │                      │    priority (ENUM)          │
              │                      │    due_date (DATE)          │
              │                      │    created_at (TIMESTAMP)   │
              │                      │    updated_at (TIMESTAMP)   │
              │                      │                             │
              │                      │ INDEX(tenant_id, project_id)│
              │                      └─────────────────────────────┘
              │
              │ 1:N
              ▼
┌─────────────────────────────┐
│       AUDIT_LOGS            │
│─────────────────────────────│
│ PK id (VARCHAR/UUID)        │
│ FK tenant_id → tenants.id   │
│ FK user_id → users.id       │
│    action (VARCHAR)         │
│    entity_type (VARCHAR)    │
│    entity_id (VARCHAR)      │
│    ip_address (VARCHAR)     │
│    created_at (TIMESTAMP)   │
└─────────────────────────────┘
```

### 2.2 Table Descriptions

#### Tenants Table
- **Purpose**: Store organization information
- **Key Fields**: subdomain (unique identifier for login), subscription_plan (determines limits)
- **Indexes**: PRIMARY KEY on id

#### Users Table
- **Purpose**: Store user accounts with tenant association
- **Key Fields**: tenant_id (NULL for super_admin), role (access control)
- **Constraints**: UNIQUE(tenant_id, email) - same email can exist in different tenants
- **Indexes**: PRIMARY KEY on id, INDEX on tenant_id

#### Projects Table
- **Purpose**: Store projects for each tenant
- **Key Fields**: created_by (tracks project creator)
- **Cascade**: DELETE tenant → DELETE projects
- **Indexes**: PRIMARY KEY on id, INDEX on tenant_id

#### Tasks Table
- **Purpose**: Store tasks within projects
- **Key Fields**: project_id, assigned_to (nullable)
- **Cascade**: DELETE project → DELETE tasks
- **Indexes**: PRIMARY KEY on id, INDEX on (tenant_id, project_id)

#### Audit_Logs Table
- **Purpose**: Track all important actions for security audit
- **Key Fields**: action (e.g., 'CREATE_USER'), entity_type (e.g., 'user')
- **Retention**: Permanent for compliance

---

## 3. API Architecture

### 3.1 Complete API Endpoint List

#### Authentication Module (4 endpoints)

| # | Method | Endpoint | Auth Required | Role Required | Description |
|---|--------|----------|---------------|---------------|-------------|
| 1 | POST | /api/auth/register-tenant | No | - | Register new tenant with admin user |
| 2 | POST | /api/auth/login | No | - | Login with email, password, subdomain |
| 3 | GET | /api/auth/me | Yes | Any | Get current user information |
| 4 | POST | /api/auth/logout | Yes | Any | Logout current user |

#### Tenant Management Module (3 endpoints)

| # | Method | Endpoint | Auth Required | Role Required | Description |
|---|--------|----------|---------------|---------------|-------------|
| 5 | GET | /api/tenants/:tenantId | Yes | Self or Super Admin | Get tenant details with stats |
| 6 | PUT | /api/tenants/:tenantId | Yes | Tenant Admin or Super Admin | Update tenant information |
| 7 | GET | /api/tenants | Yes | Super Admin | List all tenants with pagination |

#### User Management Module (4 endpoints)

| # | Method | Endpoint | Auth Required | Role Required | Description |
|---|--------|----------|---------------|---------------|-------------|
| 8 | POST | /api/tenants/:tenantId/users | Yes | Tenant Admin | Add user to tenant |
| 9 | GET | /api/tenants/:tenantId/users | Yes | Any (same tenant) | List tenant users |
| 10 | PUT | /api/users/:userId | Yes | Self or Tenant Admin | Update user information |
| 11 | DELETE | /api/users/:userId | Yes | Tenant Admin | Delete user from tenant |

#### Project Management Module (4 endpoints)

| # | Method | Endpoint | Auth Required | Role Required | Description |
|---|--------|----------|---------------|---------------|-------------|
| 12 | POST | /api/projects | Yes | Any | Create new project |
| 13 | GET | /api/projects | Yes | Any | List projects with filters |
| 14 | PUT | /api/projects/:projectId | Yes | Creator or Tenant Admin | Update project |
| 15 | DELETE | /api/projects/:projectId | Yes | Creator or Tenant Admin | Delete project |

#### Task Management Module (4 endpoints)

| # | Method | Endpoint | Auth Required | Role Required | Description |
|---|--------|----------|---------------|---------------|-------------|
| 16 | POST | /api/projects/:projectId/tasks | Yes | Any | Create task in project |
| 17 | GET | /api/projects/:projectId/tasks | Yes | Any | List project tasks |
| 18 | PATCH | /api/tasks/:taskId/status | Yes | Any | Update task status only |
| 19 | PUT | /api/tasks/:taskId | Yes | Any | Update task (all fields) |

#### System Module (1 endpoint)

| # | Method | Endpoint | Auth Required | Role Required | Description |
|---|--------|----------|---------------|---------------|-------------|
| 20 | GET | /api/health | No | - | Health check endpoint |

**Total: 20 API Endpoints** (19 functional + 1 health check)

### 3.2 API Response Format

All APIs follow consistent response format:

**Success Response:**
```json
{
  "success": true,
  "message": "Operation successful (optional)",
  "data": { /* response payload */ }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error description",
  "error": "ERROR_CODE (optional)"
}
```

**HTTP Status Codes:**
- `200 OK`: Successful GET/PUT/DELETE
- `201 Created`: Successful POST
- `400 Bad Request`: Validation errors
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Duplicate resource (e.g., email exists)
- `500 Internal Server Error`: Server errors

---

## 4. Security Architecture

### 4.1 Defense-in-Depth Strategy

```
┌─────────────────────────────────────────────────────────────┐
│ Layer 1: Network Security                                   │
│ - HTTPS/TLS encryption                                      │
│ - CORS configuration                                        │
│ - Rate limiting                                             │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ Layer 2: Authentication                                     │
│ - JWT token verification                                    │
│ - Token expiry (24 hours)                                   │
│ - Password hashing (bcrypt)                                 │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ Layer 3: Authorization                                      │
│ - Role-based access control (super_admin, tenant_admin,user)│
│ - Endpoint-level permission checks                          │
│ - Resource ownership validation                             │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ Layer 4: Data Isolation                                     │
│ - Automatic tenant_id filtering                             │
│ - Query-level tenant verification                           │
│ - Super admin bypass for cross-tenant access                │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ Layer 5: Input Validation                                   │
│ - Request body validation                                   │
│ - SQL injection prevention (parameterized queries)          │
│ - XSS prevention (input sanitization)                       │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ Layer 6: Audit & Monitoring                                 │
│ - Action logging (audit_logs table)                         │
│ - Error logging and alerting                                │
│ - Anomaly detection                                         │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Multi-Tenancy Isolation

**Tenant Isolation Middleware:**
```javascript
// Automatically adds tenant_id filter to queries
const tenantIsolation = (req, res, next) => {
  const { tenantId, role } = req.user; // From JWT token
  
  if (role === 'super_admin') {
    // Super admin can access all tenants
    req.allowAllTenants = true;
  } else {
    // Regular users: enforce tenant filtering
    req.tenantId = tenantId;
  }
  
  next();
};
```

**Query Pattern:**
```sql
-- For regular users (automatic tenant filtering)
SELECT * FROM projects WHERE tenant_id = ? AND id = ?

-- For super_admin (no tenant filtering)
SELECT * FROM projects WHERE id = ?
```

---

## 5. Deployment Architecture

### 5.1 Docker Container Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Docker Compose                           │
│                                                              │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────┐ │
│  │   Frontend     │  │    Backend     │  │   Database   │ │
│  │   Container    │  │   Container    │  │   Container  │ │
│  │                │  │                │  │              │ │
│  │  - React App   │  │  - Node.js     │  │  - PostgreSQL│ │
│  │  - Nginx/Serve │  │  - Express API │  │  - Port 5432 │ │
│  │  - Port 3000   │  │  - Port 5000   │  │              │ │
│  │                │  │                │  │              │ │
│  └────────────────┘  └────────────────┘  └──────────────┘ │
│         │                     │                    │        │
│         └─────────────────────┴────────────────────┘        │
│                     Docker Network                          │
│              (frontend, backend, database)                  │
│                                                              │
│  Volume: db_data (Persist database data)                   │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Scaling Strategy

**Horizontal Scaling:**
- Frontend: Multiple containers behind load balancer
- Backend: Stateless API allows multiple instances
- Database: Read replicas for read-heavy operations

**Vertical Scaling:**
- Increase container resources (CPU, memory)
- Optimize database queries and indexes
- Implement caching layer (Redis) for frequent queries

---

## 6. Technology Decisions Summary

| Component | Technology | Version | Justification |
|-----------|-----------|---------|---------------|
| Backend | Node.js + Express | 18+ / 4.18+ | Performance, ecosystem, async I/O |
| Frontend | React | 18+ | Component reusability, ecosystem |
| Database | PostgreSQL | 15 | ACID, JSON support, reliability |
| Authentication | JWT + bcrypt | Latest | Stateless, scalable, secure |
| Containerization | Docker + Compose | Latest | Consistency, portability |
| API Style | REST | - | Standard, simple, widely supported |

---

**Document Status**: Final  
**Last Updated**: December 2025  
**Next Review**: After implementation phase
