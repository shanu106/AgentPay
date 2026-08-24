/**
 * Multi-Payment Method Resolver & Instrument Wallet
 * Allows prompt-driven payment method selection (Cards, NetBanking, UPI) with default fallback.
 */

const PRE_SAVED_PAYMENT_METHODS = {
  default_visa: {
    id: 'default_visa',
    type: 'card',
    method: 'card',
    brand: 'Visa (Domestic)',
    last4: '1007',
    cardNumber: '4100 2800 0000 1007',
    expiry: '12/28',
    holder: 'Student Buyer',
    label: 'Saved Visa Debit (•••• 1007)',
    autoDebitLimit: 15000
  },
  amazon_card: {
    id: 'amazon_card',
    type: 'card',
    method: 'card',
    brand: 'Amazon Pay ICICI Credit Card',
    last4: '2005',
    cardNumber: '4100 2800 0000 2005',
    expiry: '09/29',
    holder: 'Student Buyer',
    label: 'Amazon Pay ICICI Credit Card (•••• 2005)',
    autoDebitLimit: 25000
  },
  hdfc_card: {
    id: 'hdfc_card',
    type: 'card',
    method: 'card',
    brand: 'HDFC Millennia Credit Card',
    last4: '3003',
    cardNumber: '4100 2800 0000 3003',
    expiry: '05/30',
    holder: 'Student Buyer',
    label: 'HDFC Millennia Card (•••• 3003)',
    autoDebitLimit: 20000
  },
  bob_netbanking: {
    id: 'bob_netbanking',
    type: 'netbanking',
    method: 'netbanking',
    bank: 'BARB_R',
    bankName: 'Bank of Baroda',
    holder: 'Student Buyer',
    label: 'Bank of Baroda (BOB) NetBanking',
    autoDebitLimit: 50000
  },
  sbi_netbanking: {
    id: 'sbi_netbanking',
    type: 'netbanking',
    method: 'netbanking',
    bank: 'SBIN',
    bankName: 'State Bank of India',
    holder: 'Student Buyer',
    label: 'SBI NetBanking',
    autoDebitLimit: 50000
  },
  hdfc_netbanking: {
    id: 'hdfc_netbanking',
    type: 'netbanking',
    method: 'netbanking',
    bank: 'HDFC',
    bankName: 'HDFC Bank',
    holder: 'Student Buyer',
    label: 'HDFC NetBanking',
    autoDebitLimit: 50000
  },
  icici_netbanking: {
    id: 'icici_netbanking',
    type: 'netbanking',
    method: 'netbanking',
    bank: 'ICIC',
    bankName: 'ICICI Bank',
    holder: 'Student Buyer',
    label: 'ICICI NetBanking',
    autoDebitLimit: 50000
  },
  canara_netbanking: {
    id: 'canara_netbanking',
    type: 'netbanking',
    method: 'netbanking',
    bank: 'CNRB',
    bankName: 'Canara Bank',
    holder: 'Student Buyer',
    label: 'Canara Bank NetBanking',
    autoDebitLimit: 50000
  },
  upi: {
    id: 'upi',
    type: 'upi',
    method: 'upi',
    vpa: 'success@razorpay',
    holder: 'Student Buyer',
    label: 'Instant UPI (Google Pay / PhonePe)',
    autoDebitLimit: 20000
  }
};

/**
 * Resolve payment method from prompt text or fallback to default
 * @param {string} message - Natural language user request
 * @param {Object} defaultMethod - User's default saved payment method
 * @returns {Object} Selected payment method object + match metadata
 */
function resolvePaymentMethod(message = '', defaultMethod = null) {
  const text = message.toLowerCase();

  // 1. Check for Amazon Card
  if (text.includes('amazon') || text.includes('amazon pay') || text.includes('amazon card') || text.includes('amazon credit card')) {
    return {
      ...PRE_SAVED_PAYMENT_METHODS.amazon_card,
      matchedFromPrompt: true,
      matchReason: 'Recognized Amazon Pay Credit Card from prompt'
    };
  }

  // 2. Check for HDFC Card
  if (text.includes('hdfc card') || text.includes('hdfc credit') || text.includes('hdfc debit') || text.includes('millennia')) {
    return {
      ...PRE_SAVED_PAYMENT_METHODS.hdfc_card,
      matchedFromPrompt: true,
      matchReason: 'Recognized HDFC Millennia Card from prompt'
    };
  }

  // 3. Check for Bank of Baroda (BOB) NetBanking
  if (text.includes('bob') || text.includes('bank of baroda') || text.includes('baroda netbanking') || text.includes('net banking of bob') || text.includes('netbanking of bob') || text.includes('bob net banking') || text.includes('bob netbanking')) {
    return {
      ...PRE_SAVED_PAYMENT_METHODS.bob_netbanking,
      matchedFromPrompt: true,
      matchReason: 'Recognized Bank of Baroda (BOB) NetBanking from prompt'
    };
  }

  // 4. Check for SBI NetBanking
  if (text.includes('sbi') || text.includes('state bank') || text.includes('sbi netbanking') || text.includes('net banking of sbi')) {
    return {
      ...PRE_SAVED_PAYMENT_METHODS.sbi_netbanking,
      matchedFromPrompt: true,
      matchReason: 'Recognized State Bank of India (SBI) NetBanking from prompt'
    };
  }

  // 5. Check for HDFC NetBanking
  if (text.includes('hdfc netbanking') || text.includes('net banking of hdfc') || text.includes('hdfc net banking')) {
    return {
      ...PRE_SAVED_PAYMENT_METHODS.hdfc_netbanking,
      matchedFromPrompt: true,
      matchReason: 'Recognized HDFC NetBanking from prompt'
    };
  }

  // 6. Check for ICICI NetBanking
  if (text.includes('icici netbanking') || text.includes('net banking of icici') || text.includes('icici net banking')) {
    return {
      ...PRE_SAVED_PAYMENT_METHODS.icici_netbanking,
      matchedFromPrompt: true,
      matchReason: 'Recognized ICICI Bank NetBanking from prompt'
    };
  }

  // 7. Check for Canara Bank NetBanking
  if (text.includes('canara') || text.includes('canara bank') || text.includes('canara netbanking')) {
    return {
      ...PRE_SAVED_PAYMENT_METHODS.canara_netbanking,
      matchedFromPrompt: true,
      matchReason: 'Recognized Canara Bank NetBanking from prompt'
    };
  }

  // 8. Check for Kotak Mahindra Bank NetBanking
  if (text.includes('kotak') || text.includes('kotak mahindra')) {
    return {
      id: 'pm_kotak_nb',
      type: 'netbanking',
      method: 'netbanking',
      bank: 'KKBK',
      bankName: 'Kotak Mahindra Bank',
      holder: 'User',
      label: 'Kotak Mahindra Bank NetBanking',
      autoDebitLimit: 50000,
      matchedFromPrompt: true,
      matchReason: 'Recognized Kotak Mahindra Bank NetBanking from prompt'
    };
  }

  // 9. Check for Axis Bank NetBanking
  if (text.includes('axis') || text.includes('axis bank')) {
    return {
      id: 'pm_axis_nb',
      type: 'netbanking',
      method: 'netbanking',
      bank: 'UTIB',
      bankName: 'Axis Bank',
      holder: 'User',
      label: 'Axis Bank NetBanking',
      autoDebitLimit: 50000,
      matchedFromPrompt: true,
      matchReason: 'Recognized Axis Bank NetBanking from prompt'
    };
  }

  // 8. General NetBanking keyword fallback (defaults to BOB)
  if (text.includes('net banking') || text.includes('netbanking')) {
    return {
      ...PRE_SAVED_PAYMENT_METHODS.bob_netbanking,
      matchedFromPrompt: true,
      matchReason: 'Recognized NetBanking preference from prompt (using primary Bank of Baroda)'
    };
  }

  // 9. Check for UPI
  if (text.includes('upi') || text.includes('gpay') || text.includes('google pay') || text.includes('phonepe') || text.includes('paytm')) {
    return {
      ...PRE_SAVED_PAYMENT_METHODS.upi,
      matchedFromPrompt: true,
      matchReason: 'Recognized UPI preference from prompt'
    };
  }

  // 10. Check for Card
  if (text.includes('visa') || text.includes('debit card') || text.includes('credit card') || text.includes('card')) {
    return {
      ...PRE_SAVED_PAYMENT_METHODS.default_visa,
      matchedFromPrompt: true,
      matchReason: 'Recognized Saved Card preference from prompt'
    };
  }

  // Default fallback
  const baseDefault = defaultMethod || PRE_SAVED_PAYMENT_METHODS.default_visa;
  return {
    ...baseDefault,
    method: baseDefault.method || (baseDefault.type === 'netbanking' ? 'netbanking' : (baseDefault.type === 'upi' ? 'upi' : 'card')),
    label: baseDefault.label || `${baseDefault.brand || 'Saved Card'} (•••• ${baseDefault.last4 || '1007'})`,
    matchedFromPrompt: false,
    matchReason: `Using Default Pre-Saved ${baseDefault.brand || 'Card'} (•••• ${baseDefault.last4 || '1007'})`
   };
}

/**
 * Resolve payment method from Gemini's extracted paymentMethod string.
 * Maps natural language payment labels (e.g. "Kotak Mahindra Bank NetBanking") 
 * to pre-saved payment method configs using fuzzy keyword matching.
 * 
 * @param {string|null} geminiPaymentStr - Gemini's extracted payment method string
 * @param {Object} defaultMethod - User's default saved payment method
 * @returns {Object} Selected payment method object + match metadata
 */
function resolvePaymentFromGeminiOutput(geminiPaymentStr, defaultMethod = null) {
  if (!geminiPaymentStr || typeof geminiPaymentStr !== 'string' || geminiPaymentStr.trim() === '') {
    // No payment method extracted by Gemini — use default
    const baseDefault = defaultMethod || PRE_SAVED_PAYMENT_METHODS.default_visa;
    return {
      ...baseDefault,
      method: baseDefault.method || (baseDefault.type === 'netbanking' ? 'netbanking' : (baseDefault.type === 'upi' ? 'upi' : 'card')),
      label: baseDefault.label || `${baseDefault.brand || 'Saved Card'} (•••• ${baseDefault.last4 || '1007'})`,
      matchedFromPrompt: false,
      matchReason: `Using Default (Gemini extracted no payment method)`
    };
  }

  const text = geminiPaymentStr.toLowerCase();

  // Keyword → config mapping (order matters: most specific first)
  const mappings = [
    { keywords: ['amazon', 'amazon pay', 'amazon icici', 'अमेज़न'], config: PRE_SAVED_PAYMENT_METHODS.amazon_card },
    { keywords: ['hdfc millennia', 'hdfc card', 'hdfc credit', 'hdfc debit'], config: PRE_SAVED_PAYMENT_METHODS.hdfc_card },
    { keywords: ['bank of baroda', 'bob', 'baroda', 'बॉब', 'बैंक ऑफ बड़ौदा'], config: PRE_SAVED_PAYMENT_METHODS.bob_netbanking },
    { keywords: ['sbi', 'state bank', 'एसबीआई', 'स्टेट बैंक'], config: PRE_SAVED_PAYMENT_METHODS.sbi_netbanking },
    { keywords: ['hdfc netbanking', 'hdfc net banking', 'hdfc', 'एचडीएफसी'], config: PRE_SAVED_PAYMENT_METHODS.hdfc_netbanking },
    { keywords: ['icici', 'आईसीआईसीआई'], config: PRE_SAVED_PAYMENT_METHODS.icici_netbanking },
    { keywords: ['canara', 'केनरा'], config: PRE_SAVED_PAYMENT_METHODS.canara_netbanking },
    { keywords: ['kotak', 'kotak mahindra', 'कोटक'], config: {
      id: 'pm_kotak_nb', type: 'netbanking', method: 'netbanking', bank: 'KKBK',
      bankName: 'Kotak Mahindra Bank', holder: 'User', label: 'Kotak Mahindra Bank NetBanking', autoDebitLimit: 50000
    }},
    { keywords: ['axis', 'axis bank', 'एक्सिस'], config: {
      id: 'pm_axis_nb', type: 'netbanking', method: 'netbanking', bank: 'UTIB',
      bankName: 'Axis Bank', holder: 'User', label: 'Axis Bank NetBanking', autoDebitLimit: 50000
    }},
    { keywords: ['gpay', 'google pay', 'phonepe', 'paytm', 'upi', 'यूपीआई', 'गूगल पे', 'फोनपे', 'पेटीएम'], config: PRE_SAVED_PAYMENT_METHODS.upi },
    { keywords: ['visa', 'debit card', 'credit card', 'card', 'कार्ड', 'डेबिट कार्ड', 'क्रेडिट कार्ड'], config: PRE_SAVED_PAYMENT_METHODS.default_visa },
  ];

  for (const { keywords, config } of mappings) {
    if (keywords.some(kw => text.includes(kw))) {
      return {
        ...config,
        matchedFromPrompt: true,
        matchReason: `Gemini/Keyword identified: "${geminiPaymentStr}"`
      };
    }
  }

  // Generic netbanking fallback
  if (text.includes('netbanking') || text.includes('net banking') || text.includes('नेटबैंकिंग') || text.includes('नेट बैंकिंग')) {
    return {
      ...PRE_SAVED_PAYMENT_METHODS.bob_netbanking,
      matchedFromPrompt: true,
      matchReason: `Identified netbanking (defaulting to Bank of Baroda): "${geminiPaymentStr}"`
    };
  }

  // If Gemini returned something unrecognized, use default
  const baseDefault = defaultMethod || PRE_SAVED_PAYMENT_METHODS.default_visa;
  return {
    ...baseDefault,
    method: baseDefault.method || 'card',
    label: baseDefault.label || `${baseDefault.brand || 'Saved Card'} (•••• ${baseDefault.last4 || '1007'})`,
    matchedFromPrompt: false,
    matchReason: `Gemini payment "${geminiPaymentStr}" not recognized, using default`
  };
}

module.exports = {
  PRE_SAVED_PAYMENT_METHODS,
  resolvePaymentMethod,
  resolvePaymentFromGeminiOutput
};
