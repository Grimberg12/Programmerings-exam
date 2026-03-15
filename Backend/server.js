/**
 * ================================================================
 * SERVER ENTRYPOINT (Backend/server.js)
 * ================================================================
 *
 * FORMÅL MED DENNE FIL
 *
 * Denne fil starter backend-serveren for projektet. Den konfigurerer
 * Express, registrerer routes og håndterer fejl.
 *
 * Når serveren kører, kan den:
 *
 * - Servere frontend-filer (HTML, JS, CSS)
 * - Modtage API-requests fra frontend
 * - Modtage webhook-calls fra eksterne systemer
 * - Returnere standardiserede fejl hvis noget går galt
 *
 * Denne fil fungerer derfor som det centrale sted hvor hele backend
 * applikationen sættes op og startes.
 *
 * Overordnet flow:
 *
 * 1. Import af dependencies
 * 2. Oprettelse af Express app
 * 3. Konfiguration af middleware
 * 4. Registrering af routes
 * 5. Fejlhåndtering
 * 6. Start af server
 *
 * ================================================================
 */

const express = require("express");
const path = require("path");

/**
 * Import af route-moduler
 *
 * Routes er opdelt i separate filer for at holde koden overskuelig.
 *
 * ./routes/api
 *   Indeholder alle API endpoints som frontend kan kalde.
 *
 * ./routes/webhooks
 *   Indeholder endpoints som eksterne services kan kalde.
 */
const apiRoutes = require("./routes/api").default;
const webhookRoutes = require("./routes/webhooks");

/**
 * Opret Express applikationen.
 *
 * Express er et Node.js framework til at bygge HTTP servere.
 * app-objektet repræsenterer selve serveren.
 */
const app = express();

/**
 * ================================================================
 * STATIC FILES
 * ================================================================
 *
 * Denne linje gør det muligt at servere frontend-filer direkte
 * fra backend-serveren.
 *
 * Express vil automatisk servere filer fra denne mappe når
 * browseren laver requests.
 *
 * Eksempel:
 *
 * Browser request:
 *   http://localhost:3000/index.html
 *
 * Fil der returneres:
 *   Frontend/public/index.html
 */
app.use(express.static(path.join(__dirname, "..", "Frontend", "public")));

/**
 * ================================================================
 * BODY PARSING MIDDLEWARE
 * ================================================================
 *
 * Middleware i Express er funktioner som kører før routes.
 *
 * Disse middleware gør det muligt at læse data fra request bodies.
 *
 * express.json()
 *   Parser JSON payloads fra requests.
 *
 * express.urlencoded()
 *   Parser data fra HTML forms.
 *
 * extended: true betyder at nested objekter også understøttes.
 */

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * ================================================================
 * HEALTH CHECK ENDPOINT
 * ================================================================
 *
 * Bruges til hurtigt at teste om serveren kører.
 *
 * Request:
 *   GET /health
 *
 * Response:
 *   {
 *     ok: true,
 *     message: "Server is running"
 *   }
 *
 * Denne type endpoint bruges ofte i produktion til monitoring.
 */

app.get("/health", (req, res) => {
  res.json({
    ok: true,
    message: "Server is running",
  });
});

/**
 * ================================================================
 * API ROUTES
 * ================================================================
 *
 * Alle API endpoints registreres under:
 *
 *   /api/v1
 *
 * Eksempel:
 *
 * Hvis apiRoutes indeholder:
 *   GET /users
 *
 * Så bliver endpointet:
 *   /api/v1/users
 *
 * Versionering gør det muligt at introducere nye API-versioner
 * senere uden at bryde eksisterende clients.
 */

app.use("/api/v1", apiRoutes);

/**
 * ================================================================
 * WEBHOOK ROUTES
 * ================================================================
 *
 * Webhooks er HTTP endpoints som eksterne systemer kan kalde
 * automatisk når en bestemt hændelse sker.
 *
 * Eksempel:
 * - betaling gennemført
 * - bruger oprettet
 * - data opdateret
 *
 * Alle webhook endpoints ligger under:
 *
 *   /webhooks
 */

app.use("/webhooks", webhookRoutes);

/**
 * ================================================================
 * 404 HANDLER
 * ================================================================
 *
 * Denne middleware håndterer requests til endpoints som ikke findes.
 *
 * Hvis ingen routes matcher requesten, vil Express ende her.
 *
 * Response:
 *   status: 404
 *   body: { error: "Not found" }
 */

app.use((req, res) => {
  res.status(404).json({
    error: "Not found",
  });
});

/**
 * ================================================================
 * GLOBAL ERROR HANDLER
 * ================================================================
 *
 * Denne middleware håndterer fejl som opstår i serveren.
 *
 * Fordele ved central fejlhåndtering:
 *
 * - konsistente fejlresponses
 * - bedre logging
 * - nemmere debugging
 *
 * next-parameteren fortæller Express at dette er en error middleware.
 */

app.use((err, req, res, next) => {

  /**
   * Specifik håndtering af JSON parse fejl.
   *
   * Hvis klienten sender invalid JSON vil express.json()
   * kaste en fejl med typen:
   *
   * entity.parse.failed
   */

  if (err.type === "entity.parse.failed") {
    console.error("Invalid JSON payload:", err.message);

    return res.status(400).json({
      error: "Invalid JSON payload",
      details: err.message,
    });
  }

  /**
   * Generel fejlhåndtering.
   *
   * Logger fejlen til konsollen og returnerer en HTTP fejlstatus.
   */

  console.error("Unhandled server error:", err);

  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
  });
});

/**
 * ================================================================
 * SERVER START
 * ================================================================
 *
 * Serveren starter her.
 *
 * PORT kan sættes via environment variable:
 *
 *   PORT=4000 node server.js
 *
 * Hvis PORT ikke er sat bruges standard port 3000.
 */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});