const express = require('express');
const cors = require('cors');
const { PORT } = require('./config/razorpay');

const productRoutes = require('./routes/product.routes');
const orderRoutes = require('./routes/order.routes');
const paymentRoutes = require('./routes/payment.routes');

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Mount Modular API Routers (Separation of Concerns)
app.use('/api', productRoutes);
app.use('/api', orderRoutes);
app.use('/api', paymentRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'NovaStore E-commerce Backend',
    port: PORT,
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔══════════════════════════════════════════════════╗
║         NovaStore E-commerce Backend             ║
╠══════════════════════════════════════════════════╣
║  Store API:     http://localhost:${PORT}        ║
║  Products API:  http://localhost:${PORT}/api/products ║
║  Health check:  http://localhost:${PORT}/api/health  ║
╚══════════════════════════════════════════════════╝
  `);
});

module.exports = app;
