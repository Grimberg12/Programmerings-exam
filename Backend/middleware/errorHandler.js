// ── Global fejlhåndterer ──────────────────────────────────────────────────────
function errorHandler(err, req, res, next) {
  console.error("Fejl:", err.message);

  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || "Intern serverfejl",
  });
}

// ── Eksporter ─────────────────────────────────────────────────────────────────
module.exports = errorHandler;
