/**
 * OrderStateMachine — Enforces valid order state transitions
 * 
 * Valid transitions:
 *   CREATED → AUTHORIZED → PAYMENT_PENDING → PAYMENT_PROCESSING → PAYMENT_CAPTURED → ORDER_CONFIRMED → RECEIPT_SENT → COMPLETED
 *   CREATED → AUTHORIZATION_FAILED
 *   AUTHORIZED → CANCELLED
 *   PAYMENT_PENDING → PAYMENT_FAILED
 *   PAYMENT_PROCESSING → PAYMENT_FAILED
 *   PAYMENT_PROCESSING → PAYMENT_CAPTURED
 *   Any → CANCELLED (admin override)
 */

const VALID_TRANSITIONS = {
  'created':              ['authorized', 'authorization_failed', 'cancelled'],
  'authorized':           ['payment_pending', 'cancelled'],
  'payment_pending':      ['payment_processing', 'payment_failed', 'cancelled'],
  'payment_processing':   ['payment_captured', 'payment_failed', 'cancelled'],
  'payment_captured':     ['order_confirmed', 'cancelled'],
  'order_confirmed':      ['receipt_sent', 'completed'],
  'receipt_sent':         ['completed'],
  'completed':            [],
  'authorization_failed': [],
  'payment_failed':       ['payment_pending'], // allow retry
  'cancelled':            []
};

const TERMINAL_STATES = ['completed', 'authorization_failed', 'cancelled'];

class OrderStateMachine {
  /**
   * Attempt to transition an order to a new state.
   * @param {string} currentState
   * @param {string} newState
   * @returns {{ valid: boolean, reason?: string }}
   */
  static validateTransition(currentState, newState) {
    const current = (currentState || 'created').toLowerCase();
    const target = newState.toLowerCase();

    if (current === target) {
      return { valid: true, reason: 'SAME_STATE' };
    }

    const validTargets = VALID_TRANSITIONS[current];
    if (!validTargets) {
      return { valid: false, reason: `UNKNOWN_CURRENT_STATE: ${current}` };
    }

    if (validTargets.includes(target)) {
      return { valid: true };
    }

    return {
      valid: false,
      reason: `INVALID_TRANSITION: ${current} → ${target}. Valid targets: [${validTargets.join(', ')}]`
    };
  }

  /**
   * Check if an order is in a terminal state
   */
  static isTerminal(state) {
    return TERMINAL_STATES.includes((state || '').toLowerCase());
  }

  /**
   * Create a status history entry
   */
  static createHistoryEntry(fromState, toState, metadata = {}) {
    return {
      from: fromState,
      to: toState,
      timestamp: new Date().toISOString(),
      ...metadata
    };
  }

  /**
   * Get all valid transitions from current state
   */
  static getValidTransitions(currentState) {
    return VALID_TRANSITIONS[(currentState || 'created').toLowerCase()] || [];
  }

  /**
   * Get display label for a state
   */
  static getStateLabel(state) {
    const labels = {
      'created': 'Order Created',
      'authorized': 'Authorized',
      'payment_pending': 'Payment Pending',
      'payment_processing': 'Processing Payment',
      'payment_captured': 'Payment Captured',
      'order_confirmed': 'Order Confirmed',
      'receipt_sent': 'Receipt Sent',
      'completed': 'Completed',
      'authorization_failed': 'Authorization Failed',
      'payment_failed': 'Payment Failed',
      'cancelled': 'Cancelled'
    };
    return labels[(state || '').toLowerCase()] || state;
  }

  /**
   * Get state severity for UI display
   */
  static getStateSeverity(state) {
    const severities = {
      'created': 'info',
      'authorized': 'info',
      'payment_pending': 'warning',
      'payment_processing': 'warning',
      'payment_captured': 'success',
      'order_confirmed': 'success',
      'receipt_sent': 'success',
      'completed': 'success',
      'authorization_failed': 'error',
      'payment_failed': 'error',
      'cancelled': 'error'
    };
    return severities[(state || '').toLowerCase()] || 'info';
  }
}

module.exports = OrderStateMachine;
