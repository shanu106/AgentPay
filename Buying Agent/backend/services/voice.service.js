/**
 * ElevenLabs Voice AI Service
 * Generates natural spoken audio feedback in English and Hindi for Autonomous Shopping Agent operations.
 */

const SUPPORTED_LANGUAGES = {
  EN: 'en',
  HI: 'hi'
};

const DEFAULT_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM'; // Rachel / Multilingual
const DEFAULT_MODEL_ID = process.env.ELEVENLABS_MODEL_ID || 'eleven_multilingual_v2';

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

  // Case 2: Purchase Succeeded & Paid
  if (result.success && (result.autoPaid || result.order?.paymentStatus === 'paid' || result.selectedProduct)) {
    const qty = result.order?.quantity || result.intent?.quantity || 1;
    const title = result.selectedProduct?.title || result.order?.productTitle || result.intent?.query || 'सामान';
    const amount = result.order?.amount || result.selectedProduct?.price || 0;
    const paymentLabel = result.order?.paymentMethod?.label || result.intent?.paymentMethod?.label || 'Saved Payment';
    const cleanPay = paymentLabel.replace(/\(•••• \d+\)/g, '').trim();

    if (isHindi) {
      return `आपका ${qty > 1 ? qty + ' ' : ''}${title} का ऑर्डर कन्फर्म हो गया है और ${cleanPay} के जरिए ₹${amount.toLocaleString()} का भुगतान सफलतापूर्वक पूरा हो गया है।`;
    }

    return `Your order for ${qty > 1 ? qty + ' units of ' : ''}${title} is confirmed and successfully paid via ${cleanPay} for ₹${amount.toLocaleString()}.`;
  }

  // Case 3: Authorization Denied / Spending Limit Exceeded
  if (result.status === 'denied' || result.code === 'AMOUNT_EXCEEDS_LIMIT') {
    const amount = result.totalAmount || result.amount || 'मांगी गई राशि';
    if (isHindi) {
      return `आपका ऑर्डर पूरा नहीं किया जा सका क्योंकि ₹${amount} की कुल राशि आपकी पूर्व-अधिकृत सीमा से अधिक है।`;
    }
    return `Your order could not be placed because the total of ₹${amount} exceeds your pre-authorized spending limit.`;
  }

  // Case 4: Product Not Found or Out of Stock
  if (result.code === 'PRODUCT_NOT_FOUND' || (result.message && result.message.toLowerCase().includes('not found'))) {
    if (isHindi) {
      return `दुकान के कैटलॉग में आपका पसंदीदा सामान नहीं मिला। कृपया कोई दूसरा आइटम या मूल्य सीमा आज़माएं।`;
    }
    return `I searched the store catalog but could not find matching products for your request. Please try another item or price range.`;
  }

  // Case 5: General Error or Incomplete
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
  const effectiveVoiceId = voiceId || DEFAULT_VOICE_ID;
  const effectiveModelId = modelId || DEFAULT_MODEL_ID;

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

  try {
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${effectiveVoiceId}`;
    const response = await fetch(url, {
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
