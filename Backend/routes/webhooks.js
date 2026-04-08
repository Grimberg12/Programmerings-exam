const express = require("express");
const router = express.Router();

const webhookController = require("../controllers/webhookController");

router.post("/incoming", webhookController.handleIncomingWebhook);
router.get("/received", webhookController.getReceivedWebhooks);

module.exports = router;