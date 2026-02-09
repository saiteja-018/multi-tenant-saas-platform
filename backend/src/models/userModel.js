const { query } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// Create user
const createUser = async ({ tenantId, email, passwordHash, fullName, role = 'user', isActive = true }, client = null) => {
  const id = uuidv4();
  
  const sql = `
    INSERT INTO users (id, tenant_id, email, password_hash, full_name, role, is_active, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
    RETURNING id, tenant_id, email, full_name, role, is_active, created_at, updated_at
  `;
  
  const runQuery = client ? client.query.bind(client) : query;
  const result = await runQuery(sql, [id, tenantId, email, passwordHash, fullName, role, isActive]);
  return result.rows[0];
};

// Find user by ID
const findUserById = async (id) => {
  const sql = `
    SELECT u.id, u.tenant_id, u.email, u.password_hash, u.full_name, u.role, u.is_active, 
           u.created_at, u.updated_at,
           t.name as tenant_name, t.subdomain, t.subscription_plan, t.max_users, t.max_projects
    FROM users u
    LEFT JOIN tenants t ON u.tenant_id = t.id
    WHERE u.id = $1
  `;
  const result = await query(sql, [id]);
  return result.rows[0];
};

// Find user by email and tenant
const findUserByEmailAndTenant = async (email, tenantId) => {
  const sql = 'SELECT * FROM users WHERE email = $1 AND tenant_id = $2';
  const result = await query(sql, [email, tenantId]);
  return result.rows[0];
};

// Find super admin by email
const findSuperAdminByEmail = async (email) => {
  const sql = 'SELECT * FROM users WHERE email = $1 AND role = $2 AND tenant_id IS NULL';
  const result = await query(sql, [email, 'super_admin']);
  return result.rows[0];
};

// List users by tenant
const listUsersByTenant = async (tenantId, { search, role, page = 1, limit = 50 }) => {
  const offset = (page - 1) * limit;
  const conditions = ['tenant_id = $1'];
  const values = [tenantId];
  let paramCount = 2;

  if (search) {
    conditions.push(`(full_name ILIKE $${paramCount} OR email ILIKE $${paramCount})`);
    values.push(`%${search}%`);
    paramCount++;
  }

  if (role) {
    conditions.push(`role = $${paramCount}`);
    values.push(role);
    paramCount++;
  }

  const whereClause = conditions.join(' AND ');

  // Get total count
  const countSql = `SELECT COUNT(*) as total FROM users WHERE ${whereClause}`;
  const countResult = await query(countSql, values);
  const total = parseInt(countResult.rows[0].total);

  // Get users
  const sql = `
    SELECT id, tenant_id, email, full_name, role, is_active, created_at, updated_at
    FROM users
    WHERE ${whereClause}
    ORDER BY created_at DESC
    LIMIT $${paramCount} OFFSET $${paramCount + 1}
  `;

  values.push(limit, offset);
  const result = await query(sql, values);

  return {
    users: result.rows,
    total,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      limit
    }
  };
};

// Update user
const updateUser = async (id, updates) => {
  const allowedFields = ['full_name', 'role', 'is_active'];
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
    UPDATE users 
    SET ${fields.join(', ')}
    WHERE id = $${paramCount}
    RETURNING id, tenant_id, email, full_name, role, is_active, updated_at
  `;

  const result = await query(sql, values);
  return result.rows[0];
};

// Delete user
const deleteUser = async (id) => {
  const sql = 'DELETE FROM users WHERE id = $1 RETURNING id';
  const result = await query(sql, [id]);
  return result.rows[0];
};

// Count users in tenant
const countUsersByTenant = async (tenantId) => {
  const sql = 'SELECT COUNT(*) as count FROM users WHERE tenant_id = $1';
  const result = await query(sql, [tenantId]);
  return parseInt(result.rows[0].count);
};

module.exports = {
  createUser,
  findUserById,
  findUserByEmailAndTenant,
  findSuperAdminByEmail,
  listUsersByTenant,
  updateUser,
  deleteUser,
  countUsersByTenant
};
