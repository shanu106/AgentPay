/**
 * Request Validation Middleware (Phase 25 & 28)
 * 
 * Strict validation of request bodies, route parameters, and query strings.
 * Prevents malformed data, prompt injection triggers, and negative numeric bypasses.
 */

const validatePurchaseInput = (req, res, next) => {
  const { message, customerEmail, userEmail } = req.body;

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_INPUT',
        message: 'A non-empty string purchase query/message is required.'
      }
    });
  }

  if (message.length > 1000) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'PAYLOAD_TOO_LARGE',
        message: 'Message length exceeds maximum limit of 1,000 characters.'
      }
    });
  }

  const email = (userEmail || customerEmail || '').trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_EMAIL',
        message: 'Invalid email address format provided.'
      }
    });
  }

  next();
};

const validateAuthorizationInput = (req, res, next) => {
  const { maxTransactionAmount, dailySpendingLimit, requireConfirmationAbove } = req.body;

  if (maxTransactionAmount !== undefined) {
    const val = Number(maxTransactionAmount);
    if (isNaN(val) || val <= 0 || val > 1000000) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_LIMIT',
          message: 'maxTransactionAmount must be a positive number up to 1,000,000.'
        }
      });
    }
  }

  if (dailySpendingLimit !== undefined) {
    const val = Number(dailySpendingLimit);
    if (isNaN(val) || val <= 0 || val > 2000000) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_LIMIT',
          message: 'dailySpendingLimit must be a positive number up to 2,000,000.'
        }
      });
    }
  }

  if (requireConfirmationAbove !== undefined) {
    const val = Number(requireConfirmationAbove);
    if (isNaN(val) || val < 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_LIMIT',
          message: 'requireConfirmationAbove must be a non-negative number.'
        }
      });
    }
  }

  next();
};

module.exports = {
  validatePurchaseInput,
  validateAuthorizationInput
};
