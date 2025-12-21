const { query } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// Create project
const createProject = async ({ tenantId, name, description, status = 'active', createdBy }) => {
  const id = uuidv4();
  
  const sql = `
    INSERT INTO projects (id, tenant_id, name, description, status, created_by, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
    RETURNING *
  `;
  
  const result = await query(sql, [id, tenantId, name, description, status, createdBy]);
  return result.rows[0];
};

// Find project by ID
const findProjectById = async (id) => {
  const sql = `
    SELECT p.*, u.full_name as creator_name
    FROM projects p
    LEFT JOIN users u ON p.created_by = u.id
    WHERE p.id = $1
  `;
  const result = await query(sql, [id]);
  return result.rows[0];
};

// List projects by tenant
const listProjectsByTenant = async (tenantId, { status, search, page = 1, limit = 20 }) => {
  const offset = (page - 1) * limit;
  const conditions = ['p.tenant_id = $1'];
  const values = [tenantId];
  let paramCount = 2;

  if (status) {
    conditions.push(`p.status = $${paramCount}`);
    values.push(status);
    paramCount++;
  }

  if (search) {
    conditions.push(`p.name ILIKE $${paramCount}`);
    values.push(`%${search}%`);
    paramCount++;
  }

  const whereClause = conditions.join(' AND ');

  // Get total count
  const countSql = `SELECT COUNT(*) as total FROM projects p WHERE ${whereClause}`;
  const countResult = await query(countSql, values);
  const total = parseInt(countResult.rows[0].total);

  // Get projects with task counts
  const sql = `
    SELECT p.*, u.full_name as creator_name,
           COUNT(t.id) as task_count,
           COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_task_count
    FROM projects p
    LEFT JOIN users u ON p.created_by = u.id
    LEFT JOIN tasks t ON p.id = t.project_id
    WHERE ${whereClause}
    GROUP BY p.id, u.full_name
    ORDER BY p.created_at DESC
    LIMIT $${paramCount} OFFSET $${paramCount + 1}
  `;

  values.push(limit, offset);
  const result = await query(sql, values);

  return {
    projects: result.rows,
    total,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      limit
    }
  };
};

// Update project
const updateProject = async (id, updates) => {
  const allowedFields = ['name', 'description', 'status'];
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
    UPDATE projects 
    SET ${fields.join(', ')}
    WHERE id = $${paramCount}
    RETURNING *
  `;

  const result = await query(sql, values);
  return result.rows[0];
};

// Delete project
const deleteProject = async (id) => {
  const sql = 'DELETE FROM projects WHERE id = $1 RETURNING id';
  const result = await query(sql, [id]);
  return result.rows[0];
};

// Count projects by tenant
const countProjectsByTenant = async (tenantId) => {
  const sql = 'SELECT COUNT(*) as count FROM projects WHERE tenant_id = $1';
  const result = await query(sql, [tenantId]);
  return parseInt(result.rows[0].count);
};

module.exports = {
  createProject,
  findProjectById,
  listProjectsByTenant,
  updateProject,
  deleteProject,
  countProjectsByTenant
};
