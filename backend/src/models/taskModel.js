const { query } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// Create task
const createTask = async ({ projectId, tenantId, title, description, status = 'todo', priority = 'medium', assignedTo, dueDate }) => {
  const id = uuidv4();
  
  const sql = `
    INSERT INTO tasks (id, project_id, tenant_id, title, description, status, priority, assigned_to, due_date, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
    RETURNING *
  `;
  
  const result = await query(sql, [id, projectId, tenantId, title, description, status, priority, assignedTo, dueDate]);
  return result.rows[0];
};

// Find task by ID
const findTaskById = async (id) => {
  const sql = `
    SELECT t.*, u.full_name as assigned_to_name, u.email as assigned_to_email
    FROM tasks t
    LEFT JOIN users u ON t.assigned_to = u.id
    WHERE t.id = $1
  `;
  const result = await query(sql, [id]);
  return result.rows[0];
};

// List tasks by project
const listTasksByProject = async (projectId, { status, assignedTo, priority, search, page = 1, limit = 50 }) => {
  const offset = (page - 1) * limit;
  const conditions = ['t.project_id = $1'];
  const values = [projectId];
  let paramCount = 2;

  if (status) {
    conditions.push(`t.status = $${paramCount}`);
    values.push(status);
    paramCount++;
  }

  if (assignedTo) {
    conditions.push(`t.assigned_to = $${paramCount}`);
    values.push(assignedTo);
    paramCount++;
  }

  if (priority) {
    conditions.push(`t.priority = $${paramCount}`);
    values.push(priority);
    paramCount++;
  }

  if (search) {
    conditions.push(`t.title ILIKE $${paramCount}`);
    values.push(`%${search}%`);
    paramCount++;
  }

  const whereClause = conditions.join(' AND ');

  // Get total count
  const countSql = `SELECT COUNT(*) as total FROM tasks t WHERE ${whereClause}`;
  const countResult = await query(countSql, values);
  const total = parseInt(countResult.rows[0].total);

  // Get tasks
  const sql = `
    SELECT t.*, u.full_name as assigned_to_name, u.email as assigned_to_email
    FROM tasks t
    LEFT JOIN users u ON t.assigned_to = u.id
    WHERE ${whereClause}
    ORDER BY 
      CASE t.priority 
        WHEN 'high' THEN 1
        WHEN 'medium' THEN 2
        WHEN 'low' THEN 3
      END,
      t.due_date ASC NULLS LAST,
      t.created_at DESC
    LIMIT $${paramCount} OFFSET $${paramCount + 1}
  `;

  values.push(limit, offset);
  const result = await query(sql, values);

  return {
    tasks: result.rows,
    total,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      limit
    }
  };
};

// Update task
const updateTask = async (id, updates) => {
  const allowedFields = ['title', 'description', 'status', 'priority', 'assigned_to', 'due_date'];
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
    UPDATE tasks 
    SET ${fields.join(', ')}
    WHERE id = $${paramCount}
    RETURNING *
  `;

  const result = await query(sql, values);
  return result.rows[0];
};

// Update task status only
const updateTaskStatus = async (id, status) => {
  const sql = `
    UPDATE tasks 
    SET status = $1, updated_at = NOW()
    WHERE id = $2
    RETURNING *
  `;

  const result = await query(sql, [status, id]);
  return result.rows[0];
};

// Delete task
const deleteTask = async (id) => {
  const sql = 'DELETE FROM tasks WHERE id = $1 RETURNING id';
  const result = await query(sql, [id]);
  return result.rows[0];
};

module.exports = {
  createTask,
  findTaskById,
  listTasksByProject,
  updateTask,
  updateTaskStatus,
  deleteTask
};
