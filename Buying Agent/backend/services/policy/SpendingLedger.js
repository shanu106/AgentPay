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
  static async getSpendingStats(userId, userEmail = null) {
    try {
      let authRes;
      if (userId) {
        authRes = await pool.query(
          `SELECT aa.*, 
             (aa.spent_today_reset_date = CURRENT_DATE) AS is_today,
             to_char(aa.spent_today_reset_date, 'YYYY-MM-DD') AS reset_date_str
           FROM agent_authorizations aa
           WHERE aa.user_id = $1 AND aa.status = 'active' 
           ORDER BY aa.created_at DESC LIMIT 1`,
          [userId]
        );
      } else if (userEmail) {
        authRes = await pool.query(
          `SELECT aa.*, 
             (aa.spent_today_reset_date = CURRENT_DATE) AS is_today,
             to_char(aa.spent_today_reset_date, 'YYYY-MM-DD') AS reset_date_str
           FROM agent_authorizations aa
           JOIN users u ON u.id = aa.user_id
           WHERE u.email = $1 AND aa.status = 'active' 
           ORDER BY aa.created_at DESC LIMIT 1`,
          [userEmail.toLowerCase().trim()]
        );
      }

      if (!authRes || authRes.rows.length === 0) {
        return { 
          spentToday: 0, 
          dailyLimit: 50000, 
          remaining: 50000, 
          maxTransaction: 15000,
          confirmationThreshold: 3000,
          resetTime: '00:00 (Midnight)'
        };
      }

      const auth = authRes.rows[0];
      const isToday = Boolean(auth.is_today);
      let spentToday = isToday ? parseFloat(auth.spent_today || 0) : 0;

      // Auto-restore at 0 on new day / reset time
      if (!isToday && auth.id) {
        await pool.query(
          `UPDATE agent_authorizations 
           SET spent_today = 0, spent_today_reset_date = CURRENT_DATE, updated_at = CURRENT_TIMESTAMP 
           WHERE id = $1`,
          [auth.id]
        );
        spentToday = 0;
      }

      // Cross-verify with total orders paid today to guarantee 100% dynamic accuracy
      const targetUserId = auth.user_id || userId;
      const targetEmail = userEmail || null;
      try {
        const orderSumRes = await pool.query(
          `SELECT COALESCE(SUM(amount), 0) AS total_orders_today, COUNT(*) AS count_today
           FROM orders 
           WHERE (user_id = $1 OR user_email = $2) 
             AND (payment_status = 'paid' OR status = 'order_confirmed' OR status = 'confirmed') 
             AND created_at::DATE = CURRENT_DATE`,
          [targetUserId || null, targetEmail]
        );
        const ordersTotalToday = parseFloat(orderSumRes.rows[0]?.total_orders_today || 0);
        if (ordersTotalToday > spentToday) {
          spentToday = ordersTotalToday;
          await pool.query(
            `UPDATE agent_authorizations 
             SET spent_today = $1, spent_today_reset_date = CURRENT_DATE, updated_at = CURRENT_TIMESTAMP 
             WHERE id = $2`,
            [spentToday, auth.id]
          );
        }
      } catch (_) {}

      const dailyLimit = parseFloat(auth.daily_spending_limit || 50000);
      const remaining = Math.max(0, dailyLimit - spentToday);

      return {
        spentToday,
        dailyLimit,
        remaining,
        maxTransaction: parseFloat(auth.max_transaction_amount || 15000),
        confirmationThreshold: parseFloat(auth.require_confirmation_above || 3000),
        resetTime: '00:00 (Midnight)'
      };
    } catch (err) {
      console.error('[SpendingLedger] Stats error:', err.message);
      return { spentToday: 0, dailyLimit: 50000, remaining: 50000, resetTime: '00:00 (Midnight)' };
    }
  }

  /**
   * Explicitly restore / reset spent_today to 0 for a user (or all users)
   */
  static async resetSpentToday(userId = null, userEmail = null) {
    try {
      if (userId) {
        await pool.query(
          `UPDATE agent_authorizations 
           SET spent_today = 0, spent_today_reset_date = CURRENT_DATE, updated_at = CURRENT_TIMESTAMP 
           WHERE user_id = $1 AND status = 'active'`,
          [userId]
        );
      } else if (userEmail) {
        await pool.query(
          `UPDATE agent_authorizations 
           SET spent_today = 0, spent_today_reset_date = CURRENT_DATE, updated_at = CURRENT_TIMESTAMP 
           WHERE user_id IN (SELECT id FROM users WHERE email = $1) AND status = 'active'`,
          [userEmail.toLowerCase().trim()]
        );
      } else {
        await pool.query(
          `UPDATE agent_authorizations 
           SET spent_today = 0, spent_today_reset_date = CURRENT_DATE, updated_at = CURRENT_TIMESTAMP 
           WHERE status = 'active'`
        );
      }
      return { success: true, message: 'Spent today successfully reset to 0.' };
    } catch (err) {
      console.error('[SpendingLedger] Reset error:', err.message);
      return { success: false, error: err.message };
    }
  }
}

// Scheduled auto-reset job that runs every 60 seconds to detect midnight boundary and restore spent_today to 0
setInterval(async () => {
  try {
    const res = await pool.query(
      `UPDATE agent_authorizations 
       SET spent_today = 0, spent_today_reset_date = CURRENT_DATE, updated_at = CURRENT_TIMESTAMP 
       WHERE spent_today_reset_date < CURRENT_DATE AND status = 'active' 
       RETURNING id, user_id`
    );
    if (res.rows.length > 0) {
      console.log(`[SpendingLedger] Restored spent_today to 0 for ${res.rows.length} authorizations on daily rollover.`);
    }
  } catch (_) {}
}, 60000);

module.exports = SpendingLedger;
