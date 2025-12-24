# Multi-Tenant SaaS Platform

A production-ready, multi-tenant SaaS application for project and task management with complete data isolation, role-based access control, and subscription management.

## 🎥 Demo Video

Watch the walkthrough: [Demo Video](https://drive.google.com/file/d/1b1ZM6l_P1tLVlmN1ZI7_c6x4DNnk2_fy/view?usp=sharing)

## 🚀 Features

- **Multi-Tenancy**: Complete data isolation between organizations using shared database with tenant_id filtering
- **Authentication**: JWT-based stateless authentication with 24-hour expiry
- **Authorization**: Three-tier role system (Super Admin, Tenant Admin, User)
- **Project Management**: Create, track, and manage projects within teams
- **Task Management**: Assign tasks, set priorities, track status and deadlines
- **Subscription Plans**: Free, Pro, and Enterprise tiers with enforced limits
- **Audit Logging**: Complete audit trail for security and compliance
- **Docker Support**: Fully containerized with docker-compose for easy deployment

## 📋 Tech Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js 4.18+
- **Database**: PostgreSQL 15
- **Authentication**: JWT + bcrypt
- **Validation**: express-validator

### Frontend
- **Framework**: React 18+
- **Routing**: React Router 6
- **HTTP Client**: Axios
- **State Management**: React Context API

### DevOps
- **Containerization**: Docker + Docker Compose
- **Database Initialization**: Automatic migrations and seeding

## 🏗️ Architecture

```
┌──────────────┐
│   Frontend   │  (React - Port 3000)
│   Container  │
└──────┬───────┘
       │ HTTP/HTTPS
       ▼
┌──────────────┐
│   Backend    │  (Node.js + Express - Port 5000)
│     API      │
└──────┬───────┘
       │ SQL
       ▼
┌──────────────┐
│  PostgreSQL  │  (Port 5432)
│   Database   │
└──────────────┘
```

## 🚀 Quick Start with Docker (Recommended)

### Prerequisites
- Docker 20+ and Docker Compose 2+
- Git

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd Multi-Tenant-SaaS-Platform
```

2. **Start all services**
```bash
docker-compose up -d
```

This single command will:
- Start PostgreSQL database (port 5432)
- Run database migrations automatically
- Load seed data automatically
- Start backend API (port 5000)
- Start frontend application (port 3000)

3. **Wait for services to initialize** (30-60 seconds)

4. **Verify deployment**
```bash
# Check health endpoint
curl http://localhost:5000/health

# Expected response (example):
# {"success":true,"message":"Server is running","timestamp":"..."}
```

5. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- API Health: http://localhost:5000/health

### Default Credentials

| Role | Email | Password | Subdomain |
|------|-------|----------|-----------|
| Super Admin | superadmin@system.com | Admin@123 | N/A |
| Tenant Admin (Demo) | admin@demo.com | Demo@123 | demo |
| User 1 (Demo) | user1@demo.com | User@123 | demo |
| User 2 (Demo) | user2@demo.com | User@123 | demo |

## 📦 Project Structure

```
Multi-Tenant-SaaS-Platform/
├── backend/                    # Backend API
│   ├── src/
│   │   ├── controllers/       # Request handlers
│   │   ├── models/            # Database models
│   │   ├── routes/            # API routes
│   │   ├── middleware/        # Auth, validation, error handling
│   │   ├── utils/             # Helper functions
│   │   ├── config/            # Configuration files
│   │   └── server.js          # Entry point
│   ├── migrations/            # Database schema
│   ├── seeds/                 # Seed data
│   ├── scripts/               # Utility scripts
│   ├── Dockerfile             # Backend container config
│   ├── package.json           # Dependencies
│   └── .env                   # Environment variables
├── frontend/                  # Frontend Application
│   ├── src/
│   │   ├── components/        # Reusable components
│   │   ├── pages/             # Page components
│   │   ├── services/          # API services
│   │   ├── context/           # React context
│   │   └── App.jsx            # Main component
│   ├── public/                # Static assets
│   ├── Dockerfile             # Frontend container config
│   ├── package.json           # Dependencies
│   └── .env                   # Environment variables
├── docs/                      # Documentation
│   ├── research.md            # Multi-tenancy analysis
│   ├── PRD.md                 # Product requirements
│   ├── architecture.md        # System architecture
│   ├── technical-spec.md      # Technical specifications
│   └── API.md                 # API documentation
├── docker-compose.yml         # Docker orchestration
├── submission.json            # Test credentials
└── README.md                  # This file
```

## 🔧 Local Development (Without Docker)

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- npm 9+

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create database
createdb saas_db

# Configure environment
cp .env.example .env
# Edit .env with your database credentials

# Run migrations and seed data
npm run init-db

# Start development server
npm run dev
```

Backend will run on http://localhost:5000

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Set REACT_APP_API_URL=http://localhost:5000/api

# Start development server
npm start
```

Frontend will run on http://localhost:3000

## 🔐 API Endpoints

### Authentication (4 endpoints)
- `POST /api/auth/register-tenant` - Register new tenant
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Tenant Management (3 endpoints)
- `GET /api/tenants/:id` - Get tenant details
- `PUT /api/tenants/:id` - Update tenant
- `GET /api/tenants` - List all tenants (super_admin only)

### User Management (4 endpoints)
- `POST /api/tenants/:id/users` - Add user to tenant
- `GET /api/tenants/:id/users` - List tenant users
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Project Management (4 endpoints)
- `POST /api/projects` - Create project
- `GET /api/projects` - List projects
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Task Management (4 endpoints)
- `POST /api/projects/:id/tasks` - Create task
- `GET /api/projects/:id/tasks` - List tasks
- `PATCH /api/tasks/:id/status` - Update task status
- `PUT /api/tasks/:id` - Update task

### System (1 endpoint)
- `GET /health` - Health check

**Total: 20 API Endpoints**

Full API documentation available in [docs/API.md](docs/API.md)

## 🗄️ Database Schema

### Tables
1. **tenants** - Organization information and subscription details
2. **users** - User accounts with tenant association
3. **projects** - Projects within tenants
4. **tasks** - Tasks within projects
5. **audit_logs** - Audit trail for all actions

### Key Features
- Foreign key constraints with CASCADE delete
- Composite unique constraint on (tenant_id, email) for users
- Indexes on tenant_id for efficient filtering
- ENUM types for status and role fields

Full ERD available in [docs/architecture.md](docs/architecture.md)

## 🛡️ Security Features

- **Password Hashing**: bcrypt with 10 salt rounds
- **JWT Authentication**: Stateless tokens with 24-hour expiry
- **Data Isolation**: Automatic tenant_id filtering on all queries
- **Role-Based Access**: Three-tier permission system
- **SQL Injection Prevention**: Parameterized queries
- **CORS Protection**: Configured whitelist origins
- **Audit Logging**: Complete action tracking

## 🐳 Docker Commands

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Check service status
docker-compose ps

# Stop services
docker-compose down

# Rebuild containers
docker-compose build

# Remove everything (including volumes)
docker-compose down -v

# Access backend shell
docker-compose exec backend sh

# Access database
docker-compose exec database psql -U postgres -d saas_db
```

## 📊 Subscription Plans

| Plan | Max Users | Max Projects | Price |
|------|-----------|--------------|-------|
| Free | 5 | 3 | $0/month |
| Pro | 25 | 15 | $49/month |
| Enterprise | 100 | 50 | $199/month |

## 🧪 Testing

### API Testing
```bash
cd backend
npm test
```

### Manual Testing
1. Start the application
2. Login with seed credentials
3. Test multi-tenant isolation:
   - Login as Demo tenant admin
   - Create project and tasks
   - Login as different tenant - verify data isolation

## 📝 Environment Variables

### Backend (.env)
```
DB_HOST=database
DB_PORT=5432
DB_NAME=saas_db
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET=<your-secret-32-chars-min>
JWT_EXPIRES_IN=24h
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://frontend:3000
```

### Frontend (.env)
```
REACT_APP_API_URL=http://backend:5000/api
```

## 🚨 Important Notes

### For Docker Deployment
- Use service names (database, backend, frontend) for inter-service communication
- Fixed ports: Database (5432), Backend (5000), Frontend (3000)
- Database migrations and seeding happen automatically on startup
- All environment variables are included in the repository for evaluation

### Data Isolation
- Every query (except super_admin) is automatically filtered by tenant_id
- Cross-tenant access attempts return 403 Forbidden
- Super admins can access all tenant data

### Seed Data
- All seed credentials are documented in submission.json
- Passwords are properly hashed with bcrypt
- Demo tenant has sample projects and tasks

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For issues or questions:
- Open an issue on GitHub
- Check documentation in `/docs` folder
- Review API documentation in `docs/API.md`

## ✅ Verification Checklist

After deployment, verify:
- [ ] `docker-compose ps` shows all 3 services as "Up"
- [ ] `curl http://localhost:5000/health` returns a JSON with `success: true`
- [ ] Frontend accessible at http://localhost:3000
- [ ] Can login with superadmin@system.com / Admin@123
- [ ] Can login with admin@demo.com / Demo@123
- [ ] Dashboard shows sample projects and tasks
- [ ] Can create new project and task
- [ ] Multi-tenant isolation works (cannot access other tenant data)

## 🎯 Key Achievements

✅ Complete multi-tenant data isolation  
✅ Role-based access control (RBAC)  
✅ Subscription plan enforcement  
✅ Comprehensive audit logging  
✅ Fully Dockerized deployment  
✅ Automatic database initialization  
✅ RESTful API with 20 endpoints  
✅ Responsive React frontend  
✅ Production-ready architecture  

---

**Built with ❤️ using Node.js, React, and PostgreSQL**
