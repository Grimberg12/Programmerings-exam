/**
 * API route definitions.
 *
 * These routes are mounted at /api/v1.
 * Add business logic and additional endpoints here.
 */

import { Router } from "express";
const router = Router();

// Example API endpoints. Add more as your application grows.
router.get("/ping", (req, res) => {
  res.json({ ok: true, message: "pong" });
});

router.get("/status", (req, res) => {
  res.json({ ok: true, uptime: process.uptime() });
});

export default router;
