const express = require("express");

// Opretter en router-instans
const router = express.Router();

// Importerer funktion fra service-laget,
// som kalder Datafordeler REST API
const {
  hentEnhederFraAdresseId,
  hentBygningFraId,
  hentGrundFraId,
  hentJordstykkeViaDawa,
} = require("../services/datafordelerService");

// Service-lag der håndterer luftfoto-opslaget mod DAWA og Dataforsyningen
const { hentLuftfotoUrl } = require("../services/luftfotoService");

// Service-lag der bygger WMS-URL til matrikelkortet (INSPIRE cp_inspire)
const { hentMatrikelkortUrl } = require("../services/matrikelkortService");

// Endpoint som henter enheder ud fra et adresse-id
// Eksempel på request:
// GET /api/v1/properties/enheder?adresseid=0a3f...
router.get("/properties/enheder", async (req, res) => {
  try {
    // Henter adresseid fra query string
    const { adresseid } = req.query;

    // Validerer at adresseid er sendt med
    if (!adresseid) {
      return res.status(400).json({
        success: false,
        message: "Mangler query-parameteren adresseid",
      });
    }

    // Kalder service-laget, som henter enheder fra Datafordeler
    const data = await hentEnhederFraAdresseId(adresseid);

    // Returnerer svaret til klienten
    return res.status(200).json({
      success: true,
      message: "Enheder hentet",
      data,
    });
  } catch (error) {
    // Logger fejlen i terminalen
    console.error("Fejl i /properties/enheder:", error.message);

    // Returnerer en kontrolleret fejl til klienten
    return res.status(502).json({
      success: false,
      message: "Kunne ikke hente enheder fra Datafordeler",
    });
  }
});

router.get("/properties/bygning", async (req, res) => {
  try {
    const { adresseid } = req.query;

    if (!adresseid) {
      return res.status(400).json({
        success: false,
        message: "Mangler query-parameteren adresseid",
      });
    }

    // Hent enheder for at finde bygning-referencen
    const enheder = await hentEnhederFraAdresseId(adresseid);
    const bygningId = enheder?.[0]?.bygning;

    if (!bygningId) {
      return res.status(404).json({
        success: false,
        message: "Ingen bygning fundet for denne adresse",
      });
    }

    const data = await hentBygningFraId(bygningId);

    return res.status(200).json({
      success: true,
      message: "Bygning hentet",
      data,
    });
  } catch (error) {
    console.error("Fejl i /properties/bygning:", error.message);
    return res.status(502).json({
      success: false,
      message: "Kunne ikke hente bygning fra Datafordeler",
    });
  }
});

// Endpoint der henter grunddata ud fra et adresse-id
// Grund-id'et hentes fra bygningen, som er knyttet til adressen
// Grunddata indeholder det faktiske jordareal (grundareal)
// Eksempel: GET /api/v1/properties/grund?adresseid=0a3f...
router.get("/properties/grund", async (req, res) => {
  try {
    const { adresseid } = req.query;

    if (!adresseid) {
      return res.status(400).json({
        success: false,
        message: "Mangler query-parameteren adresseid",
      });
    }

    // Henter enheder for at finde bygning-id
    const enheder = await hentEnhederFraAdresseId(adresseid);
    const bygningId = enheder?.[0]?.bygning;

    if (!bygningId) {
      return res.status(404).json({
        success: false,
        message: "Ingen bygning fundet for denne adresse",
      });
    }

    // Henter bygningen for at finde grund-id
    const bygninger = await hentBygningFraId(bygningId);
    const grundId = bygninger?.[0]?.grund;

    if (!grundId) {
      return res.status(404).json({
        success: false,
        message: "Ingen grund fundet for denne bygning",
      });
    }

    // Henter grunddata og udtrækker BFE-nummer
    const grundData = await hentGrundFraId(grundId);
    const bfeNummer = grundData?.[0]?.bestemtFastEjendom?.bfeNummer;

    if (!bfeNummer) {
      return res.status(404).json({
        success: false,
        message: "Ingen BFE-nummer fundet for denne grund",
      });
    }

    const data = await hentJordstykkeViaDawa(bfeNummer);

    return res.status(200).json({
      success: true,
      message: "Grundareal hentet fra DAWA",
      data,
    });
  } catch (error) {
    console.error("Fejl i /properties/grund:", error.message);
    return res.status(502).json({
      success: false,
      message: "Kunne ikke hente grund fra Datafordeler",
    });
  }
});

// Endpoint som returnerer en WMS-URL til et luftfoto af ejendommen.
// Route-laget håndterer kun HTTP-delen: validerer input, kalder service
// og pakker svaret som JSON. Selve opslaget mod DAWA og WMS-kaldet
// ligger i luftfotoService.js.
// Eksempel: GET /api/v1/properties/luftfoto?adresseid=0a3f...
router.get("/properties/luftfoto", async (req, res) => {
  try {
    const { adresseid } = req.query;

    if (!adresseid) {
      return res.status(400).json({
        success: false,
        message: "Mangler query-parameteren adresseid",
      });
    }

    const url = await hentLuftfotoUrl(adresseid);

    if (!url) {
      return res.status(404).json({
        success: false,
        message: "Adressen blev ikke fundet i DAWA",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Luftfoto-URL genereret",
      data: { url },
    });
  } catch (error) {
    console.error("Fejl i /properties/luftfoto:", error.message);
    return res.status(502).json({
      success: false,
      message: "Kunne ikke hente luftfoto",
    });
  }
});

// Endpoint som returnerer en WMS-URL til et matrikelkort over ejendommen.
// Samme opbygning som /properties/luftfoto: route-laget validerer kun input,
// service-laget bygger selve WMS-URL'en mod Dataforsyningens cp_inspire.
// Eksempel: GET /api/v1/properties/matrikelkort?adresseid=0a3f...
router.get("/properties/matrikelkort", async (req, res) => {
  try {
    const { adresseid } = req.query;

    if (!adresseid) {
      return res.status(400).json({
        success: false,
        message: "Mangler query-parameteren adresseid",
      });
    }

    const url = await hentMatrikelkortUrl(adresseid);

    if (!url) {
      return res.status(404).json({
        success: false,
        message: "Adressen blev ikke fundet i DAWA",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Matrikelkort-URL genereret",
      data: { url },
    });
  } catch (error) {
    console.error("Fejl i /properties/matrikelkort:", error.message);
    return res.status(502).json({
      success: false,
      message: "Kunne ikke hente matrikelkort",
    });
  }
});

// Eksporterer routeren
module.exports = router;