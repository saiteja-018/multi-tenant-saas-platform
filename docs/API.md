# API Documentation

Base URL: `http://localhost:5000/api`

## Endpoint Mapping

The following table maps **main.goal.txt spec endpoints** to actual implementation:

| Spec Endpoint | Implementation | Method | Notes |
|---|---|---|---|
| POST `/auth/register-tenant` | POST `/auth/register` or `/auth/register-tenant` | POST | Both aliases work |
| POST `/auth/login` | POST `/auth/login` | POST | User login |
| GET `/auth/me` | GET `/auth/profile` or `/auth/me` | GET | Both aliases work |
| POST `/auth/logout` | POST `/auth/logout` | POST | Stateless JWT |
| GET `/tenants` | GET `/tenants` | GET | Super admin only |
| GET `/tenants/:id` | GET `/tenants/:id` | GET | Get tenant |
| POST `/tenants/:id/users` | POST `/users` + tenantId param | POST | Create user |
| GET `/tenants/:id/users` | GET `/users?tenantId=:id` | GET | List users |
| PUT `/users/:id` | PUT `/users/:id` | PUT | Update user |
| DELETE `/users/:id` | DELETE `/users/:id` | DELETE | Delete user |
| POST `/projects` | POST `/projects` | POST | Create project |
| GET `/projects` | GET `/projects` | GET | List projects |
| PUT `/projects/:id` | PUT `/projects/:id` | PUT | Update project |
| DELETE `/projects/:id` | DELETE `/projects/:id` | DELETE | Delete project |
| POST `/projects/:id/tasks` | POST `/tasks` + projectId param | POST | Create task |
| GET `/projects/:id/tasks` | GET `/tasks/project/:projectId` | GET | List tasks |
| PATCH `/tasks/:id/status` | PATCH `/tasks/:id/status` | PATCH | Update status |
| PUT `/tasks/:id` | PUT `/tasks/:id` | PUT | Update task |
| GET `/health` | GET `/health` | GET | Backend health |
| **GET `/api/health`** | **GET `/api/health`** | **GET** | **API health (spec compliant)** |

## Authentication

All protected endpoints require header: `Authorization: Bearer <token>`

- Tenant admin/user login must include `subdomain` in request body
- Super admin login has no subdomain requirement
- JWT tokens expire in 24 hours

## Notes

- 19 API endpoints as specified in main.goal.txt, plus `/api/health`
- Multi-tenant isolation enforced at database and API levels
- RBAC: super_admin, tenant_admin, user roles
- All responses follow `{ success, message, data }` structure
- Proper HTTP status codes: 200, 201, 400, 401, 403, 404, 409
# Multi-Tenant SaaS Platform - API Documentation

Base URL: `http://localhost:5000/api`

All authenticated endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Authentication Endpoints

### Register Tenant
**POST** `/auth/register`

Creates a new tenant and admin user.

**Request Body:**
```json
{
  "tenantName": "My Company",
  "subdomain": "mycompany",
  "adminEmail": "admin@mycompany.com",
  "adminPassword": "SecurePass123",
  "adminFullName": "John Doe"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Tenant registered successfully",
  "data": {
    "tenant": {
      "id": "uuid",
      "name": "My Company",
      "subdomain": "mycompany"
    },
    "admin": {
      "id": "uuid",
      "email": "admin@mycompany.com",
      "fullName": "John Doe",
      "role": "admin"
    }
  }
}
```

### Login
**POST** `/auth/login`

Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "email": "admin@mycompany.com",
  "password": "SecurePass123",
  "subdomain": "mycompany"
}
```

**Note:** Leave `subdomain` empty or set to "admin" for super admin login.

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "jwt_token_here",
    "user": {
      "id": "uuid",
      "email": "admin@mycompany.com",
      "fullName": "John Doe",
      "role": "admin",
      "tenantId": "uuid"
    }
  }
}
```

### Get Profile
**GET** `/auth/profile`

Get current user's profile.

**Headers:** Authorization: Bearer {token}

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "admin@mycompany.com",
    "fullName": "John Doe",
    "role": "admin",
    "isActive": true,
    "tenantId": "uuid",
    "tenantName": "My Company",
    "subdomain": "mycompany",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

## Tenant Endpoints

### Get All Tenants
**GET** `/tenants`

Get list of all tenants (Super Admin only).

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `status` (string): Filter by status (active/suspended)
- `subscriptionPlan` (string): Filter by plan (free/pro/enterprise)

**Response (200):**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalTenants": 50,
    "limit": 10
  }
}
```

### Get Current Tenant
**GET** `/tenants/current`

Get current user's tenant information.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "My Company",
    "subdomain": "mycompany",
    "status": "active",
    "subscription_plan": "free",
    "max_users": 5,
    "max_projects": 3,
    "stats": {
      "total_users": "3",
      "total_projects": "2",
      "total_tasks": "10"
    }
  }
}
```

### Get Tenant by ID
**GET** `/tenants/:id`

Get specific tenant details.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "My Company",
    "subdomain": "mycompany",
    "status": "active",
    "subscription_plan": "free",
    "max_users": 5,
    "max_projects": 3,
    "created_at": "2024-01-01T00:00:00.000Z",
    "stats": {
      "total_users": "3",
      "total_projects": "2",
      "total_tasks": "10"
    }
  }
}
```

### Update Tenant
**PUT** `/tenants/:id`

Update tenant information.

**Request Body:**
```json
{
  "name": "Updated Company Name",
  "status": "active",
  "subscription_plan": "pro",
  "max_users": 25,
  "max_projects": 15
}
```

**Note:** Only super admin can update subscription_plan, max_users, max_projects, and status.

**Response (200):**
```json
{
  "success": true,
  "message": "Tenant updated successfully",
  "data": {...}
}
```

---

## User Endpoints

### Create User
**POST** `/users`

Create a new user (Admin/Super Admin only).

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "fullName": "Jane Smith",
  "role": "user",
  "tenantId": "uuid"
}
```

**Note:** `tenantId` is required for super admin, automatically set to current tenant for admins.

**Response (201):**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "id": "uuid",
    "tenant_id": "uuid",
    "email": "user@example.com",
    "full_name": "Jane Smith",
    "role": "user",
    "is_active": true,
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### Get Users
**GET** `/users`

Get list of users (Admin/Super Admin only).

**Query Parameters:**
- `search` (string): Search by name or email
- `role` (string): Filter by role
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 50)
- `tenantId` (string): Filter by tenant (super admin only)

**Response (200):**
```json
{
  "success": true,
  "data": [...],
  "total": 10,
  "pagination": {
    "currentPage": 1,
    "totalPages": 1,
    "limit": 50
  }
}
```

### Get User by ID
**GET** `/users/:id`

Get specific user details.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "fullName": "Jane Smith",
    "role": "user",
    "isActive": true,
    "tenantId": "uuid",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Update User
**PUT** `/users/:id`

Update user information.

**Request Body:**
```json
{
  "full_name": "Jane Doe",
  "role": "admin",
  "is_active": true
}
```

**Note:** Regular users can only update their own full_name.

**Response (200):**
```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {...}
}
```

### Delete User
**DELETE** `/users/:id`

Delete a user (Admin/Super Admin only).

**Response (200):**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

---

## Project Endpoints

### Create Project
**POST** `/projects`

Create a new project.

**Request Body:**
```json
{
  "name": "Project Alpha",
  "description": "Description of the project",
  "status": "active"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Project created successfully",
  "data": {
    "id": "uuid",
    "tenant_id": "uuid",
    "name": "Project Alpha",
    "description": "Description of the project",
    "status": "active",
    "created_by": "uuid",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### Get Projects
**GET** `/projects`

Get list of projects for current tenant.

**Query Parameters:**
- `status` (string): Filter by status
- `search` (string): Search by name
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20)

**Response (200):**
```json
{
  "success": true,
  "data": [...],
  "total": 5,
  "pagination": {
    "currentPage": 1,
    "totalPages": 1,
    "limit": 20
  }
}
```

### Get Project by ID
**GET** `/projects/:id`

Get specific project details.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "tenant_id": "uuid",
    "name": "Project Alpha",
    "description": "Description",
    "status": "active",
    "created_by": "uuid",
    "creator_name": "John Doe",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### Update Project
**PUT** `/projects/:id`

Update project information.

**Request Body:**
```json
{
  "name": "Updated Project Name",
  "description": "Updated description",
  "status": "completed"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Project updated successfully",
  "data": {...}
}
```

### Delete Project
**DELETE** `/projects/:id`

Delete a project (Admin only, cascades to tasks).

**Response (200):**
```json
{
  "success": true,
  "message": "Project deleted successfully"
}
```

---

## Task Endpoints

### Create Task
**POST** `/tasks`

Create a new task.

**Request Body:**
```json
{
  "projectId": "uuid",
  "title": "Task Title",
  "description": "Task description",
  "status": "todo",
  "priority": "high",
  "assignedTo": "uuid",
  "dueDate": "2024-12-31"
}
```

**Status values:** `todo`, `in_progress`, `completed`  
**Priority values:** `low`, `medium`, `high`

**Response (201):**
```json
{
  "success": true,
  "message": "Task created successfully",
  "data": {
    "id": "uuid",
    "project_id": "uuid",
    "tenant_id": "uuid",
    "title": "Task Title",
    "description": "Task description",
    "status": "todo",
    "priority": "high",
    "assigned_to": "uuid",
    "due_date": "2024-12-31",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### Get Tasks by Project
**GET** `/tasks/project/:projectId`

Get all tasks for a specific project.

**Query Parameters:**
- `status` (string): Filter by status
- `assignedTo` (string): Filter by assigned user ID
- `priority` (string): Filter by priority
- `search` (string): Search by title
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 50)

**Response (200):**
```json
{
  "success": true,
  "data": [...],
  "total": 15,
  "pagination": {
    "currentPage": 1,
    "totalPages": 1,
    "limit": 50
  }
}
```

### Get Task by ID
**GET** `/tasks/:id`

Get specific task details.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "project_id": "uuid",
    "tenant_id": "uuid",
    "title": "Task Title",
    "description": "Task description",
    "status": "in_progress",
    "priority": "high",
    "assigned_to": "uuid",
    "assigned_to_name": "Jane Smith",
    "assigned_to_email": "jane@example.com",
    "due_date": "2024-12-31",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### Update Task
**PUT** `/tasks/:id`

Update task information.

**Request Body:**
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "status": "in_progress",
  "priority": "medium",
  "assigned_to": "uuid",
  "due_date": "2024-12-31"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Task updated successfully",
  "data": {...}
}
```

### Update Task Status
**PATCH** `/tasks/:id/status`

Update only the task status.

**Request Body:**
```json
{
  "status": "completed"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Task status updated successfully",
  "data": {...}
}
```

### Delete Task
**DELETE** `/tasks/:id`

Delete a task.

**Response (200):**
```json
{
  "success": true,
  "message": "Task deleted successfully"
}
```

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "success": false,
  "message": "Validation error message"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "No token provided"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Resource not found"
}
```

### 409 Conflict
```json
{
  "success": false,
  "message": "Resource already exists"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error"
}
```

---

## Authentication Flow

1. **Register:** POST `/auth/register` to create a new tenant and admin user
2. **Login:** POST `/auth/login` with email, password, and subdomain to get JWT token
3. **Use Token:** Include token in Authorization header for all subsequent requests
4. **Token Expiry:** Tokens expire after 24 hours, user must login again

## Multi-Tenancy

- Each request (except super admin) is automatically scoped to the user's tenant
- Data isolation is enforced at the database level using tenant_id
- Super admin can access all tenants, admins can only access their own tenant
- Regular users can only access data within their tenant

## Rate Limiting

Currently not implemented. Consider adding rate limiting for production use.

## Health Check

**GET** `/health`

Check if server is running.

**Response (200):**
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```
