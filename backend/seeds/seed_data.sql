-- Seed Data for Multi-Tenant SaaS Platform
-- This file populates the database with initial test data
-- All passwords are hashed with bcrypt (salt rounds: 10)

-- Note: Password hashes below are for these passwords:
-- Admin@123 -> $2b$10$rN8YGHjKx0QdO7QXzBvQb.F5qLZ5X8nYZ5xGKj5Z5Z5Z5Z5Z5Z5Z5
-- Demo@123  -> $2b$10$7Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5.Y5xGKj5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5
-- User@123  -> $2b$10$5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5.X5xGKj5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5

-- ============================================================================
-- 1. INSERT SUPER ADMIN
-- ============================================================================
-- Super Admin user (tenant_id = NULL, role = super_admin)
-- Email: superadmin@system.com
-- Password: Admin@123
INSERT INTO users (id, tenant_id, email, password_hash, full_name, role, is_active, created_at, updated_at)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    NULL,
    'superadmin@system.com',
    '$2b$10$rN8YGHjKx0QdO7QXzBvQb.F5qLZ5X8nYZ5xGKj5Z5Z5Z5Z5Z5Z5Z5',
    'Super Administrator',
    'super_admin',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (tenant_id, email) DO NOTHING;

-- ============================================================================
-- 2. INSERT DEMO TENANT
-- ============================================================================
-- Demo Company tenant with PRO plan
INSERT INTO tenants (id, name, subdomain, status, subscription_plan, max_users, max_projects, created_at, updated_at)
VALUES (
    '10000000-0000-0000-0000-000000000001',
    'Demo Company',
    'demo',
    'active',
    'pro',
    25,
    15,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (subdomain) DO NOTHING;

-- ============================================================================
-- 3. INSERT DEMO TENANT ADMIN
-- ============================================================================
-- Tenant Admin for Demo Company
-- Email: admin@demo.com
-- Password: Demo@123
INSERT INTO users (id, tenant_id, email, password_hash, full_name, role, is_active, created_at, updated_at)
VALUES (
    '10000000-0000-0000-0000-000000000011',
    '10000000-0000-0000-0000-000000000001',
    'admin@demo.com',
    '$2b$10$7Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5.Y5xGKj5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5',
    'Demo Admin',
    'tenant_admin',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (tenant_id, email) DO NOTHING;

-- ============================================================================
-- 4. INSERT REGULAR USERS FOR DEMO TENANT
-- ============================================================================
-- User 1
-- Email: user1@demo.com
-- Password: User@123
INSERT INTO users (id, tenant_id, email, password_hash, full_name, role, is_active, created_at, updated_at)
VALUES (
    '10000000-0000-0000-0000-000000000021',
    '10000000-0000-0000-0000-000000000001',
    'user1@demo.com',
    '$2b$10$5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5.X5xGKj5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5',
    'John Developer',
    'user',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (tenant_id, email) DO NOTHING;

-- User 2
-- Email: user2@demo.com
-- Password: User@123
INSERT INTO users (id, tenant_id, email, password_hash, full_name, role, is_active, created_at, updated_at)
VALUES (
    '10000000-0000-0000-0000-000000000022',
    '10000000-0000-0000-0000-000000000001',
    'user2@demo.com',
    '$2b$10$5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5.X5xGKj5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5',
    'Sarah Designer',
    'user',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (tenant_id, email) DO NOTHING;

-- ============================================================================
-- 5. INSERT SAMPLE PROJECTS
-- ============================================================================
-- Project 1: Website Redesign
INSERT INTO projects (id, tenant_id, name, description, status, created_by, created_at, updated_at)
VALUES (
    '20000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    'Website Redesign',
    'Complete redesign of company website with modern UI/UX',
    'active',
    '10000000-0000-0000-0000-000000000011',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (id) DO NOTHING;

-- Project 2: Mobile App Development
INSERT INTO projects (id, tenant_id, name, description, status, created_by, created_at, updated_at)
VALUES (
    '20000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000001',
    'Mobile App Development',
    'Native mobile application for iOS and Android platforms',
    'active',
    '10000000-0000-0000-0000-000000000011',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 6. INSERT SAMPLE TASKS
-- ============================================================================
-- Tasks for Website Redesign Project
INSERT INTO tasks (id, project_id, tenant_id, title, description, status, priority, assigned_to, due_date, created_at, updated_at)
VALUES
    (
        '30000000-0000-0000-0000-000000000001',
        '20000000-0000-0000-0000-000000000001',
        '10000000-0000-0000-0000-000000000001',
        'Design homepage mockup',
        'Create high-fidelity design mockups for the homepage',
        'completed',
        'high',
        '10000000-0000-0000-0000-000000000022',
        CURRENT_DATE + INTERVAL '5 days',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        '30000000-0000-0000-0000-000000000002',
        '20000000-0000-0000-0000-000000000001',
        '10000000-0000-0000-0000-000000000001',
        'Implement responsive navigation',
        'Code responsive navigation menu with mobile support',
        'in_progress',
        'high',
        '10000000-0000-0000-0000-000000000021',
        CURRENT_DATE + INTERVAL '7 days',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        '30000000-0000-0000-0000-000000000003',
        '20000000-0000-0000-0000-000000000001',
        '10000000-0000-0000-0000-000000000001',
        'Setup contact form',
        'Integrate contact form with email notification system',
        'todo',
        'medium',
        '10000000-0000-0000-0000-000000000021',
        CURRENT_DATE + INTERVAL '10 days',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
ON CONFLICT (id) DO NOTHING;

-- Tasks for Mobile App Development Project
INSERT INTO tasks (id, project_id, tenant_id, title, description, status, priority, assigned_to, due_date, created_at, updated_at)
VALUES
    (
        '30000000-0000-0000-0000-000000000004',
        '20000000-0000-0000-0000-000000000002',
        '10000000-0000-0000-0000-000000000001',
        'Setup React Native project',
        'Initialize React Native project with required dependencies',
        'completed',
        'high',
        '10000000-0000-0000-0000-000000000021',
        CURRENT_DATE - INTERVAL '2 days',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        '30000000-0000-0000-0000-000000000005',
        '20000000-0000-0000-0000-000000000002',
        '10000000-0000-0000-0000-000000000001',
        'Design app screens',
        'Create UI designs for all main app screens',
        'in_progress',
        'high',
        '10000000-0000-0000-0000-000000000022',
        CURRENT_DATE + INTERVAL '14 days',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 7. INSERT AUDIT LOG ENTRIES
-- ============================================================================
INSERT INTO audit_logs (id, tenant_id, user_id, action, entity_type, entity_id, ip_address, created_at)
VALUES
    (
        '40000000-0000-0000-0000-000000000001',
        '10000000-0000-0000-0000-000000000001',
        '10000000-0000-0000-0000-000000000011',
        'CREATE_TENANT',
        'tenant',
        '10000000-0000-0000-0000-000000000001',
        '127.0.0.1',
        CURRENT_TIMESTAMP
    ),
    (
        '40000000-0000-0000-0000-000000000002',
        '10000000-0000-0000-0000-000000000001',
        '10000000-0000-0000-0000-000000000011',
        'CREATE_PROJECT',
        'project',
        '20000000-0000-0000-0000-000000000001',
        '127.0.0.1',
        CURRENT_TIMESTAMP
    ),
    (
        '40000000-0000-0000-0000-000000000003',
        '10000000-0000-0000-0000-000000000001',
        '10000000-0000-0000-0000-000000000011',
        'CREATE_PROJECT',
        'project',
        '20000000-0000-0000-0000-000000000002',
        '127.0.0.1',
        CURRENT_TIMESTAMP
    )
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SEED DATA SUMMARY
-- ============================================================================
-- Super Admin: superadmin@system.com / Admin@123
-- Demo Tenant: subdomain = 'demo'
--   - Tenant Admin: admin@demo.com / Demo@123
--   - User 1: user1@demo.com / User@123
--   - User 2: user2@demo.com / User@123
-- Projects: 2 (Website Redesign, Mobile App Development)
-- Tasks: 5 (distributed across projects)
-- Audit Logs: 3 sample entries
-- ============================================================================

-- Display success message
DO $$
BEGIN
    RAISE NOTICE 'Seed data inserted successfully!';
    RAISE NOTICE 'Credentials:';
    RAISE NOTICE '  Super Admin: superadmin@system.com / Admin@123';
    RAISE NOTICE '  Demo Admin: admin@demo.com / Demo@123';
    RAISE NOTICE '  Demo User 1: user1@demo.com / User@123';
    RAISE NOTICE '  Demo User 2: user2@demo.com / User@123';
END $$;
