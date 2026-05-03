// ── Importer moduler ──────────────────────────────────────────────────────────
const express = require("express");
const router = express.Router();

const {
  hentEnhederFraAdresseId,
  hentBygningFraId,
} = require("../services/datafordelerService");

const { hentLuftfotoUrl } = require("../services/luftfotoService");
const { hentMatrikelkortUrl } = require("../services/matrikelkortService");

// ── GET /properties/enheder ───────────────────────────────────────────────────
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
// Henter grundareal via DAWA: adresse → matrikelnr + ejerlavskode → jordstykker
router.get("/properties/grund", async (req, res) => {
  try {
    const { adresseid } = req.query;

    if (!adresseid) {
      return res.status(400).json({
        success: false,
        message: "Mangler query-parameteren adresseid",
      });
    }

    const dawaAdresseRes = await fetch(
      `https://api.dataforsyningen.dk/adresser/${encodeURIComponent(adresseid)}?format=json`
    );

    if (!dawaAdresseRes.ok) {
      return res.status(404).json({
        success: false,
        message: "Adressen blev ikke fundet i DAWA",
      });
    }

    const dawaAdresse = await dawaAdresseRes.json();
    const matrikelnr = dawaAdresse.adgangsadresse?.matrikelnr;
    const ejerlavskode = dawaAdresse.adgangsadresse?.ejerlav?.kode;

    if (!matrikelnr || !ejerlavskode) {
      return res.status(404).json({
        success: false,
        message: "Matrikelnr eller ejerlavskode ikke fundet for adressen",
      });
    }

    const jordRes = await fetch(
      `https://api.dataforsyningen.dk/jordstykker?ejerlavskode=${ejerlavskode}&matrikelnr=${encodeURIComponent(matrikelnr)}&format=json`
    );

    if (!jordRes.ok) {
      throw new Error(`DAWA jordstykker fejl ${jordRes.status}`);
    }

    const data = await jordRes.json();

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
