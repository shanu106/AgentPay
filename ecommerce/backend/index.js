const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { processPurchaseRequest } = require('./services/buyerAgent');
const { executeTool, buyerOrders, auditLogs } = require('./tools/index');

const app = express();
const PORT = process.env.PORT || 8001;

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());