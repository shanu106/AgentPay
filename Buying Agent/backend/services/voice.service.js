/**
 * ElevenLabs Voice AI Service
 * Generates natural spoken audio feedback in English and Hindi for Autonomous Shopping Agent operations.
 */

const SUPPORTED_LANGUAGES = {
  EN: 'en',
  HI: 'hi'
};

const DEFAULT_VOICE_ID = 'EXAVITQu4vr4xnSDxMaL'; // Sarah / High-quality Multilingual v2
const DEFAULT_MODEL_ID = 'eleven_multilingual_v2';

/**
 * Helper to build natural item list for speech (e.g. "2 Chicken Biryani, 1 Python Course, and 1 Keyboard")
 */
function formatItemsSpokenList(items = [], fallbackTitle = 'items', language = 'en') {
  const isHindi = language === 'hi' || language === 'hindi';

  if (!items || !Array.isArray(items) || items.length === 0) {
    return fallbackTitle;
  }

  if (items.length === 1) {
    const it = items[0];
    const qty = it.quantity || 1;
    const t = (it.title || it.productTitle || fallbackTitle).trim();
    if (isHindi) {
      return `${qty > 1 ? qty + ' ' : ''}${t}`;
    }
    return `${qty > 1 ? qty + ' units of ' : ''}${t}`;
  }

  // Multiple distinct item types
  if (isHindi) {
    const list = items.map(it => `${it.quantity || 1} ${(it.title || it.productTitle || 'सामान').trim()}`);
    if (list.length === 2) {
      return `${list[0]} और ${list[1]}`;
    }
    return `${list.slice(0, -1).join(', ')}, और ${list[list.length - 1]}`;
  }

  const list = items.map(it => `${it.quantity || 1} ${(it.title || it.productTitle || 'item').trim()}`);
  if (list.length === 2) {
    return `${list[0]} and ${list[1]}`;
  }
  return `${list.slice(0, -1).join(', ')}, and ${list[list.length - 1]}`;
}

/**
 * Generate natural spoken summary text in English or Hindi
 * @param {Object} result - Result from processPurchaseRequest or agent operation
 * @param {string} [language='en'] - 'en' (English) or 'hi' (Hindi)
 * @returns {string} Natural speech text suitable for TTS
 */
function createSpokenFeedback(result = {}, language = 'en') {
  const isHindi = language === 'hi' || language === 'hindi';

  // Case 1: Conversational query or memory recall
  if (result.intent?.isConversational || result.intent?.isMemoryRecall) {
    if (isHindi) {
      return result.replyHi || result.reply || 'यह रही आपकी मांगी गई जानकारी।';
    }
    return result.reply || 'Here is the information you requested.';
  }

  // Case 2: Authorization Denied / Spending Limit Exceeded / Policy Blocked
  if (result.policy?.decision === 'DENY' || result.status === 'denied' || result.code === 'AMOUNT_EXCEEDS_LIMIT' || result.code === 'SPENDING_LIMIT_EXCEEDED' || (result.reply && result.reply.includes('Blocked by Policy Engine'))) {
    const amount = result.totalAmount || result.amount || result.order?.amount || '';
    if (isHindi) {
      return `पॉलिसी इंजन द्वारा आपका ऑर्डर रोक दिया गया है क्योंकि यह आपकी अधिकृत सीमा से अधिक है। कोई भुगतान नहीं काटा गया है।`;
    }
    return `Your purchase was blocked by the policy engine as it exceeds your authorized spending limits. No payment was charged.`;
  }

  const orderItems = result.order?.items || result.intent?.items || (result.selectedProduct ? [{ quantity: result.order?.quantity || 1, title: result.selectedProduct.title }] : []);
  const itemsSpoken = formatItemsSpokenList(orderItems, result.selectedProduct?.title || result.order?.productTitle || 'items', language);

  // Case 3: Manual User Confirmation Required (Exceeds auto-approval limit)
  if (result.requiresConfirmation || result.requiresCheckout || (result.order && !result.autoPaid && result.order?.paymentStatus !== 'paid')) {
    const amount = result.order?.amount || result.totalAmount || result.selectedProduct?.price || 0;
    if (isHindi) {
      return `आपका ${itemsSpoken} का ₹${amount.toLocaleString()} का ऑर्डर तैयार है। यह राशि आपकी ऑटो-अप्रूवल सीमा से अधिक है, इसलिए मैन्युअल पुष्टि की आवश्यकता है। कृपया स्क्रीन पर चेकआउट पूरा करें।`;
    }
    return `I have prepared your order for ${itemsSpoken} for a total of ₹${amount.toLocaleString()}. Because this amount exceeds your auto-approval threshold, your confirmation is required. Please click Complete Checkout on your screen to proceed.`;
  }

  // Case 4: Purchase Succeeded & Auto-Paid
  if (result.success && result.autoPaid && (result.order?.paymentStatus === 'paid' || result.verification?.paymentStatus === 'paid' || result.verification?.paymentId)) {
    const amount = result.order?.amount || result.selectedProduct?.price || 0;
    const paymentLabel = result.order?.paymentMethod?.label || result.intent?.paymentMethod?.label || 'Saved Payment';
    const cleanPay = paymentLabel.replace(/\(•••• \d+\)/g, '').trim();

    if (isHindi) {
      return `आपका ${itemsSpoken} का ऑर्डर कन्फर्म हो गया है और ${cleanPay} के जरिए ₹${amount.toLocaleString()} का भुगतान सफलतापूर्वक पूरा हो गया है।`;
    }

    return `Your order for ${itemsSpoken} is confirmed and successfully paid via ${cleanPay} for ₹${amount.toLocaleString()}.`;
  }

  // Case 5: Product Not Found or Out of Stock
  if (result.code === 'PRODUCT_NOT_FOUND' || (result.reply && result.reply.includes('Product Not Found'))) {
    if (isHindi) {
      return `दुकान के कैटलॉग में आपका पसंदीदा सामान नहीं मिला। कृपया कोई दूसरा आइटम या मूल्य सीमा आज़माएं।`;
    }
    return `I searched the store catalog but could not find matching products for your request. Please try another item or price range.`;
  }

  // Case 6: General Error or Incomplete
  if (!result.success) {
    const cleanMsg = (result.message || result.error || 'The purchase could not be completed.').replace(/^Error:\s*/i, '');
    if (isHindi) {
      return `क्षमा करें, आपका ऑर्डर पूरा नहीं हो सका। ${cleanMsg}`;
    }
    return `I was unable to complete your purchase request. ${cleanMsg}`;
  }

  return isHindi ? 'आपका शॉपिंग अनुरोध पूरा हो गया है।' : 'Your shopping request has been processed.';
}

/**
 * Generate speech audio from text using ElevenLabs API (supports multilingual including Hindi)
 * @param {Object} options
 * @param {string} options.text - Text to convert to speech
 * @param {string} [options.language='en'] - 'en' or 'hi'
 * @param {string} [options.voiceId] - ElevenLabs voice ID
 * @param {string} [options.modelId] - ElevenLabs model ID
 * @param {string} [options.apiKey] - Optional custom ElevenLabs API key
 * @returns {Promise<Object>} Audio data with base64 URI or fallback info
 */
async function generateSpeech({ text, language = 'en', voiceId, modelId, apiKey } = {}) {
  const effectiveApiKey = (apiKey || process.env.ELEVENLABS_API_KEY || '').trim();
  const configuredVoice = (process.env.ELEVENLABS_VOICE_ID || '').trim();
  const effectiveVoiceId = (voiceId || configuredVoice || DEFAULT_VOICE_ID).trim();
  const effectiveModelId = (modelId || process.env.ELEVENLABS_MODEL_ID || DEFAULT_MODEL_ID).trim();

  if (!text || text.trim() === '') {
    return { success: false, message: 'No text provided for speech generation.' };
  }

  // Check if ElevenLabs key is configured
  const isKeyValid = effectiveApiKey && 
                     !effectiveApiKey.includes('YOUR_ELEVENLABS') && 
                     !effectiveApiKey.includes('your_elevenlabs') &&
                     effectiveApiKey.length > 5;

  if (!isKeyValid) {
    return {
      success: false,
      isFallback: true,
      provider: 'browser-synthesis',
      language,
      text,
      message: 'ElevenLabs API key not configured in .env. Falling back to high-quality browser SpeechSynthesis.'
    };
  }

  const callElevenLabs = async (targetVoiceId) => {
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${targetVoiceId}`;
    return await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': effectiveApiKey,
        'Accept': 'audio/mpeg'
      },
      body: JSON.stringify({
        text,
        model_id: effectiveModelId,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.8
        }
      })
    });
  };

  try {
    let response = await callElevenLabs(effectiveVoiceId);

    // If custom voice fails with 402 (library voice on free tier) or 404, retry with DEFAULT_VOICE_ID
    if (!response.ok && (response.status === 402 || response.status === 404) && effectiveVoiceId !== DEFAULT_VOICE_ID) {
      console.warn(`[ElevenLabs TTS] Voice ${effectiveVoiceId} returned ${response.status} (likely Free plan library voice limit). Retrying with standard multilingual voice ${DEFAULT_VOICE_ID}...`);
      response = await callElevenLabs(DEFAULT_VOICE_ID);
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`[ElevenLabs TTS] HTTP ${response.status}: ${errorText}`);
      return {
        success: false,
        isFallback: true,
        provider: 'browser-synthesis',
        language,
        text,
        error: `ElevenLabs API error: ${response.statusText}`
      };
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64Audio = Buffer.from(arrayBuffer).toString('base64');
    const audioDataUrl = `data:audio/mpeg;base64,${base64Audio}`;

    return {
      success: true,
      provider: 'elevenlabs',
      language,
      voiceId: effectiveVoiceId,
      modelId: effectiveModelId,
      audioUrl: audioDataUrl,
      audioBase64: base64Audio,
      mimeType: 'audio/mpeg',
      text
    };
  } catch (err) {
    console.error('[ElevenLabs TTS Error]:', err.message);
    return {
      success: false,
      isFallback: true,
      provider: 'browser-synthesis',
      language,
      text,
      error: err.message
    };
  }
}

module.exports = {
  SUPPORTED_LANGUAGES,
  createSpokenFeedback,
  generateSpeech,
  DEFAULT_VOICE_ID,
  DEFAULT_MODEL_ID
};
