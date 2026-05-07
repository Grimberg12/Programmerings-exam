// ── Importer moduler ─────────────────────────────────────────────────────────
//Vi sørger for at importere de nødvendige moduler og services, som vi skal bruge i vores routes. Vi importerer Express for at oprette routeren, og vi importerer de relevante funktioner fra datafordelerService, luftfotoService og matrikelkortService for at håndtere vores API-kald.
const express = require("express");
const router = express.Router();

//vi importerer kun de funktioner vi rent faktisk bruger i vores routes, for at holde det overskueligt og undgå unødvendige imports
const {
  hentEnhederFraAdresseId,
  hentBygningFraId,
  hentGrundFraId,
  hentJordstykkeViaDawa,
} = require("../services/datafordelerservice");

const { hentLuftfotoUrl } = require("../services/luftfotoService");
const { hentMatrikelkortUrl } = require("../services/matrikelkortService");

// ── GET /properties/enheder ───────────────────────────────────────────────────
// Denne route håndterer GET-forespørgsler til /properties/enheder, hvor den forventer en query-parameter adresseid. Den bruger denne adresseid til at hente enheder fra Datafordeler ved hjælp af funktionen hentEnhederFraAdresseId. Hvis adresseid mangler, returnerer den en 400-fejl. Hvis der opstår en fejl under hentningen af data, returnerer den en 502-fejl.
router.get("/properties/enheder", async (req, res) => {
  try {
    const { adresseid } = req.query;

    if (!adresseid) {
      return res.status(400).json({
        success: false,
        message: "Mangler query-parameteren adresseid",
      });
    }

    const data = await hentEnhederFraAdresseId(adresseid);

    return res.status(200).json({
      success: true,
      message: "Enheder hentet",
      data,
    });
  } catch (error) {
    console.error("Fejl i /properties/enheder:", error.message);

    return res.status(502).json({
      success: false,
      message: "Kunne ikke hente enheder fra Datafordeler",
    });
  }
});

// ── GET /properties/bygning ───────────────────────────────────────────────────
// Denne route håndterer GET-forespørgsler til /properties/bygning, hvor den forventer en query-parameter adresseid. Den bruger denne adresseid til at hente bygning fra Datafordeler ved hjælp af funktionen hentBygningFraId. Hvis adresseid mangler, returnerer den en 400-fejl. Hvis der opstår en fejl under hentningen af data, returnerer den en 502-fejl.
router.get("/properties/bygning", async (req, res) => {
  try {
    const { adresseid } = req.query;

    if (!adresseid) {
      return res.status(400).json({
        success: false,
        message: "Mangler query-parameteren adresseid",
      });
    }

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

// ── GET /properties/grund ─────────────────────────────────────────────────────
// Henter grundareal via BBR: enhed → bygning → grund → BFE-nummer → DAWA jordstykker
router.get("/properties/grund", async (req, res) => {
  try {
    const { adresseid } = req.query;

    if (!adresseid) {
      return res.status(400).json({
        success: false,
        message: "Mangler query-parameteren adresseid",
      });
    }

    const enheder = await hentEnhederFraAdresseId(adresseid);
    const bygningId = enheder?.[0]?.bygning;

    if (!bygningId) {
      return res.status(404).json({
        success: false,
        message: "Ingen bygning fundet for denne adresse",
      });
    }

    const bygninger = await hentBygningFraId(bygningId);
    const grundId = bygninger?.[0]?.grund;

    if (!grundId) {
      return res.status(404).json({
        success: false,
        message: "Ingen grund fundet for denne bygning",
      });
    }

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
      message: "Kunne ikke hente grundareal fra DAWA",
    });
  }
});

// ── GET /properties/luftfoto ──────────────────────────────────────────────────
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

// ── GET /properties/matrikelkort ──────────────────────────────────────────────
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

// ── Eksporter router ──────────────────────────────────────────────────────────
module.exports = router;
