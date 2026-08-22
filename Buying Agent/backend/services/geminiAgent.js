const { GoogleGenerativeAI } = require('@google/generative-ai');
const { products, coupons } = require('../data/catalog');
const cartService = require('./cartService');

// Tools declaration for Gemini Function Calling
const toolsDeclarations = [
  {
    functionDeclarations: [
      {
        name: 'search_products',
        description: 'Search for courses, hardware, developer gear, books, and subscriptions in the store catalog with optional filters for category, price range, and rating.',
        parameters: {
          type: 'OBJECT',
          properties: {
            query: {
              type: 'STRING',
              description: 'Search terms or keywords (e.g., "python", "react", "keyboard", "headphones", "books").'
            },
            category: {
              type: 'STRING',
              description: 'Optional category filter: "Courses", "Hardware", "Books", "Subscriptions", or "All".'
            },
            maxPrice: {
              type: 'NUMBER',
              description: 'Maximum price limit in INR (₹).'
            },
            minRating: {
              type: 'NUMBER',
              description: 'Minimum star rating (e.g., 4.5).'
            }
          }
        }
      },
      {
        name: 'get_product_details',
        description: 'Retrieve detailed information, specifications, features, and pricing for a specific product by its ID.',
        parameters: {
          type: 'OBJECT',
          properties: {
            productId: {
              type: 'STRING',
              description: 'The unique ID of the product (e.g. "prod-js-mastery").'
            }
          },
          required: ['productId']
        }
      },
      {
        name: 'compare_products',
        description: 'Compare 2 or more products side-by-side on price, rating, features, and value.',
        parameters: {
          type: 'OBJECT',
          properties: {
            productIds: {
              type: 'ARRAY',
              items: { type: 'STRING' },
              description: 'List of product IDs to compare (e.g., ["prod-js-mastery", "prod-react-nextjs"]).'
            }
          },
          required: ['productIds']
        }
      },
      {
        name: 'find_best_deals',
        description: 'Find products with the highest discounts or best value for a given budget or category.',
        parameters: {
          type: 'OBJECT',
          properties: {
            maxBudget: {
              type: 'NUMBER',
              description: 'Maximum budget in INR (₹).'
            },
            category: {
              type: 'STRING',
              description: 'Optional category: "Courses", "Hardware", "Books", "Subscriptions".'
            }
          }
        }
      },
      {
        name: 'add_to_cart',
        description: 'Add a product to the user shopping cart.',
        parameters: {
          type: 'OBJECT',
          properties: {
            productId: {
              type: 'STRING',
              description: 'The ID of the product to add to cart.'
            },
            quantity: {
              type: 'NUMBER',
              description: 'Quantity to add (default is 1).'
            }
          },
          required: ['productId']
        }
      },
      {
        name: 'remove_from_cart',
        description: 'Remove a product from the shopping cart.',
        parameters: {
          type: 'OBJECT',
          properties: {
            productId: {
              type: 'STRING',
              description: 'The ID of the product to remove.'
            }
          },
          required: ['productId']
        }
      },
      {
        name: 'get_cart_summary',
        description: 'Get the current shopping cart contents, total items, subtotal, discount, and final price.',
        parameters: {
          type: 'OBJECT',
          properties: {}
        }
      },
      {
        name: 'apply_coupon_code',
        description: 'Apply a discount coupon promo code (e.g., "SAVE10", "SAVE20", "NOVABUY", "STUDENT50") to the shopping cart.',
        parameters: {
          type: 'OBJECT',
          properties: {
            couponCode: {
              type: 'STRING',
              description: 'Coupon promo code string.'
            }
          },
          required: ['couponCode']
        }
      },
      {
        name: 'execute_checkout',
        description: 'Proceed to place the order and checkout the cart on behalf of the customer.',
        parameters: {
          type: 'OBJECT',
          properties: {
            customerName: {
              type: 'STRING',
              description: 'Customer full name.'
            },
            customerEmail: {
              type: 'STRING',
              description: 'Customer email address.'
            }
          }
        }
      }
    ]
  }
];

// Tool Executors
const executeFunction = async (name, args) => {
  switch (name) {
    case 'search_products': {
      const { query = '', category = 'All', maxPrice, minRating } = args;
      const q = query.toLowerCase().trim();

      const results = products.filter(p => {
        const matchesQuery = !q ||
          p.title.toLowerCase().includes(q) ||
          p.subtitle.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.subcategory.toLowerCase().includes(q) ||
          (p.features && p.features.some(f => f.toLowerCase().includes(q)));

        const matchesCategory = category === 'All' || p.category.toLowerCase() === category.toLowerCase();
        const matchesPrice = !maxPrice || p.price <= Number(maxPrice);
        const matchesRating = !minRating || p.rating >= Number(minRating);

        return matchesQuery && matchesCategory && matchesPrice && matchesRating;
      });

      return {
        count: results.length,
        products: results.map(({ id, title, subtitle, price, originalPrice, rating, category, badge, icon, image }) => ({
          id, title, subtitle, price: `₹${price}`, originalPrice: `₹${originalPrice}`, rating, category, badge, icon, image
        }))
      };
    }

    case 'get_product_details': {
      const product = products.find(p => p.id === args.productId);
      if (!product) {
        return { error: `Product not found with ID ${args.productId}` };
      }
      return { product };
    }

    case 'compare_products': {
      const ids = args.productIds || [];
      const found = products.filter(p => ids.includes(p.id));
      if (found.length === 0) {
        return { error: 'No matching products found to compare.' };
      }
      return {
        comparisonCount: found.length,
        items: found.map(p => ({
          id: p.id,
          title: p.title,
          price: `₹${p.price}`,
          originalPrice: `₹${p.originalPrice}`,
          rating: p.rating,
          category: p.category,
          features: p.features,
          specs: p.specs
        }))
      };
    }

    case 'find_best_deals': {
      let filtered = [...products];
      if (args.category) {
        filtered = filtered.filter(p => p.category.toLowerCase() === args.category.toLowerCase());
      }
      if (args.maxBudget) {
        filtered = filtered.filter(p => p.price <= Number(args.maxBudget));
      }
      // Sort by highest discount percentage
      filtered.sort((a, b) => b.discountPercent - a.discountPercent);

      return {
        dealsCount: filtered.length,
        availableCoupons: coupons,
        topDeals: filtered.slice(0, 4).map(p => ({
          id: p.id,
          title: p.title,
          price: `₹${p.price}`,
          discount: `${p.discountPercent}% OFF`,
          rating: p.rating,
          image: p.image
        }))
      };
    }

    case 'add_to_cart': {
      const updatedCart = cartService.addToCart(args.productId, args.quantity || 1);
      const addedProduct = products.find(p => p.id === args.productId);
      return {
        success: true,
        message: `Added "${addedProduct?.title || args.productId}" to cart.`,
        cart: updatedCart
      };
    }

    case 'remove_from_cart': {
      const updatedCart = cartService.removeFromCart(args.productId);
      return {
        success: true,
        message: `Removed item from cart.`,
        cart: updatedCart
      };
    }

    case 'get_cart_summary': {
      const cart = cartService.getCart();
      return { cart };
    }

    case 'apply_coupon_code': {
      const result = cartService.applyCoupon(args.couponCode);
      return result;
    }

    case 'execute_checkout': {
      try {
        const order = cartService.checkoutOrder({
          customerName: args.customerName,
          customerEmail: args.customerEmail
        });
        return {
          success: true,
          message: `Order #${order.orderId} successfully placed!`,
          order
        };
      } catch (err) {
        return {
          success: false,
          error: err.message
        };
      }
    }

    default:
      return { error: `Unknown tool "${name}"` };
  }
};

const SYSTEM_INSTRUCTION = `You are "NovaBuy AI", an intelligent, autonomous, and friendly AI Shopping & Buying Agent.
Your mission is to help developers, creators, and students find, compare, and buy top-rated courses, dev tools, hardware gear, books, and software subscriptions.

You have access to real-time tools for:
- searching products (search_products)
- inspecting product details & specs (get_product_details)
- comparing products side-by-side (compare_products)
- discovering top deals & discounts (find_best_deals)
- adding/removing items from the cart (add_to_cart, remove_from_cart)
- checking cart summary (get_cart_summary)
- applying promo discount codes (apply_coupon_code)
- executing checkout orders (execute_checkout)

Guidelines:
1. Always be proactive and helpful. When recommending items, explain *why* they fit the user's budget and goals.
2. When the user asks to find, buy, compare, or add items to cart, invoke the appropriate tools immediately.
3. If the user mentions a budget (e.g., "under ₹1500"), ensure your suggestions stay within that budget and look for applicable coupons like SAVE10, SAVE20, or NOVABUY.
4. Format your final response with clean Markdown (bold headings, bullet points, price comparisons).
5. If the user asks for autonomous shopping (e.g., "Find the best Python course and buy it for me"), explain your plan, execute the tool calls, and summarize the result.`;

/**
 * Handle a chat turn with Google Gemini API & Tool Use Loop
 */
const runAgentChat = async ({ message, history = [], customApiKey }) => {
  const apiKey = customApiKey || process.env.GEMINI_API_KEY;
  const toolExecutions = [];

  // Fallback if no API key is provided
  if (!apiKey || apiKey.trim() === '' || apiKey.includes('YOUR_GEMINI')) {
    return handleSimulatedAgent(message, history);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Choose latest fast flash model
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: SYSTEM_INSTRUCTION,
      tools: toolsDeclarations
    });

    // Format chat history for Gemini
    const geminiHistory = (history || []).map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content || '' }]
    }));

    const chat = model.startChat({
      history: geminiHistory
    });

    let result = await chat.sendMessage(message);
    let response = result.response;

    // Tool execution loop (up to 5 recursive turns for chained tool calls)
    let turns = 0;
    while (response.functionCalls() && response.functionCalls().length > 0 && turns < 5) {
      turns++;
      const functionCalls = response.functionCalls();
      const functionResponses = [];

      for (const call of functionCalls) {
        const { name, args } = call;
        const toolResult = await executeFunction(name, args);
        
        toolExecutions.push({
          tool: name,
          args,
          result: toolResult,
          timestamp: new Date().toISOString()
        });

        functionResponses.push({
          functionResponse: {
            name,
            response: toolResult
          }
        });
      }

      result = await chat.sendMessage(functionResponses);
      response = result.response;
    }

    const replyText = response.text();
    const currentCart = cartService.getCart();

    // Extract any products mentioned in tool executions to render as interactive cards
    const extractedProductIds = new Set();
    toolExecutions.forEach(exec => {
      if (exec.result?.products) {
        exec.result.products.forEach(p => extractedProductIds.add(p.id));
      }
      if (exec.result?.product?.id) {
        extractedProductIds.add(exec.result.product.id);
      }
      if (exec.result?.items) {
        exec.result.items.forEach(p => extractedProductIds.add(p.id));
      }
      if (exec.result?.topDeals) {
        exec.result.topDeals.forEach(p => extractedProductIds.add(p.id));
      }
    });

    const recommendedProducts = products.filter(p => extractedProductIds.has(p.id));

    return {
      success: true,
      reply: replyText,
      toolExecutions,
      recommendedProducts,
      cart: currentCart
    };

  } catch (error) {
    console.error('Gemini Agent Error:', error);
    // If Gemini model throws 404 or auth error, fallback gracefully with simulated reasoning
    return handleSimulatedAgent(message, history, error.message);
  }
};

/**
 * Intelligent Rule-Based Fallback when Gemini API key is not configured or in case of rate limits
 */
const handleSimulatedAgent = async (message, history, originalError = null) => {
  const text = message.toLowerCase();
  const toolExecutions = [];
  let reply = '';
  let extractedIds = [];

  if (text.includes('cart') || text.includes('bag')) {
    if (text.includes('checkout') || text.includes('buy now')) {
      const res = await executeFunction('execute_checkout', { customerName: 'Nova User', customerEmail: 'user@example.com' });
      toolExecutions.push({ tool: 'execute_checkout', args: {}, result: res });
      reply = res.success ? `🎉 **Order Confirmed!**\n\nI have successfully executed your checkout (Order **#${res.order.orderId}**). Total: **₹${res.order.finalTotal}**.` : `⚠️ **Checkout Error**: ${res.error}`;
    } else {
      const res = await executeFunction('get_cart_summary', {});
      toolExecutions.push({ tool: 'get_cart_summary', args: {}, result: res });
      reply = `🛒 **Your Current Cart** has **${res.cart.totalItems} items** (Total: **₹${res.cart.finalTotal}**).`;
    }
  } else if (text.includes('coupon') || text.includes('discount') || text.includes('deal')) {
    const res = await executeFunction('find_best_deals', { maxBudget: 5000 });
    toolExecutions.push({ tool: 'find_best_deals', args: { maxBudget: 5000 }, result: res });
    reply = `⚡ **Hot Deals & Coupons Found!**\n\nI discovered active coupon codes for you:\n- **SAVE10** (10% OFF)\n- **SAVE20** (20% OFF above ₹1,000)\n- **NOVABUY** (25% AI Special above ₹1,500)\n- **STUDENT50** (50% OFF Courses)\n\nHere are the top discounted picks right now:`;
    extractedIds = res.topDeals.map(d => d.id);
  } else if (text.includes('compare')) {
    // Pick two courses/products
    let ids = ['prod-js-mastery', 'prod-react-nextjs'];
    if (text.includes('python')) ids = ['prod-python-ai-ds', 'prod-ai-agents-llm'];
    if (text.includes('keyboard') || text.includes('headphones')) ids = ['prod-mech-keyboard', 'prod-anc-headphones'];

    const res = await executeFunction('compare_products', { productIds: ids });
    toolExecutions.push({ tool: 'compare_products', args: { productIds: ids }, result: res });
    reply = `📊 **Side-by-Side Comparison Complete**\n\nI analyzed both items for you:\n- **${res.items[0]?.title}**: Best for starting out with a high **${res.items[0]?.rating}⭐** rating at ${res.items[0]?.price}.\n- **${res.items[1]?.title}**: Advanced capabilities at ${res.items[1]?.price}.\n\nTake a look at the feature matrix below:`;
    extractedIds = ids;
  } else {
    // Default search
    let query = '';
    let category = 'All';
    let maxPrice = 10000;

    if (text.includes('python')) query = 'python';
    else if (text.includes('react') || text.includes('web')) query = 'react';
    else if (text.includes('ai') || text.includes('agent')) query = 'ai';
    else if (text.includes('headphone') || text.includes('audio')) query = 'headphones';
    else if (text.includes('keyboard')) query = 'keyboard';
    else if (text.includes('book')) query = 'book';

    const res = await executeFunction('search_products', { query, category, maxPrice });
    toolExecutions.push({ tool: 'search_products', args: { query, category }, result: res });

    if (res.products.length > 0) {
      reply = `🔍 **Found ${res.count} Top Matches** for your request:\n\nHere are the best-rated options curated for you. Click **Add to Cart** or ask me to compare them!`;
      extractedIds = res.products.slice(0, 4).map(p => p.id);
    } else {
      reply = `I searched our catalog but couldn't find an exact match. Try searching for **"Python"**, **"React"**, **"Keyboard"**, or **"AI Agents"**!`;
    }
  }

  const recommendedProducts = products.filter(p => extractedIds.includes(p.id));
  const note = !process.env.GEMINI_API_KEY ? '\n\n*(Note: Running with local NovaBuy reasoning engine. Add your Google Gemini API key in settings for full generative multimodal intelligence.)*' : '';

  return {
    success: true,
    reply: reply + note,
    toolExecutions,
    recommendedProducts,
    cart: cartService.getCart(),
    isSimulated: true
  };
};

module.exports = {
  runAgentChat,
  executeFunction,
  SYSTEM_INSTRUCTION
};
