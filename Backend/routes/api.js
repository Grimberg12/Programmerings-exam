/**
 * API route definitions.
 *
 * These routes are mounted at /api/v1.
 * Add business logic and additional endpoints here.
 */

const express = require("express");
const router = express.Router();

// Example API endpoints. Add more as your application grows.
router.get("/ping", (req, res) => {
  res.json({ ok: true, message: "pong" });
});

router.get("/status", (req, res) => {
  res.json({ ok: true, uptime: process.uptime() });
});

module.exports = router;
