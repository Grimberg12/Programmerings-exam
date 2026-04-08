// Simpel in-memory storage for webhooks (i produktion brug database)
let receivedWebhooks = [];

function handleIncomingWebhook(req, res, next) {
  try {
    console.log("--------------------------------------------");
    console.log("🔔 WEBHOOK MODTAGET!");
    console.log("Tid:", new Date().toISOString());
    console.log("Method:", req.method);
    console.log("URL:", req.url);
    console.log("Content-Type header:", req.get('content-type'));
    console.log("Alle headers:", req.headers);
    
    const payload = req.body;
    console.log("Raw body type:", typeof payload);
    console.log("Payload:", JSON.stringify(payload, null, 2));

    // Simpel validering
    if (!payload || typeof payload !== 'object' || Object.keys(payload).length === 0) {
      console.log("❌ Fejl: Payload er tom eller invalid!");
      const error = new Error("Webhook payload mangler eller er tom");
      error.statusCode = 400;
      throw error;
    }

    // Gem webhook med timestamp
    const webhookEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      payload: payload
    };
    receivedWebhooks.push(webhookEntry);

    console.log("✅ Webhook gemt! ID:", webhookEntry.id);
    console.log("Total modtaget:", receivedWebhooks.length);
    console.log("--------------------------------------------");

    return res.status(200).json({
      success: true,
      message: "Webhook modtaget",
      data: payload,
    });
  } catch (error) {
    console.error("❌ Webhook fejl:", error.message);
    console.error("Stack:", error.stack);
    next(error);
  }
}

// Funktion til at hente modtagne webhooks
function getReceivedWebhooks(req, res, next) {
  try {
    console.log("📋 Henter alle modtagne webhooks. Total:", receivedWebhooks.length);
    return res.status(200).json({
      success: true,
      message: "Modtagne webhooks",
      data: receivedWebhooks,
      count: receivedWebhooks.length
    });
  } catch (error) {
    console.error("❌ GET webhooks fejl:", error.message);
    next(error);
  }
}

module.exports = {
  handleIncomingWebhook,
  getReceivedWebhooks,
};