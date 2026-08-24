/**
 * AuditService — Structured Audit Trail for Agentic Commerce
 * 
 * Standardized audit logging to PostgreSQL with redaction of sensitive credentials.
 * Never logs raw card numbers, CVVs, passwords, or JWT secrets.
 */

const { query } = require('../../db/index');

const SENSITIVE_KEYS = [
  'password', 'password_hash', 'passwordHash', 'cvv', 'card_number', 'cardNumber',
  'token', 'jwt', 'secret', 'keySecret', 'apiKey', 'authorization'
];

/**
 * Recursively sanitize objects to redact sensitive secrets before logging
 */
function sanitizeAuditPayload(obj, depth = 0) {
  if (depth > 4 || obj == null) return obj;
  if (typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeAuditPayload(item, depth + 1));
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    const keyLower = key.toLowerCase();
    if (SENSITIVE_KEYS.some(s => keyLower.includes(s.toLowerCase()))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeAuditPayload(value, depth + 1);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

class AuditService {
  /**
   * Log an autonomous commerce audit event
   * @param {string} actionType - Standard audit action type
   * @param {Object} data
   * @param {string} [data.userEmail]
   * @param {number} [data.userId]
   * @param {string} [data.orderId]
   * @param {string} [data.agentSessionId]
   * @param {string} [data.requestId]
   * @param {Object} [data.details]
   */
  static async log(actionType, data = {}) {
    const {
      userEmail,
      userId,
      orderId,
      agentSessionId,
      requestId,
      details = {}
    } = data;

    const eventId = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const safeDetails = sanitizeAuditPayload(details);

    try {
      await query(
        `INSERT INTO audit_logs (id, user_id, user_email, agent_session_id, order_id, request_id, action_type, details)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          eventId,
          userId || null,
          userEmail || null,
          agentSessionId || null,
          orderId || null,
          requestId || null,
          actionType,
          JSON.stringify(safeDetails)
        ]
      );
    } catch (err) {
      console.warn('[AuditService] Write failure:', err.message);
    }

    return { id: eventId, actionType, timestamp: new Date().toISOString() };
  }

  /**
   * Fetch recent audit trail for a user or global
   */
  static async getLogs(options = {}) {
    const { userEmail, limit = 50, actionType } = options;
    try {
      let queryText = 'SELECT * FROM audit_logs';
      const params = [];

      if (userEmail) {
        params.push(userEmail.toLowerCase().trim());
        queryText += ' WHERE user_email = $1';
      }

      if (actionType) {
        params.push(actionType);
        queryText += params.length === 1 ? ' WHERE action_type = $1' : ' AND action_type = $2';
      }

      queryText += ' ORDER BY timestamp DESC LIMIT $' + (params.length + 1);
      params.push(limit);

      const res = await query(queryText, params);
      return res.rows;
    } catch (err) {
      console.error('[AuditService] Query failure:', err.message);
      return [];
    }
  }
}

module.exports = AuditService;
