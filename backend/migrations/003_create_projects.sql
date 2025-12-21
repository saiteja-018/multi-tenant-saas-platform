-- Migration: Create projects table
-- Description: Stores projects for each tenant with creator tracking

CREATE TABLE IF NOT EXISTS projects (
    id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'completed')),
    created_by VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create index on tenant_id for efficient tenant filtering (CRITICAL for multi-tenancy)
CREATE INDEX IF NOT EXISTS idx_projects_tenant_id ON projects(tenant_id);

-- Create index on created_by for filtering by creator
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects(created_by);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

-- Create composite index for common query pattern (tenant + status)
CREATE INDEX IF NOT EXISTS idx_projects_tenant_status ON projects(tenant_id, status);

COMMENT ON TABLE projects IS 'Stores projects with tenant isolation';
COMMENT ON COLUMN projects.tenant_id IS 'Ensures project belongs to specific tenant';
COMMENT ON COLUMN projects.created_by IS 'User who created the project (tenant_admin or user)';
COMMENT ON COLUMN projects.status IS 'active: ongoing, archived: paused, completed: finished';
