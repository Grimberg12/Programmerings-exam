/**
 * Webhook route definitions.
 *
 * These routes are mounted at /webhooks.
 * Incoming webhook payloads should be routed through controllers.
 */

const express = require("express");
const router = express.Router();

const { handleIncomingWebhook } = require("../controllers/webhookController");

// Incoming webhooks (POST)
router.post("/incoming", handleIncomingWebhook);

module.exports = router;
