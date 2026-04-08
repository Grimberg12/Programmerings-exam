//middleware ligger mellem request og responst og kan bruges til at håndtere forskellige aspekter af request/response-cyklussen, såsom fejlhåndtering, autentificering, logging osv.

//Denne middleware håndterer 404 Not Found-fejl, hvilket betyder, at den vil blive kaldt, når ingen af de tidligere definerede ruter matcher den indkommende request.

function notFound(req, res, next) { //definerer en funktion, der tager req, res og next som argumenter. next bruges til at sende kontrol videre til næste middleware i kæden, hvis det er nødvendigt.
  res.status(404).json({
    success: false,
    message: `Route ikke fundet: ${req.method} ${req.originalUrl}`,
  });
}

//eksporterer funktionen, så den kan bruges i server.js eller andre steder i applikationen, hvor den skal registreres som middleware for at håndtere 404-fejl.
module.exports = notFound;