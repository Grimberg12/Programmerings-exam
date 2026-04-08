//middleware til at håndtere fejl i applikationen
function errorHandler(err, req, res, next) {
  console.error("Fejl:", err.message);

  // Tjek om headers allerede er sendt
  if (res.headersSent) {
    return next(err);
  }

  //bestem statuskode baseret på fejlobjektet, hvis det har en statusCode-egenskab, ellers brug 500 (Internal Server Error)
  const statusCode = err.statusCode || 500;

  //send en JSON-respons med success: false og en besked, der enten kommer fra fejlobjektet eller er en generisk besked for intern serverfejl
  res.status(statusCode).json({
    success: false,
    message: err.message || "Intern serverfejl",
  });
}

//eksporterer funktionen, så den kan bruges i server.js eller andre steder i applikationen, hvor den skal registreres som global error handler for at håndtere fejl på tværs af hele applikationen.
module.exports = errorHandler;