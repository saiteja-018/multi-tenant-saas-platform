-- Migration: Create tasks table
-- Description: Stores tasks within projects with assignment and priority tracking

CREATE TABLE IF NOT EXISTS tasks (
    id VARCHAR(36) PRIMARY KEY,
    project_id VARCHAR(36) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    tenant_id VARCHAR(36) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'completed')),
    priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    assigned_to VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
    due_date DATE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create index on tenant_id for efficient tenant filtering (CRITICAL for multi-tenancy)
CREATE INDEX IF NOT EXISTS idx_tasks_tenant_id ON tasks(tenant_id);

-- Create index on project_id for filtering tasks by project
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);

-- Create composite index for most common query pattern (tenant + project)
CREATE INDEX IF NOT EXISTS idx_tasks_tenant_project ON tasks(tenant_id, project_id);

-- Create index on assigned_to for filtering by assignee
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);

-- Create index on priority for sorting
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);

-- Create index on due_date for deadline queries
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);

COMMENT ON TABLE tasks IS 'Stores tasks within projects with tenant isolation';
COMMENT ON COLUMN tasks.tenant_id IS 'Redundant but ensures isolation even if project is deleted';
COMMENT ON COLUMN tasks.assigned_to IS 'User responsible for task (nullable for unassigned)';
COMMENT ON COLUMN tasks.due_date IS 'Target completion date (nullable for no deadline)';
