/**
 * Controller for handling incoming webhook payloads.
 *
 * This file should validate and process webhook data, then
 * persist it / enqueue it for later processing.
 */

exports.handleIncomingWebhook = (req, res) => {
  const payload = req.body;

  // TODO: Validate the webhook source/signature (e.g. HMAC, secret key, etc.)
  // TODO: Persist payload to the database or enqueue for processing.

  console.log("[webhook] received payload:", payload);

  res.status(200).json({ ok: true, received: true });
};
