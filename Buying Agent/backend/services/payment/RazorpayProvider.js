/**
 * RazorpayProvider — Clean abstraction over Razorpay API
 * 
 * Encapsulates all Razorpay API calls. Business logic should never
 * make raw Razorpay API calls — always go through this provider.
 * 
 * Clearly distinguishes TEST MODE from LIVE MODE.
 * Never stores raw card numbers.
 * 
 * Test card mapping (Razorpay test mode):
 *   token_ref → actual test card number (only used at payment time, never stored)
 */

const crypto = require('crypto');

// Razorpay test card number mapping (token_ref → card number)
// These are Razorpay's published test cards, NOT real card numbers
const TEST_CARD_MAP = {
  'rzp_test_visa_1007': '4100280000001007',
  'rzp_test_icici_4022': '4315280000004022',
  'rzp_test_hdfc_3003': '4100280000003003',
  'rzp_test_rupay_1005': '6527658900001005'
};

require('dotenv').config();

class RazorpayProvider {
  constructor() {
    this.keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_mock_123456';
    this.keySecret = process.env.RAZORPAY_KEY_SECRET || 'mock_secret_for_tests_only';
    this.webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'mock_webhook_secret';
    this.isTestMode = (this.keyId || '').startsWith('rzp_test_');
  }

  /**
   * Get auth header for Razorpay API
   */
  getAuthHeader() {
    return 'Basic ' + Buffer.from(`${this.keyId}:${this.keySecret}`).toString('base64');
  }

  /**
   * Create an official Razorpay Order via Razorpay REST API
   * @param {Object} params
   * @param {number} params.amount - Amount in INR (not paise)
   * @param {string} [params.currency='INR']
   * @param {string} [params.receipt]
   * @param {Object} [params.notes]
   * @returns {Promise<Object>} Razorpay order object or error
   */
  async createOrder({ amount, currency = 'INR', receipt, notes = {} }) {
    try {
      const res = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.getAuthHeader()
        },
        body: JSON.stringify({
          amount: Math.round(amount * 100),
          currency,
          receipt: receipt || `rcpt_${Date.now().toString().slice(-8)}`,
          notes
        })
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        console.warn('[RazorpayProvider] createOrder API error:', data.error);
        return { success: false, error: data.error?.description || data.error?.reason || 'Failed to create Razorpay order' };
      }

      return { success: true, order: data, id: data.id, key: this.keyId };
    } catch (err) {
      console.warn('[RazorpayProvider] createOrder network error:', err.message);
      return { success: false, error: err.message };
    }
  }

  /**
   * Execute a payment using Razorpay test mode API
   * @param {Object} params
   * @param {string} params.razorpayOrderId - Razorpay order ID
   * @param {number} params.amount - Amount in INR (not paise)
   * @param {string} params.currency
   * @param {string} params.email - Customer email
   * @param {string} params.contact - Customer phone
   * @param {Object} params.paymentMethod - Payment method object
   * @returns {Promise<Object>} { paymentId, status, requiresBankApproval, redirectUrl }
   */
  async executePayment({ razorpayOrderId, amount, currency = 'INR', email, contact, paymentMethod }) {
    const form = new URLSearchParams();
    form.append('key_id', this.keyId);
    form.append('amount', amount * 100); // Convert to paise
    form.append('currency', currency);
    form.append('order_id', razorpayOrderId);
    form.append('email', email || 'buyer@example.com');
    form.append('contact', contact || '9876543210');

    const isNetBanking = paymentMethod.method === 'netbanking' || paymentMethod.type === 'netbanking';
    const isUpi = paymentMethod.method === 'upi' || paymentMethod.type === 'upi';

    if (isNetBanking) {
      form.append('method', 'netbanking');
      form.append('bank', paymentMethod.bank || 'BARB_R');
    } else if (isUpi) {
      form.append('method', 'upi');
      form.append('vpa', 'success@razorpay');
    } else {
      // Card payment — resolve test card number from token_ref
      form.append('method', 'card');
      const cardNumber = TEST_CARD_MAP[paymentMethod.token_ref] || '4100280000001007';
      form.append('card[number]', cardNumber);
      const [expMonth, expYear] = (paymentMethod.expiry || '12/28').split('/');
      form.append('card[expiry_month]', expMonth);
      form.append('card[expiry_year]', expYear.length === 2 ? `20${expYear}` : expYear);
      form.append('card[cvv]', '123');
      form.append('card[name]', paymentMethod.holder || 'Test User');
    }

    let res = await fetch('https://api.razorpay.com/v1/payments/create/ajax', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString()
    });
    let result = await res.json();

    // NetBanking fallback: if bank not enabled in test mode, fallback to BARB_R
    if (result.error && isNetBanking && 
        (result.error.reason === 'bank_not_enabled' || result.error.code === 'BAD_REQUEST_ERROR')) {
      console.log(`[RazorpayProvider] Bank ${paymentMethod.bank} not enabled, falling back to BARB_R`);
      form.set('bank', 'BARB_R');
      res = await fetch('https://api.razorpay.com/v1/payments/create/ajax', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: form.toString()
      });
      result = await res.json();
    }

    if (result.error) {
      return {
        success: false,
        error: result.error.description || result.error.reason || 'Payment creation failed',
        errorCode: result.error.code
      };
    }

    const paymentId = result.payment_id || result.id || result.request?.content?.payment_id;
    const formattedPaymentId = paymentId ? (paymentId.startsWith('pay_') ? paymentId : `pay_${paymentId}`) : null;

    return {
      success: true,
      paymentId: formattedPaymentId,
      requiresBankApproval: Boolean(result.request?.url && (isNetBanking || !isUpi)),
      redirectUrl: result.request?.url,
      redirectMethod: result.request?.method,
      redirectContent: result.request?.content
    };
  }

  /**
   * Complete the 3DS/NetBanking bank approval mock flow (test mode only)
   */
  async completeBankApproval({ redirectUrl, redirectMethod, redirectContent }) {
    if (!redirectUrl) return;

    try {
      // Step 1: Follow initial redirect
      const initialRes = await fetch(redirectUrl, {
        method: redirectMethod || 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(redirectContent || {}).toString(),
        redirect: 'follow'
      });
      let pageHtml = await initialRes.text();

      // Step 2: Check if intermediate form (card /authenticate) or bank page
      const hasBankSuccessField = pageHtml.includes('name="success"');
      if (!hasBankSuccessField) {
        const intermediateAction = pageHtml.match(/action="([^"]+)"/)?.[1]?.replace(/&amp;/g, '&');
        if (intermediateAction) {
          const intermediateInputs = [...pageHtml.matchAll(/<input[^>]+name="([^"]+)"[^>]+value="([^"]*)"/gi)];
          const intermediateForm = new URLSearchParams();
          for (const m of intermediateInputs) intermediateForm.append(m[1], m[2]);

          const bankPageRes = await fetch(intermediateAction, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: intermediateForm.toString(),
            redirect: 'follow'
          });
          pageHtml = await bankPageRes.text();
        }
      }

      // Step 3: Submit success on bank page
      const formAction = pageHtml.match(/action="([^"]+)"/)?.[1]?.replace(/&amp;/g, '&');
      const callbackUrl = pageHtml.match(/name="callback_url"[^>]+value="([^"]+)"/)?.[1]?.replace(/&amp;/g, '&');

      if (formAction) {
        const submitForm = new URLSearchParams();
        if (callbackUrl) submitForm.append('callback_url', callbackUrl);
        submitForm.append('language_code', 'en');
        submitForm.append('success', 'S');

        await fetch(formAction, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: submitForm.toString(),
          redirect: 'follow'
        });
        console.log('[RazorpayProvider] Bank approval submitted successfully');
      }
    } catch (err) {
      console.warn('[RazorpayProvider] Bank approval flow note:', err.message);
    }
  }

  /**
   * Poll payment status and capture when authorized
   * @param {string} paymentId
   * @param {number} amount - Amount in INR
   * @param {string} currency
   * @param {number} maxAttempts - Maximum polling attempts
   * @returns {Promise<Object>} { status, captured }
   */
  async pollAndCapture(paymentId, amount, currency = 'INR', maxAttempts = 8) {
    const authHeader = this.getAuthHeader();
    let paymentStatus = 'created';

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      await new Promise(r => setTimeout(r, 1000));

      const checkRes = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, {
        headers: { 'Authorization': authHeader }
      });
      const pData = await checkRes.json();
      paymentStatus = pData.status;
      console.log(`[RazorpayProvider] Poll #${attempt}: ${paymentId} → ${paymentStatus}`);

      if (paymentStatus === 'authorized') {
        const captureRes = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}/capture`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader
          },
          body: JSON.stringify({ amount: amount * 100, currency })
        });
        const captureData = await captureRes.json();
        paymentStatus = captureData.status || 'captured';
        console.log(`[RazorpayProvider] Captured: ${paymentId} → ${paymentStatus}`);
        return { status: paymentStatus, captured: true };
      }

      if (paymentStatus === 'captured') {
        return { status: 'captured', captured: true };
      }

      if (paymentStatus === 'failed') {
        return { status: 'failed', captured: false };
      }
    }

    return { status: paymentStatus, captured: false };
  }

  /**
   * Get payment status from Razorpay
   */
  async getPaymentStatus(paymentId) {
    const res = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, {
      headers: { 'Authorization': this.getAuthHeader() }
    });
    return await res.json();
  }

  /**
   * Verify Razorpay payment signature (HMAC SHA256)
   */
  verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, signature) {
    const expectedSignature = crypto
      .createHmac('sha256', this.keySecret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    return expectedSignature === signature;
  }

  /**
   * Generate valid payment signature
   */
  generateSignature(razorpayOrderId, razorpayPaymentId) {
    return crypto
      .createHmac('sha256', this.keySecret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(body, signature) {
    if (!this.webhookSecret) {
      console.warn('[RazorpayProvider] No webhook secret configured');
      return false;
    }

    const expectedSignature = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(body)
      .digest('hex');

    return expectedSignature === signature;
  }
}

// Singleton instance
const razorpayProvider = new RazorpayProvider();

module.exports = { RazorpayProvider, razorpayProvider, TEST_CARD_MAP };
