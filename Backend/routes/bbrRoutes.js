// Debug: viser at bbrRoutes-filen faktisk bliver indlæst
console.log("LOADER: Backend/routes/bbrRoutes.js");

// Importerer Express, så vi kan oprette en router
const express = require("express");

// Opretter en router-instans
const router = express.Router();

// Importerer funktion fra service-laget,
// som kalder Datafordeler REST API
const {
  hentEjendomsrelationFraAdresseId,
  hentEnhederFraAdresseId,
  hentBygningFraId,
  hentGrundFraId,
  hentJordstykke,
} = require("../services/datafordelerService");

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

    // Debug: viser at route-handleren bliver ramt
    console.log("RAMTE route: /properties/enheder");

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

    // Henter grunddata og udtrækker jordstykke-ID
    const grundData = await hentGrundFraId(grundId);
    const jordstykkeId = grundData?.[0]?.jordstykkeList?.[0];

    if (!jordstykkeId) {
      return res.status(404).json({
        success: false,
        message: "Ingen jordstykke fundet for denne grund",
      });
    }

    // Henter jordstykkedata fra Matriklen API — her ligger det faktiske grundareal
    const data = await hentJordstykke(jordstykkeId);
    console.log("Jordstykke rådata:", JSON.stringify(data?.[0]));

    return res.status(200).json({
      success: true,
      message: "Grundareal hentet fra Matriklen",
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

// Eksporterer routeren
module.exports = router;