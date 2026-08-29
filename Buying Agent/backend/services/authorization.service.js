const PolicyEngine = require('./policy/PolicyEngine');
const SpendingLedger = require('./policy/SpendingLedger');

/**
 * Authorization Engine (Spec Section 4, 5 & 6)
 * 
 * Critical security boundary:
 * The agent may reason about purchasing, but the backend decides whether spending is allowed.
 * Never trust price values supplied by the LLM.
 * Independently enforce user spending limits, daily ledger, merchant status, and authorization policies.
 */

class AuthorizationService {
  /**
   * Async comprehensive policy check against PostgreSQL authorization model
   */
  static async evaluatePolicy({ userId, amount, currency = 'INR', merchantId, productCategory, paymentMethodId, authorization }) {
    return PolicyEngine.evaluate({
      userId,
      amount,
      currency,
      merchantId,
      productCategory,
      paymentMethodId,
      authorization
    });
  }

  /**
   * Check merchant policy
   */
  static async checkMerchantPolicy(merchantId, amount) {
    return PolicyEngine.checkMerchantPolicy(merchantId, amount);
  }

  /**
   * Atomically reserve daily spend
   */
  static async reserveSpend(userId, amount) {
    return SpendingLedger.reserveSpend(userId, amount);
  }

  /**
   * Rollback reserved spend on payment failure
   */
  static async rollbackSpend(userId, amount) {
    return SpendingLedger.rollbackSpend(userId, amount);
  }

  /**
   * Validate user purchase authorization against authoritative product data (Synchronous fallback)
   * @param {Object} params
   * @param {number} params.maxAmount - Maximum spending limit authorized by user
   * @param {string} params.currency - Expected currency (default 'INR')
   * @param {Array<string>} [params.allowedCategories] - Allowed categories
   * @param {Object} params.product - Authoritative product object fetched from merchant
   */
  static validatePurchaseAuthorization({ maxAmount, currency = 'INR', allowedCategories, product }) {
    if (!product) {
      return {
        authorized: false,
        code: 'PRODUCT_NOT_FOUND',
        reason: 'Authoritative product data could not be retrieved from merchant.'
      };
    }

    if (!product.available) {
      return {
        authorized: false,
        code: 'PRODUCT_UNAVAILABLE',
        reason: `Product "${product.title}" is currently marked as unavailable for purchase.`
      };
    }

    const authoritativePrice = product.price; // in INR
    const userSpendingLimit = Number(maxAmount);

    if (isNaN(userSpendingLimit) || userSpendingLimit <= 0) {
      return {
        authorized: false,
        code: 'INVALID_SPENDING_LIMIT',
        reason: 'A valid maximum spending limit must be specified.'
      };
    }

    // Strict Spending Limit Check
    if (authoritativePrice > userSpendingLimit) {
      return {
        authorized: false,
        code: 'SPENDING_LIMIT_EXCEEDED',
        reason: `Authorization Denied: Authoritative product price ₹${authoritativePrice} exceeds user authorized maximum limit of ₹${userSpendingLimit}.`,
        authoritativePrice,
        maxAmount: userSpendingLimit
      };
    }

    // Category check if configured
    if (allowedCategories && allowedCategories.length > 0) {
      const isAllowed = PolicyEngine.isCategoryAllowed(allowedCategories, product.category, product.merchantId || product.merchant?.id);
      if (!isAllowed) {
        return {
          authorized: false,
          code: 'CATEGORY_NOT_PERMITTED',
          reason: `Category "${product.category}" is not within authorized categories [${allowedCategories.join(', ')}].`
        };
      }
    }

    return {
      authorized: true,
      code: 'AUTHORIZED',
      reason: `Authorized: Price ₹${authoritativePrice} is within spending limit of ₹${userSpendingLimit}.`,
      authoritativePrice,
      maxAmount: userSpendingLimit
    };
  }
}

module.exports = AuthorizationService;
