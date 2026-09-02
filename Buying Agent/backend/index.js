const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config/razorpay.config');
const { authenticateToken } = require('./middlewares/auth.middleware');

const agentRoutes = require('./routes/agent.routes');
const userRoutes = require('./routes/user.routes');
const webhookRoutes = require('./routes/webhook.routes');
const agentController = require('./controllers/agent.controller');

const app = express();
const PORT = config.PORT;

// Global Middlewares
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());

// Serve static embeddable SDK files (e.g. /sdk/razorpay-agent.js)
app.use(express.static(path.join(__dirname, 'public')));

// Public routes (no auth required)
app.get('/api/health', agentController.getHealth);

// User routes (login/signup are public, others protected)
app.use('/api/user', userRoutes);

// Webhook routes (handle payment callbacks - can have their own validation)
app.use('/api/webhooks', webhookRoutes);

// Protected routes (auth required)
app.use('/api/agent', agentRoutes);
app.get('/api/config', authenticateToken, agentController.getConfig);
app.post('/api/config/key', authenticateToken, agentController.updateConfigKey);

// Initialize PostgreSQL database schema & seeds
const { initDatabase } = require('./db/index');
initDatabase().catch(err => console.error('[DB Boot Error]:', err.message));

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔══════════════════════════════════════════════════╗
║         AI Shopping Buyer Agent Backend          ║
╠══════════════════════════════════════════════════╣
║  Buyer API:     http://localhost:${PORT}        ║
║  Purchase API:  http://localhost:${PORT}/api/agent/purchase ║
║  Merchant URL:  ${config.MERCHANT_API_BASE} ║
║  Health check:  http://localhost:${PORT}/api/health  ║
╚══════════════════════════════════════════════════╝
  `);
});

module.exports = app;
