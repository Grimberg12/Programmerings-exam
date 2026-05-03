// ── 404-handler ───────────────────────────────────────────────────────────────
function notFound(req, res, next) {
  res.status(404).json({
    success: false,
    message: `Route ikke fundet: ${req.method} ${req.originalUrl}`,
  });
}

// ── Eksporter ─────────────────────────────────────────────────────────────────
module.exports = notFound;
