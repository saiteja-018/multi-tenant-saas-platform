const { query } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const logAudit = async ({ tenantId, userId, action, entityType, entityId, ipAddress, metadata = {} }) => {
  try {
    const id = uuidv4();
    const sql = `
      INSERT INTO audit_logs (id, tenant_id, user_id, action, entity_type, entity_id, ip_address, metadata, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
    `;
    
    await query(sql, [
      id,
      tenantId || null,
      userId || null,
      action,
      entityType || null,
      entityId || null,
      ipAddress || null,
      JSON.stringify(metadata)
    ]);
    
    return { success: true };
  } catch (error) {
    console.error('Audit log error:', error);
    // Don't throw - audit logging should not break the main operation
    return { success: false, error: error.message };
  }
};

module.exports = { logAudit };
