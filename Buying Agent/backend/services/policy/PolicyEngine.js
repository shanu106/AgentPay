/**
 * PolicyEngine — Deterministic Authorization Policy Evaluator
 * 
 * CRITICAL SECURITY BOUNDARY:
 * This engine runs independently of the LLM. The LLM may recommend actions,
 * but CANNOT override policy decisions. All rules are deterministic backend logic.
 * 
 * Evaluates: transaction limits, daily spending, authorization expiry,
 * merchant restrictions, category restrictions, payment method restrictions,
 * and confirmation thresholds.
 */

const { query } = require('../../db/index');

class PolicyEngine {
  /**
   * Evaluate a purchase request against the user's authorization policy.
   * 
   * @param {Object} request
   * @param {number} request.userId - Database user ID
   * @param {number} request.amount - Transaction amount (INR)
   * @param {string} request.currency - Currency code
   * @param {string} request.merchantId - Merchant identifier
   * @param {string} request.productCategory - Product category
   * @param {string} request.paymentMethodId - Selected payment method ID
   * @param {Object} [request.authorization] - Pre-fetched authorization (optional, will be fetched if absent)
   * @returns {Promise<Object>} { decision, reasonCodes, authorization, requiresConfirmation }
   */
  static async evaluate(request) {
    const { userId, amount, currency = 'INR', merchantId, productCategory, paymentMethodId } = request;
    const reasonCodes = [];
    let requiresConfirmation = false;

    // 0. Strict amount & currency validation (Phase 4, Phase 19)
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return {
        decision: 'DENY',
        reasonCodes: ['INVALID_AMOUNT'],
        authorization: null,
        requiresConfirmation: false,
        details: { amount, message: 'Transaction amount must be a positive number greater than zero.' }
      };
    }

    const normalizedCurrency = (currency || 'INR').toString().toUpperCase().trim();
    if (normalizedCurrency !== 'INR') {
      return {
        decision: 'DENY',
        reasonCodes: ['UNSUPPORTED_CURRENCY'],
        authorization: null,
        requiresConfirmation: false,
        details: { currency, supported: 'INR' }
      };
    }

    const parsedAmount = Math.round(numAmount * 100) / 100;

    // 1. Fetch user's active authorization
    let auth = request.authorization;
    if (!auth) {
      auth = await PolicyEngine.getActiveAuthorization(userId);
    }

    if (!auth) {
      return {
        decision: 'DENY',
        reasonCodes: ['NO_ACTIVE_AUTHORIZATION'],
        authorization: null,
        requiresConfirmation: false
      };
    }

    // 2. Check authorization status
    if (auth.status !== 'active') {
      return {
        decision: 'DENY',
        reasonCodes: ['AUTHORIZATION_INACTIVE'],
        authorization: auth,
        requiresConfirmation: false
      };
    }

    // 3. Check authorization expiration
    const now = new Date();
    const startsAt = new Date(auth.starts_at);
    const expiresAt = new Date(auth.expires_at);

    if (now < startsAt) {
      return {
        decision: 'DENY',
        reasonCodes: ['AUTHORIZATION_NOT_YET_ACTIVE'],
        authorization: auth,
        requiresConfirmation: false
      };
    }

    if (now > expiresAt) {
      return {
        decision: 'DENY',
        reasonCodes: ['AUTHORIZATION_EXPIRED'],
        authorization: auth,
        requiresConfirmation: false
      };
    }
    reasonCodes.push('AUTHORIZATION_ACTIVE');

    // 4. Check per-transaction limit
    const maxTransaction = parseFloat(auth.max_transaction_amount);
    if (amount > maxTransaction) {
      return {
        decision: 'DENY',
        reasonCodes: ['AMOUNT_EXCEEDS_TRANSACTION_LIMIT'],
        authorization: auth,
        requiresConfirmation: false,
        details: { amount, maxTransaction }
      };
    }
    reasonCodes.push('AMOUNT_WITHIN_LIMIT');

    // 5. Check daily spending limit (with automatic date reset)
    const dailyLimit = parseFloat(auth.daily_spending_limit);
    let spentToday = parseFloat(auth.spent_today || 0);
    const resetDate = auth.spent_today_reset_date;
    const todayStr = now.toISOString().split('T')[0];
    const resetDateStr = resetDate instanceof Date 
      ? resetDate.toISOString().split('T')[0] 
      : (resetDate ? String(resetDate).split('T')[0] : null);

    if (resetDateStr && resetDateStr !== todayStr) {
      // Reset daily spending counter
      spentToday = 0;
      await query(
        `UPDATE agent_authorizations SET spent_today = 0, spent_today_reset_date = $1 WHERE id = $2`,
        [todayStr, auth.id]
      );
    }

    if (spentToday + amount > dailyLimit) {
      return {
        decision: 'DENY',
        reasonCodes: ['DAILY_SPENDING_LIMIT_EXCEEDED'],
        authorization: auth,
        requiresConfirmation: false,
        details: { spentToday, amount, dailyLimit }
      };
    }
    reasonCodes.push('DAILY_LIMIT_AVAILABLE');

    // 6. Check merchant restriction
    const allowedMerchants = auth.allowed_merchants || [];
    if (Array.isArray(allowedMerchants) && allowedMerchants.length > 0 && merchantId) {
      const merchantAllowed = allowedMerchants.some(m => 
        m === merchantId || m === '*' || merchantId.toLowerCase().includes(m.toLowerCase())
      );
      if (!merchantAllowed) {
        return {
          decision: 'DENY',
          reasonCodes: ['MERCHANT_NOT_ALLOWED'],
          authorization: auth,
          requiresConfirmation: false,
          details: { merchantId, allowedMerchants }
        };
      }
    }
    reasonCodes.push('MERCHANT_ALLOWED');

    // 7. Check category restriction
    const allowedCategories = auth.allowed_categories || [];
    if (Array.isArray(allowedCategories) && allowedCategories.length > 0 && (productCategory || merchantId)) {
      const categoryAllowed = PolicyEngine.isCategoryAllowed(allowedCategories, productCategory, merchantId);
      if (!categoryAllowed) {
        return {
          decision: 'DENY',
          reasonCodes: ['CATEGORY_NOT_ALLOWED'],
          authorization: auth,
          requiresConfirmation: false,
          details: { productCategory, allowedCategories, merchantId }
        };
      }
    }
    reasonCodes.push('CATEGORY_ALLOWED');

    // 8. Check payment method restriction
    const allowedPaymentMethods = auth.allowed_payment_methods || [];
    if (Array.isArray(allowedPaymentMethods) && allowedPaymentMethods.length > 0 && paymentMethodId) {
      const pmAllowed = allowedPaymentMethods.some(pm =>
        pm === paymentMethodId || pm === '*'
      );
      if (!pmAllowed) {
        return {
          decision: 'DENY',
          reasonCodes: ['PAYMENT_METHOD_NOT_ALLOWED'],
          authorization: auth,
          requiresConfirmation: false,
          details: { paymentMethodId, allowedPaymentMethods }
        };
      }
    }
    reasonCodes.push('PAYMENT_METHOD_ALLOWED');

    // 9. Check confirmation threshold
    const confirmationThreshold = parseFloat(auth.require_confirmation_above || 0);
    if (confirmationThreshold > 0 && amount > confirmationThreshold) {
      requiresConfirmation = true;
      reasonCodes.push('AMOUNT_ABOVE_CONFIRMATION_THRESHOLD');
    }

    return {
      decision: requiresConfirmation ? 'REQUIRES_CONFIRMATION' : 'ALLOW',
      reasonCodes,
      authorization: auth,
      requiresConfirmation,
      details: { amount, spentToday, dailyLimit, maxTransaction, confirmationThreshold }
    };
  }

  /**
   * Fetch active authorization for a user
   */
  static async getActiveAuthorization(userId) {
    if (!userId) return null;
    try {
      const res = await query(
        `SELECT * FROM agent_authorizations 
         WHERE user_id = $1 AND status = 'active' 
         ORDER BY created_at DESC LIMIT 1`,
        [userId]
      );
      return res.rows[0] || null;
    } catch (err) {
      console.error('[PolicyEngine] Failed to fetch authorization:', err.message);
      return null;
    }
  }

  /**
   * Get authorization by user email
   */
  static async getAuthorizationByEmail(email) {
    if (!email) return null;
    try {
      const res = await query(
        `SELECT aa.* FROM agent_authorizations aa
         JOIN users u ON u.id = aa.user_id
         WHERE u.email = $1 AND aa.status = 'active'
         ORDER BY aa.created_at DESC LIMIT 1`,
        [email.toLowerCase().trim()]
      );
      return res.rows[0] || null;
    } catch (err) {
      console.error('[PolicyEngine] Failed to fetch authorization by email:', err.message);
      return null;
    }
  }

  /**
   * Create or update authorization for a user
   */
  static async upsertAuthorization(userId, params) {
    const {
      maxTransactionAmount = 5000,
      dailySpendingLimit = 10000,
      allowedCategories = [],
      allowedMerchants = [],
      allowedPaymentMethods = [],
      requireConfirmationAbove = 3000,
      expiresInDays = 30
    } = params;

    // Deactivate existing authorizations
    await query(
      `UPDATE agent_authorizations SET status = 'revoked', updated_at = CURRENT_TIMESTAMP WHERE user_id = $1 AND status = 'active'`,
      [userId]
    );

    const res = await query(
      `INSERT INTO agent_authorizations (
        user_id, max_transaction_amount, daily_spending_limit, spent_today,
        currency, allowed_categories, allowed_merchants, allowed_payment_methods,
        require_confirmation_above, status, starts_at, expires_at
      ) VALUES (
        $1, $2, $3, 0,
        'INR', $4::jsonb, $5::jsonb, $6::jsonb,
        $7, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + ($8 || ' days')::INTERVAL
      ) RETURNING *`,
      [
        userId, maxTransactionAmount, dailySpendingLimit,
        JSON.stringify(allowedCategories), JSON.stringify(allowedMerchants), JSON.stringify(allowedPaymentMethods),
        requireConfirmationAbove, String(expiresInDays)
      ]
    );
    return res.rows[0];
  }

  /**
   * Revoke authorization
   */
  static async revokeAuthorization(authorizationId) {
    const res = await query(
      `UPDATE agent_authorizations SET status = 'revoked', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
      [authorizationId]
    );
    return res.rows[0];
  }

  /**
   * Check if merchant allows agent commerce
   */
  static async checkMerchantPolicy(merchantId, amount) {
    if (!merchantId) return { allowed: true, reason: 'NO_MERCHANT_SPECIFIED' };
    try {
      const res = await query('SELECT * FROM merchants WHERE id = $1', [merchantId]);
      if (res.rows.length === 0) return { allowed: true, reason: 'MERCHANT_NOT_REGISTERED' };

      const merchant = res.rows[0];
      if (!merchant.agent_commerce_enabled) {
        return { allowed: false, reason: 'MERCHANT_DISABLED_AGENT_COMMERCE' };
      }
      if (merchant.status !== 'active') {
        return { allowed: false, reason: 'MERCHANT_INACTIVE' };
      }
      const maxAmount = parseFloat(merchant.max_autonomous_order_amount || 999999);
      if (amount > maxAmount) {
        return { allowed: false, reason: 'EXCEEDS_MERCHANT_MAX_AUTONOMOUS_AMOUNT', maxAmount };
      }
      return { allowed: true, reason: 'MERCHANT_ALLOWS_AGENT_COMMERCE' };
    } catch (err) {
      console.warn('[PolicyEngine] Merchant check error:', err.message);
      return { allowed: true, reason: 'MERCHANT_CHECK_FAILED_PERMISSIVE' };
    }
  }

  /**
   * Check if category or merchant domain is permitted by allowed_categories
   */
  static isCategoryAllowed(allowedCategories, productCategory, merchantId = null) {
    if (!allowedCategories || !Array.isArray(allowedCategories) || allowedCategories.length === 0) {
      return true;
    }
    if (allowedCategories.includes('*')) {
      return true;
    }

    const CATEGORY_MAP = {
      courses: [
        'courses', 'course', 'education', 'learning', 'web development', 'data science',
        'backend development', 'full stack', 'ai & ml', 'computer science', 'dsa',
        'programming', 'software', 'tutorials', 'certifications', 'bootcamps', 'classes'
      ],
      food: [
        'food', 'dining', 'restaurant', 'biryani', 'pizza', 'burgers', 'waffles', 'waffle-wiches',
        'desserts', 'sides & shakes', 'street food & chaat', 'authentic indian sweets',
        'dimsums & appetizers', 'rice & noodles', 'chinese', 'north indian', 'rolls', 'beverages',
        'meals', 'fast food', 'snacks', 'drinks', 'ice cream', 'sweets', 'main course'
      ],
      electronics: [
        'electronics', 'hardware', 'gear', 'tech', 'mice', 'keyboards', 'audio', 'headphones',
        'chargers', 'cables', 'accessories', 'monitors', 'laptops', 'gadgets',
        'bags & sleeves', 'bags', 'sleeves', 'laptop sleeves', 'cases', 'covers', 'wearables',
        'fitness trackers', 'smart band', 'smartwatch', 'stands', 'hubs', 'docks', 'storage',
        'power banks', 'adapters', 'tech gear', 'computer accessories', 'peripherals'
      ]
    };

    const targetCat = (productCategory || '').toLowerCase().trim();

    return allowedCategories.some(allowed => {
      const a = allowed.toLowerCase().trim();
      if (!a) return false;

      // 1. Direct match or substring
      if (targetCat && (targetCat.includes(a) || a.includes(targetCat))) return true;

      // 2. Synonyms match if targetCat is present
      if (targetCat) {
        const synonyms = CATEGORY_MAP[a] || [];
        if (synonyms.some(syn => targetCat.includes(syn) || syn.includes(targetCat))) {
          return true;
        }
      } else if (merchantId) {
        // Fallback to merchant domain only when productCategory is empty
        const mId = merchantId.toLowerCase();
        if ((a === 'courses' || a === 'education') && (mId.includes('course') || mId.includes('learn'))) return true;
        if ((a === 'food' || a === 'dining') && (mId.includes('zomato') || mId.includes('food') || mId.includes('restaurant') || mId.includes('express'))) return true;
        if ((a === 'electronics' || a === 'hardware' || a === 'gear') && (mId.includes('ecommerce') || mId.includes('tech') || mId.includes('gear') || mId.includes('nova'))) return true;
      }

      return false;
    });
  }
}

module.exports = PolicyEngine;
