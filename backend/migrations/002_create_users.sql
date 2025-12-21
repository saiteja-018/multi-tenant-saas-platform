-- Migration: Create users table
-- Description: Stores user accounts with tenant association and role-based access

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(36) REFERENCES tenants(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('super_admin', 'tenant_admin', 'user')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Email must be unique per tenant (but can exist in different tenants)
    -- Super admins have tenant_id = NULL and email must be globally unique
    CONSTRAINT unique_email_per_tenant UNIQUE (tenant_id, email)
);

-- Create index on tenant_id for efficient tenant filtering
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);

-- Create index on email for login lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Create index on role for authorization queries
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

COMMENT ON TABLE users IS 'Stores user accounts with multi-tenant isolation';
COMMENT ON COLUMN users.tenant_id IS 'NULL for super_admin users, references tenant for others';
COMMENT ON COLUMN users.role IS 'super_admin: system-wide, tenant_admin: org admin, user: regular';
COMMENT ON COLUMN users.password_hash IS 'Bcrypt hashed password (never store plain text)';
