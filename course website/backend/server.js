const express = require('express');
const cors = require('cors');
const { PORT, CLIENT_URL } = require('./config/razorpay');

const courseRoutes = require('./routes/course.routes');
const orderRoutes = require('./routes/order.routes');
const paymentRoutes = require('./routes/payment.routes');

const app = express();

// Global Middlewares
app.use(cors({
  origin: CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Mount Modular API Routers (Separation of Concerns)
app.use('/api', courseRoutes);
app.use('/api', orderRoutes);
app.use('/api', paymentRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'LearnHub Course Platform Backend',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔══════════════════════════════════════════════════╗
║         Course Platform Backend Server           ║
╠══════════════════════════════════════════════════╣
║  Server running on http://localhost:${PORT}        ║
║  API base:      http://localhost:${PORT}/api       ║
║  Courses:       http://localhost:${PORT}/api/courses ║
║  Health:        http://localhost:${PORT}/api/health  ║
║                                                  ║
║  Frontend URL:  ${CLIENT_URL}         ║
╚══════════════════════════════════════════════════╝
  `);
});

module.exports = app;