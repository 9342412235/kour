import { query } from '../db/pool.js';

/**
 * Records an entry in audit_logs. Safe to call from any authenticated
 * route — pass the Express `req` so we can pull the actor + IP
 * automatically, plus an `action` string and optional entity/details.
 *
 * Never throws: an audit-log failure should never break the request that
 * triggered it.
 */
export async function logAudit(req, { action, entityType = null, entityId = null, details = {} }) {
  try {
    const actor = req.user || null;
    await query(
      `INSERT INTO audit_logs (actor_id, actor_name, actor_role, action, entity_type, entity_id, details, ip_address)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [
        actor?.id || null,
        actor?.name || 'system',
        actor?.role || 'system',
        action,
        entityType,
        entityId ? String(entityId) : null,
        JSON.stringify(details || {}),
        req.ip || null,
      ]
    );
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Failed to write audit log:', err.message);
  }
}
