const express = require("express");

// Routere
const apiRouter = require("./routes/api");
const webhookRouter = require("./routes/webhooks");

// Middleware
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");

// Konfiguration
const { PORT, NODE_ENV } = require("./config/env");

const app = express();

// Middleware til at læse JSON body
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// CORS headers for alle requests
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Simpel logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Body:', req.body);
  }
  next();
});

// Statiske filer fra Frontend
app.use(express.static("../Frontend/public"));

// API routes
app.use("/api/v1", apiRouter);

// Webhook routes
app.use("/webhooks", webhookRouter);

// 404 middleware
app.use(notFound);

// Global error handler
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`Server kører på http://localhost:${PORT} (${NODE_ENV})`);
});