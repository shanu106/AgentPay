const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config/razorpay.config');

const agentRoutes = require('./routes/agent.routes');
const userRoutes = require('./routes/user.routes');
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

// Mount Modular Routers (Separation of Concerns)
app.use('/api/agent', agentRoutes);
app.use('/api/user', userRoutes);

// System & Config Routes
app.get('/api/config', agentController.getConfig);
app.post('/api/config/key', agentController.updateConfigKey);
app.get('/api/health', agentController.getHealth);

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