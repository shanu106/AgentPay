/**
 * Authorization Engine (Spec Section 6 & 8)
 * 
 * Critical security boundary:
 * The agent may reason about purchasing, but the backend decides whether spending is allowed.
 * Never trust price values supplied by the LLM.
 * Independently enforce user spending limits against authoritative merchant prices.
 */

class AuthorizationService {
  /**
   * Validate user purchase authorization against authoritative product data
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
      const cat = (product.category || '').toLowerCase();
      const subcat = (product.subcategory || '').toLowerCase();
      const isAllowed = allowedCategories.some(c => cat.includes(c.toLowerCase()) || subcat.includes(c.toLowerCase()));
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
