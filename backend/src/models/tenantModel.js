const { query } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// Create tenant
const createTenant = async ({ name, subdomain, subscriptionPlan = 'free', status = 'active' }) => {
  const id = uuidv4();
  
  // Set limits based on plan
  const limits = {
    free: { maxUsers: 5, maxProjects: 3 },
    pro: { maxUsers: 25, maxProjects: 15 },
    enterprise: { maxUsers: 100, maxProjects: 50 }
  };
  
  const { maxUsers, maxProjects } = limits[subscriptionPlan] || limits.free;
  
  const sql = `
    INSERT INTO tenants (id, name, subdomain, status, subscription_plan, max_users, max_projects, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
    RETURNING *
  `;
  
  const result = await query(sql, [id, name, subdomain, status, subscriptionPlan, maxUsers, maxProjects]);
  return result.rows[0];
};

// Find tenant by ID
const findTenantById = async (id) => {
  const sql = 'SELECT * FROM tenants WHERE id = $1';
  const result = await query(sql, [id]);
  return result.rows[0];
};

// Find tenant by subdomain
const findTenantBySubdomain = async (subdomain) => {
  const sql = 'SELECT * FROM tenants WHERE subdomain = $1';
  const result = await query(sql, [subdomain]);
  return result.rows[0];
};

// Update tenant
const updateTenant = async (id, updates) => {
  const allowedFields = ['name', 'status', 'subscription_plan', 'max_users', 'max_projects'];
  const fields = [];
  const values = [];
  let paramCount = 1;

  Object.keys(updates).forEach(key => {
    if (allowedFields.includes(key) && updates[key] !== undefined) {
      fields.push(`${key} = $${paramCount}`);
      values.push(updates[key]);
      paramCount++;
    }
  });

  if (fields.length === 0) {
    throw new Error('No valid fields to update');
  }

  fields.push(`updated_at = NOW()`);
  values.push(id);

  const sql = `
    UPDATE tenants 
    SET ${fields.join(', ')}
    WHERE id = $${paramCount}
    RETURNING *
  `;

  const result = await query(sql, values);
  return result.rows[0];
};

// List all tenants (with pagination and filters)
const listTenants = async ({ page = 1, limit = 10, status, subscriptionPlan }) => {
  const offset = (page - 1) * limit;
  const conditions = [];
  const values = [];
  let paramCount = 1;

  if (status) {
    conditions.push(`status = $${paramCount}`);
    values.push(status);
    paramCount++;
  }

  if (subscriptionPlan) {
    conditions.push(`subscription_plan = $${paramCount}`);
    values.push(subscriptionPlan);
    paramCount++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Get total count
  const countSql = `SELECT COUNT(*) as total FROM tenants ${whereClause}`;
  const countResult = await query(countSql, values);
  const total = parseInt(countResult.rows[0].total);

  // Get tenants with user and project counts
  const sql = `
    SELECT t.*,
           COUNT(DISTINCT u.id) as total_users,
           COUNT(DISTINCT p.id) as total_projects
    FROM tenants t
    LEFT JOIN users u ON t.id = u.tenant_id
    LEFT JOIN projects p ON t.id = p.tenant_id
    ${whereClause}
    GROUP BY t.id
    ORDER BY t.created_at DESC
    LIMIT $${paramCount} OFFSET $${paramCount + 1}
  `;

  values.push(limit, offset);
  const result = await query(sql, values);

  return {
    tenants: result.rows,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalTenants: total,
      limit
    }
  };
};

// Get tenant stats
const getTenantStats = async (tenantId) => {
  const sql = `
    SELECT 
      (SELECT COUNT(*) FROM users WHERE tenant_id = $1) as total_users,
      (SELECT COUNT(*) FROM projects WHERE tenant_id = $1) as total_projects,
      (SELECT COUNT(*) FROM tasks WHERE tenant_id = $1) as total_tasks
  `;
  
  const result = await query(sql, [tenantId]);
  return result.rows[0];
};

module.exports = {
  createTenant,
  findTenantById,
  findTenantBySubdomain,
  updateTenant,
  listTenants,
  getTenantStats
};
