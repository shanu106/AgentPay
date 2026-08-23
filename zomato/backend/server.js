const express = require('express');
const cors = require('cors');
const { PORT } = require('./config/razorpay');

const restaurantRoutes = require('./routes/restaurant.routes');
const dishRoutes = require('./routes/dish.routes');
const orderRoutes = require('./routes/order.routes');
const paymentRoutes = require('./routes/payment.routes');

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Mount Modular API Routers (Separation of Concerns)
app.use('/api', restaurantRoutes);
app.use('/api', dishRoutes);
app.use('/api', orderRoutes);
app.use('/api', paymentRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Zomato Food Delivery Backend',
    port: PORT,
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔══════════════════════════════════════════════════╗
║         Zomato Food Delivery Backend             ║
╠══════════════════════════════════════════════════╣
║  Store API:     http://localhost:${PORT}        ║
║  Restaurants:   http://localhost:${PORT}/api/restaurants ║
║  Products API:  http://localhost:${PORT}/api/products ║
║  Health check:  http://localhost:${PORT}/api/health  ║
╚══════════════════════════════════════════════════╝
  `);
});

module.exports = app;
