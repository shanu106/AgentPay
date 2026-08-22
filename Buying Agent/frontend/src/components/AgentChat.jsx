import React, { useState, useRef, useEffect } from 'react';
import { sendAgentMessage } from '../api/agentApi';

const quickPrompts = [
  '⚡ Find best courses under ₹700',
  '🐍 Top-rated Python & AI masterclasses',
  '⚖️ Compare React vs Fullstack bundle',
  '🎧 Find ANC headphones under ₹5,000',
  '🏷️ Show all available coupon codes',
  '🛒 Check my current cart & discounts'
];

function AgentChat({ onAddToCart, onCompare, customApiKey, onCartUpdated }) {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: `👋 Hello! I am **NovaBuy AI**, your autonomous shopping & buying agent powered by Google Gemini.

I can help you:
- **Search & filter** top developer courses, gear, books & cloud tools.
- **Compare items** side-by-side with objective pros and cons.
- **Find secret promo codes** & maximize your discounts.
- **Add items to your cart** & execute autonomous checkouts.

What are you looking for today?`,
      toolExecutions: [],
      recommendedProducts: []
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (textToSend) => {
    const query = (textToSend || inputMessage).trim();
    if (!query || loading) return;

    const userMsg = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: query
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);

    try {
      // Build history for backend
      const history = messages
        .filter(m => m.id !== 'welcome')
        .map(m => ({ role: m.role, content: m.content }));

      const res = await sendAgentMessage({
        message: query,
        history,
        customApiKey
      });

      const assistantMsg = {
        id: `agent_${Date.now()}`,
        role: 'assistant',
        content: res.reply || 'Here is what I found for you:',
        toolExecutions: res.toolExecutions || [],
        recommendedProducts: res.recommendedProducts || []
      };

      setMessages(prev => [...prev, assistantMsg]);
      if (res.cart && onCartUpdated) {
        onCartUpdated(res.cart);
      }
    } catch (error) {
      setMessages(prev => [
        ...prev,
        {
          id: `error_${Date.now()}`,
          role: 'assistant',
          content: `⚠️ **Agent Request Failed**: ${error.message || 'Could not connect to Gemini backend.'}`,
          toolExecutions: []
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([
      {
        id: 'welcome-reset',
        role: 'assistant',
        content: `👋 Chat cleared. Ready for your next shopping task! What would you like to search, compare, or buy?`,
        toolExecutions: [],
        recommendedProducts: []
      }
    ]);
  };

  return (
    <div className="chat-pane">
      <div className="chat-header">
        <div className="agent-status">
          <div className="agent-avatar">🤖</div>
          <div className="agent-title-text">
            <h3>NovaBuy AI Shopping Assistant</h3>
            <p>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
              Gemini Tool-Calling Engine Active
            </p>
          </div>
        </div>
        <button className="btn-clear-chat" onClick={handleClear}>Clear</button>
      </div>

      <div className="chat-messages">
        {messages.map(msg => (
          <div key={msg.id} className={`message-bubble ${msg.role}`}>
            <div className="msg-avatar">
              {msg.role === 'user' ? '👤' : '🤖'}
            </div>

            <div className="msg-content-wrapper">
              <div className="msg-text-box">
                {/* Markdown text simulation */}
                <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                  {msg.content}
                </div>

                {/* Tool Executions Badges */}
                {msg.toolExecutions && msg.toolExecutions.length > 0 && (
                  <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {msg.toolExecutions.map((tool, idx) => (
                      <div key={idx} className="tool-execution-pill">
                        <span>⚡ Executed:</span>
                        <strong>{tool.tool}()</strong>
                        {tool.args && Object.keys(tool.args).length > 0 && (
                          <span style={{ opacity: 0.8 }}>
                            ({Object.entries(tool.args).map(([k, v]) => `${k}=${JSON.stringify(v)}`).join(', ')})
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recommended Product Cards inside Chat Bubble */}
              {msg.recommendedProducts && msg.recommendedProducts.length > 0 && (
                <div className="chat-product-carousel">
                  {msg.recommendedProducts.map(prod => (
                    <div key={prod.id} className="chat-product-card">
                      <img src={prod.image} alt={prod.title} className="chat-prod-img" />
                      <div className="chat-prod-info">
                        <h4>{prod.title}</h4>
                        <div className="chat-prod-prices">
                          <span className="chat-price">₹{prod.price}</span>
                          {prod.originalPrice && <span className="chat-orig-price">₹{prod.originalPrice}</span>}
                          <span>⭐ {prod.rating}</span>
                        </div>
                      </div>
                      <button 
                        className="btn-chat-add"
                        onClick={() => onAddToCart(prod.id)}
                      >
                        + Cart
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="message-bubble assistant">
            <div className="msg-avatar">🤖</div>
            <div className="msg-content-wrapper">
              <div className="msg-text-box" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="spinner"></div>
                <span style={{ color: 'var(--accent-cyan)', fontSize: '0.88rem', fontWeight: '600' }}>
                  NovaBuy AI is thinking & inspecting catalog tools...
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="quick-prompts-bar">
        {quickPrompts.map((prompt, idx) => (
          <button
            key={idx}
            className="prompt-chip"
            onClick={() => handleSendMessage(prompt.replace(/^[^\w\s]+/, '').trim())}
          >
            {prompt}
          </button>
        ))}
      </div>

      <div className="chat-input-container">
        <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="chat-input-form">
          <input
            type="text"
            placeholder="Ask anything (e.g., 'Find fullstack courses under ₹1000 and add best to cart')..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            disabled={loading}
            className="chat-input-field"
          />
          <button type="submit" disabled={loading || !inputMessage.trim()} className="btn-send">
            ➤
          </button>
        </form>
      </div>
    </div>
  );
}

export default AgentChat;
