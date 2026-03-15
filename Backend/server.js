/**
 * Backend server entrypoint.
 *
 * - Starts an Express HTTP server.
 * - Registers API routes under /api/v1.
 * - Registers webhook endpoints under /webhooks.
 * - Includes health, 404, and error handlers.
 */

const express = require("express");
const apiRoutes = require("./routes/api");
const webhookRoutes = require("./routes/webhooks");

const app = express();

// Parse JSON bodies and URL-encoded bodies (for webhook payloads)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/health", (req, res) => {
  res.json({ ok: true, message: "Server is running" });
});

// API versioned routes
app.use("/api/v1", apiRoutes);

// Webhooks
app.use("/webhooks", webhookRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Error handler
app.use((err, req, res, next) => {
  // Handle JSON parse errors gracefully
  if (err.type === "entity.parse.failed") {
    console.error("Invalid JSON payload", err.message);
    return res.status(400).json({ error: "Invalid JSON payload", details: err.message });
  }

  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});

const PORT = process.env.PORT || 3000;

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
