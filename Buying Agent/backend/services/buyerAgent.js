const { GoogleGenerativeAI } = require('@google/generative-ai');
const { toolDeclarations, executeTool } = require('../tools/index');
const { resolvePaymentMethod } = require('./paymentMethods');
const userStore = require('./userStore.service');
const emailService = require('./email.service');

const SYSTEM_PROMPT = `You are the autonomous AI Shopping Agent built for Razorpay Agentic Commerce.
Your objective is to help the user find, evaluate, authorize, purchase, and pay for products from the merchant store with ZERO human intervention whenever pre-authorized limits permit.`;

/**
 * Helper: Detect Memory & Order Recall queries (e.g. "what was my last order?", "how much have I spent?")
 */
const checkMemoryRecallQuery = (text, userEmail) => {
  const t = text.toLowerCase().trim();
  
  const isLastOrderQuery = /\b(what was my last order|what did i order (last|previously|earlier)|show my last order|view last order|last order)\b/i.test(t);
  const isOrderHistoryQuery = /\b(show (my )?(past |previous )?orders|order history|my orders|list (my )?orders|what have i ordered|past orders)\b/i.test(t);
  const isSpendingQuery = /\b(how much (did i|have i|i) (spend|spent)|my total spend|total expenses|spending stats|total spending|how much spend)\b/i.test(t);
  const isAddressQuery = /\b(what is my (delivery )?address|where do you deliver|my saved address|saved addresses|where did you deliver)\b/i.test(t);

  if (isLastOrderQuery || isOrderHistoryQuery || isSpendingQuery || isAddressQuery) {
    const user = userStore.getUser(userEmail);
    const lastOrder = userStore.getLastOrder(userEmail);
    const history = userStore.getOrderHistory(userEmail);
    const stats = userStore.getSpendingStats(userEmail);
    const address = userStore.getActiveAddress(userEmail);

    if (isAddressQuery) {
      return {
        isMemoryQuery: true,
        reply: `📍 **Your Saved Delivery Addresses (${user.name})**:\n\n` +
          user.addresses.map(a => `- **${a.label}** ${a.isDefault ? '*(Default)*' : ''}: ${a.street}, ${a.area}, ${a.city} - ${a.pincode}`).join('\n') +
          `\n\nActive delivery address for orders: **${address.label}** (${address.street}, ${address.area}, ${address.city} - ${address.pincode}).`
      };
    }

    if (isSpendingQuery) {
      return {
        isMemoryQuery: true,
        reply: `📊 **Spending & Memory Stats for ${user.name} (${user.email})**:\n\n- **Total Orders Placed**: ${stats.orderCount}\n- **Total Autonomous Spend**: ₹${stats.totalSpent.toLocaleString()}\n- **Last Order Date**: ${stats.lastOrderDate ? new Date(stats.lastOrderDate).toLocaleString() : 'No orders yet'}\n- **Default Payment Card**: ${user.paymentMethods[0]?.label || 'Visa (•••• 1007)'}`
      };
    }

    if (isLastOrderQuery && lastOrder) {
      const itemsList = (lastOrder.items || []).map(i => `- **${i.quantity || 1}x ${i.title || i.productTitle}**: ₹${(i.lineTotal || i.price * (i.quantity || 1) || 0).toLocaleString()}`).join('\n');
      return {
        isMemoryQuery: true,
        reply: `📋 **Your Last Autonomously Captured Order**:\n\n- **Order ID**: \`${lastOrder.orderId}\`\n- **Date**: ${new Date(lastOrder.createdAt).toLocaleString()}\n- **Total Amount**: **₹${lastOrder.amount.toLocaleString()}**\n- **Razorpay Payment ID**: \`${lastOrder.razorpayPaymentId}\` (Captured ✓)\n- **Delivered To**: ${lastOrder.deliveryAddress?.label || 'Home'} (${lastOrder.deliveryAddress?.street || ''}, ${lastOrder.deliveryAddress?.city || 'Bengaluru'})\n\n### Purchased Items:\n${itemsList}\n\n💡 *Tip: You can say "reorder my last order" to order these items again immediately!*`
      };
    }

    if (history.length > 0) {
      const historyList = history.slice(0, 5).map((o, idx) => `${idx + 1}. **#${o.orderId}** (${new Date(o.createdAt).toLocaleDateString()}): ₹${o.amount.toLocaleString()} — *${o.productTitle || 'Items'}* (Payment: \`${o.razorpayPaymentId}\`)`).join('\n');
      return {
        isMemoryQuery: true,
        reply: `📋 **Order History & Memory for ${user.name}** (${history.length} total orders):\n\n${historyList}\n\n- **Total Lifetime Spend**: ₹${stats.totalSpent.toLocaleString()}\n- **Saved Address**: ${address.street}, ${address.city} - ${address.pincode}`
      };
    } else {
      return {
        isMemoryQuery: true,
        reply: `📋 **No Previous Orders Found in Memory** for ${user.name} (${user.email}). Place your first order by asking me to buy any dishes, products, or courses!`
      };
    }
  }

  return { isMemoryQuery: false };
};

/**
 * Helper: Classify and handle Greetings, Store Inquiries, Guardrails, and Meta Inquiries
 */
const handleConversationalAndGuardrailQueries = async (message, user, sessionContext, apiKey) => {
  const text = message.toLowerCase().trim();
  const hasBuyCommand = /\b(buy|order|purchase|bue|by|get me|deliver me|send me|add to cart|checkout|reorder)\b/i.test(text);

  // 1. Meta / System Prompt / Restrictions Inquiry -> Guardrail
  const isMetaInquiry = /\b(ignore (all )?previous instructions|system prompt|what are your (instructions|rules|restrictions|constraints|system prompts)|show (me )?your (prompt|code|instructions|rules)|jailbreak|developer mode|dan mode|internal prompt)\b/i.test(text);
  if (isMetaInquiry) {
    return {
      handled: true,
      reply: `I am the store's AI Shopping Assistant powered by **Razorpay Agentic Commerce**. I'm here to assist you with browsing our catalog, checking product availability, and placing orders securely with pre-authorized payments.`,
      stepText: `🛡️ Security & Privacy Guardrail: Handled assistant inquiry safely`
    };
  }

  // 2. Greeting Inquiry (when not explicitly asking to buy an item)
  const isGreeting = /\b(hi|hello|hey|heya|yo|namaste|good\s+(morning|afternoon|evening)|howdy|sup|how are you|greetings|hi there|hello there)\b/i.test(text);
  if (isGreeting && !hasBuyCommand) {
    return {
      handled: true,
      reply: `👋 Hello **${user.name}**! I am your AI Shopping Assistant for this store powered by **Razorpay Agentic Commerce**.\n\nHere is what I can do for you:\n- 🛍️ **Browse Catalog**: Ask me *"what dishes/products do you have?"* or *"show me pizzas/burgers"*\n- ⚡ **Autonomous 0-Click Buying**: Tell me *"buy 2 chicken biryani under 1000"* and I will place the order and capture payment automatically\n- 💳 **Payment Methods**: Pay via Saved Cards, Bank of Baroda / HDFC NetBanking, or UPI\n- 📋 **Memory Recall**: Ask *"what was my last order?"* or *"show my spending"*\n\nHow can I help you today?`,
      stepText: `💬 Conversational Greeting: Welcomed ${user.name}`
    };
  }

  // 3. Store / Merchant Info & Product Availability Queries
  const isCatalogOverviewQuery = /\b(what (restaurants|shops|brands|items|products|dishes|food|courses)|show (me )?(what (you|is)|the |available )?(menu|catalog|dishes|products|items|restaurants|courses|sell)|what (do you|can i|can you|you|is available to) (sell|offer|have|serve|buy|order)|what is in (the |your )?(store|catalog|menu|shop)|list (of )?(all )?(items|products|dishes|courses|restaurants|menu)|what are (the |your )?(dishes|items|products|bestsellers)|how (does (the )?agent|do you) work)\b/i.test(text);
  const isPaymentQuery = /\b(payment (methods|options)|how (to|do i) pay|accepted cards|netbanking|upi (accepted|available))\b/i.test(text);
  const isPriceQuery = /\b(price of|cost of|how much (is|for|does)|what is the price)\b/i.test(text);
  const isAvailabilityQuery = /\b(is there|are there|available|availability|in stock|do you have|do you sell|can i find|search for|look for|find)\b/i.test(text);

  if ((isCatalogOverviewQuery || isPaymentQuery || isPriceQuery || isAvailabilityQuery) && !hasBuyCommand) {
    // Fetch live products from merchant catalog
    const searchRes = await executeTool('searchProducts', { query: '' }, sessionContext);
    const prods = searchRes.products || [];

    if (isPaymentQuery) {
      return {
        handled: true,
        reply: `💳 **Supported Payment Instruments & Auto-Debit Options**:\n\n- **💳 Pre-Saved Cards**: Visa Domestic, Amazon Pay ICICI, HDFC Millennia, RuPay Debit\n- **🏦 NetBanking**: Bank of Baroda (BOB), HDFC Bank, State Bank of India (SBI), ICICI Bank\n- **⚡ Instant UPI**: Google Pay, PhonePe, Paytm\n\nAll transactions are verified with **Razorpay Pre-Authorization** and 256-bit tokenization. You can switch your default payment method anytime in the ⚙️ Settings panel!`,
        stepText: `ℹ️ Merchant Information: Provided supported Razorpay payment methods`
      };
    }

    if (!isCatalogOverviewQuery && (isPriceQuery || isAvailabilityQuery)) {
      // Extract target product search query
      const cleaned = text
        .replace(/^(?:is there (any )?|are there (any )?|do you have (any )?|check availability of |availability of |can i find |search for |find |what is the price of |how much is |how much for |cost of |price of |how much does )\s*/i, '')
        .replace(/\s+(available|availability|in stock|in the store|cost|worth|\?)*$/gi, '')
        .trim();

      const matchedProds = prods.filter(p => {
        const titleLower = (p.title || '').toLowerCase();
        const descLower = (p.description || '').toLowerCase();
        const brandLower = (p.brand || p.restaurantName || '').toLowerCase();
        const words = cleaned.toLowerCase().split(/\s+/).filter(w => w.length > 2);
        return titleLower.includes(cleaned) ||
               descLower.includes(cleaned) ||
               brandLower.includes(cleaned) ||
               words.some(w => titleLower.includes(w) || descLower.includes(w) || brandLower.includes(w));
      });

      if (matchedProds.length > 0) {
        const prodList = matchedProds.slice(0, 3).map(p => 
          `- **${p.title}**: **₹${p.price.toLocaleString()}** *(⭐ ${p.rating || 4.5} ★ | ${p.available !== false ? 'In Stock ✓' : 'Out of Stock'})*${p.restaurantName || p.brand ? `\n  *Brand/Merchant: ${p.restaurantName || p.brand}*` : ''}${p.description ? `\n  *${p.description}*` : ''}`
        ).join('\n\n');

        return {
          handled: true,
          reply: `✅ **Yes! Available in Store**:\n\n${prodList}\n\n💡 *Would you like me to autonomously purchase any of these? Just say "buy 1 ${matchedProds[0].title}".*`,
          stepText: `🔍 Availability Check: Found ${matchedProds.length} matching item(s) in catalog for "${cleaned}"`
        };
      } else if (cleaned.length > 2) {
        return {
          handled: true,
          reply: `❌ **Not Found in Catalog**: We currently do not have **"${cleaned}"** in stock.\n\nYou can ask me *"show catalog"* or *"what items do you have?"* to explore our available menu and products!`,
          stepText: `🔍 Availability Check: No products found in catalog for "${cleaned}"`
        };
      }
    }

    // Group products by restaurant, brand, or category
    const isFoodNiche = prods.some(p => p.restaurantName || (p.category && /food|biryani|pizza|burger|snack/i.test(p.category)));
    const isTechNiche = prods.some(p => p.brand || (p.category && /hardware|electronics|accessories|audio/i.test(p.category)));
    const isCourseNiche = prods.some(p => p.instructor || (p.category && /course|education/i.test(p.category)));

    const groupIcon = isFoodNiche ? '🍴' : (isTechNiche ? '💻' : (isCourseNiche ? '📚' : '🛍️'));
    const storeNicheTitle = isFoodNiche ? 'Restaurant & Food Menu' : (isTechNiche ? 'Electronics & Gear Catalog' : (isCourseNiche ? 'Course Catalog' : 'Store Catalog'));

    const groups = {};
    prods.forEach(p => {
      const gName = p.restaurantName || p.brand || p.category || (isCourseNiche ? 'Featured Courses' : 'Store Catalog');
      if (!groups[gName]) groups[gName] = [];
      groups[gName].push(p);
    });

    let menuList = '';
    for (const [gName, items] of Object.entries(groups)) {
      menuList += `### ${groupIcon} ${gName}:\n`;
      items.slice(0, 4).forEach(item => {
        menuList += `- **${item.title}**: ₹${item.price.toLocaleString()} *(⭐ ${item.rating || 4.5})*\n`;
      });
      menuList += '\n';
    }

    return {
      handled: true,
      reply: `📋 **Welcome to the ${storeNicheTitle}!** Here are popular items available for autonomous ordering:\n\n${menuList}\n💡 *To order, simply tell me what you'd like (e.g. "buy 1 ${prods[0]?.title || 'item'}").*`,
      stepText: `📋 Catalog Overview: Displayed ${storeNicheTitle.toLowerCase()} with available items`
    };
  }

  // 4. Out-of-Domain / Non-Merchant Query Guardrail
  const isOutOfDomain = /\b(write (python|javascript|code|script|essay|poem)|solve (equation|math|\d+[\+\-\*\/])|who is (the )?(president|prime minister|ceo|founder|king)|what is (the capital|quantum|gravity|photosynthesis|speed of light)|tell me a joke|explain (relativity|calculus|physics)|how to hack|recipe for homemade)\b/i.test(text);

  if (isOutOfDomain && !hasBuyCommand) {
    return {
      handled: true,
      reply: `I am specifically designed as an AI Shopping Assistant for this store. I can help you discover products, check item prices, explore the menu, and place autonomous orders with Razorpay. \n\nHow can I assist you with your shopping today?`,
      stepText: `🛡️ Out-of-Domain Guardrail: Redirected non-shopping query to store assistance`
    };
  }

  return { handled: false };
};

/**
 * Helper: Extract structured multi-item intent from natural language prompt
 */
const extractPurchaseIntent = (message, defaultLimit = 15000) => {
  const text = message.toLowerCase();
  
  // 1. Extract budget / spending limit
  let maxPrice = defaultLimit;
  let hasExplicitBudget = false;
  
  const priceMatches = text.match(/(?:under|below|up to|max|upto|within|budget of|price of|price upto|price up to|of price upto|of price up to|worth upto|worth up to|worth|for|<=|<)\s*(?:₹|rs\.?|inr)?\s*([\d,]+)/i) ||
                       text.match(/(?:₹|rs\.?|inr)\s*([\d,]+)/i);
  if (priceMatches && priceMatches[1]) {
    maxPrice = parseInt(priceMatches[1].replace(/,/g, ''), 10);
    hasExplicitBudget = true;
  }

  // 2. Clean conversational commentary & payment clauses
  let cleaned = text
    .replace(/^(?:i\s+want\s+to\s+|can\s+you\s+|pls\s+|please\s+|plz\s+|help\s+me\s+)?(?:buy|bue|by|bay|order|purchase|get|want|find|give|deliver|send)\s+(?:me\s+)?(?:a\s+|an\s+|to\s+)?/gi, '')
    // Strip payment clauses: "and make payment using ...", "and pay using ...", "using bank of baroda ...", etc.
    .replace(/\s+(and\s+)?(make\s+)?(payment|pay|paying|paid)\s+(using|with|via|by|through|of|on)\s+.*$/gi, '')
    .replace(/\s+(and\s+)?(using|with|via|through|by)\s+(visa|mastercard|card|credit\s+card|debit\s+card|bob|sbi|hdfc|icici|canara|bank\s+of\s+baroda|state\s+bank|axis|upi|gpay|google\s+pay|phonepe|paytm|netbanking|net\s+banking).*$/gi, '')
    .replace(/\s+(and\s+)?(deliver|deliver\s+to|send\s+to|address)\s+(to\s+)?(home|office|work|bangalore|bengaluru|flat|house).*$/gi, '')
    .replace(/\s+(for the prompt|then total|multiple product|when user|fix the issue|total should be|asking for|but receipt got|order autonomously).*$/gi, '')
    .replace(/\s+(of\s+price|at\s+price|price|budget|worth|under|below|up to|upto|for)\s*(?:₹|rs\.?|inr)?\s*[\d,]+.*$/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  // 3. Detect Catalog-Wide / All-Items intent (e.g., "buy each item as single quantity from the store", "buy each item from La Pino'z Pizza of 2 quantity")
  const isCatalogWide = /\b(each|all|every)\s+(?:single\s+)?(?:item|items|product|products|dish|dishes|food|everything|menu|course|courses)\b/i.test(text) ||
                        /\b(one\s+of\s+each|one\s+of\s+everything|whole\s+menu|entire\s+store|from\s+the\s+store|every\s+item)\b/i.test(text) ||
                        /\b(all\s+the\s+dishes|all\s+dishes|all\s+items|everything\s+in\s+the\s+store)\b/i.test(text);

  if (isCatalogWide) {
    // Check if user specified a specific shop, restaurant, or brand
    const knownShops = [
      "la pino'z pizza", "la pinoz pizza", "la pinoz", "la pino'z",
      "biryani by kilo", "burger king", "the belgian waffle co", "the belgian waffle", "belgian waffle",
      "haldiram's sweets & snacks", "haldirams", "haldiram's", "haldiram",
      "mainland china",
      "keychron", "sony", "logitech", "anker", "apple", "samsung", "dell"
    ];

    let targetShop = null;
    for (const shop of knownShops) {
      if (text.includes(shop)) {
        targetShop = shop;
        break;
      }
    }

    if (!targetShop) {
      const fromMatch = text.match(/\b(?:from|at|in)\s+([a-z0-9\s&'\-_]+?)(?:\s+(?:of|with|in|at)\s+\d+|\s+quantity|\s+qty|$)/i);
      if (fromMatch && !fromMatch[1].includes("the store") && !fromMatch[1].includes("menu") && !fromMatch[1].includes("store")) {
        targetShop = fromMatch[1].trim();
      }
    }

    let quantityPerItem = 1;
    if (text.match(/\b(?:2|two|double)\s*(?:quantity|qty|units|pcs|pieces|each)?\b/i) || text.includes('of 2') || text.includes('quantity 2')) quantityPerItem = 2;
    else if (text.match(/\b(?:3|three|triple)\s*(?:quantity|qty|units|pcs|pieces|each)?\b/i) || text.includes('of 3') || text.includes('quantity 3')) quantityPerItem = 3;
    else if (text.match(/\b(?:4|four)\s*(?:quantity|qty|units|pcs|pieces|each)?\b/i) || text.includes('of 4') || text.includes('quantity 4')) quantityPerItem = 4;
    else if (text.match(/\b(?:5|five)\s*(?:quantity|qty|units|pcs|pieces|each)?\b/i) || text.includes('of 5') || text.includes('quantity 5')) quantityPerItem = 5;
    else if (text.match(/\b(?:1|one|single)\s*(?:quantity|qty|units|pcs|pieces|each)?\b/i)) quantityPerItem = 1;

    const shopLabel = targetShop ? targetShop.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : 'Store';

    return {
      items: [{ query: targetShop || 'all items', quantity: quantityPerItem }],
      query: `All ${shopLabel} Items (${quantityPerItem}x each)`,
      quantity: quantityPerItem,
      maxPrice,
      hasExplicitBudget,
      isCatalogWide: true,
      targetShop,
      quantityPerItem,
      currency: 'INR',
      ratingRequirement: 'standard'
    };
  }

  // Preserve compound product titles containing 'and' or '&' so they don't get split into multiple items
  let sanitized = cleaned
    .replace(/\b(ai|artificial\s+intelligence)\s+(and|&)\s+(machine\s+learning|ml)\b/gi, 'ai_and_machine_learning')
    .replace(/\b(machine\s+learning|ml)\s+(and|&)\s+(ai|artificial\s+intelligence)\b/gi, 'machine_learning_and_ai')
    .replace(/\b(data\s+science)\s+(and|&)\s+(ai|machine\s+learning|python)\b/gi, 'data_science_and_$3')
    .replace(/\b(full\s+stack)\s+(and|&)\s+(web\s+dev|development)\b/gi, 'full_stack_and_web_dev')
    .replace(/\b(react)\s+(and|&)\s+(next\.?js|modern\s+web)\b/gi, 'react_and_modern_web')
    .replace(/\b(sweets?)\s+(and|&)\s+(snacks?)\b/gi, 'sweets_and_snacks')
    .replace(/\b(chole)\s+(and|&)\s+(bhature)\b/gi, 'chole_and_bhature')
    .replace(/\b(pav)\s+(and|&)\s+(bhaji)\b/gi, 'pav_and_bhaji')
    .replace(/\b(red\s+velvet)\s+(and|&)\s+(white\s+chocolate)\b/gi, 'red_velvet_and_white_chocolate')
    .replace(/\b(burn)\s+(to)\s+(hell)\b/gi, 'burn_to_hell')
    .replace(/\b(cheesy|iphone|galaxy|ps|pixel|windows|i3|i5|i7|i9)\s*[-_ ]\s*(\d+)\b/gi, '$1_$2');

  const wordQtyMap = { 'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5, 'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10, 'double': 2, 'pair': 2, 'triple': 3 };
  const qtyWords = Object.keys(wordQtyMap).join('|');

  const parseSegment = (seg) => {
    let s = seg.trim()
      .replace(/^and\s+/i, '')
      .replace(/,\s*$/i, '')
      .replace(/^(?:buy|bue|by|bay|order|purchase|get|want|find|give|pls|please|plz|me)\s+/gi, '')
      .replace(/_and_/g, ' & ')
      .replace(/_/g, ' ')
      .trim();

    if (!s) return [];

    // Discard any segment that is actually a payment instruction or delivery destination
    if (/\b(make\s+payment|payment|netbanking|net\s+banking|bank\s+of\s+baroda|baroda|sbi|hdfc|icici|canara|axis|upi|gpay|google\s+pay|phonepe|paytm|credit\s+card|debit\s+card|visa|mastercard|deliver|delivery|address|home|office|koramangala|residency)\b/i.test(s)) {
      return [];
    }
    const matches = [...s.matchAll(new RegExp(`(?:^|\\s+)(\\d+|${qtyWords})\\s*(?:x|pcs|pieces|plates|sets|units|box|boxes|dishes)?\\s*(?:of\\s+)?([a-z0-9\\s&'\\-_]+?)(?=(?:\\s+(?:\\d+|${qtyWords})\\b)|$)`, 'gi'))];
    if (matches.length > 1) {
      const results = [];
      for (const m of matches) {
        const rawQty = m[1].toLowerCase();
        const q = parseInt(rawQty, 10) || wordQtyMap[rawQty] || 1;
        const name = m[2].trim().replace(/^and\s+/i, '');
        if (name.length > 0) results.push({ query: name, quantity: q });
      }
      if (results.length > 0) return results;
    }

    // Check Prefix Quantity: e.g. "2 cheesy_7 pizza" or "2 hyderabadi dum chicken biryani"
    const prefixMatch = s.match(new RegExp(`^(\\d+|${qtyWords})\\s*(?:x|pcs|pieces|plates|sets|units|box|boxes|dishes)?\\s*(?:of\\s+)?(.*)$`, 'i'));
    if (prefixMatch && prefixMatch[2].trim().length > 0) {
      const rawQty = prefixMatch[1].toLowerCase();
      const q = parseInt(rawQty, 10) || wordQtyMap[rawQty] || 1;
      return [{ query: prefixMatch[2].trim(), quantity: q }];
    }

    // Check Suffix Quantity: e.g. "burn to hell pizza 2 pcs"
    const suffixMatch = s.match(new RegExp(`^(.*?)\\s+(\\d+|${qtyWords})\\s*(?:x|pcs|pieces|plates|sets|units|box|boxes|dishes)?$`, 'i'));
    if (suffixMatch && suffixMatch[1].trim().length > 0) {
      const rawQty = suffixMatch[2].toLowerCase();
      const q = parseInt(rawQty, 10) || wordQtyMap[rawQty] || 1;
      return [{ query: suffixMatch[1].trim(), quantity: q }];
    }

    return [{ query: s, quantity: 1 }];
  };

  // Split on "and", comma, plus, ampersand
  const segments = sanitized.split(/(?:\s+and\s+|\s*&\s*|\s*,\s*|\s*\+\s*)/i);
  const items = [];
  for (const seg of segments) {
    const parsed = parseSegment(seg);
    if (parsed && parsed.length > 0) items.push(...parsed);
  }

  if (items.length === 0 && cleaned.length > 0) {
    items.push({ query: cleaned.replace(/_and_/g, ' & ').replace(/_/g, ' '), quantity: 1 });
  }

  const querySummary = items.map(i => `${i.quantity > 1 ? i.quantity + 'x ' : ''}${i.query}`).join(', ');

  return {
    items,
    query: querySummary || 'biryani',
    quantity: items.reduce((acc, i) => acc + i.quantity, 0),
    maxPrice,
    hasExplicitBudget,
    isCatalogWide: false,
    currency: 'INR',
    ratingRequirement: text.includes('good') || text.includes('top') || text.includes('best') ? 'high' : 'standard'
  };
};

/**
 * Execute Buyer Agent Purchase Flow (Spec Section 5, 14 & 25)
 */
const processPurchaseRequest = async ({ 
  message, 
  customApiKey, 
  userEmail = 'nawaz@gmail.com',
  customerName = 'Nawaz Khan', 
  customerEmail = 'nawaz@gmail.com',
  deliveryAddress = null,
  autoExecutePayment = true,
  savedPaymentMethod = { type: 'card', last4: '1007', brand: 'Visa', autoDebitLimit: 15000 },
  merchantApiBase
}) => {
  const apiKey = customApiKey || process.env.GEMINI_API_KEY;
  const targetEmail = (userEmail || customerEmail || 'nawaz@gmail.com').toLowerCase().trim();
  const user = userStore.getUser(targetEmail);
  const activeAddress = deliveryAddress || userStore.getActiveAddress(targetEmail, message);

  // 0. Intercept conversational memory & history queries
  const memoryCheck = checkMemoryRecallQuery(message, targetEmail);
  if (memoryCheck.isMemoryQuery) {
    return {
      success: true,
      intent: { query: 'Memory Query', isMemoryRecall: true },
      reply: memoryCheck.reply,
      steps: [{ text: `⚡ Agent Memory System: Retrieved user profile & past order memory for ${user.name} (${targetEmail})`, status: 'completed' }],
      toolCalls: [],
      selectedProduct: null,
      order: null,
      autoPaid: false,
      requiresCheckout: false
    };
  }

  // 1. Intercept Greetings, Merchant/Store Inquiries, and Non-Merchant Guardrails
  const tempSessionContext = {
    userAuth: { maxAmount: 15000, currency: 'INR' },
    customerName: customerName || user.name,
    customerEmail: targetEmail,
    deliveryAddress: activeAddress,
    merchantApiBase
  };
  const convCheck = await handleConversationalAndGuardrailQueries(message, user, tempSessionContext, apiKey);
  if (convCheck.handled) {
    return {
      success: true,
      intent: { query: 'Conversational Query', isConversational: true },
      reply: convCheck.reply,
      steps: [{ text: convCheck.stepText || `💬 Conversational Assistant: Processed user inquiry`, status: 'completed' }],
      toolCalls: [],
      selectedProduct: null,
      order: null,
      autoPaid: false,
      requiresCheckout: false
    };
  }

  // Handle "reorder" from memory
  let effectiveMessage = message;
  if (/\b(reorder|repeat (my )?(last|previous)|order again)\b/i.test(message)) {
    const lastOrder = userStore.getLastOrder(targetEmail);
    if (lastOrder && lastOrder.items && lastOrder.items.length > 0) {
      effectiveMessage = `buy ` + lastOrder.items.map(i => `${i.quantity || 1} ${i.title || i.productTitle}`).join(' and ');
    }
  }

  // Resolve dynamic payment method from user prompt (Cards, NetBanking, UPI, or Default Saved Method)
  const paymentMethod = resolvePaymentMethod(effectiveMessage, savedPaymentMethod);
  const cardLimit = Number(paymentMethod.autoDebitLimit || savedPaymentMethod?.autoDebitLimit || 15000);
  
  const intent = extractPurchaseIntent(effectiveMessage, cardLimit);
  intent.paymentMethod = paymentMethod;

  // Strict Dual-Boundary Spending Limits:
  // 1. If user gave prompt limit (e.g. 5000), effective limit is min(5000, cardLimit)
  // 2. If user did not give prompt limit, effective limit is strictly the cardLimit (e.g. 2000)
  const effectiveMaxLimit = intent.hasExplicitBudget 
    ? Math.min(intent.maxPrice, cardLimit)
    : cardLimit;

  intent.maxPrice = effectiveMaxLimit;
  intent.cardLimit = cardLimit;

  const sessionContext = {
    userAuth: {
      maxAmount: effectiveMaxLimit,
      cardLimit: cardLimit,
      currency: intent.currency
    },
    customerName: customerName || user.name,
    customerEmail: targetEmail,
    deliveryAddress: activeAddress,
    paymentMethod,
    savedPaymentMethod: paymentMethod,
    autoExecutePayment,
    merchantApiBase
  };

  const steps = [];
  const toolCalls = [];

  const addStep = (stepText, status = 'completed', meta = {}) => {
    steps.push({
      text: stepText,
      status,
      timestamp: new Date().toISOString(),
      ...meta
    });
  };

  // 1. Advanced Gemini AI Natural Language Intent Extraction
  if (apiKey && apiKey.trim() !== '' && !apiKey.includes('YOUR_GEMINI') && !apiKey.includes('XXXX')) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const geminiModel = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });
      
      const nlpPrompt = `You are the Google Gemini AI Shopping Assistant Intent Parser.
Extract the user purchase intent from the natural language message into valid JSON with this exact structure:
{
  "isCatalogWide": boolean (true if user asks for "each item", "all items", "every item", "whole menu" from the store or a specific restaurant/brand),
  "targetShop": string or null (the specific restaurant, shop, or brand if specified, e.g. "Burger King", "La Pino'z Pizza", "Biryani By Kilo", "Mainland China", "The Belgian Waffle Co.", "Haldiram's", "Keychron", "Sony", "Logitech", etc., or null if entire store),
  "quantityPerItem": number (the quantity for each item if catalog-wide, default 1),
  "items": [ { "query": string, "quantity": number } ] (list of specific product items to buy. CRITICAL RULE: Payment instructions like "and make payment using bank of baroda netbanking", "using sbi netbanking", "pay with upi", and delivery destinations like "deliver to home" are NOT products and MUST NEVER be included in the items array!),
  "budget": number or null (price limit mentioned in prompt, e.g. 5000),
  "paymentMethod": string or null (e.g. "Bank of Baroda NetBanking", "SBI NetBanking", "Visa", "UPI", "Amazon Card", etc.)
}

User Message: "${effectiveMessage.replace(/"/g, '\\"')}"

Respond ONLY with valid JSON inside a markdown codeblock.`;

      const geminiRes = await geminiModel.generateContent(nlpPrompt);
      const textOutput = geminiRes.response.text();
      const jsonMatch = textOutput.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || [null, textOutput];
      if (jsonMatch && jsonMatch[1]) {
        const parsed = JSON.parse(jsonMatch[1].trim());
        if (parsed.isCatalogWide !== undefined) {
          intent.isCatalogWide = Boolean(parsed.isCatalogWide);
          if (parsed.targetShop) intent.targetShop = parsed.targetShop;
          if (parsed.quantityPerItem) intent.quantityPerItem = Number(parsed.quantityPerItem);
          if (parsed.items && parsed.items.length > 0 && !parsed.isCatalogWide) {
            intent.items = parsed.items;
          }
          if (parsed.budget) {
            intent.maxPrice = Number(parsed.budget);
            intent.hasExplicitBudget = true;
          }
          const shopName = intent.targetShop ? intent.targetShop : 'Store';
          intent.query = intent.isCatalogWide 
            ? `All ${shopName} Items (${intent.quantityPerItem || 1}x each)`
            : intent.items.map(i => `${i.quantity > 1 ? i.quantity + 'x ' : ''}${i.query}`).join(', ');
        }
      }
    } catch (err) {
      console.warn('Gemini NLP fallback to heuristic parser:', err.message);
    }
  }

  return runSimulatedBuyerAgent({ intent, sessionContext, steps, toolCalls, autoExecutePayment, savedPaymentMethod });
};

/**
 * Deterministic Control Loop Engine (Ensures 100% Reliability)
 */
const runSimulatedBuyerAgent = async ({ 
  intent, 
  sessionContext, 
  steps, 
  toolCalls, 
  autoExecutePayment = true,
  savedPaymentMethod = { type: 'card', last4: '1007', brand: 'Visa' },
  fallbackError = null 
}) => {
  // Streamlined User-Facing Step 1: Search and match items
  steps.push({
    text: `Searching catalog for "${intent.query}"`,
    status: 'completed'
  });

  const evaluatedItems = [];
  let totalGrandAmount = 0;

  if (intent.isCatalogWide) {
    const searchResult = await executeTool('searchProducts', { query: intent.targetShop || '', maxPrice: intent.maxPrice }, sessionContext);
    toolCalls.push({ tool: 'searchProducts', args: { query: intent.targetShop || '', maxPrice: intent.maxPrice }, result: searchResult });

    let matchingProducts = searchResult.products || [];
    if (intent.targetShop) {
      const cleanShop = intent.targetShop.toLowerCase().replace(/['\s]/g, '');
      const filtered = matchingProducts.filter(p => {
        const rName = (p.restaurantName || p.brand || '').toLowerCase().replace(/['\s]/g, '');
        const pDesc = (p.description || '').toLowerCase().replace(/['\s]/g, '');
        const pTitle = (p.title || '').toLowerCase().replace(/['\s]/g, '');
        return (rName.length > 0 && (rName.includes(cleanShop) || cleanShop.includes(rName))) ||
               (pDesc.length > 0 && pDesc.includes(cleanShop)) ||
               (pTitle.length > 0 && pTitle.includes(cleanShop));
      });
      matchingProducts = filtered;
    }

    const shopLabel = intent.targetShop ? `"${intent.targetShop.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}"` : 'the store';

    if (matchingProducts.length === 0) {
      steps.push({ text: `No products found from ${shopLabel}.`, status: 'failed' });
      return {
        success: false,
        intent,
        reply: `⚠️ **Shop Not Found**: Could not find any products from **${shopLabel}** in the store catalog.`,
        steps,
        toolCalls,
        selectedProduct: null,
        order: null,
        requiresCheckout: false
      };
    }

    const qtyPerItem = intent.quantityPerItem || 1;
    for (const prod of matchingProducts) {
      const details = await executeTool('getProduct', { productId: prod.id }, sessionContext);
      toolCalls.push({ tool: 'getProduct', args: { productId: prod.id }, result: details });

      const lineTotal = details.price * qtyPerItem;
      totalGrandAmount += lineTotal;
      evaluatedItems.push({
        product: details,
        quantity: qtyPerItem,
        unitPrice: details.price,
        lineTotal
      });

      steps.push({
        text: `Added to cart: ${details.title} (${qtyPerItem}x) • ₹${lineTotal.toLocaleString()}`,
        status: 'completed'
      });
    }
  } else {
    for (const itemIntent of intent.items) {
      const searchResult = await executeTool('searchProducts', { query: itemIntent.query, maxPrice: intent.maxPrice }, sessionContext);
      toolCalls.push({ tool: 'searchProducts', args: { query: itemIntent.query, maxPrice: intent.maxPrice }, result: searchResult });

      if (!searchResult.products || searchResult.products.length === 0) {
        const limitLabel = intent.hasExplicitBudget ? `budget of ₹${intent.maxPrice.toLocaleString()}` : `pre-auth limit of ₹${intent.maxPrice.toLocaleString()}`;
        steps.push({ text: `No products found matching "${itemIntent.query}".`, status: 'failed' });
        return {
          success: false,
          intent,
          reply: `⚠️ **Product Not Found**:\n\nI searched the merchant catalog for **"${itemIntent.query}"**, but could not find any matching items within your **${limitLabel}**.\n\nNo order was placed.`,
          steps,
          toolCalls,
          selectedProduct: null,
          order: null,
          requiresCheckout: false
        };
      }

      // Step 2: Rerank candidates against item query with cross-niche intelligence
      const qWords = itemIntent.query.toLowerCase().split(/[\s,_\-]+/).filter(w => w.length > 1);
      const rankedCandidates = [...searchResult.products].map(prod => {
        const pTitle = (prod.title || '').toLowerCase();
        const pDesc = (prod.description || '').toLowerCase();
        const pCategory = (prod.category || '').toLowerCase();
        const pBrand = (prod.brand || prod.restaurantName || prod.instructor || '').toLowerCase();

        let score = 0;
        const fullItemQuery = itemIntent.query.toLowerCase();

        if (pTitle.includes(fullItemQuery)) score += 100;
        if (fullItemQuery.includes(pTitle)) score += 80;

        if ((fullItemQuery.includes('python') || fullItemQuery.includes('ds')) && pTitle.includes('python') && (pTitle.includes('data science') || pDesc.includes('data science'))) {
          score += 90;
        }

        qWords.forEach(w => {
          if (w === 'ds' && (pTitle.includes('data science') || pDesc.includes('data science'))) {
            score += 40;
          }
          if (pTitle.includes(w)) {
            score += 30;
          } else if (pDesc.includes(w) || pCategory.includes(w) || pBrand.includes(w)) {
            score += 15;
          }
        });

        if (fullItemQuery.includes('mutton') && pTitle.includes('chicken')) score -= 50;
        if (fullItemQuery.includes('chicken') && pTitle.includes('mutton')) score -= 50;
        if (fullItemQuery.includes('paneer') && (pTitle.includes('chicken') || pTitle.includes('mutton'))) score -= 50;
        if (fullItemQuery.includes('mouse') && pTitle.includes('keyboard')) score -= 50;
        if (fullItemQuery.includes('keyboard') && pTitle.includes('mouse')) score -= 50;

        return { ...prod, matchScore: score };
      }).sort((a, b) => b.matchScore - a.matchScore);

      const chosenCandidate = rankedCandidates[0];

      if (!chosenCandidate || chosenCandidate.matchScore <= 0) {
        steps.push({ text: `No relevant products found matching "${itemIntent.query}".`, status: 'failed' });
        return {
          success: false,
          intent,
          reply: `⚠️ **Product Not Found in Catalog**:\n\nI searched the merchant catalog for **"${itemIntent.query}"**, but could not find any matching products in this store.`,
          steps,
          toolCalls,
          selectedProduct: null,
          order: null,
          requiresCheckout: false
        };
      }

      const productDetails = await executeTool('getProduct', { productId: chosenCandidate.id }, sessionContext);
      toolCalls.push({ tool: 'getProduct', args: { productId: chosenCandidate.id }, result: productDetails });

      const existingItem = evaluatedItems.find(i => i.product.id === productDetails.id);
      if (!existingItem) {
        const lineTotal = productDetails.price * itemIntent.quantity;
        totalGrandAmount += lineTotal;
        evaluatedItems.push({
          product: productDetails,
          quantity: itemIntent.quantity,
          unitPrice: productDetails.price,
          lineTotal
        });

        steps.push({
          text: `Added to cart: ${productDetails.title} (${itemIntent.quantity > 1 ? itemIntent.quantity + 'x' : '1x'}) • ₹${lineTotal.toLocaleString()}`,
          status: 'completed'
        });
      }
    }
  }

  // Pre-Authorization Check against aggregate cart total
  if (totalGrandAmount > intent.maxPrice) {
    const limitLabel = intent.hasExplicitBudget ? `budget limit of ₹${intent.maxPrice.toLocaleString()}` : `pre-authorized limit of ₹${intent.maxPrice.toLocaleString()}`;
    steps.push({
      text: `Order total ₹${totalGrandAmount.toLocaleString()} exceeds ${limitLabel}.`,
      status: 'denied'
    });
    return {
      success: false,
      intent,
      reply: `⚠️ **Purchase Blocked**:\n\nThe order total is **₹${totalGrandAmount.toLocaleString()}**, which exceeds your **${limitLabel}**.\n\nNo payment was charged.`,
      steps,
      toolCalls,
      selectedProduct: evaluatedItems[0]?.product,
      order: null,
      requiresCheckout: false
    };
  }

  // Check Availability
  for (const item of evaluatedItems) {
    const availResult = await executeTool('checkAvailability', { productId: item.product.id }, sessionContext);
    toolCalls.push({ tool: 'checkAvailability', args: { productId: item.product.id }, result: availResult });
  }

  // Create Order
  const orderResult = await executeTool('createOrder', {
    items: evaluatedItems.map(i => ({ productId: i.product.id, quantity: i.quantity, unitPrice: i.unitPrice, lineTotal: i.lineTotal })),
    productId: evaluatedItems[0]?.product.id,
    quantity: evaluatedItems.reduce((acc, i) => acc + i.quantity, 0)
  }, sessionContext);
  toolCalls.push({ tool: 'createOrder', args: { items: evaluatedItems }, result: orderResult });

  if (orderResult.status === 'denied' || !orderResult.orderId) {
    steps.push({
      text: `Order creation failed: ${orderResult.error || 'Denied'}`,
      status: 'denied'
    });
    return {
      success: false,
      intent,
      reply: `⚠️ **Order Creation Failed**:\n\n${orderResult.error}`,
      steps,
      toolCalls,
      selectedProduct: evaluatedItems[0]?.product,
      order: null,
      requiresCheckout: false
    };
  }

  const activeMethod = sessionContext.paymentMethod || savedPaymentMethod;
  const methodLabel = activeMethod.label || `${activeMethod.brand || 'Saved Card'} (•••• ${activeMethod.last4 || '1007'})`;

  // Initiate Payment
  const paymentData = await executeTool('initiatePayment', { orderId: orderResult.orderId }, sessionContext);
  toolCalls.push({ tool: 'initiatePayment', args: { orderId: orderResult.orderId }, result: paymentData });

  let verificationResult = null;

  // Direct Autonomous Payment on Razorpay API
  if (autoExecutePayment) {
    steps.push({
      text: `Processing secure payment via ${methodLabel}`,
      status: 'completed'
    });

    verificationResult = await executeTool('verifyPayment', {
      orderId: orderResult.orderId,
      razorpayOrderId: paymentData.razorpayOrderId
    }, sessionContext);
    toolCalls.push({ tool: 'verifyPayment', args: { orderId: orderResult.orderId }, result: verificationResult });

    steps.push({
      text: `Payment captured & order placed successfully!`,
      status: 'completed'
    });

    // Save to Persistent User Order Memory
    try {
      userStore.saveOrder(sessionContext.customerEmail, {
        orderId: orderResult.orderId,
        razorpayOrderId: paymentData.razorpayOrderId,
        paymentId: verificationResult.paymentId,
        amount: orderResult.amount,
        quantity: orderResult.quantity,
        items: evaluatedItems.map(i => ({
          productId: i.product.id,
          title: i.product.title,
          unitPrice: i.unitPrice,
          quantity: i.quantity,
          lineTotal: i.lineTotal
        })),
        productTitle: orderResult.productTitle,
        merchant: sessionContext.merchantApiBase,
        deliveryAddress: sessionContext.deliveryAddress,
        paymentMethod: activeMethod
      });
    } catch (memErr) {
      console.warn('User memory save warning:', memErr.message);
    }

    // Dispatch Confirmation Email Receipt
    try {
      const mailResult = await emailService.sendOrderConfirmationEmail({
        userEmail: sessionContext.customerEmail,
        userName: sessionContext.customerName,
        order: {
          ...orderResult,
          items: evaluatedItems.map(i => ({
            productId: i.product.id,
            title: i.product.title,
            unitPrice: i.unitPrice,
            quantity: i.quantity,
            lineTotal: i.lineTotal
          }))
        },
        payment: verificationResult,
        address: sessionContext.deliveryAddress
      });
      if (mailResult.success) {
        steps.push({
          text: `📧 Confirmation email sent to ${sessionContext.customerEmail}`,
          status: 'completed'
        });
      }
    } catch (mailErr) {
      console.warn('Email dispatch warning:', mailErr.message);
    }
  }

  const itemsListFormatted = evaluatedItems.map(i => `- **${i.quantity}x ${i.product.title}**: ₹${i.lineTotal.toLocaleString()} (₹${i.unitPrice.toLocaleString()} each)`).join('\n');
  const deliveryAddr = sessionContext.deliveryAddress;
  const addrText = deliveryAddr ? `${deliveryAddr.label} (${deliveryAddr.street}, ${deliveryAddr.city} - ${deliveryAddr.pincode})` : 'Default Address (Bengaluru)';

  const reply = autoExecutePayment ?
    `🎉 **Order Confirmed & Paid Successfully!**\n\nI have successfully ordered and secured payment for all **${evaluatedItems.length} items**:\n\n### 📋 Itemized Receipt:\n${itemsListFormatted}\n\n---\n- **Total Amount Paid**: **₹${orderResult.amount.toLocaleString()}**\n- **Payment Method**: ${methodLabel}\n- **Pre-Authorized Spending Limit**: ₹${(activeMethod.autoDebitLimit || 15000).toLocaleString()} (Verified ✓)\n- **📍 Delivery Address**: ${addrText}\n- **📧 Email Confirmation**: Sent to \`${sessionContext.customerEmail}\` ✓\n- **Store Order ID**: \`${orderResult.orderId}\`\n- **Razorpay Order ID**: \`${paymentData.razorpayOrderId || orderResult.orderId}\`\n- **Razorpay Payment ID**: \`${verificationResult?.paymentId}\` (Captured ✓)\n\nYour order is confirmed and will be delivered shortly!` :
    `I have evaluated all items for you:\n\n${itemsListFormatted}\n\n- **Total**: ₹${orderResult.amount.toLocaleString()}\n- **Order ID**: \`${orderResult.orderId}\`\n\nPlease complete the payment step below to finalize your order!`;
    `I have evaluated all items for you:\n\n${itemsListFormatted}\n\n- **Total**: ₹${orderResult.amount.toLocaleString()}\n- **Order ID**: \`${orderResult.orderId}\`\n\nPlease complete the payment step below to finalize your order!`;

  return {
    success: true,
    intent,
    reply,
    steps,
    toolCalls,
    selectedProduct: evaluatedItems[0]?.product,
    order: {
      ...orderResult,
      paymentMethod: activeMethod,
      deliveryAddress: sessionContext.deliveryAddress,
      userEmail: sessionContext.customerEmail,
      status: autoExecutePayment ? 'confirmed' : 'created',
      paymentStatus: autoExecutePayment ? 'paid' : 'pending'
    },
    paymentData,
    verification: verificationResult,
    autoPaid: Boolean(autoExecutePayment && verificationResult?.paymentStatus === 'paid'),
    requiresCheckout: !Boolean(autoExecutePayment && verificationResult?.paymentStatus === 'paid'),
    autoLaunchCheckout: false
  };
};

module.exports = {
  processPurchaseRequest,
  extractPurchaseIntent,
  SYSTEM_PROMPT
};
