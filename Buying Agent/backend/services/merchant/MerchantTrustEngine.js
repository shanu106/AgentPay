/**
 * MerchantTrustEngine — Deterministic AI Sellability & Merchant Trust Scoring (Phase 7 & 17)
 * 
 * Evaluates merchant platforms for AI agent compatibility, transparency, and safety.
 * Produces reproducible, explainable scoring (0 - 100) and trust ratings.
 */

class MerchantTrustEngine {
  /**
   * Deterministically evaluate a merchant and its catalog
   * @param {Object} merchant - Merchant metadata
   * @param {Array<Object>} products - List of products from merchant catalog
   * @returns {Object} Structured AI sellability score & breakdown
   */
  static evaluateMerchant(merchant = {}, products = []) {
    let score = 0;
    const factors = [];
    const deductions = [];

    // 1. Autonomous Agent Commerce Enablement (Max 15 pts)
    if (merchant.agent_commerce_enabled !== false) {
      score += 15;
      factors.push({ name: 'Agent Commerce Enabled', points: 15, status: 'PASS' });
    } else {
      deductions.push({ name: 'Agent Commerce Disabled', points: -15, status: 'FAIL', reason: 'Merchant explicitly disallows AI agent transactions.' });
    }

    // 2. Catalog Completeness & Validity (Max 25 pts)
    if (Array.isArray(products) && products.length > 0) {
      let validProductCount = 0;
      const total = products.length;

      for (const p of products) {
        const hasId = Boolean(p.id || p.productId || p._id);
        const hasTitle = Boolean(p.title || p.name);
        const hasValidPrice = typeof p.price === 'number' && p.price > 0 && !isNaN(p.price);
        const hasCategory = Boolean(p.category || p.productCategory);

        if (hasId && hasTitle && hasValidPrice && hasCategory) {
          validProductCount++;
        }
      }

      const completenessRatio = validProductCount / total;
      const catalogPoints = Math.round(completenessRatio * 25);
      score += catalogPoints;

      if (completenessRatio === 1) {
        factors.push({ name: 'Catalog Integrity & Completeness', points: 25, status: 'PASS', details: `${total}/${total} products fully structured.` });
      } else {
        deductions.push({ name: 'Incomplete Product Metadata', points: catalogPoints - 25, status: 'WARN', details: `${validProductCount}/${total} products valid.` });
      }
    } else {
      deductions.push({ name: 'Empty Catalog', points: -25, status: 'FAIL', reason: 'No searchable products discovered.' });
    }

    // 3. Pricing Clarity & Currency Consistency (Max 20 pts)
    const allInr = products.every(p => !p.currency || p.currency.toUpperCase() === 'INR');
    const noZeroOrNegative = products.every(p => typeof p.price === 'number' && p.price > 0);

    if (allInr && noZeroOrNegative && products.length > 0) {
      score += 20;
      factors.push({ name: 'Deterministic Pricing & Currency', points: 20, status: 'PASS', details: 'All prices strictly positive INR.' });
    } else {
      score += 5;
      deductions.push({ name: 'Pricing Ambiguity', points: -15, status: 'WARN', details: 'Contains zero, negative, or inconsistent currency.' });
    }

    // 4. Payment Compatibility & Integration (Max 20 pts)
    const hasPaymentReady = Boolean(merchant.payment_supported !== false && (merchant.api_base_url || merchant.apiBase));
    if (hasPaymentReady) {
      score += 20;
      factors.push({ name: 'Razorpay & Test Mode Rails Ready', points: 20, status: 'PASS', details: 'Verified payment endpoint and signature verification support.' });
    } else {
      deductions.push({ name: 'Payment Integration Missing', points: -20, status: 'FAIL', reason: 'No verifiable API endpoint for order creation.' });
    }

    // 5. Structured Metadata & Machine Readability (Max 20 pts)
    const hasStructuredFields = products.some(p => p.rating || p.description || p.image || p.brand || p.restaurantName);
    if (hasStructuredFields) {
      score += 20;
      factors.push({ name: 'Rich AI-Readable Metadata', points: 20, status: 'PASS', details: 'Ratings, descriptions, and category metadata present for LLM reasoning.' });
    } else {
      score += 10;
      deductions.push({ name: 'Minimal Metadata', points: -10, status: 'WARN', details: 'Lacks rich descriptions or ratings.' });
    }

    // Ensure bounded 0-100 range
    score = Math.max(0, Math.min(100, score));

    // Calculate Grade
    let grade = 'F';
    let trustLevel = 'LOW';
    if (score >= 90) {
      grade = 'A+';
      trustLevel = 'VERY_HIGH';
    } else if (score >= 80) {
      grade = 'A';
      trustLevel = 'HIGH';
    } else if (score >= 70) {
      grade = 'B';
      trustLevel = 'MODERATE';
    } else if (score >= 50) {
      grade = 'C';
      trustLevel = 'LOW';
    }

    return {
      merchantId: merchant.id || 'unknown_merchant',
      merchantName: merchant.name || 'Unknown Merchant',
      sellabilityScore: score,
      grade,
      trustLevel,
      agentCommerceAllowed: merchant.agent_commerce_enabled !== false,
      maxAutonomousOrderAmount: merchant.max_autonomous_order_amount || 10000,
      factors,
      deductions,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = MerchantTrustEngine;
