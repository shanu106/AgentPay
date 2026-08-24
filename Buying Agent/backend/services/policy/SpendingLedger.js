/**
 * SpendingLedger — Atomic Spending Tracker with Race-Condition Protection
 * 
 * Uses PostgreSQL row-level locking (SELECT ... FOR UPDATE) to prevent
 * concurrent purchases from exceeding daily spending limits.
 * 
 * Example race condition prevented:
 *   Daily limit = ₹5,000
 *   Request A = ₹4,000 (concurrent)
 *   Request B = ₹3,000 (concurrent)
 *   Without locking: Both see spent=₹0, both approve → ₹7,000 spent (VIOLATION)
 *   With locking: A acquires lock, updates to ₹4,000, B sees ₹4,000 → DENY
 */

const { pool } = require('../../db/index');

class SpendingLedger {
  /**
   * Atomically reserve spending capacity. Uses row-level locking.
   * Returns { success, spentBefore, spentAfter, dailyLimit } or { success: false, reason }
   */
  static async reserveSpend(userId, amount) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Lock the authorization row for this user with SQL date equality
      const authRes = await client.query(
        `SELECT *, (spent_today_reset_date = CURRENT_DATE) AS is_today 
         FROM agent_authorizations 
         WHERE user_id = $1 AND status = 'active' 
         ORDER BY created_at DESC LIMIT 1
         FOR UPDATE`,
        [userId]
      );

      if (authRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return { success: false, reason: 'NO_ACTIVE_AUTHORIZATION' };
      }

      const auth = authRes.rows[0];
      const dailyLimit = parseFloat(auth.daily_spending_limit);
      let spentToday = auth.is_today ? parseFloat(auth.spent_today || 0) : 0;

      // Check if reservation would exceed limit
      if (spentToday + amount > dailyLimit) {
        await client.query('ROLLBACK');
        return {
          success: false,
          reason: 'DAILY_LIMIT_EXCEEDED',
          spentToday,
          amount,
          dailyLimit,
          remaining: dailyLimit - spentToday
        };
      }

      // Reserve the spend
      const newSpent = spentToday + amount;
      await client.query(
        `UPDATE agent_authorizations 
         SET spent_today = $1, spent_today_reset_date = CURRENT_DATE, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $2`,
        [newSpent, auth.id]
      );

      await client.query('COMMIT');

      return {
        success: true,
        authorizationId: auth.id,
        spentBefore: spentToday,
        spentAfter: newSpent,
        dailyLimit,
        remaining: dailyLimit - newSpent
      };
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('[SpendingLedger] Reserve error:', err.message);
      return { success: false, reason: 'LEDGER_ERROR', error: err.message };
    } finally {
      client.release();
    }
  }

  /**
   * Rollback a spending reservation (e.g., on payment failure).
   * Atomically decrements spent_today.
   */
  static async rollbackSpend(userId, amount) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const authRes = await client.query(
        `SELECT * FROM agent_authorizations 
         WHERE user_id = $1 AND status = 'active' 
         ORDER BY created_at DESC LIMIT 1
         FOR UPDATE`,
        [userId]
      );

      if (authRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return { success: false, reason: 'NO_ACTIVE_AUTHORIZATION' };
      }

      const auth = authRes.rows[0];
      const currentSpent = parseFloat(auth.spent_today || 0);
      const newSpent = Math.max(0, currentSpent - amount);

      await client.query(
        `UPDATE agent_authorizations 
         SET spent_today = $1, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $2`,
        [newSpent, auth.id]
      );

      await client.query('COMMIT');

      return {
        success: true,
        spentBefore: currentSpent,
        spentAfter: newSpent,
        rolledBack: amount
      };
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('[SpendingLedger] Rollback error:', err.message);
      return { success: false, reason: 'ROLLBACK_ERROR', error: err.message };
    } finally {
      client.release();
    }
  }

  /**
   * Get current spending stats for a user
   */
  static async getSpendingStats(userId) {
    try {
      const res = await pool.query(
        `SELECT * FROM agent_authorizations 
         WHERE user_id = $1 AND status = 'active' 
         ORDER BY created_at DESC LIMIT 1`,
        [userId]
      );

      if (res.rows.length === 0) {
        return { spentToday: 0, dailyLimit: 0, remaining: 0 };
      }

      const auth = res.rows[0];
      const todayStr = new Date().toISOString().split('T')[0];
      const spentToday = auth.spent_today_reset_date === todayStr 
        ? parseFloat(auth.spent_today || 0) 
        : 0;
      const dailyLimit = parseFloat(auth.daily_spending_limit);

      return {
        spentToday,
        dailyLimit,
        remaining: dailyLimit - spentToday,
        maxTransaction: parseFloat(auth.max_transaction_amount),
        confirmationThreshold: parseFloat(auth.require_confirmation_above || 0)
      };
    } catch (err) {
      console.error('[SpendingLedger] Stats error:', err.message);
      return { spentToday: 0, dailyLimit: 10000, remaining: 10000 };
    }
  }
}

module.exports = SpendingLedger;
